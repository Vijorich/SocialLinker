// Runnable check for the audio stack — asserts on the deep surfaces directly:
//   ladder math + walker bounds + vocabulary data  (assets/piano.js exports)
//   engine gating, envelopes, release              (assets/audio-engine.js)
// Usage: node tests/piano.test.mjs
import assert from 'node:assert';
import { SEMI, rungAt, nextRung, MELODIES, pickMelodyName } from '../assets/piano.js';
import { createAudioEngine } from '../assets/audio-engine.js';

const closeTo = (a, b) => Math.abs(a - b) < 1e-6;

function storageStub() {
  const map = new Map();
  return { getItem: k => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)) };
}

function makeCtx({ state = 'running', failResume = false } = {}) {
  const param = v => ({
    value: v,
    setValueAtTime(x) { this.value = x; },
    exponentialRampToValueAtTime() {},
    linearRampToValueAtTime() {},
    setTargetAtTime(x) { this.value = x; },
    cancelScheduledValues() {},
  });
  const oscs = [];
  const ctx = {
    currentTime: 0,
    state,
    destination: {},
    resume: () => (failResume ? Promise.reject(new Error('autoplay')) : Promise.resolve()),
    createOscillator() {
      const o = {
        frequency: param(440), connect: x => x,
        started: 0, stopped: 0,
        start() { this.started++; },
        stop() { this.stops = this.stops || []; this.stops.push([...arguments]); this.stopped++; },
      };
      oscs.push(o); return o;
    },
    createGain() { return { gain: param(1), connect: x => x, disconnect() {} }; },
    createBiquadFilter() { return { frequency: param(350), Q: param(1), type: '', connect: x => x }; },
  };
  return { ctx, oscs };
}

function makeEngine(opts = {}) {
  const c = makeCtx(opts);
  const storage = storageStub();
  const eng = createAudioEngine({ storage, ctxFactory: () => c.ctx });
  return { eng, ...c, storage };
}

// T1: pentatonic ladder math — DOM-position pitches, octave wrap at 5 steps.
{
  assert.ok(closeTo(rungAt(0), 220), 'T1 base rung is A3');
  assert.ok(closeTo(rungAt(3), 220 * Math.pow(2, 7 / 12)), 'T1 fourth rung is +P5');
  assert.ok(closeTo(rungAt(5), 440), 'T1 sixth rung wraps an octave up');
  assert.equal(SEMI.length, 5, 'T1 five semitone steps per loop');
  assert.ok(closeTo(rungAt(2, 440), 440 * Math.pow(2, 5 / 12)), 'T1 donate scale rides the same ladder an octave up');
}

// T2: walker stays bounded — never below 0, never above pos+4, steps within ±2.
{
  for (const pos of [0, 3, 9]) {
    let rung = pos;
    for (let n = 0; n < 1000; n++) {
      const prev = rung;
      rung = nextRung(rung, pos);
      assert.ok(rung >= 0, 'T2 walker never dips below the first rung');
      assert.ok(rung <= pos + 4, 'T2 walker never exceeds pos+4');
      assert.ok(Math.abs(rung - prev) <= 2, 'T2 walker leaps at most a third');
    }
  }
}

// T3: importance ladder as DATA — exactly one voice per rung, donate fullest.
{
  assert.deepEqual(MELODIES.thank.semis, [0, 4, 7, 11, 14, 21], 'T3 donate thank = maj7 rise + sparkle');
  assert.deepEqual(MELODIES.joy.semis, [0, 4, 7, 11, 14], 'T3 links joy = maj7 lift');
  assert.deepEqual(MELODIES.craft.semis, [0, 4, 7, 14], 'T3 projects craft = add9 arpeggio');
  assert.deepEqual(MELODIES.page.semis, [0, 7, 14], 'T3 posts page = open fifths, shortest');
  assert.ok(MELODIES.thank.semis.length > MELODIES.joy.semis.length, 'T3 donate > links');
  assert.ok(MELODIES.joy.semis.length > MELODIES.craft.semis.length, 'T3 links > projects');
  assert.ok(MELODIES.craft.semis.length > MELODIES.page.semis.length, 'T3 projects > posts');
  assert.deepEqual(MELODIES.glance.semis, [0, 5], 'T3 right-click glance hangs a fourth apart');
  assert.equal(MELODIES.swell.root, 440, 'T3 reopen swell root');
  assert.deepEqual(MELODIES.farewell.semis, [2, 0], 'T3 close sigh sags RE→DO');
}

