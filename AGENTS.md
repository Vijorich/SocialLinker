# AGENTS.md

Personal business-card site for **Vijor**. Static Jekyll site on GitHub Pages (safe mode: **no plugins, no CI**). Content lives in `_data/*.yml`; page composed from includes in `index.html`. Liquid + plain HTML/CSS.

## Local preview

```bash
bundle install
bundle exec jekyll serve --baseurl ""
```

> [!IMPORTANT]
> Always pass `--baseurl ""`. `_config.yml` sets `baseurl: "/SocialLinker"` for the live Pages URL, so a plain `jekyll serve` renders broken asset paths locally. `Gemfile` pins the `github-pages` gem so local build matches the Pages runtime exactly (Jekyll 3.9.x + curated plugin allowlist); transitive deps land in `vendor/` (gitignored).

> [!WARNING]
> Local build does not work on Windows: `bundle exec jekyll` fails with `command not found: jekyll` even after `bundle install`. Don't burn time on it — verify changes with `node --check` (JS) and a YAML parse, and let GitHub Pages do the real build. Modal history sync has a runnable harness: `node tests/modal-history.test.mjs`.

## Composition

`default.html` owns ALL shared chrome (head, meta, OG tags). Never duplicate it in includes.

`index.html` iterates `_data/sections.yml` (order = render order, omit or add entries to show/hide sections). Each section `type` maps to a `_includes/*.html`. Titles: override via `title:` in sections.yml, omit for locale default, `false` to hide the heading.

## Where to edit content

| What | File |
|---|---|
| Section order, titles, visibility | `_data/sections.yml` |
| Nick, avatar path, tagline | `_data/profile.yml` |
| Bio | `_data/profile.yml` (`bio`, `|` block scalar) |
| Social links + order + per-card `description` | `_data/social.yml` |
| Live/New! badges | `_data/social.yml` (`badge` per item, `badge_days`) |
| Projects list | `_data/projects.yml` |
| Donate block | `_data/donate.yml` |
| UI strings | `_data/locale.yml` |
| Icons (inline SVG) | `_includes/icon.html` (`{% case %}`) |
| Styles | `assets/style.css` |

Posts: `_posts/YYYY-MM-DD-slug.md` with `layout: post`, `title`, `date`, `lang` — appear in `articles.html` automatically. On the index they open in a modal (`<dialog id="post-modal">`): JS fetches the post page, extracts `.post-article`, fills the dialog, and morphs the clicked card into the dialog via a shared-element View Transition (`view-transition-name: post-morph`; it morphs back on close). Prev/next nav swaps slide the new article in from the clicked button's side (240ms WAAPI). Both fall back to instant under `prefers-reduced-motion` or where View Transitions are unavailable. The modal is URL-synced (pushState on open/swap, popstate closes or reopens) — refreshing with a modal URL lands on the standalone post page, which remains the no-JS/direct-link fallback. In-flight fetches carry a generation token (`gen`); any open/swap/close/popstate invalidates them, so a stale fetch can't fill the modal or push out of order, and a popstate naming a post with no card on the page hard-navigates to its standalone URL. Prev/next nav lives inside `.post-article` (`_layouts/post.html`), so the modal copies it and intercepts its links to swap content in place.

## Repo-specific quirks

- **Icons**: `icon.html` renders a `{% when %}` per brand from simpleicons.org; unknown `name` falls back to a globe SVG. Add a `case` to add a brand.
- **Badges (Live/New!)**: client-side only — `assets/badges.js` reveals hidden chips rendered by `links.html`. Standing rule: a revealed badge pins its card to the top of the list (stable in `social.yml` order; Twitch leads statically). Sources: decapi.me (Twitch uptime), public CORS proxy chain in `badges.js` (corsproxy.io → allorigins.win → codetabs.com) for YouTube RSS and t.me/s. All keyless; any fetch/parse error leaves the chip hidden. Confirmed Twitch live also adds `.live` to `.avatar` (sonar ring, gated by `prefers-reduced-motion`). No VK support: VK blocks public proxies, needs an API token — add only if one appears. YouTube needs `channel_id` in `social.yml` (owner finds it at youtube.com/account_advanced); empty = chip suppressed at render in `links.html`, never reaches the client.
- **Hover piano + click vocab**: `assets/piano.js` plays a WebAudio-synthesized note when the pointer enters any `.link-card`/`.post-card` (loaded next to `badges.js` with `defer`). Card position in DOM order climbs an A-minor pentatonic scale across octaves (220 Hz base, 5 semitone steps per loop = position A3, A4, A5…). Every card entry sounds with no throttle — hovering up/down the list plays like an instrument. Clicks speak too: each card's click root is its OWN pentatonic tonic (the same `order` map hover uses), so re-clicking the same card sings in the same key. Three open voices built from it: joy = rising add9 `[0,4,7,14]` (link cards), thank = `[0,4,7,11,14]` C-maj7-lift (donate cards, slower), page = `[0,7,14,21]` fifth-stacked on the offbeat (post cards). Middle-click (`auxclick` button=1) hits the same vocabs; right-click (`contextmenu`) is a questioning two-tone glance `[0, 5]` (P4 + tritone, unresolved). Closing the post modal is two notes sagging RE→DO. All glide in on the voice — pitch glides to the chord rather than starting on it, which is what makes it read as resolve, not detune. The click-glide pattern is a shared symmetric mistune `GLIDE_SEMIS=[-7,-4,2,2…]` — warmer than the old minor-third/fifth alternation. The hover plink's octave partial is damped to 0.22 with its decay stretched to 0.85 s for the same reason. Skip-link (`.skip-link:focus`) is a single clean tone at 330 Hz — a soft *tok* that says **the door is this way**.

**Focus instruments**: hovering `.avatar` layers an ember drone (three detuned sines 110/165/220 Hz through a 900 Hz lowpass, gain breathing on a 7.5 s LFO in step with the CSS ember-breath animation, ~1.8 s release on leave, tab-hide stops it). Hover-hold any card ~3.5 s and it attunes: a small 3-note chord (share pentatonic ladder with the card's hover root, biased ±1 steps up/down between steps, ~×1.0/×0.78 gain alternation per 3.2 s step) runs an **evolving random-walk melody** — pitch changes, volume breathes, no two attunes land on the same sequence. Donate cards walk the same ladder on octave 5 (`ladderScale: 2`) so they sit above the fold. CSS (`.attuned::after`, `assets/attune.css`) raises a companion glow on the same 3.5 s delay — donation shimmers warmer, at higher contrast.

**System-driven tick**: when badges.js reveals a live/new chip it dispatches `badge-reveal` — piano.js answers with a two-note Lydian wake-tick (E to F# at 660 Hz, short). That is the only moment the page sounds without a gesture. GitHub link card (href `github.com/Vijorich/*`) gets a faint octave echo 30 ms after its hover-note — Vijor's own workshop voice in the same scale.

All AudioContexts are created lazily on first pointer interaction so autoplay policy can't block them, and the module no-ops under `prefers-reduced-motion`. No-op on touch (no hover).
- **Single-language (RU)**: server-rendered from `locale.yml` and `profile.yml`. No client-side i18n. Add strings to `locale.yml`, reference via `{{ site.data.locale.key }}`.
- **Deploy**: push to `main`; Settings → Pages → Deploy from a branch, `/main`, root. Builds in ~1 min. Keep `baseurl`/`url` in `_config.yml` synced to the repo name.
