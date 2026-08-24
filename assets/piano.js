/* Piano — DOM wiring + musical vocabulary. The audio machinery lives in
 * audio-engine.js (deep module: contexts, mute, envelopes); this file maps
 * page events onto it. Three layers, narrow necks between them:
 *
 *   wiring      event listeners -> vocabulary lookups -> engine calls
 *   vocabulary  MELODIES data table + pickMelodyName (the importance ladder) +
 *               the pentatonic ladder math (SEMI/rungAt) + nextRung walker
 *   engine      play/chord/hold/drone/tok/echo (assets/audio-engine.js)
 *
 * Modal coupling is event-based only: post-modal.js emits 'post-modal-open'
 * {url, source:'card'|'history'} / 'post-modal-close'; a card click has already
 * voiced its own page() chord, so source==='card' opens stay silent here —
 * that replaces the old openedByClick flag protocol. Same pattern as the
 * badge-reveal wake-tick from badges.js.
 */
import { createAudioEngine } from './audio-engine.js';

export { createAudioEngine };

/* Pentatonic pitch ladder follows DOM order, top→bottom: A-minor pentatonic
   across octaves (220 Hz base, 5 semitone steps per loop). Pure math. */
export const SEMI = [0, 3, 5, 7, 10];
export const rungAt = (j, base = 220) =>
  base * Math.pow(2, (SEMI[j % SEMI.length] + 12 * Math.floor(j / SEMI.length)) / 12);

/* One walker step: biased ±1 random walk clamped to the card's rung ±4, so a
   long hold drifts around the card's register instead of climbing octaves. */
const WALK_DELTAS = [-2, -1, -1, +1, +1, +2];
export const nextRung = (rung, pos) => {
  const r = rung + WALK_DELTAS[Math.floor(Math.random() * WALK_DELTAS.length)];
  return Math.min(pos + 4, Math.max(0, r));
};

/* Click vocabulary = the importance ladder: the more important the component,
   the longer and more playful the melody — exactly one voice per rung:
     donate (1) thank  [0 4 7 11 14 21] maj7 rise + octave sparkle
     links  (2) joy    [0 4 7 11 14]    maj7 lift
     projct (3) craft  [0 4 7 14]       add9 arpeggio
     posts  (4) page   [0 7 14]         open fifths — shortest
   Plus the one-off voicings: right-click glance, popstate reopen swell,
   close sigh, badge wake-ticks. */
export const MELODIES = {
  thank: { semis: [0, 4, 7, 11, 14, 21], beat: 0.15, glide: 0.08, dur: 0.75, vols: [0.06, 0.055, 0.055, 0.045, 0.04, 0.035] },
  joy: { semis: [0, 4, 7, 11, 14], beat: 0.14, dur: 0.65, vols: [0.065, 0.055, 0.05, 0.045, 0.035] },
  craft: { semis: [0, 4, 7, 14], beat: 0.13, dur: 0.55, vols: [0.07, 0.055, 0.05, 0.04] },
  page: { semis: [0, 7, 14], beat: 0.12, glide: 0.05, dur: 0.45, vols: [0.06, 0.05, 0.04] },
  glance: { semis: [0, 5], beat: 0.18, glide: 0.12, dur: 0.55, vols: [0.07, 0.05] },
  swell: { root: 440, semis: [0, 7, 14], beat: 0.12, glide: 0.05, dur: 0.45, vols: [0.08, 0.07, 0.06] },
  farewell: { root: 440, semis: [2, 0], beat: 0.3, glide: 0.12, dur: 0.7, vols: [0.08, 0.06] },
};

export function pickMelodyName(card) {
  if (card.closest('.donate-list')) return 'thank';
  if (card.classList.contains('post-card')) return 'page';
  if (card.classList.contains('project-card')) return 'craft';
  return 'joy';
}

