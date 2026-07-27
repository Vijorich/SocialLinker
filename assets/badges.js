// Badges: reveals "Live" (Twitch) / "New!" (YouTube, Telegram) chips on link cards.
// Chips render hidden; any error (network, proxy down, parse) leaves them hidden.
// ponytail: third-party deps, no keys — decapi.me (Twitch), public CORS proxies (chain below).
// Upgrade path if proxies get too flaky: tiny own worker + official APIs.
(() => {
  if (!document.querySelector('[data-badge-days]')) return;

  // one walker over a chain of URL rewriters, 1.5s between hops.
  // decapi is stable — 3 direct retries. proxies die for minutes (520/522) — one shot each.
  const DIRECT = [u => u, u => u, u => u];
  const PROXIES = [
    u => 'https://corsproxy.io/?url=' + encodeURIComponent(u),
    u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
    u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
  ];
  const get = (url, ok, chain, i = 0) => {
    if (i >= chain.length) return;
    fetch(chain[i](url)).then(r => { if (!r.ok) throw 0; return r.text(); })
      .then(ok)
      .catch(() => setTimeout(() => get(url, ok, chain, i + 1), 1500));
  };

  document.querySelectorAll('.badge[data-badge-type]').forEach(el => {
    const d = el.dataset;
    const cutoff = Date.now() - (+el.closest('[data-badge-days]').dataset.badgeDays || 3) * 864e5;
    if (d.badgeType === 'twitch') {
      // decapi uptime: "<user> is offline" or "3 hours, 25 minutes"
      get('https://decapi.me/twitch/uptime/' + d.badgeLogin, text => {
        if (!text.includes('offline')) el.hidden = false;
      }, DIRECT);
    } else if (d.badgeType === 'youtube') {
      get('https://www.youtube.com/feeds/videos.xml?channel_id=' + d.badgeId, xml => {
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const entry = doc.getElementsByTagName('entry')[0];
        const pub = entry && entry.getElementsByTagName('published')[0];
        if (pub && Date.parse(pub.textContent) > cutoff) el.hidden = false;
      }, PROXIES);
    } else if (d.badgeType === 'telegram') {
      get('https://t.me/s/' + d.badgeChannel, html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const times = doc.querySelectorAll('time[datetime]');
        const last = times[times.length - 1];
        if (last && Date.parse(last.getAttribute('datetime')) > cutoff) el.hidden = false;
      }, PROXIES);
    }
  });
})();
