# AGENTS.md

Personal business-card site for **Vijor**. Static Jekyll site on GitHub Pages (safe mode: **no plugins, no CI**). Content lives in `_data/*.yml`; page composed from includes in `index.html`. Liquid + plain HTML/CSS.

## Local preview

```bash
bundle install
bundle exec jekyll serve --baseurl ""
```

> [!IMPORTANT]
> Always pass `--baseurl ""`. `_config.yml` sets `baseurl: "/SocialLinker"` for the live Pages URL, so a plain `jekyll serve` renders broken asset paths locally. `Gemfile` pins the `github-pages` gem so local build matches the Pages runtime exactly (Jekyll 3.9.x + curated plugin allowlist); transitive deps land in `vendor/` (gitignored).

## Composition

`default.html` owns ALL shared chrome (head, meta, OG tags). Never duplicate it in includes.

`index.html` iterates `_data/sections.yml` (order = render order, omit or add entries to show/hide sections). Each section `type` maps to a `_includes/*.html`. Titles: override via `title:` in sections.yml, omit for locale default, `false` to hide the heading.

## Where to edit content

| What | File |
|---|---|
| Section order, titles, visibility | `_data/sections.yml` |
| Nick, avatar path | `_data/profile.yml` |
| Bio | `_data/profile.yml` (`bio`, `|` block scalar) |
| Social links + order | `_data/social.yml` |
| Live/New! badges | `_data/social.yml` (`badge` per item, `badge_days`) |
| Projects list | `_data/projects.yml` |
| Donate block | `_data/donate.yml` |
| UI strings | `_data/locale.yml` |
| Icons (inline SVG) | `_includes/icon.html` (`{% case %}`) |
| Styles | `assets/style.css` |

Posts: `_posts/YYYY-MM-DD-slug.md` with `layout: post`, `title`, `date`, `lang` — appear in `articles.html` automatically.

## Repo-specific quirks

- **Icons**: `icon.html` renders a `{% when %}` per brand from simpleicons.org; unknown `name` falls back to a globe SVG. Add a `case` to add a brand.
- **Badges (Live/New!)**: client-side only — `assets/badges.js` reveals hidden chips rendered by `links.html`. Sources: decapi.me (Twitch uptime), public CORS proxy chain in `badges.js` (corsproxy.io → allorigins.win → codetabs.com) for YouTube RSS and t.me/s. All keyless; any fetch/parse error leaves the chip hidden. No VK support: VK blocks public proxies, needs an API token — add only if one appears. YouTube needs `channel_id` in `social.yml` (owner finds it at youtube.com/account_advanced); empty = chip suppressed at render in `links.html`, never reaches the client.
- **Single-language (RU)**: server-rendered from `locale.yml` and `profile.yml`. No client-side i18n. Add strings to `locale.yml`, reference via `{{ site.data.locale.key }}`.
- **Deploy**: push to `main`; Settings → Pages → Deploy from a branch, `/main`, root. Builds in ~1 min. Keep `baseurl`/`url` in `_config.yml` synced to the repo name.
