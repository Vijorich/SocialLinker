// Runnable check for assets/badges.js PROVIDERS.check — the pure detection
// surface. Feed shapes are stub documents; network/proxy transport is out of scope.
// Usage: node tests/badges.test.mjs
import assert from 'node:assert';
import { PROVIDERS } from '../assets/badges.js';

const NOW = Date.parse('2026-08-24T12:00:00Z');
const daysAgo = n => new Date(NOW - n * 864e5).toISOString();
const cutoff = NOW - 3 * 864e5;

// Stub XML document for YouTube RSS: entries[{ published: [isoTextNode] }]
const xmlDoc = entries => ({
  getElementsByTagName: name => (name === 'entry' ? entries : []),
});
const ytEntry = iso => ({ getElementsByTagName: name => (name === 'published' ? [{ textContent: iso }] : []) });

// Stub HTML document for t.me/s: time[datetime] list, oldest first
const htmlDoc = isos => ({
  querySelectorAll: sel => (sel === 'time[datetime]' ? isos.map(iso => ({ getAttribute: () => iso })) : []),
});

// T1: twitch — decapi uptime strings
{
  const check = PROVIDERS.twitch.check;
  assert.equal(check('3 hours, 25 minutes', cutoff), true, 'T1 uptime string reveals Live');
  assert.equal(check('somechannel is offline', cutoff), false, 'T1 offline stays hidden');
  assert.equal(check('', cutoff), false, 'T1 empty body stays hidden');
  assert.equal(check(undefined, cutoff), false, 'T1 missing body stays hidden');
}

// T2: youtube — freshness vs cutoff, robustness against malformed feeds
{
  const check = (text, doc) => PROVIDERS.youtube.check(text, cutoff, { parseFromString: () => doc });
  assert.equal(check('xml', xmlDoc([ytEntry(daysAgo(1))])), true, 'T2 fresh video reveals New!');
  assert.equal(check('xml', xmlDoc([ytEntry(daysAgo(10))])), false, 'T2 stale video stays hidden');
  assert.equal(check('xml', xmlDoc([ytEntry(daysAgo(3))])), false, 'T2 exactly-at-cutoff stays hidden (strict >)');
  assert.equal(check('xml', xmlDoc([])), false, 'T2 no entries stays hidden');
  assert.equal(check('xml', xmlDoc([{ getElementsByTagName: () => [] }])), false, 'T2 entry without <published> stays hidden');
  assert.equal(check('xml', xmlBroken()), false, 'T2 broken feed shape stays hidden');

  function xmlBroken() {
    // Degenerate feed: no <entry> elements at all
    return { getElementsByTagName: () => [] };
  }
}

// T3: telegram — LAST time[datetime] wins, robustness against proxy HTML drift
{
  const check = (text, doc) => PROVIDERS.telegram.check(text, cutoff, { parseFromString: () => doc });
  assert.equal(check('html', htmlDoc([daysAgo(9), daysAgo(1)])), true, 'T3 latest post fresh reveals New!');
  assert.equal(check('html', htmlDoc([daysAgo(9), daysAgo(4)])), false, 'T3 latest post stale stays hidden');
  assert.equal(check('html', htmlDoc([])), false, 'T3 no timestamps stays hidden');
}

console.log('badges: 3/3 provider check groups passed');
