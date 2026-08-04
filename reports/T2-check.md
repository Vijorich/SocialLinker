# T2 Checker Report

## Verdict

MERGE

## Evidence

- `git -C wt\t2 log --oneline -3` — tip is 816ad9e `feat(piano): per-card tonic on clicks, distinct open-post voicing, auxclick, warmer glide`; base 04bf059 as expected.
- `git diff 04bf059..task/t2 --stat` — exactly one file: `assets/piano.js`, +39/-13. AC (g) holds.
- `git diff main..task/t2 -- AGENTS.md` — empty. AGENTS.md untouched.
- `node --check assets/piano.js` — exit 0. AC (e) holds.
- `node tests/modal-history.test.mjs` — "modal-history: 9/9 checks passed", exit 0. AC (f) holds.
- `node %TEMP%\opencode\t2-tonic-smoke.mjs` — "ALL GREEN: per-card tonic on joy/thank/page, distinct post shape, auxclick wired for middle only", exit 0. Independently reproduced, not trusted.
- Full read of `assets/piano.js` (211 lines) against the diff — diff matches file, no hidden changes.

## AC coverage: 7/7

- (a) Click resolves up from the hover tonic: `tonic(card)` (piano.js:67-70) indexes the same `order` WeakMap and `freq()` the mouseover handler uses (line 27-28), so a card's click root equals its hover root. Verified in source and by smoke.
- (b) Post-open voicing differs from link-open: `page` = `[0,7,14,21]` @ beat 0.21, glide 0.09, dur 1.0 (piano.js:76) vs `joy` = `[0,4,7,14]` @ beat 0.14 (piano.js:71). See musical note below.
- (c) auxclick handler guards `e.button !== 1` (piano.js:89-93); right-click silent. Cannot double-fire with `click`, which is primary-button only.
- (d) Warmth numbers all present: `note()` partial gain 0.22, decay ramp t+0.85, stops at t+0.95 (piano.js:16-21); `GLIDE_SEMIS = [-7, -4, 2, 2, 2, -4]` with first four entries exactly the spec'd `[−7,−4,+2,+2]` (piano.js:38); all chord vols arrays and the 0.25 octave-partial gain unchanged from base.
- (e) node --check clean (above).
- (f) modal-history 9/9 (above).
- (g) Single-file diff confirmed by --stat (above).

## Musical argument

Accept. `page` differs from `joy` on two orthogonal axes, not one: interval content (open-fifth stack with no third — hollow, suspended quality — versus a defined major add9) and time (210 ms stride versus 140 ms, the four voices spread over 630 ms instead of 420 ms, plus a longer 0.09 glide per voice). Same glide mechanic is fine — it's the shared "resolve" grammar of the whole module; the words differ, the grammar stays. Two simultaneous differences in interval and rhythm are comfortably above the just-noticeable threshold; no alternative needed.

## Subtle correctness checks

1. `tonic()` mutation of `order`: safe. WeakMap keyed on the card element; an un-hovered click simply claims the next counter value, and that assignment persists identically for hover afterwards. No instability.
2. auxclick/click double-fire: impossible. Per UI Events spec and Chrome behavior, `click` fires only for the primary button; middle-click produces `auxclick` exclusively. The `button !== 1` early-return additionally silences right-click auxclick.
3. Partial level: effective octave-partial peak is 0.22 × main envelope (max 0.12) ≈ 0.026 — sits below the main fundamental as required. Oscillator stops (t+0.95) are scheduled strictly after the gain ramp completes (t+0.85), so no truncation click.
4. `page` explicit `dur: 1.0` versus its default `beat*(n+1.5) = 1.155`: deliberate shortening, decay ends before stops at tOn+1.1. Fine.

## Findings

1. [INFO] piano.js:105 — the post-modal `MutationObserver` still plays the fixed-440 add9 swell when the dialog opens, layered over the clicked card's `page` voicing. Pre-existing behavior, unchanged by this task; the AC governs the click voicing itself, which is correctly distinct. Worth a future ear-check for masking, not a blocker.
2. [INFO] piano.js:65,74 — the `page` comment says voices enter "on the upbeat"; they actually enter on the same integer-beat grid as `joy`, just at a slower beat. Cosmetic wording, no behavior impact.

No criticals, no warnings.

## Recommendation

MERGE
