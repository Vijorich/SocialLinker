/* Post-modal session machine.
 *
 * Deep module: article fetch+cache, generation token, dialog fill, scroll lock,
 * View Transition morph, directional prev/next swap, and history sync.
 * Everything that varies outside enters as an injected adapter, which keeps the
 * normal path testable without a browser.
 */

export function createPostModal(deps) {
  const { cards, host, fetcher, hist, navigate, vt, reduce, raf, emit, labels = {} } = deps;
  const { dlg, body, root, status, loading } = host;

  dlg.addEventListener('close', () => { root.overflow = ''; });
  dlg.addEventListener('cancel', e => { e.preventDefault(); close(); });

  const cache = new Map();
  const pending = new Map();
  let gen = 0, current = null, sessionLoading = false;

  async function getArticle(url) {
    if (cache.has(url)) return cache.get(url);
    if (pending.has(url)) return pending.get(url);
    let result;
    try { result = fetcher(url); } catch (error) { result = Promise.reject(error); }
    const request = Promise.resolve(result)
      .then(article => {
        if (article) cache.set(url, article);
        return article;
      })
      .finally(() => pending.delete(url));
    pending.set(url, request);
    return request;
  }

  const top = () => { body.scrollTop = 0; raf(() => { body.scrollTop = 0; }); };

  const focusTitle = () => {
    const heading = body.querySelector('.post-title');
    if (heading && typeof heading.focus === 'function') {
      try { heading.focus({ preventScroll: true }); } catch { heading.focus(); }
    } else if (body && typeof body.focus === 'function') {
      try { body.focus({ preventScroll: true }); } catch { body.focus(); }
    }
  };

  function fill(article) {
    body.innerHTML = article.innerHTML;
    const sourceTitle = article.querySelector('.post-title');
    if (sourceTitle) {
      const title = sourceTitle.textContent.trim();
      dlg.setAttribute('aria-label', title);
      if (status) status.textContent = title;
    } else if (status) {
      status.textContent = '';
    }

    /* Demote h1→h2 inside the modal so the page keeps one document h1. */
    const heading = body.querySelector('.post-title');
    if (heading?.tagName === 'H1') {
      const ownerDocument = body.ownerDocument || (typeof document !== 'undefined' ? document : null);
      if (ownerDocument) {
        const replacement = ownerDocument.createElement('h2');
        for (const attr of heading.attributes || []) replacement.setAttribute(attr.name, attr.value);
        while (heading.firstChild) replacement.appendChild(heading.firstChild);
        heading.replaceWith(replacement);
      }
    }
    const renderedTitle = body.querySelector('.post-title');
    if (renderedTitle) renderedTitle.setAttribute('tabindex', '-1');
    body.querySelectorAll?.('pre').forEach(pre => {
      pre.tabIndex = 0;
      pre.setAttribute('role', 'region');
      pre.setAttribute('aria-label', labels.codeBlock || 'Code');
    });
    top();
  }

  async function open(card, push = true) {
    if (dlg.open && !sessionLoading) return;
    const g = ++gen, url = card.getAttribute('href');
    current = card;

    const prepare = () => {
      sessionLoading = true;
      dlg.style.viewTransitionName = '';
      if (!dlg.open) {
        root.overflow = 'hidden';
        dlg.showModal();
      }
      body.setAttribute?.('aria-busy', 'true');
      if (loading) {
        loading.hidden = false;
        body.innerHTML = '';
      } else {
        body.innerHTML = `<p class="post-modal-loading-fallback">${labels.loading || 'Loading…'}</p>`;
      }
      if (status) status.textContent = labels.loading || 'Loading…';
      top();
      if (typeof body.focus === 'function') {
        try { body.focus({ preventScroll: true }); } catch { body.focus(); }
      }
    };

    /* Open a busy dialog immediately. A post card is not used as a View Transition
       source: its snapshot can sit above the dialog while the morph is running. */
    prepare();

    const article = await getArticle(url);
    if (g !== gen) return;
    if (!article) {
      dismiss();
      navigate(url);
      return;
    }
    const show = () => {
      sessionLoading = false;
      if (loading) loading.hidden = true;
      body.removeAttribute?.('aria-busy');
      fill(article);
      focusTitle();
      top();
      if (!reduce() && typeof dlg.animate === 'function') {
        try {
          dlg.animate(
            [
              { opacity: 0, transform: 'translate(-50%, -50%) translateY(8px) scale(.985)' },
              { opacity: 1, transform: 'translate(-50%, -50%)' },
            ],
            { duration: 180, easing: 'cubic-bezier(0.16,1,0.3,1)' }
          );
        } catch {}
      }
      if (push !== false) hist.push({ postModal: url }, url);
      emit('post-modal-open', { url, source: push === false ? 'history' : 'card' });
    };
    show();
  }

  async function swap(url, push = true, dir = 0) {
    const g = ++gen;
    const article = await getArticle(url);
    if (g !== gen) return;
    if (!article) { navigate(url); return; }
    const card = cards.find(c => c.getAttribute('href') === url);
    current = card || null;
    if (!dlg.open) {
      root.overflow = 'hidden';
      dlg.showModal();
    }
    if (loading) loading.hidden = true;
    body.removeAttribute?.('aria-busy');
    fill(article);
    if (push !== false) hist.replace({ postModal: url }, url);
    const focusAfterSwap = () => { focusTitle(); raf(focusTitle); };
    if (reduce() || !dir || typeof body.animate !== 'function') {
      focusAfterSwap();
      return;
    }
    try {
      body.animate(
        [{ opacity: 0, transform: `translateX(${dir * 28}px)` }, { opacity: 1, transform: 'none' }],
        { duration: 240, easing: 'cubic-bezier(0.16,1,0.3,1)' }
      );
    } catch {}
    focusAfterSwap();
  }

  /* Invalidate before any close transition starts. This is deliberately
     synchronous: history.back() and ViewTransition callbacks are asynchronous. */
  function dismiss(invalidate = true) {
    if (invalidate) gen++;
    sessionLoading = false;
    dlg.close();
    dlg.style.viewTransitionName = '';
    if (loading) loading.hidden = true;
    body.removeAttribute?.('aria-busy');
    emit('post-modal-close', {});
    if (hist.state && hist.state.postModal) hist.back();
  }

  function close() {
    if (!dlg.open) return;
    gen++;
    const source = current;
    if (!vt || reduce() || !source) { dismiss(false); return; }
    dlg.style.viewTransitionName = 'post-morph';
    const closeGen = gen;
    let transition;
    try {
      transition = vt(() => {
        if (closeGen !== gen) return;
        dismiss(false);
        if (source) source.style.viewTransitionName = 'post-morph';
      });
    } catch {
      dlg.style.viewTransitionName = '';
      dismiss(false);
      return;
    }
    transition.finished.catch(() => {}).finally(() => {
      if (source) source.style.viewTransitionName = '';
    });
  }

  function popstate(state) {
    gen++;
    const u = state && state.postModal;
    if (!u) { if (dlg.open) dismiss(); return; }
    const card = cards.find(c => c.getAttribute('href') === u);
    if (!card) {
      if (dlg.open) { dlg.close(); dlg.style.viewTransitionName = ''; }
      navigate(u);
      return;
    }
    if (!dlg.open || sessionLoading) open(card, false);
    else swap(u, false, 0);
  }

  function prefetch(url) { getArticle(url).catch(() => {}); }

  return { open, swap, close, popstate, prefetch };
}

