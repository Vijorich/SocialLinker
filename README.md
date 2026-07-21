# SocialLinker

Personal business-card site for **Vijor** — a single-page hub linking out to live socials, with a small article feed. Built as a static [Jekyll](https://jekyllrb.com) site and served directly from GitHub Pages. No plugins, no CI, no build step.

> [!NOTE]
> GitHub Pages runs Jekyll in **safe mode** (no plugins), so the site deliberately uses only vanilla Liquid templates and plain HTML/CSS.

## Features

- **Single-page card** composed from reusable includes (`hero` → `bio` → `socials` → `donate` → `articles`).
- **Content-as-data**: every string lives in `_data/*.yml`. Edit YAML, never touch templates.

- **Article feed** from `_posts/`, auto-rendered in `articles.html`.
- **Self-contained icons**: inline SVGs from simpleicons.org, no CDN.

## Project structure

```
.
├── _config.yml          # Site config, baseurl/url, Kramdown (GFM)
├── index.html           # Composes the page from includes
├── _layouts/
│   ├── default.html     # <head>, OG tags
│   └── post.html        # Article layout
├── _includes/           # hero, bio, socials, donate, articles, icon
├── _data/               # profile, social, donate, locale (content source)
├── _posts/              # Markdown articles
└── assets/              # style.css, avatar
```

### Where to edit content

| What | File |
|---|---|
| Nick, avatar path | `_data/profile.yml` |
| Bio | `_data/profile.yml` (`bio`) |
| Social links + order | `_data/social.yml` |
| Donate block | `_data/donate.yml` |
| UI strings | `_data/locale.yml` |
| Icons (inline SVG) | `_includes/icon.html` |
| Styles | `assets/style.css` |

## Adding a social or donate link

Append an item to `_data/social.yml` (order = display order):

```yaml
items:
  - name: GitHub
    url: https://github.com/Vijorich
    icon: github
```

`icon` must match a `{% when %}` case in `_includes/icon.html`. Unknown names render a globe fallback. To add a brand, copy its SVG path from [simpleicons.org](https://simpleicons.org) into a new `{% when %}` block.

## Adding an article

Create `_posts/YYYY-MM-DD-slug.md`:

```markdown
---
layout: post
title: "Заголовок"
date: 2026-08-01 00:00:00 +0300
lang: ru
---

Text in Markdown.
```

It appears in the feed automatically.

## Local preview

```bash
bundle install
bundle exec jekyll serve --baseurl ""
# http://localhost:4000
```

No Ruby/Jekyll locally? Just push — GitHub Pages builds it for you. See the [Jekyll install guide](https://jekyllrb.com/docs/installation/) if needed.

## Deploy to GitHub Pages

1. Create repo `SocialLinker` on GitHub.
2. `git init && git add . && git commit -m "init"`
3. `git remote add origin git@github.com:USERNAME/SocialLinker.git && git push -u origin main`
4. **Settings → Pages → Source:** Deploy from a branch, Branch `main` / `(root)`.
5. Live in ~1 min at `https://USERNAME.github.io/SocialLinker`.

> [!IMPORTANT]
> Keep `baseurl` / `url` in `_config.yml` in sync with the repo name. For a user page (`USERNAME.github.io`), set `url` and leave `baseurl` empty.