// T4: melody lookup follows the importance ladder's card classes.
{
  const card = (cls, donateList = false) => ({
    classList: { contains: c => cls.includes(c) },
    closest: sel => (sel === '.donate-list' && donateList ? {} : null),
  });
  assert.equal(pickMelodyName(card(['link-card'], true)), 'thank', 'T4 donate cards thank');
  assert.equal(pickMelodyName(card(['link-card'])), 'joy', 'T4 plain link cards joy');
  assert.equal(pickMelodyName(card(['project-card'])), 'craft', 'T4 project cards craft');
  assert.equal(pickMelodyName(card(['post-card'])), 'page', 'T4 post cards page');
}

// T5: pre-gesture silence — suspended context schedules nothing and never throws
// (the rejecting-resume path included). Ambient voices gate; play() swallows.
{
  const { eng, oscs } = makeEngine({ state: 'suspended', failResume: true });
  assert.equal(eng.running(), false, 'T5 context not running yet');
  eng.play(() => eng.chord(220, [0, 4]));
  eng.note(220);
  eng.tok();
  eng.echo(330);
  assert.equal(eng.hold({ root: 220 }), null, 'T5 hold refuses to start pre-gesture');
  assert.equal(eng.drone(), null, 'T5 drone refuses to start pre-gesture');
  assert.equal(oscs.length, 0, 'T5 nothing scheduled into the frozen clock');
}

// T6: master mute — persisted ('sl-audio'), gates every voice creator inside the
// engine, default ON, unmute restores scheduling.
{
  const { eng, oscs, storage } = makeEngine({});
  assert.equal(eng.muted, false, 'T6 default is sound ON');
  assert.equal(storage.getItem('sl-audio'), null, 'T6 no key written before first toggle');

  eng.toggleMuted();
  assert.equal(eng.muted, true, 'T6 muted after toggle');
  assert.equal(storage.getItem('sl-audio'), 'off', 'T6 mute persisted');
  const before = oscs.length;
  eng.note(220); eng.chord(220, [0, 4]); eng.tok(); eng.echo(330);
  assert.equal(eng.hold({ root: 220 }), null, 'T6 hold gated while muted');
  assert.equal(oscs.length, before, 'T6 muted page schedules nothing');

  eng.toggleMuted();
  assert.equal(storage.getItem('sl-audio'), 'on', 'T6 unmute persisted');
  eng.chord(220, [0, 7, 14]);
  assert.equal(oscs.length - before, 6, 'T6 sound returns: 3 voices × 2 oscs');
}

// T7: attune hold voices are a real chord — root × 2^(semi/12) (the old NaN
// regression), retune keeps the shape, breath LFO runs on 2×stepS.
{
  const { eng, oscs } = makeEngine({});
  const h = eng.hold({ root: 220, semis: [0, 4, 7], stepS: 3.2 });
  assert.ok(h, 'T7 hold starts');
  const lfo = oscs[0]; // first oscillator created by hold is the breath LFO
  assert.ok(closeTo(lfo.frequency.value, 1 / 6.4), 'T7 breath LFO runs on 2×stepS');
  const voices = oscs.slice(-3);
  assert.ok(voices.every(o => Number.isFinite(o.frequency.value) && o.frequency.value > 0), 'T7 all walker voices finite');
  assert.ok(closeTo(voices[0].frequency.value, 220), 'T7 voice 0 is the rung root');
  assert.ok(closeTo(voices[1].frequency.value / voices[0].frequency.value, Math.pow(2, 4 / 12)), 'T7 voice 1 is +M3');
  assert.ok(closeTo(voices[2].frequency.value / voices[0].frequency.value, Math.pow(2, 7 / 12)), 'T7 voice 2 is +P5');
  h.retune(rungAt(3));
  const [v0, v1, v2] = voices;
  assert.ok(closeTo(v1.frequency.value / v0.frequency.value, Math.pow(2, 4 / 12)), 'T7 retune keeps M3');
  assert.ok(closeTo(v2.frequency.value / v0.frequency.value, Math.pow(2, 7 / 12)), 'T7 retune keeps P5');
  h.stop();
}