const absoluteURL = (value, base) => {
  try { return new URL(value, base).href; } catch { return value; }
};

/* Browser wiring: build production adapters and attach listeners. */
export function initPostModal(doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc) return;
  const win = doc.defaultView || (typeof window !== 'undefined' ? window : null);
  if (!win) return;
  const article = doc.querySelector('.post-article');
  const dlgEl = doc.getElementById('post-modal');
  if (!article && !dlgEl) return;
  const codeLabel = doc.body?.dataset?.codeLabel || 'Code';
  const makeCodeAccessible = root => root.querySelectorAll('pre').forEach(pre => {
    pre.tabIndex = 0;
    pre.setAttribute('role', 'region');
    pre.setAttribute('aria-label', codeLabel);
  });

  /* Standalone post page (no dialog): the close control is a real home link;
     JS upgrades it to history.back() when possible. */
  if (!dlgEl) {
    makeCodeAccessible(doc);
    const closeBtn = doc.querySelector('.post-close');
    if (closeBtn) closeBtn.addEventListener('click', e => {
      e.preventDefault();
      let sameOrigin = false;
      try { sameOrigin = !!doc.referrer && new URL(doc.referrer, win.location.href).origin === win.location.origin; } catch {}
      if (sameOrigin && win.history.length > 1) win.history.back();
      else win.location.href = doc.body?.dataset?.home || '/';
    });
    return;
  }

  /* Leave native post links untouched when the dialog API is unavailable. */
  if (typeof dlgEl.showModal !== 'function' || typeof dlgEl.close !== 'function') return;
  dlgEl.hidden = false;

  const machine = createPostModal({
    cards: [...doc.querySelectorAll('.post-card')],
    host: {
      dlg: dlgEl,
      body: dlgEl.querySelector('.post-modal-body'),
      root: doc.documentElement.style,
      status: dlgEl.querySelector('[data-post-status]'),
      loading: dlgEl.querySelector('[data-post-loading]'),
    },
    labels: {
      codeBlock: dlgEl.dataset.codeLabel || 'Code',
      loading: dlgEl.dataset.loadingLabel || 'Loading…',
    },
    fetcher: async url => {
      const controller = typeof win.AbortController === 'function' ? new win.AbortController() : null;
      const timer = controller ? setTimeout(() => controller.abort(), 8000) : 0;
      try {
        const options = { credentials: 'same-origin' };
        if (controller) options.signal = controller.signal;
        const r = await win.fetch(url, options);
        if (!r.ok) return null;
        const parsed = new win.DOMParser().parseFromString(await r.text(), 'text/html');
        const result = parsed.querySelector('.post-article');
        if (!result) return null;
        const base = new URL(r.url || url, win.location.href);
        result.querySelectorAll('[href]').forEach(node => {
          const value = node.getAttribute('href');
          if (value) node.setAttribute('href', absoluteURL(value, base));
        });
        result.querySelectorAll('[src]').forEach(node => {
          const value = node.getAttribute('src');
          if (value) node.setAttribute('src', absoluteURL(value, base));
        });
        result.querySelectorAll('[srcset]').forEach(node => {
          const value = node.getAttribute('srcset');
          if (!value) return;
          const normalized = value.split(',').map(part => {
            const [url, ...descriptor] = part.trim().split(/\s+/);
            return [absoluteURL(url, base), ...descriptor].join(' ');
          }).join(', ');
          node.setAttribute('srcset', normalized);
        });
        return result;
      } catch {
        return null;
      } finally {
        clearTimeout(timer);
      }
    },
    hist: {
      get state() { return win.history.state; },
      push: (s, u) => win.history.pushState(s, '', u),
      replace: (s, u) => win.history.replaceState(s, '', u),
      back: () => win.history.back(),
    },
    navigate: u => { win.location.href = u; },
    vt: typeof doc.startViewTransition === 'function'
      ? cb => doc.startViewTransition(cb)
      : null,
    reduce: () => typeof win.matchMedia === 'function' && win.matchMedia('(prefers-reduced-motion: reduce)').matches,
    raf: cb => typeof win.requestAnimationFrame === 'function' ? win.requestAnimationFrame(cb) : setTimeout(cb, 0),
    emit: (type, detail) => win.dispatchEvent(new win.CustomEvent(type, { detail })),
  });

  const plainClick = e => !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey;
  for (const c of doc.querySelectorAll('.post-card')) {
    c.setAttribute('aria-haspopup', 'dialog');
    c.addEventListener('click', e => {
      if (!plainClick(e)) return;
      e.preventDefault();
      machine.open(c);
    });
    c.addEventListener('pointerenter', () => machine.prefetch(c.getAttribute('href')));
  }
  const closeBtn = dlgEl.querySelector('.post-close');
  if (closeBtn) closeBtn.addEventListener('click', machine.close);
  dlgEl.addEventListener('click', e => {
    if (e.target === dlgEl) { machine.close(); return; }
    const nav = e.target?.closest?.('.post-nav a');
    if (nav && dlgEl.contains(nav)) {
      if (!plainClick(e)) return;
      e.preventDefault();
      machine.swap(nav.getAttribute('href'), true, nav.classList.contains('post-nav-next') ? 1 : -1);
    }
  });
  win.addEventListener('popstate', e => machine.popstate(e.state));
}

if (typeof document !== 'undefined') initPostModal();
