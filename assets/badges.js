/* Badges: reveals "Live" (Twitch) / "New!" (YouTube, Telegram) chips on link cards.
 * Chips render hidden; any error (network, proxy down, parse) leaves them hidden.
 * ponytail: third-party deps, no keys — decapi.me (Twitch), public CORS proxies
 * (chain below). Upgrade path if proxies get too flaky: tiny own worker + official APIs.
 *
 * Providers are adapter rows in PROVIDERS: feed(data) builds the request URL,
 * check(text, cutoff, parser) decides revelation — pure and fixture-testable.
 * Adding a provider = adding one row (VK lands here once a token exists).
 * Presentation (pin-to-top, wake-tick event, avatar ring, afterglow) concentrates
 * in reveal()/announce() below the seam; detection never touches the DOM.
 */
export const DIRECT = [u => u, u => u, u => u];
export const PROXIES = [
  u => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
  u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
  u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
];

/* one walker over a chain of URL rewriters, 1.5s between hops.
   decapi is stable — 3 direct retries. proxies die for minutes (520/522) — one shot each. */
function get(url, ok, chain, i = 0) {
  if (i >= chain.length) return;
  fetch(chain[i](url)).then(r => { if (!r.ok) throw 0; return r.text(); })
    .then(ok)
    .catch(() => setTimeout(() => get(url, ok, chain, i + 1), 1500));
}

export const PROVIDERS = {
  twitch: {
    chain: DIRECT,
    feed: d => 'https://decapi.me/twitch/uptime/' + d.badgeLogin,
    /* decapi uptime: "<user> is offline" or "3 hours, 25 minutes" */
    check: text => !!text && !text.includes('offline'),
  },
  youtube: {
    chain: PROXIES,
    feed: d => 'https://www.youtube.com/feeds/videos.xml?channel_id=' + d.badgeId,
    check: (text, cutoff, parser) => {
      const doc = parser.parseFromString(text, 'text/xml');
      const entry = doc.getElementsByTagName('entry')[0];
      const pub = entry && entry.getElementsByTagName('published')[0];
      return !!(pub && Date.parse(pub.textContent) > cutoff);
    },
  },
  telegram: {
    chain: PROXIES,
    feed: d => 'https://t.me/s/' + d.badgeChannel,
    check: (text, cutoff, parser) => {
      const doc = parser.parseFromString(text, 'text/html');
      const times = doc.querySelectorAll('time[datetime]');
      const last = times[times.length - 1];
      return !!(last && Date.parse(last.getAttribute('datetime')) > cutoff);
    },
  },
};

/* Standing rule: a revealed badge pins its card to the top of the list, stable in
   YAML relative order (Twitch leads by data). Native View Transition morphs the
   reorder; unsupported or reduced-motion = instant move. */
function pin(el) {
  const li = el.closest('li'), ul = li && li.parentElement;
  if (!ul) return;
  ul._pinned ??= 0;
  const move = () => { ul.insertBefore(li, ul.children[ul._pinned] || null); ul._pinned++; };
  if (!document.startViewTransition || matchMedia('(prefers-reduced-motion: reduce)').matches) return move();
  const lis = [...ul.children];
  lis.forEach((n, i) => n.style.viewTransitionName = 'link-pin-' + i);
  document.startViewTransition(move).finished.finally(() =>
    lis.forEach(n => n.style.viewTransitionName = ''));
}

function reveal(el) {
  el.hidden = false;
  pin(el);
  // piano.js listens for this to play the wake-tick — no direct coupling.
  window.dispatchEvent(new CustomEvent('badge-reveal', { detail: el.dataset.badgeType }));
}

/* Per-type presentation after a reveal. Twitch is live NOW: pulse the hero avatar
   ring (absent on post pages = skip) and flash the freshly-pinned card hot so the
   eye follows the reorder morph. CSS ignores both under reduced motion. */
function announce(el) {
  reveal(el);
  if (el.dataset.badgeType !== 'twitch') return;
  const av = document.querySelector('.avatar');
  if (av) av.classList.add('live');
  const li = el.closest('li');
  if (li) setTimeout(() => {
    li.classList.add('just-pinned');
    setTimeout(() => li.classList.remove('just-pinned'), 1500);
  }, 350);
}

export function initBadges(root = document) {
  if (!root.querySelector('[data-badge-days]')) return;
  root.querySelectorAll('.badge[data-badge-type]').forEach(el => {
    const p = PROVIDERS[el.dataset.badgeType];
    if (!p) return;
    const days = +el.closest('[data-badge-days]').dataset.badgeDays || 3;
    const cutoff = Date.now() - days * 864e5;
    get(p.feed(el.dataset), text => { if (p.check(text, cutoff, new DOMParser())) announce(el); }, p.chain);
  });
}

if (typeof document !== 'undefined') initBadges();
