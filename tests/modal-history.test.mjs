// Runnable check for the post-modal history sync in _layouts/default.html.
// Extracts the inline <script> and runs it against a stub DOM/history/fetch.
// Usage: node tests/modal-history.test.mjs
import { readFileSync } from 'node:fs';
import assert from 'node:assert';

const html = readFileSync(new URL('../_layouts/default.html', import.meta.url), 'utf8');
const code = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const tick = () => new Promise(r => setTimeout(r, 0));
const okResp = url => ({ ok: true, text: async () => url });

function makeWorld(cardUrls) {
  const popListeners = [];
  const cardClicks = new Map();
  let closeClick = null;
  const dlgListeners = {};
  const body = { innerHTML: '', scrollTop: 0 };
  const cards = cardUrls.map(url => ({
    style: {},
    getAttribute: n => (n === 'href' ? url : null),
    addEventListener: (ev, fn) => cardClicks.set(url, fn),
  }));
  const dlg = {
    open: false,
    showModal() { this.open = true; },
    close() { this.open = false; },
    setAttribute() {},
    contains: () => true,
    querySelector: sel =>
      sel === '.post-modal-body' ? body : { addEventListener: (ev, fn) => { closeClick = fn; } },
    addEventListener: (ev, fn) => { dlgListeners[ev] = fn; },
  };
  const st = { entries: [{ state: null, url: '/' }], idx: 0, pushed: [], navigated: null };
  const firePop = () => popListeners.forEach(fn => fn({ state: history.state }));
  const history = {
    get state() { return st.entries[st.idx].state; },
    pushState(s, _, url) { st.entries.splice(st.idx + 1); st.entries.push({ state: s, url }); st.idx++; st.pushed.push(url); },
    back() { if (st.idx > 0) { st.idx--; firePop(); } },
    forward() { if (st.idx < st.entries.length - 1) { st.idx++; firePop(); } },
  };
  const location = {};
  Object.defineProperty(location, 'href', { get: () => st.navigated, set: v => { st.navigated = v; } });
  const fetches = [];
  const world = {
    cards, dlg, body, st, history, location, fetches, cardClicks, dlgListeners,
    clickCard: url => cardClicks.get(url)({ preventDefault() {} }),
    clickClose: () => closeClick(),
    navClick: url => dlgListeners.click({
      target: { closest: s => (s === '.post-nav a' ? { getAttribute: () => url } : null) },
      preventDefault() {},
    }),
    firePop,
  };
  const windowStub = {
    matchMedia: () => ({ matches: false }),
    addEventListener: (ev, fn) => { if (ev === 'popstate') popListeners.push(fn); },
  };
  const documentStub = {
    querySelector: () => null,
    querySelectorAll: sel => (sel === '.post-card' ? cards : []),
    getElementById: id => (id === 'post-modal' ? dlg : null),
  };
  const fetchStub = url => new Promise(res => fetches.push({ url, resolve: res }));
  const DOMParserStub = class {
    parseFromString(text) {
      return {
        querySelector: sel =>
          sel === '.post-article'
            ? { innerHTML: 'body-of ' + text, querySelector: q => (q === '.post-title' ? { textContent: 'T ' + text } : null) }
            : null,
      };
    }
  };
  const sessionStub = { getItem: () => null, setItem() {}, removeItem() {} };
  new Function('window', 'document', 'history', 'location', 'fetch', 'sessionStorage', 'DOMParser', code)
    (windowStub, documentStub, history, location, fetchStub, sessionStub, DOMParserStub);
  return world;
}

// T1: open shows modal and pushes post URL; close button pops history and closes.
{
  const w = makeWorld(['/posts/a/', '/posts/b/']);
  w.clickCard('/posts/a/');
  w.fetches[0].resolve(okResp('/posts/a/'));
  await tick();
  assert.ok(w.dlg.open, 'T1 modal open');
  assert.deepEqual(w.st.pushed, ['/posts/a/'], 'T1 pushed post URL');
  assert.equal(w.history.state.postModal, '/posts/a/', 'T1 state set');
  w.clickClose();
  await tick();
  assert.ok(!w.dlg.open, 'T1 close button closes via history.back');
  assert.equal(w.st.idx, 0, 'T1 popped back to index entry');
}

