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

`index.html` iterates `_data/sections.yml` (order = render order, omit or add entries to show/hide sections). Each section type maps to a `_includes/*.html`. Titles: override via `title:` in sections.yml, omit for locale default, set `""` to hide.

## Where to edit content

| What | File |
|---|---|
| Section order, titles, visibility | `_data/sections.yml` |
| Nick, avatar path | `_data/profile.yml` |
| Bio | `_data/profile.yml` (`bio`, `|` block scalar) |
| Social links + order | `_data/social.yml` |
| Donate block | `_data/donate.yml` |
| UI strings | `_data/locale.yml` |
| Icons (inline SVG) | `_includes/icon.html` (`{% case %}`) |
| Styles | `assets/style.css` |

Posts: `_posts/YYYY-MM-DD-slug.md` with `layout: post`, `title`, `date`, `lang` — appear in `articles.html` automatically.

## Repo-specific quirks

- **Icons**: `icon.html` renders a `{% when %}` per brand from simpleicons.org; unknown `name` falls back to a globe SVG. Add a `case` to add a brand.
- **Single-language (RU)**: server-rendered from `locale.yml` and `profile.yml`. No client-side i18n. Add strings to `locale.yml`, reference via `{{ site.data.locale.key }}`.
- **Deploy**: push to `main`; Settings → Pages → Deploy from a branch, `/main`, root. Builds in ~1 min. Keep `baseurl`/`url` in `_config.yml` synced to the repo name.
