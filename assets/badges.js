/* Badges: reveals "Live" (Twitch) / "New!" (YouTube, Telegram) chips on link cards.
 * Chips render hidden; any error (network, proxy down, parse) leaves them hidden.
 * Badge feeds are intentionally third-party requests, but each request is
 * bounded, credential-free, and announced to assistive technology only after a
 * confirmed, fresh response.
 */
export const DIRECT = [u => u, u => u, u => u];
export const PROXIES = [
  u => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
  u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
  u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
];

const REQUEST_TIMEOUT_MS = 8000;
const RETRY_DELAY_MS = 1500;

/* One walker over a chain of URL rewriters. Every attempt has a deadline and
   omits credentials/referrers; a parser error also advances the chain. */
function get(url, ok, chain, i = 0) {
  if (i >= chain.length) return;
  const controller = typeof globalThis.AbortController === 'function' ? new globalThis.AbortController() : null;
  let timer = 0;
  let timedOut = false;
  timer = setTimeout(() => {
    timedOut = true;
    controller?.abort();
  }, REQUEST_TIMEOUT_MS);
  const options = { credentials: 'omit', referrerPolicy: 'no-referrer' };
  if (controller) options.signal = controller.signal;
  const retry = () => {
    clearTimeout(timer);
    if (i + 1 < chain.length) setTimeout(() => get(url, ok, chain, i + 1), RETRY_DELAY_MS);
  };
  let request;
  try {
    request = fetch(chain[i](url), options);
  } catch {
    retry();
    return;
  }
  Promise.resolve(request)
    .then(r => { if (!r.ok) throw new Error(`badge HTTP ${r.status}`); return r.text(); })
    .then(text => {
      clearTimeout(timer);
      if (timedOut) throw new Error('badge request timed out');
      if (ok(text) === false) throw new Error('badge response did not match provider format');
    })
    .catch(retry);
}

export const PROVIDERS = {
  twitch: {
    chain: DIRECT,
    feed: d => 'https://decapi.me/twitch/uptime/' + encodeURIComponent(d.badgeLogin || ''),
    /* decapi uptime: "<user> is offline" or "3 hours, 25 minutes". Reject
       common 200 error bodies instead of treating every response as live. */
    check: text => {
      const value = String(text || '').trim().toLowerCase();
      if (!value || value.includes('offline')) return false;
      if (/^[\[{]|<\/?(?:html|!doctype)\b/.test(value)) return false;
      if (/(error|unavailable|not found|unknown user|rate limit|too many requests|maintenance|forbidden)/.test(value)) return false;
      return /\bis\s+live\b|\b(?:seconds?|minutes?|hours?|days?)\b/.test(value);
    },
  },
  youtube: {
    chain: PROXIES,
    feed: d => 'https://www.youtube.com/feeds/videos.xml?channel_id=' + encodeURIComponent(d.badgeId || ''),
    check: (text, cutoff, parser) => {
      const parsed = parser.parseFromString(text, 'text/xml');
      const entry = parsed.getElementsByTagName('entry')[0];
      const pub = entry && entry.getElementsByTagName('published')[0];
      return !!(pub && Date.parse(pub.textContent) > cutoff);
    },
  },
  telegram: {
    chain: PROXIES,
    feed: d => 'https://t.me/s/' + encodeURIComponent(d.badgeChannel || ''),
    check: (text, cutoff, parser) => {
      const parsed = parser.parseFromString(text, 'text/html');
      const times = parsed.querySelectorAll('time[datetime]');
      const last = times[times.length - 1];
      return !!(last && Date.parse(last.getAttribute('datetime')) > cutoff);
    },
  },
};

/* Standing rule: revealed badges form a stable block at the top, ordered by
   their original YAML position rather than by network response time. */
function pin(el) {
  const li = el.closest('li'), ul = li && li.parentElement;
  if (!ul) return;
  ul._badgeRanks ??= new Map([...ul.children].map((node, index) => [node, index]));
  if (!ul._badgeRanks.has(li)) ul._badgeRanks.set(li, ul._badgeRanks.size);
  li._badgePinned = true;

  const move = () => {
    const rank = node => ul._badgeRanks.get(node) ?? Number.MAX_SAFE_INTEGER;
    const pinned = [...ul.children].filter(node => node._badgePinned);
    const before = pinned.find(node => node !== li && rank(node) > rank(li));
    if (before) {
      ul.insertBefore(li, before);
    } else {
      const firstUnpinned = [...ul.children].find(node => !node._badgePinned);
      ul.insertBefore(li, firstUnpinned || null);
    }
  };

  const reduce = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
  if (typeof document.startViewTransition !== 'function' || reduce) {
    move();
    return;
  }
  const lis = [...ul.children];
  lis.forEach((node, index) => { node.style.viewTransitionName = `link-pin-${index}`; });
  try {
    const transition = document.startViewTransition(move);
    transition.finished.catch(() => {}).finally(() => {
      lis.forEach(node => { node.style.viewTransitionName = ''; });
    });
  } catch {
    lis.forEach(node => { node.style.viewTransitionName = ''; });
    move();
  }
}

function reveal(el) {
  if (!el.hidden) return false;
  el.hidden = false;
  pin(el);
  const status = document.getElementById('site-status');
  if (status) status.textContent = el.textContent.trim();
  window.dispatchEvent(new CustomEvent('badge-reveal', { detail: el.dataset.badgeType }));
  return true;
}

/* Per-type presentation after a reveal. */
function announce(el) {
  if (!reveal(el)) return false;
  if (el.dataset.badgeType === 'twitch') {
    const av = document.querySelector('.avatar');
    if (av) av.classList.add('live');
    const li = el.closest('li');
    if (li) setTimeout(() => {
      li.classList.add('just-pinned');
      setTimeout(() => li.classList.remove('just-pinned'), 1500);
    }, 350);
  }
  return true;
}

export function initBadges(root = (typeof document !== 'undefined' ? document : null)) {
  if (!root || !root.querySelector('[data-badge-days]')) return;
  const requested = new Set();
  root.querySelectorAll('.badge[data-badge-type]').forEach(el => {
    const provider = PROVIDERS[el.dataset.badgeType];
    if (!provider) return;
    const feedURL = provider.feed(el.dataset);
    if (requested.has(feedURL)) return;
    requested.add(feedURL);
    const days = +el.closest('[data-badge-days]').dataset.badgeDays || 3;
    const cutoff = Date.now() - days * 864e5;
    get(feedURL, text => {
      try {
        const fresh = provider.check(text, cutoff, new DOMParser());
        if (fresh) announce(el);
        return fresh;
      } catch {
        return false;
      }
    }, provider.chain);
  });
}

if (typeof document !== 'undefined') initBadges();
