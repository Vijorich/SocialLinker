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
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);
    o.frequency.value = f;
    o2.frequency.value = f * 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.3;
    o.connect(g); o2.connect(g2).connect(g); g.connect(ctx.destination);
    o.start(t); o2.start(t); o.stop(t + 0.8); o2.stop(t + 0.8);
  };
  document.addEventListener('mouseover', e => {
    const card = e.target.closest('.link-card, .post-card');
    if (!card || card.contains(e.relatedTarget)) return;
    ac();
    if (!order.has(card)) order.set(card, i++);
    note(freq(order.get(card)));
  }); // ponytail: no throttle — every card entry sounds, the list is an instrument. Overlaps are cheap sine oscs.

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