export function initPiano({
  doc = document,
  win = window,
  storage = (() => { try { return localStorage; } catch { return null; } })(),
} = {}) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const engine = createAudioEngine({ storage });

  /* ponytail: nothing may be scheduled until the context runs (see engine).
     Gesture unlock plus an optimistic resume at load for relaxed browsers. */
  doc.addEventListener('pointerdown', () => engine.unlock(), { once: true });
  doc.addEventListener('keydown', () => engine.unlock(), { once: true });
  engine.unlock();

  const order = new WeakMap();
  let i = 0;
  const tonic = card => {
    if (!order.has(card)) order.set(card, i++);
    return rungAt(order.get(card));
  };
  doc.querySelectorAll('.link-card, .post-card').forEach(c => order.set(c, i++));

  const soundCard = card => {
    const m = MELODIES[pickMelodyName(card)];
    engine.play(() => engine.chord(tonic(card), m.semis, m));
  };

  doc.addEventListener('mouseover', e => {
    const card = e.target.closest('.link-card, .post-card');
    if (!card || card.contains(e.relatedTarget)) return;
    if (!engine.running()) return; // pre-gesture hover stays silent, never queued
    if (!order.has(card)) order.set(card, i++);
    engine.note(tonic(card));
  }); // no throttle — every card entry sounds, the list is an instrument. Overlaps are cheap sine oscs.

  doc.addEventListener('click', e => {
    const card = e.target.closest('.link-card, .post-card');
    if (!card) return;
    soundCard(card);
  });
  // Middle-click opens in a new tab but never fires 'click'; auxclick catches it.
  doc.addEventListener('auxclick', e => {
    if (e.button !== 1) return;
    const card = e.target.closest('.link-card, .post-card');
    if (card) soundCard(card);
  });
  // Right-click on a card: a questioning flirtatious glance [0, 5] — two notes a
  // perfect fourth apart that hang unresolved. Fires on the press, menu or not.
  doc.addEventListener('contextmenu', e => {
    const card = e.target.closest('.link-card, .post-card');
    if (!card) return;
    const m = MELODIES.glance;
    engine.play(() => engine.chord(tonic(card), m.semis, m));
  });

  // Skip-link: the accessibility path deserves its own instrument.
  const skipLink = doc.querySelector('.skip-link');
  if (skipLink) skipLink.addEventListener('focus', () => engine.play(() => engine.tok()));

  // GitHub link card = Vijor's workbench: its own note plus a faint octave tap
  // 30 ms late — workshop-y, dry, curious.
  doc.querySelectorAll('a.link-card').forEach(c => {
    if (!(c.href || '').includes('github.com/Vijorich')) return;
    c.addEventListener('mouseenter', () => {
      const f = tonic(c);
      setTimeout(() => engine.echo(f), 30);
    });
  });

  // Badge wake-tick: badges.js dispatched 'badge-reveal' — Live up a major third
  // from E5, New! up a tritone. The only moment the page sounds without a gesture;
  // a reveal landing in a background tab stays silent.
  win.addEventListener('badge-reveal', e => {
    if (doc.hidden || !engine.running()) return;
    engine.chord(660, e.detail === 'twitch' ? [0, 4] : [0, 6], { beat: 0.12, glide: 0.05, vols: [0.05, 0.04], dur: 0.35 });
  });

  // Post-modal events (emitted by post-modal.js): inviting add9 swell on a
  // history/programmatic open, fading RE→DO sigh on every close path.
  win.addEventListener('post-modal-open', e => {
    if (e.detail.source === 'card') return; // the click's page() chord already spoke
    if (!engine.running()) return;
    const m = MELODIES.swell;
    engine.chord(m.root, m.semis, m);
  });
  win.addEventListener('post-modal-close', () => {
    if (!engine.running()) return;
    const m = MELODIES.farewell;
    engine.chord(m.root, m.semis, m);
  });

  // Focus instruments: hovering a card holds an evolving walker after ~3.5 s.
  // The outer glow lives in CSS (.attuned) — same delay, so the warmth a visitor
  // hears lands on the same breath they see.
  const SHIMMER_DELAY = 3.5;

  const holdFor = (card, { ladderScale = 1, gain = 0.05, stepS = 3.2 } = {}) => () => {
    const pos = order.get(card) ?? 0;
    const base = 220 * ladderScale; // donate variant sits an octave up the fold
    const live = engine.hold({ root: rungAt(pos, base), gain, stepS });
    if (!live) return null;
    let rung = pos; // start where the hover-note ended
    const walk = () => {
      rung = nextRung(rung, pos);
      live.retune(rungAt(rung, base));
      walk.t = setTimeout(walk, stepS * 1000);
    };
    walk.t = setTimeout(walk, stepS * 1000);
    return { stop() { clearTimeout(walk.t); live.stop(); } };
  };

  const calmAttunes = () => doc.querySelectorAll('.attuned').forEach(c => c.classList.remove('attuned'));

  const wireHold = (card, startHold) => {
    let tRef = null, live = null;
    card.addEventListener('mouseenter', () => {
      clearTimeout(tRef);
      tRef = setTimeout(() => {
        if (doc.hidden) return; // engine still gates mute/context
        live = startHold();
        if (live) card.classList.add('attuned');
      }, SHIMMER_DELAY * 1000);
    });
    card.addEventListener('mouseleave', () => {
      clearTimeout(tRef);
      card.classList.remove('attuned');
      live?.stop();
      live = null;
    });
  };
  doc.querySelectorAll('.link-list:not(.donate-list) .link-card, .link-list:not(.donate-list) .post-card').forEach(c =>
    wireHold(c, holdFor(c, { gain: 0.045, stepS: 3.2 })));
  doc.querySelectorAll('.donate-list .link-card').forEach(c =>
    wireHold(c, holdFor(c, { ladderScale: 2, gain: 0.06, stepS: 3.0 })));

  // Tab-hide releases every sounding voice: hover can't move in a hidden tab,
  // but a started walker/drone would keep oscillating (and burning battery).
  doc.addEventListener('visibilitychange', () => {
    if (!doc.hidden) return;
    engine.releaseAll();
    calmAttunes();
  });

  // Avatar warmth → ember drone, started on the same cursor-enter that lights
  // the ring, released ~1.8 s after leave.
  const avatar = doc.querySelector('.avatar');
  if (avatar) {
    let droneLive = null;
    avatar.addEventListener('mouseenter', () => { droneLive = engine.drone() ?? droneLive; });
    avatar.addEventListener('mouseleave', () => { droneLive?.stop(); droneLive = null; });
    doc.addEventListener('visibilitychange', () => {
      if (doc.hidden) { droneLive?.stop(); droneLive = null; }
    });
  }

  // Sound toggle: revealed here because only this layer knows audio exists.
  // Muting mid-flight releases every sounding voice (inside the engine) and
  // drops the attune glows; unmuting just re-arms the entry points.
  const sBtn = doc.querySelector('.sound-toggle');
  if (sBtn) {
    const paint = () => {
      sBtn.hidden = false;
      sBtn.setAttribute('aria-pressed', String(engine.muted));
      sBtn.setAttribute('aria-label', engine.muted ? sBtn.dataset.labelUnmute : sBtn.dataset.labelMute);
    };
    paint();
    sBtn.addEventListener('click', () => {
      engine.toggleMuted();
      if (engine.muted) calmAttunes();
      paint();
    });
  }
}

if (typeof document !== 'undefined') initPiano();
