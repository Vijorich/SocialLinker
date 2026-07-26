// Badges: reveals "Live" (Twitch) / "New!" (YouTube, Telegram) chips on link cards.
// Chips render hidden; any error (network, proxy down, parse) leaves them hidden.
// ponytail: third-party deps, no keys — decapi.me (Twitch), api.allorigins.win (CORS proxy).
// Upgrade path if proxies get too flaky: tiny own worker + official APIs.
(() => {
  if (!document.querySelector('[data-badge-days]')) return;

  // allorigins intermittently 520/522s — retry up to 3 times with a pause
  const get = (url, ok, tries = 3) => {
    fetch(url).then(r => { if (!r.ok) throw 0; return r.text(); })
      .then(ok)
      .catch(() => { if (tries > 1) setTimeout(() => get(url, ok, tries - 1), 1500); });
  };
  const proxied = url => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);

  document.querySelectorAll('.badge[data-badge-type]').forEach(el => {
    const d = el.dataset;
    const cutoff = Date.now() - (+el.closest('[data-badge-days]').dataset.badgeDays || 3) * 864e5;
    if (d.badgeType === 'twitch') {
      // decapi uptime: "<user> is offline" or "3 hours, 25 minutes"
      get('https://decapi.me/twitch/uptime/' + d.badgeLogin, text => {
        if (!text.includes('offline')) el.hidden = false;
      });
    } else if (d.badgeType === 'youtube') {
      get(proxied('https://www.youtube.com/feeds/videos.xml?channel_id=' + d.badgeId), xml => {
        const doc = new DOMParser().parseFromString(xml, 'text/xml');
        const entry = doc.getElementsByTagName('entry')[0];
        const pub = entry && entry.getElementsByTagName('published')[0];
        if (pub && Date.parse(pub.textContent) > cutoff) el.hidden = false;
      });
    } else if (d.badgeType === 'telegram') {
      get(proxied('https://t.me/s/' + d.badgeChannel), html => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const times = doc.querySelectorAll('time[datetime]');
        const last = times[times.length - 1];
        if (last && Date.parse(last.getAttribute('datetime')) > cutoff) el.hidden = false;
      });
    }
  });
})();
