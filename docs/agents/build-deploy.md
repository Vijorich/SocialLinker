# Build & deploy

## Local Jekyll serve (non-Windows)

```bash
bundle install
bundle exec jekyll serve --baseurl ""
```

Always pass `--baseurl ""`. `_config.yml` sets `baseurl: "/SocialLinker"` for the live Pages URL, so a plain `jekyll serve` renders broken asset paths locally. The `Gemfile` and committed `Gemfile.lock` pin the tested `github-pages` toolchain (Jekyll 3.9.x + curated plugin allowlist); install transitive dependencies with `BUNDLE_PATH=vendor/bundle` when keeping them inside the checkout.

## Windows

Local Jekyll is broken here: `bundle exec jekyll` fails with `command not found: jekyll` even after `bundle install`. Don't burn time on it — run `npm test` (syntax + JS + Liquid parse) and a YAML parse, then let GitHub Pages do the real build.

## Tests

All syntax and JS suites run on plain node — `npm test`, no npm packages installed:

- `tests/piano.test.mjs` — piano/audio-engine
- `tests/modal-history.test.mjs` — post-modal history sync
- `tests/badges.test.mjs` — badge provider checks
- `tests/silk.test.mjs` — Silk module import/fallback smoke check
- `tests/static-regressions.test.mjs` — guard checks for layering, progressive fallback, permalink, and exclusions
- `bundle exec ruby scripts/check-liquid.rb` — the same Liquid syntax check under the pinned bundle

They import the asset modules directly and pass fakes across their seams.

## Deploy

Push to `main`. GitHub Pages: Settings → Pages → Deploy from a branch, `/main`, root. Posts use trailing-slash URLs; old `.html` paths are preserved with the allowlisted `jekyll-redirect-from` plugin. Keep `baseurl`/`url` in `_config.yml` synced to the repo name.
