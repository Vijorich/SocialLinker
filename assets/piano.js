/* Piano — DOM wiring + musical vocabulary. The audio machinery lives in
 * audio-engine.js; this file maps page events onto it.
 *
 * Touch policy: a primary tap may play the click chord, but hover notes,
 * context-menu notes, avatar drones, attune holds, and system-driven ticks are
 * disabled when the device cannot hover. This keeps the touch experience
 * intentional instead of relying on synthetic mouse events.
 */
import { createAudioEngine } from './audio-engine.js';

export { createAudioEngine };

/* Pentatonic pitch ladder follows DOM order, top→bottom: A-minor pentatonic
   across octaves (220 Hz base, 5 semitone steps per loop). Pure math. */
export const SEMI = [0, 3, 5, 7, 10];
export const rungAt = (j, base = 220) =>
  base * Math.pow(2, (SEMI[j % SEMI.length] + 12 * Math.floor(j / SEMI.length)) / 12);

/* One walker step: biased ±1 random walk clamped to the card's rung ±4. */
const WALK_DELTAS = [-2, -1, -1, +1, +1, +2];
export const nextRung = (rung, pos) => {
  const r = rung + WALK_DELTAS[Math.floor(Math.random() * WALK_DELTAS.length)];
  return Math.min(pos + 4, Math.max(0, r));
};

/* Click vocabulary = the importance ladder. */
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

export function initPiano({ doc = (typeof document !== 'undefined' ? document : null), win = (typeof window !== 'undefined' ? window : null), storage } = {}) {
  if (!doc || !win) return;
  const media = query => (typeof win.matchMedia === 'function' ? win.matchMedia(query) : { matches: false });
  const reduced = media('(prefers-reduced-motion: reduce)');
  if (reduced.matches) return;
  if (!doc.querySelector('.sound-toggle') && !doc.querySelector('.link-card, .post-card')) return;

  if (storage === undefined) {
    try { storage = win.localStorage; } catch { storage = null; }
  }
  const engine = createAudioEngine({ storage });
  const hoverMedia = media('(hover: hover)');
  const canHover = () => hoverMedia.matches;

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
    if (!canHover()) return;
    const card = e.target?.closest?.('.link-card, .post-card');
    if (!card || card.contains(e.relatedTarget)) return;
    if (!engine.running()) return;
    if (!order.has(card)) order.set(card, i++);
    engine.note(tonic(card));
  });

  /* A primary tap remains audible on touch devices. */
  doc.addEventListener('click', e => {
    const card = e.target?.closest?.('.link-card, .post-card');
    if (!card) return;
    soundCard(card);
  });

  doc.addEventListener('auxclick', e => {
    if (e.button !== 1) return;
    const card = e.target?.closest?.('.link-card, .post-card');
    if (card) soundCard(card);
  });

  doc.addEventListener('contextmenu', e => {
    if (!canHover()) return;
    const card = e.target?.closest?.('.link-card, .post-card');
    if (!card) return;
    const m = MELODIES.glance;
    engine.play(() => engine.chord(tonic(card), m.semis, m));
  });

  const skipLink = doc.querySelector('.skip-link');
  if (skipLink) skipLink.addEventListener('focus', () => {
    if (canHover()) engine.play(() => engine.tok());
  });

  doc.querySelectorAll('a.link-card').forEach(c => {
    if (!(c.href || '').includes('github.com/Vijorich')) return;
    let timer = null;
    c.addEventListener('mouseenter', () => {
      if (!canHover()) return;
      const f = tonic(c);
      clearTimeout(timer);
      timer = setTimeout(() => engine.echo(f), 30);
    });
    c.addEventListener('mouseleave', () => clearTimeout(timer));
  });

  win.addEventListener('badge-reveal', e => {
    if (!canHover() || doc.hidden || !engine.running()) return;
    engine.chord(660, e.detail === 'twitch' ? [0, 4] : [0, 6], { beat: 0.12, glide: 0.05, vols: [0.05, 0.04], dur: 0.35 });
  });

  win.addEventListener('post-modal-open', e => {
    if (!canHover() || e.detail.source === 'card' || !engine.running()) return;
    const m = MELODIES.swell;
    engine.chord(m.root, m.semis, m);
  });
  win.addEventListener('post-modal-close', () => {
    if (!canHover() || !engine.running()) return;
    const m = MELODIES.farewell;
    engine.chord(m.root, m.semis, m);
  });

  /* Focus instruments: piano owns the wrapper timers as well as the engine
     handles, so hide/mute can cancel the recursive walker completely. */
  const SHIMMER_DELAY = 3.5;
  const liveHolds = new Set();

  const holdFor = (card, { ladderScale = 1, gain = 0.05, stepS = 3.2 } = {}) => () => {
    const pos = order.get(card) ?? 0;
    const base = 220 * ladderScale;
    const live = engine.hold({ root: rungAt(pos, base), gain, stepS });
    if (!live) return null;
    let rung = pos;
    let stopped = false;
    const handle = {
      stop() {
        if (stopped) return;
        stopped = true;
        clearTimeout(walk.t);
        liveHolds.delete(handle);
        live.stop();
      },
    };
    const walk = () => {
      if (stopped) return;
      rung = nextRung(rung, pos);
      live.retune(rungAt(rung, base));
      walk.t = setTimeout(walk, stepS * 1000);
    };
    walk.t = setTimeout(walk, stepS * 1000);
    liveHolds.add(handle);
    return handle;
  };

  const calmAttunes = () => doc.querySelectorAll('.attuned').forEach(c => c.classList.remove('attuned'));
  const stopAttunes = () => {
    for (const h of [...liveHolds]) h.stop();
    liveHolds.clear();
    calmAttunes();
  };

  const wireHold = (card, startHold) => {
    let tRef = null, live = null;
    card.addEventListener('mouseenter', () => {
      if (!canHover()) return;
      clearTimeout(tRef);
      tRef = setTimeout(() => {
        if (doc.hidden || !canHover()) return;
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

  doc.addEventListener('visibilitychange', () => {
    if (!doc.hidden) return;
    stopAttunes();
    engine.releaseAll();
  });

  const avatar = doc.querySelector('.avatar');
  if (avatar) {
    let droneLive = null;
    avatar.addEventListener('mouseenter', () => {
      if (canHover()) droneLive = engine.drone() ?? droneLive;
    });
    avatar.addEventListener('mouseleave', () => { droneLive?.stop(); droneLive = null; });
    doc.addEventListener('visibilitychange', () => {
      if (doc.hidden) { droneLive?.stop(); droneLive = null; }
    });
  }

  const soundButtons = [...doc.querySelectorAll('.sound-toggle')];
  if (soundButtons.length) {
    const paint = () => {
      soundButtons.forEach(button => {
        button.hidden = !engine.available;
        button.setAttribute('aria-pressed', String(engine.muted));
        button.setAttribute('aria-label', engine.muted ? button.dataset.labelUnmute : button.dataset.labelMute);
      });
    };
    paint();
    soundButtons.forEach(button => button.addEventListener('click', () => {
      engine.toggleMuted();
      if (engine.muted) stopAttunes();
      if (!engine.muted) engine.unlock();
      paint();
    }));
  }
}

if (typeof document !== 'undefined') initPiano();
