// Runnable check for assets/piano.js — runs the real file against a stub
// DOM/AudioContext and asserts what actually gets scheduled.
// Usage: node tests/piano.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert';

const src = readFileSync(new URL('../assets/piano.js', import.meta.url), 'utf8');

function makeWorld({ cards = [], dlg = null, suspended = false } = {}) {
  const param = v => ({
    value: v,
    setValueAtTime(x) { this.value = x; },
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime() {},
    setTargetAtTime(x) { this.value = x; },
    cancelScheduledValues() {},
  });
  const ctx = {
    currentTime: 0,
    state: suspended ? 'suspended' : 'running',
    destination: {},
    resume: () => (suspended ? Promise.reject(new Error('autoplay')) : Promise.resolve()),
    oscs: [],
    createOscillator() { const o = { frequency: param(440), connect: x => x, start() {}, stop() {} }; this.oscs.push(o); return o; },
    createGain() { return { gain: param(1), connect: x => x, disconnect() {} }; },
    createBiquadFilter() { return { frequency: param(350), Q: param(1), type: '', connect: x => x }; },
    createDynamicsCompressor() { return { connect: x => x }; },
  };
  const timers = new Map();
  let timerId = 0;
  const setTimeoutStub = fn => { timers.set(++timerId, fn); return timerId; };
  const clearTimeoutStub = id => timers.delete(id);
  const flushOne = () => {
    const next = timers.entries().next().value;
    if (!next) return false;
    timers.delete(next[0]); next[1]();
    return true;
  };
  let moCb = null;
  const MOStub = class { constructor(cb) { moCb = cb; } observe() {} };
  const docListeners = {}, winListeners = {};
  const documentStub = {
    hidden: false,
    addEventListener: (ev, fn) => { (docListeners[ev] ??= []).push(fn); },
    querySelectorAll: sel => {
      if (sel === '.link-card, .post-card') return cards;
      if (sel === '.attuned') return cards.filter(c => c.classList.contains('attuned'));
      if (sel.startsWith('.donate-list') || sel.startsWith('a.link-card')) return [];
      if (sel.includes('.link-card') || sel.includes('.post-card')) return cards; // wireHold selectors
      return [];
    },
    querySelector: () => null, // skip-link / avatar blocks stay out of these tests
    getElementById: id => (id === 'post-modal' ? dlg : null),
  };
  const windowStub = {
    AudioContext: function () { return ctx; },
    addEventListener: (ev, fn) => { (winListeners[ev] ??= []).push(fn); },
  };
  new Function('window', 'document', 'matchMedia', 'setTimeout', 'clearTimeout', 'MutationObserver', src)
    (windowStub, documentStub, () => ({ matches: false }), setTimeoutStub, clearTimeoutStub, MOStub);
  const fireDoc = (ev, e) => (docListeners[ev] || []).forEach(fn => fn(e));
  return {
    ctx, cards, timers, flushOne, moCb: () => moCb, fireDoc, documentStub,
    fireWin: (ev, e) => (winListeners[ev] || []).forEach(fn => fn(e)),
    hover: card => fireDoc('mouseover', { target: card, relatedTarget: null }),
    click: card => fireDoc('click', { target: card }),
  };
}
const makeCard = (cls, label = '') => ({
  label,
  classList: {
    _s: new Set(cls),
    contains(c) { return this._s.has(c); },
    add(c) { this._s.add(c); },
    remove(c) { this._s.delete(c); },
  },
  closest(sel) {
    if (sel === '.donate-list') return null;
    return cls.some(k => sel.includes('.' + k)) ? this : null;
  },
  contains: () => false,
  addEventListener() {},
  href: '',
});
const closeTo = (a, b) => Math.abs(a - b) < 1e-6;

// T1: pitch ladder follows DOM order top→bottom — even when the FIRST hovered card
// is in the middle of the list, its note is its DOM-position pitch, not the base A3.
// Also: a suspended context (resume rejecting, no gesture yet) must not throw.
{
  const cards = [makeCard(['link-card']), makeCard(['link-card']), makeCard(['link-card']), makeCard(['link-card'])];
  const w = makeWorld({ cards, suspended: true });
  w.hover(cards[3]); // DOM position 3 → 220 * 2^(7/12), NOT 220
  const f3 = 220 * Math.pow(2, 7 / 12);
  assert.ok(closeTo(w.ctx.oscs[0].frequency.value, f3), 'T1 hover pitch follows DOM position');
  w.hover(cards[0]);
  assert.ok(closeTo(w.ctx.oscs[2].frequency.value, 220), 'T1 first DOM card stays the base A3');
}

