/* Audio engine — the deep module under every voice on the site.
 *
 * Owns the AudioContext lifecycle (lazy creation, autoplay unlock, master bus),
 * the mute gate (persisted in localStorage 'sl-audio', default ON), and every
 * envelope. The interface is small and voice-shaped:
 *
 *   play(fn)          gesture path: resumes a suspended context, then runs fn
 *   note(f)           plink: fundamental + fifth partial
 *   chord(root,semis,o) staggered gliding voices — every melody is built here
 *   hold({root,...})  sustained breath-LFO chord -> {retune(root), stop()}
 *   drone()           avatar ember drone -> {stop()} | null
 *   tok() / echo(f)   skip-link tick / GitHub octave tap
 *   releaseAll()      stop every sounding voice (tab-hide, mute)
 *   setMuted/toggleMuted/muted/running/unlock
 *
 * Invariant owned HERE, not by callers: a muted page never creates or schedules
 * a voice, and nothing schedules into a suspended clock. All envelopes are
 * setTargetAtTime only: exponentialRamp kinks at segment ends and phones render
 * the kink as crackle.
 */

const globalObject = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : {});
const defaultCtxFactory = () => {
  const Ctor = globalObject.AudioContext || globalObject.webkitAudioContext;
  if (!Ctor) throw new Error('Web Audio API is unavailable');
  return new Ctor();
};

