/* Post-modal session machine.
 *
 * Deep module: article fetch+cache, generation token, dialog fill (h1→h2
 * demotion), scroll lock, View Transition morph on open/close, directional
 * prev/next swap, and history sync all live behind a small interface:
 *
 *   open(card)        card click → fetch, show, push post URL
 *   swap(url, dir)    in-modal prev/next: replaceState, never stacks history
 *   close()           every dismiss path; pops the session entry
 *   popstate(state)   Back/Forward: close, reopen from cache, or hand off
 *   prefetch(url)     pointerover warm-up of the cache
 *
 * Everything that varies outside enters as an injected adapter — two adapters
 * per seam make each one real (prod vs tests):
 *   fetcher(url)   -> Promise<article|null>   null = failure, never cached
 *   hist           -> { state, push(s,u), replace(s,u), back() }
 *   navigate(url)  -> hard navigation (failed fetch / unknown popstate URL)
 *   host           -> { dlg, body, root }     elements the machine drives
 *   vt(cb) | null  -> startViewTransition wrapper; null = unsupported
 *   reduce()       -> prefers-reduced-motion
 *   raf(cb)
 *   emit(type, detail) -> 'post-modal-open' {url, source} / 'post-modal-close'
 *
 * The layout wires DOM events onto this interface via initPostModal(); tests
 * import createPostModal and pass fakes across the seams.
 */
export function createPostModal(deps) {
  const { cards, host, fetcher, hist, navigate, vt, reduce, raf, emit } = deps;
  const { dlg, body, root } = host;
  /* Scroll lock = overflow:hidden on html only: no position:fixed, no saved offset,
     so close never touches scroll position. 'close' fires on every dismiss path
     (button, backdrop, Esc, popstate) — the single unlock chokepoint. */
  dlg.addEventListener('close', () => { root.overflow = ''; });
  /* Esc routes through the same close() as every other dismiss path. */
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });

  const cache = new Map();
  let gen = 0, current = null;

  async function getArticle(url) {
    if (cache.has(url)) return cache.get(url);
    const art = await fetcher(url);
    /* Cache successes only: a failed fetch must retry on the next click, not
       hard-navigate forever off one transient network blip. */
    if (art) cache.set(url, art);
    return art;
  }

  /* Instant jump to top — not body.scroll(0,0), which is smooth under CSS
     scroll-behavior and would animate the old post's scroll away instead of
     resetting it. rAF re-asserts once post-fill layout / morph settles. */
  const top = () => { body.scrollTop = 0; raf(() => { body.scrollTop = 0; }); };

  function fill(article) {
    body.innerHTML = article.innerHTML;
    const t = article.querySelector('.post-title');
    if (t) {
      dlg.setAttribute('aria-label', t.textContent);
      /* Demote h1→h2 inside the modal so the page keeps one document h1 (the
         hero nick); the standalone post page keeps its server-rendered h1. */
      const h = body.querySelector('.post-title');
      if (h && h.tagName === 'H1') {
        const d = document.createElement('h2');
        d.className = h.className;
        while (h.firstChild) d.appendChild(h.firstChild);
        h.replaceWith(d);
      }
    }
    top();
  }

  async function open(card, push = true) {
    if (dlg.open) return;
    const g = ++gen, url = card.getAttribute('href');
    const article = await getArticle(url);
    if (g !== gen) return;
    if (!article) { navigate(url); return; }
    current = card;
    const show = () => {
      fill(article);
      root.overflow = 'hidden';
      dlg.showModal();
      top();
      if (push !== false) hist.push({ postModal: url }, url);
      emit('post-modal-open', { url, source: push === false ? 'history' : 'card' });
    };
    if (!vt || reduce()) { show(); return; }
    card.style.viewTransitionName = 'post-morph';
    const transition = vt(() => {
      show();
      dlg.style.viewTransitionName = 'post-morph';
      card.style.viewTransitionName = '';
    });
    /* The morph animates the DIALOG — it must not inherit the old scroll offset
       mid-transition. Assert once more when it finishes. */
    transition.finished.catch(() => {}).finally(() => {
      top();
      card.style.viewTransitionName = '';
      dlg.style.viewTransitionName = '';
    });
  }

  async function swap(url, push = true, dir = 0) {
    const g = ++gen;
    const article = await getArticle(url);
    if (g !== gen) return;
    if (!article) { navigate(url); return; }
    const card = cards.find(c => c.getAttribute('href') === url);
    if (card) current = card;
    if (!dlg.open) { root.overflow = 'hidden'; dlg.showModal(); }
    fill(article);
    /* replaceState, not pushState: in-modal next/prev must NOT stack history
       entries — one entry per modal session; close→back always lands on index. */
    if (push !== false) hist.replace({ postModal: url }, url);
    if (reduce() || !dir) return;
    body.animate(
      [{ opacity: 0, transform: `translateX(${dir * 28}px)` }, { opacity: 1, transform: 'none' }],
      { duration: 240, easing: 'cubic-bezier(0.16,1,0.3,1)' }
    );
  }

  /* Single dismiss path: dlg.close() fires the 'close' listener (scroll unlock),
     the emitted event voices the piano farewell, then we pop our session entry. */
  function dismiss() {
    dlg.close();
    dlg.style.viewTransitionName = '';
    emit('post-modal-close', {});
    if (hist.state && hist.state.postModal) hist.back();
  }

  function close() {
    if (!dlg.open) return;
    if (!vt || reduce() || !current) { dismiss(); return; }
    dlg.style.viewTransitionName = 'post-morph';
    const transition = vt(() => {
      dismiss();
      if (current) current.style.viewTransitionName = 'post-morph';
    });
    transition.finished.catch(() => {}).finally(() => {
      if (current) current.style.viewTransitionName = '';
    });
  }

  function popstate(state) {
    gen++;
    const u = state && state.postModal;
    if (!u) { if (dlg.open) dismiss(); return; }
    const card = cards.find(c => c.getAttribute('href') === u);
    if (!card) {
      /* A post URL with no card on this page: land on its standalone page. */
      if (dlg.open) { dlg.close(); dlg.style.viewTransitionName = ''; }
      navigate(u);
      return;
    }
    if (!dlg.open) open(card, false);
    else swap(u, false, 0);
  }

  function prefetch(url) { getArticle(url); }

  return { open, swap, close, popstate, prefetch };
}

