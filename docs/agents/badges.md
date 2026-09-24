# Badges (Live / New!)

Client-side only: `assets/badges.js` reveals chips hidden at render time by `_includes/links.html`.

Standing rule: a revealed badge pins its card to the top of the list (stable in `social.yml` order; Twitch leads statically).

## Providers

Providers are adapter rows in the exported `PROVIDERS` table — `feed(data)` plus a pure `check(text, cutoff, parser)`. Adding a provider = one row. Detection is fixture-tested in `tests/badges.test.mjs`.

Sources are all keyless:

- Twitch uptime via decapi.me.
- YouTube RSS and t.me/s via a public CORS proxy chain (corsproxy.io → allorigins.win → codetabs.com), with one internal seam in `get()`.

Requests use an 8-second timeout, omit credentials/referrers, and announce a confirmed reveal through the page status live region. Any fetch/parse error leaves the chip hidden.

Per-type presentation concentrates in `announce()` below the seam: confirmed Twitch live also adds `.live` to `.avatar` (sonar ring, gated by `prefers-reduced-motion`) and dispatches `badge-reveal` for piano (see [audio-piano.md](audio-piano.md)).

## Known limits

- No VK support yet: VK blocks the public proxies and needs an API token. When a token appears, it lands as a single new adapter row.
- YouTube needs `channel_id` in `social.yml` (owner finds it at youtube.com/account_advanced); empty = chip suppressed at render in `links.html`, never reaches the client.
