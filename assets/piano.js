(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ctx = null, i = 0;
  const ac = () => {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  };
  const order = new WeakMap();
  const SEMI = [0, 3, 5, 7, 10];
  const freq = j => 220 * Math.pow(2, (SEMI[j % SEMI.length] + 12 * Math.floor(j / SEMI.length)) / 12);
  const note = f => {
    const t = ctx.currentTime, g = ctx.createGain(), o = ctx.createOscillator(), o2 = ctx.createOscillator();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    o.frequency.value = f;
    o2.frequency.value = f * 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.22;
    o.connect(g); o2.connect(g2).connect(g); g.connect(ctx.destination);
    o.start(t); o2.start(t); o.stop(t + 0.95); o2.stop(t + 0.95);
  };
  document.addEventListener('mouseover', e => {
    const card = e.target.closest('.link-card, .post-card');
    if (!card || card.contains(e.relatedTarget)) return;
    ac();
    if (!order.has(card)) order.set(card, i++);
    note(freq(order.get(card)));
  }); // ponytail: no throttle — every card entry sounds, the list is an instrument. Overlaps are cheap sine oscs.

  // Short chord stabs: [semitones from root], amount of glide between voices,
  // which output gain each voice takes. Voices start at a mistuned/common pitch
  // and glide onto the chord — that arrival is what reads as "resolve".
  // Timing is in beats of `beat` seconds so all four events share a grid.
  // Warmth: mistune curve is symmetric-ish and gentle — P5 below, M3 below,
  // M2 above, M2 above — arrival lands in the chord instead of mysteriously
  // above/below. Fixed semitone keys, extended for >4-voice chords.
  const GLIDE_SEMIS = [-7, -4, 2, 2, 2, -4];
  const chord = (root, semis, { beat = 0.14, glide = 0.06, vols = [0.09, 0.07, 0.06, 0.05], dur = null } = {}) => {
    const c = ac(), t = c.currentTime;
    dur ??= beat * (semis.length + 1.5);
    semis.forEach((s, k) => {
      const f = root * Math.pow(2, s / 12);
      const g = c.createGain(), o = c.createOscillator(), o2 = c.createOscillator();
      const tOn = t + k * beat;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.setValueAtTime(0.0001, tOn);
      g.gain.exponentialRampToValueAtTime(vols[k % vols.length], tOn + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, tOn + dur);
      // Start on a gentle mistuned pitch, glide onto the target so the chord
      // "arrives" as it forms (the landing is what reads "warm resolve").
      o.frequency.setValueAtTime(f * Math.pow(2, GLIDE_SEMIS[k % GLIDE_SEMIS.length] / 12), tOn);
      o.frequency.exponentialRampToValueAtTime(f, tOn + glide);
      o2.frequency.value = f * 2;
      const g2 = c.createGain(); g2.gain.value = 0.25;
      o.connect(g); o2.connect(g2).connect(g); g.connect(c.destination);
      o.start(tOn); o2.start(tOn); o.stop(tOn + dur + 0.1); o2.stop(tOn + dur + 0.1);
    });
  };

  // Click vocab, one line each (joy/thank/page root follows the card's
  // own pentatonic index, so repeated opens of one card match its hover):
  //   joy      [0 4 7 14] add9 arpeggio, on the beat          — greeting a jump out
  //   thank    [0 4 7 11 14] 6→maj7 lift, slower and fuller  — grateful, golden
  //   page     [0 7 14 21] fifth-stacked, on the upbeat      — turning a page
  //   farewell two notes sagging a major third down          — page falling asleep
  const tonic = card => {
    if (!order.has(card)) order.set(card, i++);
    return freq(order.get(card));
  };
  const joy = r => chord(r, [0, 4, 7, 14]);
  const thank = r => chord(r, [0, 4, 7, 11, 14], { beat: 0.16, dur: 1.2, vols: [0.08, 0.07, 0.07, 0.06, 0.05] });
  // Page-open differs from joy in two dimensions: interval set ([0,7,14,21] —
  // open fifths + add2, no 3rd) AND rhythm (voices enter on the upbeat,
  // beat*1.5 cadence, slightly slower). Reads "inviting, push the cover".
  const page = r => chord(r, [0, 7, 14, 21], { beat: 0.21, glide: 0.09, dur: 1.0, vols: [0.08, 0.07, 0.06, 0.05] });
  const clickSound = card => {
    const r = tonic(card);
    if (card.closest('.donate-list')) return thank(r);
    if (card.classList.contains('post-card')) return page(r);
    joy(r);
  };
  document.addEventListener('click', e => {
    const card = e.target.closest('.link-card, .post-card');
    if (card) clickSound(card);
  });
  // Middle-click opens in a new tab but never fires 'click'; auxclick catches it.
  // ponytail: ignore right-click explicitly — button 2 has its own affordance.
  document.addEventListener('auxclick', e => {
    if (e.button !== 1) return;
    const card = e.target.closest('.link-card, .post-card');
    if (card) clickSound(card);
  });

  // Post modal: inviting add9 swell on open, fading RE→DO two-note sigh on close.
  // Both fire off the <dialog>'s own attribute so they also play on back/forward
  // navigation and close-by-Escape, not only on scripted clicks.
  const dlg = document.getElementById('post-modal');
  if (dlg) {
    const farewell = () => chord(440, [2, 0], { beat: 0.3, glide: 0.12, vols: [0.08, 0.06], dur: 0.7 });
    let wasOpen = dlg.open;
    new MutationObserver(() => {
      if (dlg.open === wasOpen) return;
      wasOpen = dlg.open;
      (dlg.open ? () => chord(440, [0, 4, 7, 14], { beat: 0.17, dur: 1.1 }) : farewell)();
    }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
  }

  // Focus instruments: hovering a card holds a soft shimmer-chord bed after ~3.5 s.
  // Two flavors, one shape: normal = warm C add9 fourth-octave, donate = the same
  // voicing an octave up with phase-shifted gain tremolo (gold, not ember).
  // Visual shimmer lives in CSS (.attuned::after) — same 3.5 s delay, same tremolo
  // period, so the warmth a visitor hears lands on the same breath they see.
  const SHIMMER_DELAY = 3.5;
  const holdFor = (semis, { root = 261.63, gain = 0.045, trem = 0.14, glide = 1.4, detune = 0.4 } = {}) => () => {
    const c = ac(), t = c.currentTime;
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + glide);
    const lfo = c.createOscillator(), lg = c.createGain();
    lfo.frequency.value = trem; lg.gain.value = gain * 0.35;
    lfo.connect(lg).connect(g.gain);
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 1400; filt.Q.value = 0.3;
    const osc = semis.map((s, k) => {
      const f = root * Math.pow(2, s / 12);
      const o = c.createOscillator(), og = c.createGain();
      o.frequency.value = f + k * detune;
      og.gain.value = [0.55, 0.3, 0.22, 0.18, 0.12][k % 5];
      o.connect(og).connect(g);
      o.start(t);
      return o;
    });
    g.connect(filt).connect(c.destination);
    lfo.start(t);
    return { stop() {
      const te = c.currentTime;
      lg.gain.setValueAtTime(0, te);
      g.gain.cancelScheduledValues(te);
      g.gain.setValueAtTime(g.gain.value, te);
      g.gain.exponentialRampToValueAtTime(0.0001, te + 1.6);
      osc.forEach(o => o.stop(te + 1.8)); lfo.stop(te + 1.8);
    } };
  };
  const wireHold = (card, startHold) => {
    let tRef = null; // setTimeout id while still waiting to attune
    let live = null; // running hold while attuned
    card.addEventListener('mouseenter', () => {
      clearTimeout(tRef);
      tRef = setTimeout(() => {
        live = startHold(); // ponytail: was makeHold()() — double-call made every attune throw before classList.add
        if (live) card.classList.add('attuned');
      }, SHIMMER_DELAY * 1000);
    });
    card.addEventListener('mouseleave', () => {
      clearTimeout(tRef); // left before attuning → nothing to release
      card.classList.remove('attuned');
      const h = live; live = null;
      h?.stop();
    });
  };
  // ponytail: holdFor(semis, opts) — stray Element as arg1 made semis.map throw
  // inside the 3.5s timeout, killing attune silently. Pass semis only.
  document.querySelectorAll('.link-list:not(.donate-list) .link-card, .link-list:not(.donate-list) .post-card').forEach(c =>
    wireHold(c, holdFor([0, 4, 7, 14], { gain: 0.045, trem: 0.14 })));
  document.querySelectorAll('.donate-list .link-card').forEach(c =>
    wireHold(c, holdFor([0, 4, 7, 11, 14], { root: 523.25, gain: 0.06, trem: 0.22, detune: 0.55 })));

  // Avatar warmth → ember drone: three detuned sines (110/165/220 Hz), gain
  // "breathes" with an LFO matching the CSS ember-breath 7.5s period. Starts on
  // the same cursor-enter that lights the ring, releases ~1.8s after leave.
  const avatar = document.querySelector('.avatar');
  if (avatar) {
    let drone = null; // { gain, stop() } while alive
    const start = () => {
      if (drone) return;
      const c = ac(), t = c.currentTime;
      const g = c.createGain(), lfoGain = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.05, t + 1.2);
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
      g.disconnect(); g.connect(filt).connect(c.destination);
      lfo.start(t);
      drone = { gain: g, stop() {
        const te = c.currentTime;
        lfoGain.gain.setValueAtTime(0, te); // freeze the LFO so the release tail is monotonic
        g.gain.cancelScheduledValues(te);
        g.gain.setValueAtTime(g.gain.value, te);
        g.gain.exponentialRampToValueAtTime(0.0001, te + 1.8);
        osc.forEach(o => o.stop(te + 2)); lfo.stop(te + 2);
      } };
    };
    const stop = () => { drone?.stop(); drone = null; };
    avatar.addEventListener('mouseenter', start);
    avatar.addEventListener('mouseleave', stop);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  }
})();
