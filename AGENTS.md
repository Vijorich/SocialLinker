# AGENTS.md

Personal business-card site. Static Jekyll site on GitHub Pages (safe mode: **no plugins, no CI**). Content lives in `_data/*.yml`; page composed from includes in `index.html`. Liquid + plain HTML/CSS. Single-language (RU), server-rendered — no client-side i18n.

## Verify changes

`npm test` runs all three JS suites on plain node — no packages installed (piano/audio-engine, post-modal history sync, badge providers). The local Jekyll build fails on Windows: check JS with `node --check`, YAML with a parse, and let GitHub Pages do the real build — see [build-deploy.md](docs/agents/build-deploy.md).

## Topic guides

| Reach for | When |
|---|---|
| [build-deploy.md](docs/agents/build-deploy.md) | Serving locally, `baseurl`, the github-pages gem pin, deploying to Pages |
| [content-map.md](docs/agents/content-map.md) | Editing content: which `_data/*.yml` or include owns what; posts, UI strings, icons |
| [layout-composition.md](docs/agents/layout-composition.md) | Shared-chrome invariant, `sections.yml` ordering, includes vs layouts |
| [post-modal.md](docs/agents/post-modal.md) | The `<dialog>` post viewer: history sync, View Transitions, prev/next |
| [badges.md](docs/agents/badges.md) | Live/New! chips: providers, CORS proxies, pin-to-top rule |
| [audio-piano.md](docs/agents/audio-piano.md) | Sounds: hover piano, click vocab, attune glow, mute toggle |

## Agent skills

- **Issue tracker**: GitHub Issues on Vijorich/SocialLinker (`gh` CLI) — [issue-tracker.md](docs/agents/issue-tracker.md)
- **Triage labels**: five-role vocabulary used verbatim — [triage-labels.md](docs/agents/triage-labels.md)
- **Domain docs**: root `CONTEXT.md` + `docs/adr/` — [domain.md](docs/agents/domain.md)
