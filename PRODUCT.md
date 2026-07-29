# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two equally primary audiences (confirmed):

1. **Vijor** — RU-speaking content creator (Twitch, two YouTube channels, Telegram, VK). Uses the site as his own live business card; visitors are his viewers arriving from stream/social profiles who need the right link fast.
2. **Template users** — people who fork the repo to get their own card. README leads with fork instructions; they edit `_data/*.yml` and never touch templates.

## Product Purpose

A personal business-card site: one page that routes a visitor to every place Vijor lives online, plus projects, donate links, and articles. Success for Vijor: a viewer lands and reaches the right destination in one click, with live status visible (is he streaming *now*). Success for the template: a forker goes from fork to deployed personal card by editing YAML only.

## Positioning

Self-hosted, fork-and-fill Jekyll card with **keyless live badges** (Twitch "Live", YouTube/Telegram "New!") — no accounts, no API keys, no paid tier, deploy by push to `main`. Linktree/Carrd cannot truthfully copy this: they are hosted services with accounts; this is a repo you own, and its freshness signals run entirely client-side on free GitHub Pages hosting.

## Operating Context

- Visitors arrive mostly on mobile from Twitch/Telegram/YouTube profile links.
- Vijor edits content by pushing YAML changes; GitHub Pages rebuilds in ~1 min.
- Forkers follow README: fork → enable Pages → edit `_config.yml` + `_data/*.yml` + avatar → push.
- Local preview: `bundle exec jekyll serve --baseurl ""` (github-pages gem pinned).

## Capabilities and Constraints

- **Durable (user-confirmed):** all content is data-driven via `_data/*.yml` — a forker never edits templates. This is the core template promise; future work must preserve it.
- **Current technical facts** (repo-enforced today, not user-pinned as permanent): GitHub Pages safe mode (no plugins, no CI, Jekyll 3.9.x via github-pages gem); badges are keyless client-side fetches (decapi.me, CORS proxy chain for YouTube RSS and t.me/s; VK unsupported — blocks public proxies); single Russian locale server-rendered from `_data/locale.yml`, no client-side i18n.
- Sections composed from `_data/sections.yml`; order = render order, entries omitted to hide.
- Posts in `_posts/*.md`; on the index they open in a `<dialog>` modal via JS fetch + View Transition; standalone pages are the no-JS fallback.

## Brand Commitments

- Name: **SocialLinker**; persona: **Vijor**.
- Language and voice: Russian, informal-direct ("Статический сайт-визитка… Форкните, впишите свои данные — и сайт готов").
- License: MIT; attribution welcome but not required.

## Evidence on Hand

- Live production instance is Vijor's own site (this repo deployed).
- Real content: avatar (`assets/avatar.webp`), social links, one project entry (self-referential), donate links (Donation Alerts, Boosty).
- No testimonials, press, or usage metrics — must not be fabricated.

## Product Principles

1. **Data is the interface.** If a content change requires touching a template, that's a bug.
2. **Own your links.** No third-party accounts, keys, or servers between the owner and the page.
3. **Freshness signals earn their place.** Badges fail silent (hidden) on any error; a wrong badge is worse than none.
4. **Boring stack, one-minute deploy.** Safe-mode Jekyll on GitHub Pages beats any cleverer setup that needs CI or a server.
