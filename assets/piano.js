(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let ctx = null, i = 0;
  const ac = () => {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    // Rejects when no gesture has happened yet (badge-reveal as first sound) — silence is the intended fallback.
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  };
  // ponytail: one master compressor for the whole page — a ceiling for overlapping
  // notes so the sum can't clip. Upgrade path if it audibly pumps: per-voice gains.
  let out = null;
  const bus = () => {
    const c = ac();
    if (!out) { const g = c.createGain(), comp = c.createDynamicsCompressor(); g.connect(comp).connect(c.destination); out = g; }
    return out;
  };
  const order = new WeakMap();
  const SEMI = [0, 3, 5, 7, 10];
  const freq = j => 220 * Math.pow(2, (SEMI[j % SEMI.length] + 12 * Math.floor(j / SEMI.length)) / 12);
  // Pitch ladder follows DOM order, top→bottom: prefill once at load, handlers only read.
  document.querySelectorAll('.link-card, .post-card').forEach(c => order.set(c, i++));
  const note = f => {
    const t = ctx.currentTime, g = ctx.createGain(), o = ctx.createOscillator(), o2 = ctx.createOscillator();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
    o.frequency.value = f;
    o2.frequency.value = f * 2;
    const g2 = ctx.createGain(); g2.gain.value = 0.22;
    o.connect(g); o2.connect(g2).connect(g); g.connect(bus());
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
      o.connect(g); o2.connect(g2).connect(g); g.connect(bus());
      o.start(tOn); o2.start(tOn); o.stop(tOn + dur + 0.1); o2.stop(tOn + dur + 0.1);
    });
  };

  // Click vocab = the importance ladder: the more important the component, the
  // longer and more playful the melody — exactly one voice per rung:
  //   donate (1) thank [0 4 7 11 14 21] maj7 rise + octave sparkle — golden, fullest
  //   links  (2) joy   [0 4 7 11 14]    maj7 lift
  //   projct (3) craft [0 4 7 14]       add9 arpeggio
  //   posts  (4) page  [0 7 14]         open fifths — shortest, least important
  const tonic = card => {
    if (!order.has(card)) order.set(card, i++);
    return freq(order.get(card));
  };
  const page = r => chord(r, [0, 7, 14], { beat: 0.12, glide: 0.05, dur: 0.45, vols: [0.08, 0.07, 0.06] });
  const craft = r => chord(r, [0, 4, 7, 14], { beat: 0.13, dur: 0.55, vols: [0.09, 0.07, 0.06, 0.05] });
  const joy = r => chord(r, [0, 4, 7, 11, 14], { beat: 0.14, dur: 0.65, vols: [0.085, 0.07, 0.065, 0.06, 0.05] });
  const thank = r => chord(r, [0, 4, 7, 11, 14, 21], { beat: 0.15, glide: 0.08, dur: 0.75, vols: [0.08, 0.07, 0.07, 0.06, 0.05, 0.045] });
  const clickSound = card => {
    const r = tonic(card);
    if (card.closest('.donate-list')) return thank(r);
    if (card.classList.contains('post-card')) return page(r);
    if (card.classList.contains('project-card')) return craft(r);
    joy(r);
  };
  // Set when a post-card click plays its page() chord, consumed by the modal-open
  // observer below so one opening sounds exactly once (the observer still voices
  // popstate/programmatic opens). Never reset on other clicks: the open may still
  // be mid-fetch, and any card click here leaves the page or stays on it — stale
  // flags are cleared on the next close/observe anyway.
  let openedByClick = false;
  document.addEventListener('click', e => {
    const card = e.target.closest('.link-card, .post-card');
    if (!card) return;
    if (card.classList.contains('post-card')) openedByClick = true;
    clickSound(card);
  });
  // Middle-click opens in a new tab but never fires 'click'; auxclick catches it.
  document.addEventListener('auxclick', e => {
    if (e.button !== 1) return;
    const card = e.target.closest('.link-card, .post-card');
    if (card) clickSound(card);
  });
  // Right-click on a card: a questioning flirtatious glance, not a silence.
  // Two short notes a perfect fourth apart ([0, 5]) that hang unresolved.
  // contextmenu fires on the press (even when the menu opens), so this plays
  // regardless of whether the user actually picks "open in new tab".
  document.addEventListener('contextmenu', e => {
    const card = e.target.closest('.link-card, .post-card');
    if (!card) return;
    const r = tonic(card);
    chord(r, [0, 5], { beat: 0.18, glide: 0.12, vols: [0.07, 0.05], dur: 0.55 });
  });

  // Skip-link: the accessibility path deserves its own instrument.
  // One clean fundamental, no harmonic — a soft *tok* that says "door's here".
  const skipLink = document.querySelector('.skip-link');
  if (skipLink) {
    skipLink.addEventListener('focus', () => {
      const c = ac(), t = c.currentTime;
      const g = c.createGain(), o = c.createOscillator();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.09, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      o.frequency.value = 330; // perfect fifth above the pentatonic root
      o.connect(g); g.connect(bus());
      o.start(t); o.stop(t + 0.2);
    });
  }

  // GitHub link card = Vijor's workbench. Same pentatonic note as every other
  // card, plus a faint octave tap 30 ms late — workshop-y, dry, curious.
  document.querySelectorAll('a.link-card').forEach(c => {
    const href = c.href || '';
    if (!href.includes('github.com/Vijorich')) return;
    c.addEventListener('mouseenter', () => {
      const f = tonic(c);
      setTimeout(() => {
        const a = ac(), t = a.currentTime, g = a.createGain(), o = a.createOscillator();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
        o.frequency.value = f * 2;
        o.connect(g); g.connect(bus());
        o.start(t); o.stop(t + 0.3);
      }, 30);
    });
  });

  // Badge wake-tick: two short Lydian notes when a Live/New chip appears.
  // The page moved on its own; the only moment the UI plays without a gesture.
  // badges.js dispatches 'badge-reveal' with the badge type after pinning.
  // Guarded on document.hidden: a reveal that lands in a background tab stays silent.
  window.addEventListener('badge-reveal', e => {
    if (document.hidden) return;
    const isLive = e.detail === 'twitch';
    chord(660, isLive ? [0, 4] : [0, 6], { beat: 0.12, glide: 0.05, vols: [0.05, 0.04], dur: 0.35 });
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
      if (!dlg.open) {
        openedByClick = false; // clear any stale flag from a click that never opened
        return farewell();
      }
      // A post-card click already spoke its page() chord — don't double the open.
      if (openedByClick) { openedByClick = false; return; }
      // Popstate/programmatic reopen: the same short page chord (post importance rung).
      chord(440, [0, 7, 14], { beat: 0.12, glide: 0.05, dur: 0.45, vols: [0.08, 0.07, 0.06] });
    }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
  }

  // Focus instruments: hovering a card holds an evolving pentatonic walker after ~3.5 s.
  // The walker picks steps from the shared pentatonic ladder, biased ±1 pivoting on
  // the card's position, so two adjacent cards drone in neighbouring registers and
  // the "melody" is genuinely a melody — pitch (and volume) move together.
  // Visual shimmer lives in CSS (.attuned::after) — same 3.5 s delay, so the warmth
  // a visitor hears lands on the same breath they see.
  const SHIMMER_DELAY = 3.5;

  // One walker step: pick a ladder rung k ± bounded delta from prev and retune the
  // three sustained voices onto it. Breath is NOT per-step: a real LFO swells the
  // master gain on a period of 2×stepS, and attune.css runs its shimmer on the very
  // same period (JS stamps --attune-period on the card at hold start) with a −¼
  // period delay — glow peak lands exactly on the loudness peak. One clock, two skins.
  const holdFor = (card, { ladderScale = 1, gain = 0.05, stepS = 3.2, chordSemis = [0, 4, 7] } = {}) => () => {
    const c = ac(), t0 = c.currentTime;
    const g = c.createGain();
    const breath = 2 * stepS;
    card.style.setProperty('--attune-period', breath + 's');
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(gain * 0.9, t0 + 1.4);
    // LFO ±~11% around the base = the old peak/valley alternation, but continuous
    // and phase-locked with the CSS shimmer. Ramps in with the attack so a
    // pre-gesture (suspended-context) hold can't dip the gain below zero.
    const lfo = c.createOscillator(), lfoGain = c.createGain();
    lfo.frequency.value = 1 / breath;
    lfoGain.gain.setValueAtTime(0, t0);
    lfoGain.gain.linearRampToValueAtTime(gain * 0.1, t0 + 1.4);
    lfo.connect(lfoGain).connect(g.gain);
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass'; filt.frequency.value = 1600; filt.Q.value = 0.3;
    // Three sustained voices whose frequencies the walker retunes each step.
    const voices = chordSemis.map(s => {
      const o = c.createOscillator(), og = c.createGain();
      og.gain.value = [0.6, 0.28, 0.18][chordSemis.indexOf(s) % 3];
      o.connect(og).connect(g);
      return o;
    });
    g.connect(filt).connect(bus());
    const pos = order.get(card) ?? 0;
    let rung = pos;                                  // start where the hover-note ended
    const base = 220 * ladderScale;                  // donate variant passes ladderScale=2
    const stepRung = k => base * Math.pow(2, (SEMI[k % SEMI.length] + 12 * Math.floor(k / SEMI.length)) / 12);
    // Chord offsets are SEMITONES above the rung's root — multiply the rung frequency.
    // Never feed them into stepRung: ladder space counts steps, not semitones, and a
    // fractional index reads undefined → NaN (the voices go silent).
    const chordFreq = (root, k) => root * Math.pow(2, chordSemis[k] / 12);
    // Set initial pitches directly (no glide), then start the voices.
    voices.forEach((o, k) => o.frequency.setValueAtTime(chordFreq(stepRung(rung), k), t0));
    voices.forEach(o => o.start(t0));
    lfo.start(t0);
    const walk = () => {
      const deltas = [-2, -1, -1, +1, +1, +2];        // biased ±1, occasionally ±2 for leaps
      // Pivot around the card's own rung — unclamped, a long hold drifts up
      // octaves forever; ±4 keeps the drone in the card's register.
      rung = Math.min(pos + 4, Math.max(0, rung + deltas[Math.floor(Math.random() * deltas.length)]));
      const root = stepRung(rung);
      voices.forEach((o, k) => {
        const f = chordFreq(root, k);
        // Glide to the new pitch across the first 60% of the step — reading as
        // movement, not a jump. The remaining 40% sits stable so the chord formants.
        o.frequency.setTargetAtTime(f, c.currentTime, stepS * 0.2);
      });
      walk.t = setTimeout(walk, stepS * 1000);
    };
    walk.t = setTimeout(walk, stepS * 1000);
    return { stop() {
      clearTimeout(walk.t);
      const te = c.currentTime;
      lfoGain.gain.setValueAtTime(0, te); // freeze the LFO so the release tail is smooth
      g.gain.cancelScheduledValues(te);
      g.gain.setValueAtTime(g.gain.value, te);
      g.gain.exponentialRampToValueAtTime(0.0001, te + 1.6);
      voices.forEach(o => o.stop(te + 1.8));
      lfo.stop(te + 1.8);
    } };
  };

  const holds = new Set();
  const wireHold = (card, startHold) => {
    let tRef = null, live = null;
    card.addEventListener('mouseenter', () => {
      clearTimeout(tRef);
      tRef = setTimeout(() => {
        if (document.hidden) return; // queued while the tab was hidden — skip
        live = startHold();
        if (live) { card.classList.add('attuned'); holds.add(live); }
      }, SHIMMER_DELAY * 1000);
    });
    card.addEventListener('mouseleave', () => {
      clearTimeout(tRef);
      card.classList.remove('attuned');
      const h = live; live = null;
      if (h) { holds.delete(h); h.stop(); }
    });
  };
  document.querySelectorAll('.link-list:not(.donate-list) .link-card, .link-list:not(.donate-list) .post-card').forEach(c =>
    wireHold(c, holdFor(c, { gain: 0.045, stepS: 3.2 })));
  document.querySelectorAll('.donate-list .link-card').forEach(c =>
    wireHold(c, holdFor(c, { ladderScale: 2, gain: 0.06, stepS: 3.0 })));

  // Tab-hide releases every active hold: hover can't move in a hidden tab, but a
  // walker started beforehand would keep oscillating (and burning battery) otherwise.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    holds.forEach(h => h.stop());
    holds.clear();
    document.querySelectorAll('.attuned').forEach(c => c.classList.remove('attuned'));
  });

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
      g.disconnect(); g.connect(filt).connect(bus());
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