export function createAudioEngine({ storage, ctxFactory = defaultCtxFactory } = {}) {
  let ctx = null, out = null, droneVoice = null, unavailable = false;
  const hasDefaultCtor = typeof globalObject.AudioContext === 'function' || typeof globalObject.webkitAudioContext === 'function';
  const holds = new Set();
  const transients = new Set();

  let muted = false;
  try { muted = (storage && storage.getItem('sl-audio')) === 'off'; } catch {}

  /* Context creation is deliberately fail-soft: unsupported WebViews and
     privacy modes must not turn a card click into an uncaught exception. */
  const ac = () => {
    if (ctx) return ctx;
    if (unavailable) return null;
    try {
      ctx = typeof ctxFactory === 'function' ? ctxFactory() : null;
      if (!ctx) unavailable = true;
    } catch {
      ctx = null;
      /* A browser may reject construction before the first gesture, rather than
         report an unsupported API. Keep the control available for a later retry. */
      if (ctxFactory === defaultCtxFactory && !globalObject.AudioContext && !globalObject.webkitAudioContext) {
        unavailable = true;
      }
    }
    return ctx;
  };
  const running = () => !!ctx && ctx.state === 'running';
  const bus = c => {
    if (!out) { out = c.createGain(); out.connect(c.destination); }
    return out;
  };

  const scheduleTransient = (node, when) => {
    if (!node) return;
    transients.add(node);
    try {
      node.stop(when);
    } catch {
      transients.delete(node);
    }
    if (typeof node.addEventListener === 'function') {
      node.addEventListener('ended', () => transients.delete(node), { once: true });
    }
  };
  const stopTransients = () => {
    if (!ctx) {
      transients.clear();
      return;
    }
    const now = ctx.currentTime;
    for (const node of transients) {
      try { node.stop(now); } catch {}
    }
    transients.clear();
  };

  /* Gesture path: the very first tap may arrive with a suspended context. */
  const play = fn => {
    if (muted) return;
    const c = ac();
    if (!c) return;
    if (c.state === 'running') {
      try { fn(c); } catch {}
      return;
    }
    let resumed;
    try { resumed = c.resume(); } catch { return; }
    Promise.resolve(resumed).then(() => {
      if (!muted && c.state === 'running') fn(c);
    }).catch(() => {});
  };
  /* Shared voice gate: muted pages schedule nothing; nothing schedules into a
     suspended clock. */
  const gate = () => {
    if (muted) return null;
    const c = ac();
    return c && c.state === 'running' ? c : null;
  };
  /* Ambient paths stay silent until the context runs — never queued. */
  const unlock = () => {
    if (muted) return;
    const c = ac();
    if (!c) return;
    try { Promise.resolve(c.resume()).catch(() => {}); } catch {}
  };

  const note = f => {
    const c = gate();
    if (!c) return;
    const t = c.currentTime;
    const g = c.createGain(), o = c.createOscillator(), o2 = c.createOscillator();
    g.gain.setValueAtTime(0, t);
    g.gain.setTargetAtTime(0.09, t, 0.02);
    g.gain.setTargetAtTime(0, t + 0.06, 0.28);
    o.frequency.value = f;
    o2.frequency.value = f * 1.5;
    const g2 = c.createGain(); g2.gain.value = 0.1;
    o.connect(g); o2.connect(g2).connect(g); g.connect(bus(c));
    o.start(t); o2.start(t);
    scheduleTransient(o, t + 1.2);
    scheduleTransient(o2, t + 1.2);
  };

  /* Short chord stabs: [semitones from root], glide between voices, output gain
     per voice. Voices start mistuned and glide onto the chord. */
  const GLIDE_SEMIS = [-7, -4, 2, 2, 2, -4];
  const chord = (root, semis, { beat = 0.14, glide = 0.06, vols = [0.07, 0.055, 0.05, 0.04], dur = null } = {}) => {
    const c = gate();
    if (!c) return;
    const t = c.currentTime;
    dur ??= beat * (semis.length + 1.5);
    semis.forEach((s, k) => {
      const f = root * Math.pow(2, s / 12);
      const g = c.createGain(), o = c.createOscillator(), o2 = c.createOscillator();
      const tOn = t + k * beat;
      g.gain.setValueAtTime(0, tOn);
      g.gain.setTargetAtTime(vols[k % vols.length], tOn, 0.02);
      g.gain.setTargetAtTime(0, tOn + dur * 0.25, dur * 0.25);
      o.frequency.setValueAtTime(f * Math.pow(2, GLIDE_SEMIS[k % GLIDE_SEMIS.length] / 12), tOn);
      o.frequency.setTargetAtTime(f, tOn, Math.max(0.03, glide));
      o2.frequency.value = f * 1.5;
      const g2 = c.createGain(); g2.gain.value = 0.12;
      o.connect(g); o2.connect(g2).connect(g); g.connect(bus(c));
      o.start(tOn); o2.start(tOn);
      scheduleTransient(o, tOn + dur * 1.75 + 0.3);
      scheduleTransient(o2, tOn + dur * 1.75 + 0.3);
    });
  };

  /* Sustained hold: N voices + a real breath LFO swelling the master gain of
     THIS voice on a period of 2×stepS. The current CSS attune treatment is a
     steady outer glow; the LFO is intentionally audio-only. */
  const hold = ({ root, semis = [0, 4, 7], gain = 0.05, stepS = 3.2 } = {}) => {
    const c = gate();
    if (!c) return null;
    const t0 = c.currentTime;
    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.setTargetAtTime(gain * 0.9, t0, 0.5);
    const lfo = c.createOscillator(), lfoGain = c.createGain();
    lfo.frequency.value = 1 / (2 * stepS);
    lfoGain.gain.setValueAtTime(0, t0);
    lfoGain.gain.setTargetAtTime(gain * 0.1, t0, 0.5);
    lfo.connect(lfoGain).connect(g.gain);
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 1600; filt.Q.value = 0.3;
    const voices = semis.map((_, k) => {
      const o = c.createOscillator(), og = c.createGain();
      og.gain.value = [0.6, 0.28, 0.18][k % 3];
      o.connect(og).connect(g);
      return o;
    });
    g.connect(filt).connect(bus(c));
    voices.forEach((o, k) => o.frequency.setValueAtTime(root * Math.pow(2, semis[k] / 12), t0));
    voices.forEach(o => o.start(t0));
    lfo.start(t0);
    let stopped = false;
    const h = {
      retune(nextRoot) {
        if (stopped) return;
        voices.forEach((o, k) =>
          o.frequency.setTargetAtTime(nextRoot * Math.pow(2, semis[k] / 12), c.currentTime, stepS * 0.2));
      },
      stop() {
        if (stopped) return;
        stopped = true;
        holds.delete(h);
        const te = c.currentTime;
        lfoGain.gain.setTargetAtTime(0, te, 0.05);
        g.gain.cancelScheduledValues(te);
        g.gain.setTargetAtTime(0, te, 0.5);
        voices.forEach(o => { try { o.stop(te + 2); } catch {} });
        try { lfo.stop(te + 2); } catch {}
      },
    };
    holds.add(h);
    return h;
  };

  /* Avatar warmth → ember drone: three detuned sines with a 7.5 s breath. */
  const drone = () => {
    if (droneVoice) return droneVoice;
    const c = gate();
    if (!c) return null;
    const t = c.currentTime;
    const g = c.createGain(), lfoGain = c.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.setTargetAtTime(0.05, t, 0.45);
    const lfo = c.createOscillator();
    lfo.frequency.value = 1 / 7.5;
    lfoGain.gain.value = 0.018;
    lfo.connect(lfoGain).connect(g.gain);
    const osc = [110, 165.5, 220].map((f, k) => {
      const o = c.createOscillator(), og = c.createGain();
      o.frequency.value = f + k * 0.35;
      og.gain.value = [0.6, 0.25, 0.15][k];
      o.connect(og).connect(g);
      o.start(t);
      return o;
    });
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 900; filt.Q.value = 0.4;
    g.disconnect(); g.connect(filt).connect(bus(c));
    lfo.start(t);
    droneVoice = {
      stop() {
        if (droneVoice !== this) return;
        droneVoice = null;
        const te = c.currentTime;
        lfoGain.gain.setTargetAtTime(0, te, 0.05);
        g.gain.cancelScheduledValues(te);
        g.gain.setTargetAtTime(0, te, 0.55);
        osc.forEach(o => { try { o.stop(te + 2); } catch {} });
        try { lfo.stop(te + 2); } catch {}
      },
    };
    return droneVoice;
  };

  /* Skip-link: one clean fundamental, no harmonic. */
  const tok = () => {
    const c = gate();
    if (!c) return;
    const t = c.currentTime;
    const g = c.createGain(), o = c.createOscillator();
    g.gain.setValueAtTime(0, t);
    g.gain.setTargetAtTime(0.08, t, 0.008);
    g.gain.setTargetAtTime(0, t + 0.05, 0.06);
    o.frequency.value = 330;
    o.connect(g); g.connect(bus(c));
    o.start(t); scheduleTransient(o, t + 0.4);
  };

  /* GitHub link card echo: faint octave tap riding after its hover-note. */
  const echo = f => {
    const c = gate();
    if (!c) return;
    const t = c.currentTime;
    const g = c.createGain(), o = c.createOscillator();
    g.gain.setValueAtTime(0, t);
    g.gain.setTargetAtTime(0.045, t, 0.008);
    g.gain.setTargetAtTime(0, t + 0.04, 0.09);
    o.frequency.value = f * 2;
    o.connect(g); g.connect(bus(c));
    o.start(t); scheduleTransient(o, t + 0.5);
  };

  /* One chokepoint for tab-hide and mute. Short voices are tracked as well as
     holds/drone, so a mute does not leave a scheduled chord ringing. */
  const releaseAll = () => {
    holds.forEach(h => h.stop());
    holds.clear();
    droneVoice?.stop();
    droneVoice = null;
    stopTransients();
  };

  const setMuted = v => {
    muted = Boolean(v);
    try { storage && storage.setItem('sl-audio', muted ? 'off' : 'on'); } catch {}
    if (muted) releaseAll();
    return muted;
  };

  return {
    play, unlock, note, chord, hold, drone, tok, echo, releaseAll,
    setMuted,
    toggleMuted: () => setMuted(!muted),
    get muted() { return muted; },
    get available() { return !unavailable && (ctxFactory !== defaultCtxFactory || hasDefaultCtor); },
    running,
  };
}
