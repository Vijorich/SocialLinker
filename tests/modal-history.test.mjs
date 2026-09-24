// Runnable check for assets/post-modal.js — imports the real module and passes
// fakes across its named seams (fetcher / hist / navigate / host / vt / emit).
// Usage: node tests/modal-history.test.mjs
import assert from 'node:assert';
import { createPostModal } from '../assets/post-modal.js';

const tick = () => new Promise(r => setTimeout(r, 0));
const okArticle = url => ({
  innerHTML: 'body-of ' + url,
  querySelector: q => (q === '.post-title' ? { textContent: 'T ' + url, tagName: 'H1', className: 'post-title', firstChild: null, replaceWith() {} } : null),
});

function makeWorld(cardUrls) {
  const cardClicks = new Map();
  const cards = cardUrls.map(url => ({
    style: {},
    getAttribute: n => (n === 'href' ? url : null),
    addEventListener: (ev, fn) => cardClicks.set(url, fn),
  }));
  const dlgListeners = {};
  const body = {
    innerHTML: '', scrollTop: 0,
    animate: () => ({}),
    querySelector: () => null,
    style: { writes: [], setProperty(k, v) { this.writes.push([k, v]); } },
  };
  const dlg = {
    style: {},
    open: false,
    ariaLabel: null,
    showModal() { this.open = true; },
    close() {
      if (!this.open) return;
      this.open = false;
      (dlgListeners.close || []).forEach(fn => fn());
    },
    setAttribute(_k, v) { this.ariaLabel = v; },
    contains: () => true,
    querySelector: sel => (sel === '.post-modal-body' ? body : null),
    addEventListener: (ev, fn) => { (dlgListeners[ev] ??= []).push(fn); },
  };
  const st = { entries: [{ state: null, url: '/' }], idx: 0, pushed: [], replaced: [] };
  const historyLike = {
    get state() { return st.entries[st.idx].state; },
    push(s, _, u) { st.entries.splice(st.idx + 1); st.entries.push({ state: s, url: u }); st.idx++; st.pushed.push(u); },
    replace(s, _, u) { st.entries[st.idx] = { state: s, url: u }; st.replaced.push(u); },
    back() { if (st.idx > 0) { st.idx--; deliverPop(); } },
    forward() { if (st.idx < st.entries.length - 1) { st.idx++; deliverPop(); } },
  };
  const navigated = [];
  const events = [];
  const root = { overflow: '' };
  let vtCalls = 0;
  const machine = createPostModal({
    cards,
    host: { dlg, body, root },
    fetcher: url => new Promise(res => world.fetches.push({ url, resolve: res })),
    hist: {
      get state() { return historyLike.state; },
      push: (s, u) => historyLike.push(s, '', u),
      replace: (s, u) => historyLike.replace(s, '', u),
      back: () => historyLike.back(),
    },
    navigate: u => navigated.push(u),
    vt: cb => { vtCalls++; cb(); return { finished: Promise.resolve() }; },
    reduce: () => false,
    raf: cb => cb(),
    emit: (type, detail) => events.push({ type, detail }),
  });
  const deliverPop = () => machine.popstate(historyLike.state);
  const world = {
    machine, cards, dlg, body, st, historyLike, navigated, events, root,
    get vtCalls() { return vtCalls; },
    fetches: [],
    clickCard: url => machine.open(cards.find(c => c.getAttribute('href') === url)),
    closeViaEsc: () => (dlgListeners.cancel || []).forEach(fn => fn({ preventDefault() {} })),
    deliverPop,
  };
  return world;
}

// T1: open shows modal and pushes post URL; close button pops history and closes.
{
  const w = makeWorld(['/posts/a/', '/posts/b/']);
  w.clickCard('/posts/a/');
  w.fetches[0].resolve(okArticle('/posts/a/'));
  await tick();
  assert.ok(w.dlg.open, 'T1 modal open');
  assert.deepEqual(w.st.pushed, ['/posts/a/'], 'T1 pushed post URL');
  assert.equal(w.historyLike.state.postModal, '/posts/a/', 'T1 state set');
  assert.deepEqual(w.events.filter(e => e.type === 'post-modal-open'),
    [{ type: 'post-modal-open', detail: { url: '/posts/a/', source: 'card' } }],
    'T1 exactly one open event, sourced from the card click');
  assert.equal(w.vtCalls, 0, 'T1 opening does not snapshot the post card above the dialog');
  w.machine.close();
  await tick();
  assert.equal(w.vtCalls, 1, 'T1 close may use the shared-element transition');
  assert.ok(!w.dlg.open, 'T1 close dismisses via history.back');
  assert.equal(w.st.idx, 0, 'T1 popped back to index entry');
  assert.equal(w.events.filter(e => e.type === 'post-modal-close').length, 1, 'T1 one close event');
}