// T2: attune walker voices are a real 3-note chord — root × 2^(semi/12). The old
// code indexed the pentatonic ladder with a fraction → undefined → NaN frequency.
{
  const handlers = {};
  const card = makeCard(['link-card']);
  card.addEventListener = (ev, fn) => { (handlers[ev] ??= []).push(fn); };
  const w = makeWorld({ cards: [card] });
  handlers.mouseenter.forEach(fn => fn());       // queue the 3.5 s attune timer
  w.flushOne();                                   // hold starts: first 3 oscs are voices
  const [v0, v1, v2] = w.ctx.oscs;
  const root = 220; // card is DOM position 0
  assert.ok(Number.isFinite(v0.frequency.value) && Number.isFinite(v1.frequency.value) && Number.isFinite(v2.frequency.value),
    'T2 all walker voices have finite frequency (was NaN)');
  assert.ok(closeTo(v0.frequency.value, root), 'T2 voice 0 is the rung root');
  assert.ok(closeTo(v1.frequency.value, root * Math.pow(2, 4 / 12)), 'T2 voice 1 is +M3');
  assert.ok(closeTo(v2.frequency.value, root * Math.pow(2, 7 / 12)), 'T2 voice 2 is +P5');
  w.flushOne();                                   // one random-walk step retunes the chord
  const r = v0.frequency.value;
  assert.ok(Number.isFinite(r) && r > 0, 'T2 step keeps the root finite');
  assert.ok(closeTo(v1.frequency.value / r, Math.pow(2, 4 / 12)), 'T2 step keeps the chord shape (M3)');
  assert.ok(closeTo(v2.frequency.value / r, Math.pow(2, 7 / 12)), 'T2 step keeps the chord shape (P5)');
}

// T3: one modal opening = exactly one sound. Card click plays page(), the observer
// swallows its swell; a popstate-style open (no click) still gets the swell; close
// gets the farewell.
{
  const handlers = {};
  const post = makeCard(['post-card', 'link-card']);
  const dlg = { open: false };
  const w = makeWorld({ cards: [post], dlg });
  const count = () => w.ctx.oscs.length;
  w.click(post);                                  // page() chord: 4 voices × 2 oscs
  const afterClick = count();
  assert.equal(afterClick, 8, 'T3 post-card click sounds its page() chord');
  dlg.open = true; w.moCb()();                    // modal opens → flag consumed
  assert.equal(count(), afterClick, 'T3 click-open does NOT double with the observer swell');
  dlg.open = false; w.moCb()();                   // farewell: 2 voices × 2 oscs
  assert.equal(count(), afterClick + 4, 'T3 close sounds the farewell');
  dlg.open = true; w.moCb()();                    // popstate reopen: swell plays
  assert.equal(count(), afterClick + 12, 'T3 a no-click open still gets its swell');
}

// T4: tab-hide stops an active attune (timer queue drains, .attuned class drops)
// and keeps a badge-reveal silent.
{
  const handlers = {};
  const card = makeCard(['link-card']);
  card.addEventListener = (ev, fn) => { (handlers[ev] ??= []).push(fn); };
  const w = makeWorld({ cards: [card] });
  handlers.mouseenter.forEach(fn => fn());
  w.flushOne();                                   // hold active → walk timer pending
  assert.ok(w.timers.size > 0, 'T4 walker timer pending while attuned');
  w.documentStub.hidden = true;
  w.fireDoc('visibilitychange', {});
  assert.equal(w.timers.size, 0, 'T4 tab-hide clears the walker');
  assert.ok(!card.classList.contains('attuned'), 'T4 tab-hide drops the attuned glow');
  const before = w.ctx.oscs.length;
  w.fireWin('badge-reveal', { detail: 'twitch' });
  assert.equal(w.ctx.oscs.length, before, 'T4 badge-reveal stays silent in a hidden tab');
  w.documentStub.hidden = false;
  w.fireWin('badge-reveal', { detail: 'twitch' });
  assert.equal(w.ctx.oscs.length, before + 4, 'T4 visible badge-reveal sounds the wake-tick');
}

console.log('piano: 4/4 check groups passed');
