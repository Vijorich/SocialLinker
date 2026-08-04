(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ctx = null, i = 0, lastTs = 0;
  const order = new WeakMap(), lastHit = new WeakMap();
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
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    const now = performance.now();
    if (now - lastTs < 55 || now - (lastHit.get(card) || 0) < 1200) return; // sweep = run of notes; same card stays quiet 1.2 s
    lastTs = now; lastHit.set(card, now);
    if (!order.has(card)) order.set(card, i++);
    note(freq(order.get(card)));
  });
})();
