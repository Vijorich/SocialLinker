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

Posts: `_posts/YYYY-MM-DD-slug.md` with `layout: post`, `title`, `date`, `lang` — appear in `articles.html` automatically. On the index they open in a modal (`<dialog id="post-modal">`): JS fetches the post page, extracts `.post-article`, fills the dialog, and opens it instantly (no transition/animation). The modal is URL-synced (pushState on open/swap, popstate closes or reopens) — refreshing with a modal URL lands on the standalone post page, which remains the no-JS/direct-link fallback. In-flight fetches carry a generation token (`gen`); any open/swap/close/popstate invalidates them, so a stale fetch can't fill the modal or push out of order, and a popstate naming a post with no card on the page hard-navigates to its standalone URL. Prev/next nav lives inside `.post-article` (`_layouts/post.html`), so the modal copies it and intercepts its links to swap content in place.

## Repo-specific quirks

- **Icons**: `icon.html` renders a `{% when %}` per brand from simpleicons.org; unknown `name` falls back to a globe SVG. Add a `case` to add a brand.
- **Badges (Live/New!)**: client-side only — `assets/badges.js` reveals hidden chips rendered by `links.html`. Standing rule: a revealed badge pins its card to the top of the list (stable in `social.yml` order; Twitch leads statically). Sources: decapi.me (Twitch uptime), public CORS proxy chain in `badges.js` (corsproxy.io → allorigins.win → codetabs.com) for YouTube RSS and t.me/s. All keyless; any fetch/parse error leaves the chip hidden. Confirmed Twitch live also adds `.live` to `.avatar` (sonar ring, gated by `prefers-reduced-motion`). No VK support: VK blocks public proxies, needs an API token — add only if one appears. YouTube needs `channel_id` in `social.yml` (owner finds it at youtube.com/account_advanced); empty = chip suppressed at render in `links.html`, never reaches the client.
- **Single-language (RU)**: server-rendered from `locale.yml` and `profile.yml`. No client-side i18n. Add strings to `locale.yml`, reference via `{{ site.data.locale.key }}`.
- **Deploy**: push to `main`; Settings → Pages → Deploy from a branch, `/main`, root. Builds in ~1 min. Keep `baseurl`/`url` in `_config.yml` synced to the repo name.