/* Browser wiring: build prod adapters, attach listeners, nothing else. */
export function initPostModal(doc = document) {
  const article = doc.querySelector('.post-article');
  const dlgEl = doc.getElementById('post-modal');
  if (!article && !dlgEl) return;

  /* Standalone post page (no dialog): close button = back, else home.
     Home URL rides on <body data-home="..."> so the layout keeps owning URLs. */
  if (!dlgEl) {
    const closeBtn = doc.querySelector('.post-close');
    if (closeBtn) closeBtn.addEventListener('click', () => {
      if (history.length > 1) history.back();
      else location.href = doc.body?.dataset?.home || '/';
    });
    return;
  }

  const machine = createPostModal({
    cards: [...doc.querySelectorAll('.post-card')],
    host: {
      dlg: dlgEl,
      body: dlgEl.querySelector('.post-modal-body'),
      root: doc.documentElement.style,
    },
    fetcher: async url => {
      try {
        const r = await fetch(url);
        if (!r.ok) return null;
        return new DOMParser().parseFromString(await r.text(), 'text/html').querySelector('.post-article');
      } catch { return null; }
    },
    hist: {
      get state() { return history.state; },
      push: (s, u) => history.pushState(s, '', u),
      replace: (s, u) => history.replaceState(s, '', u),
      back: () => history.back(),
    },
    navigate: u => { location.href = u; },
    vt: typeof doc.startViewTransition === 'function'
      ? cb => doc.startViewTransition(cb)
      : null,
    reduce: () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    raf: cb => requestAnimationFrame(cb),
    emit: (type, detail) => window.dispatchEvent(new CustomEvent(type, { detail })),
  });

  for (const c of doc.querySelectorAll('.post-card')) {
    c.addEventListener('click', e => { e.preventDefault(); machine.open(c); });
    if ('onpointerover' in c) c.addEventListener('pointerover', () => machine.prefetch(c.getAttribute('href')));
  }
  dlgEl.querySelector('.post-close').addEventListener('click', machine.close);
  dlgEl.addEventListener('click', e => {
    if (e.target === dlgEl) { machine.close(); return; }
    const nav = e.target.closest('.post-nav a');
    if (nav && dlgEl.contains(nav)) {
      e.preventDefault();
      machine.swap(nav.getAttribute('href'), true, nav.classList.contains('post-nav-next') ? 1 : -1);
    }
  });
  window.addEventListener('popstate', e => machine.popstate(e.state));
}

if (typeof document !== 'undefined') initPostModal();