// T2: Back with a modal entry open closes the morph without navigating away.
{
  const w = makeWorld(['/posts/a/']);
  w.clickCard('/posts/a/');
  w.fetches[0].resolve(okResp('/posts/a/'));
  await tick();
  w.history.back();
  await tick();
  assert.ok(!w.dlg.open, 'T2 back closes modal');
  assert.equal(w.st.navigated, null, 'T2 no navigation');
}

// T3: history navigation during a slow open — the pending open is superseded
// (its late fetch can't push or fill), but the modal stays open serving the entry
// the user navigated to. Loading-on-open means the modal is no longer closed here.
{
  const w = makeWorld(['/posts/a/', '/posts/b/']);
  w.clickCard('/posts/a/');
  w.fetches[0].resolve(okResp('/posts/a/'));
  await tick(); // open A, entry pushed
  w.history.back();
  await tick(); // closed, idx 0
  w.clickCard('/posts/b/'); // opens B (loading), slow fetch pending
  assert.ok(w.dlg.open, 'T3 modal opened for B with loading (no silent fetch)');
  w.history.forward(); // user navigates to A entry while B fetches → swap(A)
  w.fetches[1].resolve(okResp('/posts/b/')); // B resolves late — must be dropped
  await tick();
  assert.deepEqual(w.st.pushed, ['/posts/a/'], 'T3 stale B fetch pushed nothing');
  assert.equal(w.cards[1].style.viewTransitionName ?? '', '', 'T3 no stuck VT name on B');
  assert.ok(!w.body.innerHTML.includes('body-of /posts/b/'), 'T3 stale B content did not land');
}

// T4: rapid prev/next swaps — last click wins, exactly one push, content matches.
{
  const w = makeWorld(['/posts/a/', '/posts/b/', '/posts/c/']);
  w.clickCard('/posts/a/');
  w.fetches[0].resolve(okResp('/posts/a/'));
  await tick();
  w.navClick('/posts/b/');
  w.navClick('/posts/c/');
  w.fetches[2].resolve(okResp('/posts/c/')); // C resolves first
  await tick();
  w.fetches[1].resolve(okResp('/posts/b/')); // B resolves late — must be dropped
  await tick();
  assert.equal(w.body.innerHTML, 'body-of /posts/c/', 'T4 last click wins');
  assert.deepEqual(w.st.pushed, ['/posts/a/', '/posts/c/'], 'T4 one push, right order');
}

// T5: popstate naming a post with no card on the page navigates to the standalone page.
{
  const w = makeWorld(['/posts/a/']);
  w.st.entries.push({ state: { postModal: '/posts/zzz/' }, url: '/posts/zzz/' });
  w.st.idx++;
  w.firePop();
  await tick();
  assert.equal(w.st.navigated, '/posts/zzz/', 'T5 unknown post URL loads standalone page');
}

// T6: fetch failure shows the loading state first, then falls back to full navigation.
{
  const w = makeWorld(['/posts/a/']);
  w.clickCard('/posts/a/');
  assert.ok(w.dlg.open, 'T6 modal opens with loading immediately (no silent fetch)');
  assert.ok(w.body.innerHTML.includes('Загрузка'), 'T6 loading state shown before fallback');
  w.fetches[0].resolve({ ok: false });
  await tick();
  assert.equal(w.st.navigated, '/posts/a/', 'T6 falls back to standalone page after showing state');
  assert.deepEqual(w.st.pushed, [], 'T6 nothing pushed (failed fetch has no URL sync)');
}

console.log('modal-history: 6/6 checks passed');