// T8: releaseAll is the single chokepoint — active holds AND the drone stop
// their oscillators; calling it twice is safe; new voices still work.
{
  const { eng, oscs } = makeEngine({});
  eng.hold({ root: 220 });
  eng.drone();
  const withStop = oscs.filter(o => o.stopped > 0).length;
  assert.equal(withStop, 0, 'T8 voices sustain before release');
  eng.releaseAll();
  assert.equal(oscs.filter(o => o.stopped > 0).length, 8, 'T8 hold (3 voices + LFO) + drone (3 sines + LFO) all stop');
  eng.releaseAll(); // idempotent
  const fresh = eng.hold({ root: 220 });
  assert.ok(fresh, 'T8 fresh hold starts after release');
  assert.ok(oscs.some(o => o.started > 0 && o.stopped === 0), 'T8 fresh voice schedules and sustains after release');
  fresh.stop();
}

// T9: drone singleton — second call returns the live handle, stop is idempotent.
{
  const { eng } = makeEngine({});
  const d1 = eng.drone();
  assert.ok(d1, 'T9 drone started');
  assert.equal(eng.drone(), d1, 'T9 same handle returned while alive');
  d1.stop();
  d1.stop(); // must not re-run envelopes on dead nodes
  const d2 = eng.drone();
  assert.notEqual(d2, d1, 'T9 fresh drone after stop');
}

// T10: browser boot path — production creates the engine WITHOUT an injected
// ctxFactory (piano.js passes { storage } only), so the engine must fall back
// to the ambient AudioContext constructor (the 12cd182 total-silence regression).
{
  const c = makeCtx({ state: 'running' });
  const saved = globalThis.AudioContext;
  globalThis.AudioContext = function () { return c.ctx; };
  try {
    const eng = createAudioEngine({ storage: storageStub() });
    eng.chord(220, [0, 7, 14]);
    assert.equal(c.oscs.length, 6, 'T10 factory-less engine schedules 3 voices × 2 oscs');
    eng.play(() => eng.note(330));
    assert.equal(c.oscs.length, 8, 'T10 gesture play path uses the same default factory');
  } finally {
    if (saved === undefined) delete globalThis.AudioContext;
    else globalThis.AudioContext = saved;
  }
}

// T11: releaseAll stops already-scheduled transient voices too.
{
  const { eng, oscs } = makeEngine({});
  eng.chord(220, [0, 4]);
  const before = oscs.map(o => (o.stops || []).length);
  eng.releaseAll();
  assert.ok(oscs.every((o, i) => (o.stops || []).length > before[i]), 'T11 transient voices receive an early stop');
}

// T12: a persisted mute does not create an AudioContext during unlock.
{
  const c = makeCtx();
  const storage = storageStub();
  storage.setItem('sl-audio', 'off');
  let created = 0;
  const eng = createAudioEngine({ storage, ctxFactory: () => { created++; return c.ctx; } });
  eng.unlock();
  assert.equal(created, 0, 'T12 muted unlock creates no context');
  assert.equal(eng.available, true, 'T12 muted engine remains available for a later unmute');
}

// T13: the factory-less production path supports the legacy WebKit constructor.
{
  const c = makeCtx({ state: 'running' });
  const savedAudio = globalThis.AudioContext;
  const savedWebkit = globalThis.webkitAudioContext;
  delete globalThis.AudioContext;
  globalThis.webkitAudioContext = function () { return c.ctx; };
  try {
    const eng = createAudioEngine({ storage: storageStub() });
    eng.chord(220, [0]);
    assert.equal(c.oscs.length, 2, 'T13 WebKit fallback schedules a voice');
  } finally {
    if (savedAudio === undefined) delete globalThis.AudioContext; else globalThis.AudioContext = savedAudio;
    if (savedWebkit === undefined) delete globalThis.webkitAudioContext; else globalThis.webkitAudioContext = savedWebkit;
  }
}

console.log('piano: 13/13 check groups passed');
