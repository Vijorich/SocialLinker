# Build & deploy

## Local Jekyll serve (non-Windows)

```bash
bundle install
bundle exec jekyll serve --baseurl ""
```

Always pass `--baseurl ""`. `_config.yml` sets `baseurl: "/SocialLinker"` for the live Pages URL, so a plain `jekyll serve` renders broken asset paths locally. The `Gemfile` pins the `github-pages` gem so local builds match the Pages runtime exactly (Jekyll 3.9.x + curated plugin allowlist); transitive deps land in `vendor/` (gitignored).

## Windows

Local Jekyll is broken here: `bundle exec jekyll` fails with `command not found: jekyll` even after `bundle install`. Don't burn time on it — verify changes with `node --check` (JS) and a YAML parse, and let GitHub Pages do the real build.

## Tests

All three JS suites run on plain node — `npm test`, no packages installed:

- `tests/piano.test.mjs` — piano/audio-engine
- `tests/modal-history.test.mjs` — post-modal history sync
- `tests/badges.test.mjs` — badge provider checks

They import the asset modules directly and pass fakes across their seams.

## Deploy

Push to `main`. GitHub Pages: Settings → Pages → Deploy from a branch, `/main`, root. Keep `baseurl`/`url` in `_config.yml` synced to the repo name.