// T2: Back with a modal entry open closes the morph without navigating away.
{
  const w = makeWorld(['/posts/a/']);
  w.clickCard('/posts/a/');
  w.fetches[0].resolve(okArticle('/posts/a/'));
  await tick();
  w.historyLike.back();
  await tick();
  assert.ok(!w.dlg.open, 'T2 back closes modal');
  assert.deepEqual(w.navigated, [], 'T2 no navigation');
}

// T3: history navigation during a slow open — the pending open is superseded (its late
// fetch can't push or fill), and Forward reopens the cached entry the user navigated to.
// The busy dialog is visible immediately; stale work cannot replace its state.
{
  const w = makeWorld(['/posts/a/', '/posts/b/']);
  w.clickCard('/posts/a/');
  w.fetches[0].resolve(okArticle('/posts/a/'));
  await tick(); // open A, entry pushed, A now cached
  w.historyLike.back();
  await tick(); // closed, idx 0
  w.clickCard('/posts/b/'); // open B: fetch pending, modal not yet open (fetch-first)
  assert.ok(w.dlg.open, 'T3 loading dialog opens immediately');
  assert.match(w.body.innerHTML, /Loading/, 'T3 loading state is visible');
  w.historyLike.forward(); // user navigates to the A entry → A reopens from cache
  w.fetches[1].resolve(okArticle('/posts/b/')); // B resolves late — must be dropped
  await tick();
  assert.ok(w.dlg.open, 'T3 A reopened from cache via Forward');
  assert.deepEqual(w.st.pushed, ['/posts/a/'], 'T3 stale B fetch pushed nothing');
  assert.equal(w.cards[1].style.viewTransitionName ?? '', '', 'T3 no stuck VT name on B');
  assert.ok(!w.body.innerHTML.includes('body-of /posts/b/'), 'T3 stale B content did not land');
  const opens = w.events.filter(e => e.type === 'post-modal-open').map(e => e.detail.source);
  assert.deepEqual(opens, ['card', 'history'], 'T3 reopen via Forward reports source "history"');
}

// T4: rapid prev/next swaps — last click wins, exactly one push, content matches,
// and swaps emit no additional open events (the modal never closed).
{
  const w = makeWorld(['/posts/a/', '/posts/b/', '/posts/c/']);
  w.clickCard('/posts/a/');
  w.fetches[0].resolve(okArticle('/posts/a/'));
  await tick();
  w.machine.swap('/posts/b/', true, -1);
  w.machine.swap('/posts/c/', true, 1);
  w.fetches[2].resolve(okArticle('/posts/c/')); // C resolves first
  await tick();
  w.fetches[1].resolve(okArticle('/posts/b/')); // B resolves late — must be dropped
  await tick();
  assert.equal(w.body.innerHTML, 'body-of /posts/c/', 'T4 last click wins');
  assert.deepEqual(w.st.pushed, ['/posts/a/'], 'T4 only the open pushes; swaps replace in place');
  assert.equal(w.historyLike.state.postModal, '/posts/c/', 'T4 current state is the last swap');
  assert.equal(w.events.filter(e => e.type === 'post-modal-open').length, 1, 'T4 swaps emit no open events');
}

// T7: in-modal next/prev must not stack history. After swapping through posts, a
// single close returns to the index, not the previous post.
{
  const w = makeWorld(['/posts/a/', '/posts/b/', '/posts/c/']);
  w.clickCard('/posts/a/');
  w.fetches[0].resolve(okArticle('/posts/a/'));
  await tick();
  w.machine.swap('/posts/b/', true, -1);
  w.fetches[1].resolve(okArticle('/posts/b/'));
  await tick();
  w.machine.swap('/posts/c/', true, 1);
  w.fetches[2].resolve(okArticle('/posts/c/'));
  await tick();
  assert.equal(w.st.idx, 1, 'T7 swaps replaced, did not grow the stack');
  assert.deepEqual(w.st.pushed, ['/posts/a/'], 'T7 one push for the whole session');
  assert.deepEqual(w.st.replaced, ['/posts/b/', '/posts/c/'], 'T7 swaps replaced in place');
  w.machine.close();
  await tick();
  assert.ok(!w.dlg.open, 'T7 close dismissed the modal');
  assert.equal(w.st.idx, 0, 'T7 one back lands on the index, not a previous post');
}

