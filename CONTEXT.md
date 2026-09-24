# CONTEXT.md — domain glossary & module map

Single-context domain: one visitor-facing business-card site for **Vijor**.
This file is the vocabulary source of truth; ADRs live in `docs/adr/`.

## Domain terms

- **Link card** — a pill-shaped outbound link row (social or donate), rendered by `_includes/links.html` from `_data/social.yml` / `_data/donate.yml`.
- **Post card** — an article teaser row on the index (`_includes/articles.html`); clicking it opens the **post modal** instead of navigating.
- **Post modal** — the `<dialog id="post-modal">` session: fetches a post page, extracts `.post-article`, opens with a short scale/fade entrance, and may morph back to the clicked card on close (View Transition `post-morph`). Refreshing a modal URL lands on the **standalone post page** — the no-JS/direct-link fallback rendered by `_layouts/post.html`.
- **Badge** — a hidden "Live" / "New!" chip on a link card; revealed client-side when its provider feed confirms. A revealed badge **pins** its card to the top of the list.
- **Attune** — the ~3.5 s hover-hold state on a card: an evolving pentatonic walker melody plus a static outer `.attuned` ember glow. The audio LFO remains internal to the voice; the current visual treatment is a steady bloom.
- **Silk** — the WebGL background layer (`silk.js`, config in `_data/silk.yml`); fails silent to the CSS gradient ground.
- **Sound toggle** — fixed mute button; persisted choice, default ON.

## Module map (deep → shallow)

| Module | Interface | Implementation hides |
|---|---|---|
| `assets/audio-engine.js` | `play/note/chord/hold/drone/tok/echo/releaseAll/setMuted/running/unlock` | AudioContext lifecycle, autoplay unlock, master bus, every envelope, the mute gate (checked inside each voice creator) |
| `assets/post-modal.js` | `open(card)/swap(url,dir)/close()/popstate(state)/prefetch(url)` + window events `post-modal-open {url, source}` / `post-modal-close` | fetch+cache, generation token, dialog fill (h1→h2 demotion), scroll lock, non-overlapping modal entrance, optional close View Transition, directional swap, history sync |
| `assets/badges.js` | `PROVIDERS` adapter rows (`feed(data)` + pure `check(text, cutoff, parser)`); `initBadges()` | proxy fallback chain, per-provider feeds/parsers, pin-to-top + reveal effects |
| `assets/silk.js` | `createSilk(container, opts)` → `{update, destroy}`; `initSilk()` | ogl renderer, shader, resize/visibility lifecycle |
| `assets/piano.js` | exports `SEMI/rungAt/nextRung/MELODIES/pickMelodyName`; `initPiano()` wires DOM | event wiring, order ladder prefill, walker timers, modal-event subscriptions |

## Seams

- **post-modal adapters**: fetcher (prod `fetch`+DOMParser ↔ queued fakes), history (prod pushState stack ↔ in-memory stack), host (real dialog ↔ recorder), vt (`startViewTransition` ↔ sync fake), emit (window events ↔ collector). Tests cross exactly these seams (`tests/modal-history.test.mjs`).
- **badge providers**: one adapter row per source; detection is pure, presentation (`pin`/`announce`) sits below the seam. Adding VK = one row when a token exists.
- **piano ⇄ modal**: window events only — no dialog observation, no shared flags. `source:'card'` opens stay silent because the click chord already spoke.
- **piano ⇄ badges**: the `badge-reveal` custom event (the original seam; pattern extended to the modal).

## Invariants worth keeping

- Nothing schedules into a suspended AudioContext; a muted page schedules nothing (gate lives inside the engine).
- Failed post fetches are never cached; successes are (one transient blip must not hard-navigate forever).
- In-modal prev/next replaces history state — one entry per modal session; close→back lands on the index.
- All envelopes are `setTargetAtTime` only; ramp kinks crackle on phone speakers.
