# AGENTS.md

Personal business-card site for **Vijor**. Static Jekyll site on GitHub Pages (safe mode: **no plugins, no CI**). Content lives in `_data/*.yml`; page composed from includes in `index.html`. Liquid + plain HTML/CSS + one vanilla JS file for language toggle.

## Local preview

```bash
bundle install
bundle exec jekyll serve --baseurl ""
```

> [!IMPORTANT]
> Always pass `--baseurl ""`. `_config.yml` sets `baseurl: "/SocialLinker"` for the live Pages URL, so a plain `jekyll serve` renders broken asset paths locally. The `github-pages` gem is pinned in `Gemfile` so local build matches production.

## Composition

`index.html` renders in order: `hero` → `bio` → `socials` → `donate` → `articles`, wrapped by `_layouts/default.html`.

`default.html` owns ALL shared chrome (head, meta, OG tags, `window.__LOCALE__` injection, i18n.js tag). Never duplicate it in includes.

## Where to edit content

| What | File |
|---|---|
| Nick, avatar path | `_data/profile.yml` |
| Bio (RU/EN) | `_data/profile.yml` (`bio`, `|` block scalar) |
| Social links + order | `_data/social.yml` |
| Donate block | `_data/donate.yml` |
| UI strings (RU/EN) | `_data/locale.yml` |
| Icons (inline SVG) | `_includes/icon.html` (`{% case %}`) |
| Styles | `assets/style.css` |
| Lang toggle logic | `assets/i18n.js` |

YAML item **order === display order** (top of list = top of card). Posts: `_posts/YYYY-MM-DD-slug.md` with `layout: post`, `title`, `date`, `lang` — appear in `articles.html` automatically.

## Repo-specific quirks

- **Icons**: `icon.html` renders a `{% when %}` per brand from simpleicons.org; unknown `name` falls back to a globe SVG. Add a `case` to add a brand.
- **i18n is client-side only**: server renders RU; `i18n.js` swaps `[data-i18n]` text and `[data-i18n-bio]` HTML, persisted in `localStorage`. To add a UI string: put it in `locale.yml`, then tag the element `data-i18n="key"` with a hardcoded RU default inside. SEO sees RU only (acceptable; full i18n needs `jekyll-polyglot` + Actions, forbidden by safe-mode Pages).
- **Deploy**: push to `main`; Settings → Pages → Deploy from a branch, `/main`, root. Builds in ~1 min. Keep `baseurl`/`url` in `_config.yml` synced to the repo name.
