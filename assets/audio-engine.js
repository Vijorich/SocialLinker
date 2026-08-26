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
 * Invariant owned HERE, not by callers: a muted page never schedules a voice,
 * and nothing schedules into a suspended clock (that pile-up was the startup
 * crackle — af4a508). All envelopes are setTargetAtTime only: exponentialRamp
 * kinks at segment ends and phones render the kink as crackle (275e2f5, 4a21d2e).
 */
export function createAudioEngine({ storage, ctxFactory = () => new AudioContext() } = {}) {
  let ctx = null, out = null, droneVoice = null;
  const holds = new Set();

  let muted = false;
  try { muted = (storage && storage.getItem('sl-audio')) === 'off'; } catch {}

  const ac = () => ctx ??= ctxFactory();
  const running = () => !!ctx && ctx.state === 'running';
  const bus = () => {
    const c = ac();
    if (!out) { out = c.createGain(); out.connect(c.destination); }
    return out;
  };

  /* Gesture path: the very first tap may arrive with a suspended context. */
  const play = fn => {
    if (muted) return;
    const c = ac();
    if (c.state === 'running') fn(c);
    else c.resume().then(() => fn(c)).catch(() => {});
  };
  /* Shared voice gate: muted pages schedule nothing; nothing schedules into a
     suspended clock (the pile-up was the startup crackle). Creates the context
     lazily like every accessor before it. */
  const gate = () => {
    if (muted) return null;
    const c = ac();
    return c.state === 'running' ? c : null;
  };
  /* Ambient paths (hover, drones, ticks) stay silent until the context runs —
     never queued. Autoplay policy needs a gesture, but browsers with media-
     engagement history allow resume at load; callers invoke this optimistically. */
  const unlock = () => { try { ac().resume().catch(() => {}); } catch {} };

  const note = f => {
    const c = gate();
    if (!c) return;
    const t = c.currentTime;
    const g = c.createGain(), o = c.createOscillator(), o2 = c.createOscillator();
    g.gain.setValueAtTime(0, t);
    g.gain.setTargetAtTime(0.09, t, 0.02);
    g.gain.setTargetAtTime(0, t + 0.06, 0.28);
    o.frequency.value = f;
    /* Fifth (not octave) partial at low level: sine+octave at the top of a chord
       sum is exactly what phone speakers render as buzzing crackle. */
    o2.frequency.value = f * 1.5;
    const g2 = c.createGain(); g2.gain.value = 0.1;
    o.connect(g); o2.connect(g2).connect(g); g.connect(bus());
    o.start(t); o2.start(t); o.stop(t + 1.2); o2.stop(t + 1.2);
  };

  /* Short chord stabs: [semitones from root], glide between voices, output gain
     per voice. Voices start mistuned and glide onto the chord — that arrival
     reads as "resolve". Timing is in beats of `beat` seconds so all events
     share a grid. Warmth: symmetric gentle mistune curve (GLIDE_SEMIS). */
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
      o.connect(g); o2.connect(g2).connect(g); g.connect(bus());
      o.start(tOn); o2.start(tOn);
      o.stop(tOn + dur * 1.75 + 0.3); o2.stop(tOn + dur * 1.75 + 0.3);
    });
  };

  /* Sustained hold: N voices + a real breath LFO swelling the master gain of
     THIS voice on a period of 2×stepS (CSS attune glow rides the same period).
     retune(root) glides the whole chord onto a new rung across the first 60%
     of a step. Chord offsets are semitones above the rung root — the caller
     supplies an ABSOLUTE root frequency; ladder math lives in piano.js. */
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
    g.connect(filt).connect(bus());
    voices.forEach((o, k) => o.frequency.setValueAtTime(root * Math.pow(2, semis[k] / 12), t0));
    voices.forEach(o => o.start(t0));
    lfo.start(t0);
    const h = {
      retune(nextRoot) {
        voices.forEach((o, k) =>
          o.frequency.setTargetAtTime(nextRoot * Math.pow(2, semis[k] / 12), c.currentTime, stepS * 0.2));
      },
      stop() {
        holds.delete(h);
        const te = c.currentTime;
        lfoGain.gain.setTargetAtTime(0, te, 0.05); // freeze the LFO so the release tail is smooth
        g.gain.cancelScheduledValues(te);
        g.gain.setTargetAtTime(0, te, 0.5);
        voices.forEach(o => o.stop(te + 2));
        lfo.stop(te + 2);
      },
    };
    holds.add(h);
    return h;
  };

  /* Avatar warmth → ember drone: three detuned sines, gain breathing with a
     7.5 s LFO matching the CSS ember-breath animation period. Singleton. */
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
      o.frequency.value = f + k * 0.35; // slight detune per voice = chorused warmth
      og.gain.value = [0.6, 0.25, 0.15][k];
      o.connect(og).connect(g);
      o.start(t);
      return o;
    });
    const filt = c.createBiquadFilter(); // low-pass tames the sines into a glow, not a whine
    filt.type = 'lowpass'; filt.frequency.value = 900; filt.Q.value = 0.4;
    g.disconnect(); g.connect(filt).connect(bus());
    lfo.start(t);
    droneVoice = {
      stop() {
        if (droneVoice !== this) return;
        droneVoice = null;
        const te = c.currentTime;
        lfoGain.gain.setTargetAtTime(0, te, 0.05);
        g.gain.cancelScheduledValues(te);
        g.gain.setTargetAtTime(0, te, 0.55);
        osc.forEach(o => o.stop(te + 2));
        lfo.stop(te + 2);
      },
    };
    return droneVoice;
  };

  /* Skip-link: one clean fundamental, no harmonic — a soft *tok*, "door's here". */
  const tok = () => {
    const c = gate();
    if (!c) return;
    const t = c.currentTime;
    const g = c.createGain(), o = c.createOscillator();
    g.gain.setValueAtTime(0, t);
    g.gain.setTargetAtTime(0.08, t, 0.008);
    g.gain.setTargetAtTime(0, t + 0.05, 0.06);
    o.frequency.value = 330; // perfect fifth above the pentatonic root
    o.connect(g); g.connect(bus());
    o.start(t); o.stop(t + 0.4);
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
    o.connect(g); g.connect(bus());
    o.start(t); o.stop(t + 0.5);
  };

  /* One chokepoint for "stop everything sounding": tab-hide and mute both land
     here. Voice release tails stay smooth (setTargetAtTime, ~2 s). */
  const releaseAll = () => {
    holds.forEach(h => h.stop());
    holds.clear();
    droneVoice?.stop();
    droneVoice = null;
  };

  const setMuted = v => {
    muted = v;
    try { storage && storage.setItem('sl-audio', muted ? 'off' : 'on'); } catch {}
    if (muted) releaseAll();
    return muted;
  };

  return {
    play, unlock, note, chord, hold, drone, tok, echo, releaseAll,
    setMuted,
    toggleMuted: () => setMuted(!muted),
    get muted() { return muted; },
    running,
  };
}