// T5: popstate naming a post with no card on the page navigates to the standalone page
// (hard handoff: dialog closes silently, no close event, no extra history step).
{
  const w = makeWorld(['/posts/a/']);
  w.st.entries.push({ state: { postModal: '/posts/zzz/' }, url: '/posts/zzz/' });
  w.st.idx++;
  w.deliverPop();
  await tick();
  assert.deepEqual(w.navigated, ['/posts/zzz/'], 'T5 unknown post URL loads standalone page');
  assert.equal(w.events.filter(e => e.type === 'post-modal-close').length, 0, 'T5 hard handoff is silent');
}

// T6: a fetch failure dismisses the busy modal and falls back to the standalone page.
{
  const w = makeWorld(['/posts/a/']);
  w.clickCard('/posts/a/');
  assert.ok(w.dlg.open, 'T6 busy modal opens immediately');
  w.fetches[0].resolve(null);
  await tick();
  assert.deepEqual(w.navigated, ['/posts/a/'], 'T6 falls back to standalone page');
  assert.deepEqual(w.st.pushed, [], 'T6 nothing pushed (failed fetch has no URL sync)');
}

// T8: fill() force-resets the modal body's scroll position to top before showing
// new content — a prior post's scroll offset never bleeds into the next open.
{
  const w = makeWorld(['/posts/a/']);
  w.body.scrollTop = 400; // previous post scrolled to the end
  w.clickCard('/posts/a/');
  w.fetches[0].resolve(okArticle('/posts/a/'));
  await tick();
  assert.equal(w.body.scrollTop, 0, 'T8 fill() resets modal body scroll to top');
}

// T9: scroll lock is behavioural now — open hides html overflow through host.root,
// every dismiss path (close, Esc-cancel) unlocks it via the dialog 'close' event.
// The machine never touches body style at all (no position:fixed era regressions).
{
  const w = makeWorld(['/posts/a/']);
  w.clickCard('/posts/a/');
  w.fetches[0].resolve(okArticle('/posts/a/'));
  await tick();
  assert.equal(w.root.overflow, 'hidden', 'T9 lock sets html overflow while open');

  w.machine.close();
  await tick();
  assert.equal(w.root.overflow, '', 'T9 close unlocks html overflow');

  // Esc path routes through the same close()
  const w3 = makeWorld(['/posts/a/']);
  w3.clickCard('/posts/a/');
  w3.fetches[0].resolve(okArticle('/posts/a/'));
  await tick();
  w3.closeViaEsc();
  await tick();
  assert.ok(!w3.dlg.open, 'T9 Esc closes the modal');
  assert.equal(w3.st.idx, 0, 'T9 Esc pops the session entry');
  assert.equal(w3.root.overflow, '', 'T9 Esc unlocks html overflow');
  assert.deepEqual(w3.body.style.writes.filter(([k]) => k.includes('position')), [], 'T9 body style untouched (no position:fixed)');
}

// T10: prefetch and open share one in-flight request.
{
  const w = makeWorld(['/posts/a/']);
  w.machine.prefetch('/posts/a/');
  w.clickCard('/posts/a/');
  assert.equal(w.fetches.length, 1, 'T10 in-flight article request is deduplicated');
  w.fetches[0].resolve(okArticle('/posts/a/'));
  await tick();
  assert.ok(w.dlg.open, 'T10 shared request opens the modal');
}

// T11: closing while a swap is pending invalidates the late result.
{
  const w = makeWorld(['/posts/a/', '/posts/b/']);
  w.clickCard('/posts/a/');
  w.fetches[0].resolve(okArticle('/posts/a/'));
  await tick();
  w.machine.swap('/posts/b/', true, 0);
  w.machine.close();
  w.fetches[1].resolve(okArticle('/posts/b/'));
  await tick();
  assert.ok(!w.dlg.open, 'T11 late swap cannot reopen a closed modal');
  assert.equal(w.body.innerHTML, 'body-of /posts/a/', 'T11 closed modal keeps its prior fill');
}

console.log('modal-history: 11/11 checks passed');
