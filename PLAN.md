# PLAN — SocialLinker sound/warmth batch

## Goal
Batch of changes to `assets/piano.js` + `assets/attune.css`:

1. Warm the sonic palette: richer voice layering (2nd partial already there, add a soft 5th partial = more "piano body"). All gains stay quiet.
2. Fix attune shimmer on card hover — user reports "hovered .link-card (normal & donate), hold logic doesn't fire". Root cause hypothesis available for the checker; selector must match `.link-list` markup in `_includes/links.html` / `projects.html` / `articles.html`. A DOM check of actual classes is step one.
3. Replace the single global click-stab with **per-card tonic voices**: the pitch of the joy/thank chords follows the same pentatonic index (A3/A4/A5…) the hover-note already uses — each card sounds "itself" on hover and on click. Opening a post must sound **different** from opening a link.
4. Middle-click (auxclick, button=1) must play the same open vocabulary — wired but must be verified in the smoke test.

## Stack pins
- Jekyll 3.9.x via `github-pages` gem, safe mode (no plugins).
- No build tooling, no npm — plain ESM-less browser JS in `assets/piano.js`, plain CSS in `assets/attune.css`.
- Verification command: `node --check assets/piano.js` must exit 0. No other test harness exists for JS changes beyond the stub-based smoke scripts the maker reproduces under `%TEMP%` (see previous sessions: `piano-card-smoke.mjs`, `piano-smoke.mjs`).
- Modal-history regression: `node tests/modal-history.test.mjs` must pass (validates `_layouts/default.html`'s inline modal script untouched).
- RU content only; `AGENTS.md` documents quirks, must be updated with any new interaction shipped.

## Atomic tasks (wave 0 — both touch `assets/piano.js`, so they merge sequentially, not in parallel worktrees)

| ID | Title | Acceptance |
|---|---|---|
| T1 | fix-attune: shimmer on card hover actually fires | Reproduce in stub harness: hovering `.link-card` (donate-list & not) for 3.6 s adds `.attuned`, leaving drops it. Fix selector or wiring in `piano.js` so the real markup lights up. `node --check assets/piano.js` clean. |
| T2 | tonic-voices: chords follow per-card tonic + distinct post-open voicing + warmth layering | (a) Click on card at pentatonic position j resolves up **from** `220 * 2^((5*floor(j/5)+[0,3,5,7,10][j%5])/12)` (the hover tonic), (b) post-open is a *different* voicing than link-open (user requirement), (c) middle-click (`auxclick`) hits the same code path, (d) voice layering gains a soft 5th partial without clipping the existing 0.12 cap, (e) `node --check assets/piano.js` clean, (f) modal-history test still passes (untouched file). |

## Waves
- Wave 0: T1 (fix-blocker) → merge → T2 (builds on T1's surface).
- Audit (answer in the final report): candidates for more of this, what each should feel like. Read-only, no code.

## Reports
- `reports/T1-check.md`, `reports/T2-check.md` — forge-checker verdicts.
