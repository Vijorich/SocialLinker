---
name: SocialLinker
description: Nocturnal ember-red business card — one page that routes viewers to every place Vijor lives online.
colors:
  # OKLCH lightness ramp — every role has a defined lightness so contrast is
  # structural, not accidental. Anchor hue 27 (ember red); neutrals drift warm
  # at h30 low-chroma. One signal hue in three steps: Deep/Live (fills) →
  # Bright (text/icon on any surface incl. Ember hover).
  cinder-black: "#0d0706"
  cinder-grad: "#140c0b"
  oxblood: "#301512"
  ember-red: "#7b2a25"
  hearth-brown: "#4c2f19"
  signal-red: "#d1433c"
  signal-link: "#f67e6c"
  signal-deep: "#af302b"
  signal-live: "#bb3c35"
  signal-sel: "#d65048"
  on-live: "#ffffff"          # white on the Live fill — bone dips to 4.41 (fails AA); white clears 5.51
  spotlight-gold: "#fdd171"
  ash-rose: "#b1a09d"
  bone-white: "#eee4e0"
  scrollbar: "#795b56"
  scrollbar-hover: "#997770"
typography:
  # Two voices: Unbounded (display: logo, headings) + Rubik (body/UI).
  # Fluid clamp scale; system stacks as load-time floor (fail-silent like badges).
  fontSans: "Rubik, system-ui, sans-serif"
  fontDisplay: "Unbounded, 'Arial Black', sans-serif"
  fontMono: "'JetBrains Mono', ui-monospace, monospace"
  display:
    fontFamily: "Unbounded, 'Arial Black', sans-serif"
    fontSize: "clamp(2rem, 1.41rem + 2.48vw, 3rem)"
    fontWeight: 900
    lineHeight: 1.1
  headline:
    fontFamily: "Unbounded, 'Arial Black', sans-serif"
    fontSize: "clamp(1.4rem, 1.19rem + 0.87vw, 1.75rem)"
    fontWeight: 800
    lineHeight: 1.2
  prose-h2:
    fontFamily: "Unbounded, 'Arial Black', sans-serif"
    fontSize: "clamp(1.15rem, 1rem + 0.4vw, 1.4rem)"
    fontWeight: 700
    lineHeight: 1.2
  prose-h3:
    fontFamily: "Unbounded, 'Arial Black', sans-serif"
    fontSize: "clamp(1.05rem, 0.92rem + 0.33vw, 1.25rem)"
    fontWeight: 700
    lineHeight: 1.2
  title:
    fontFamily: "Unbounded, 'Arial Black', sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    letterSpacing: "0.1em"
  body:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "clamp(1rem, 0.76rem + 1.03vw, 1.25rem)"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
  tagline:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "clamp(0.95rem, 0.85rem + 0.43vw, 1.125rem)"
    fontWeight: 500
  label:
    fontFamily: "Rubik, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: "0.25rem"
  md: "1rem"
  lg: "2rem"
  full: "999px"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "2rem"
  xl: "3rem"
components:
  link-card:
    backgroundColor: "{colors.oxblood}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.md}"
    padding: "16px 16px"
  link-card-hover:
    backgroundColor: "{colors.ember-red}"
  link-card-donate:
    backgroundColor: "{colors.hearth-brown}"
    textColor: "{colors.spotlight-gold}"
    rounded: "{rounded.md}"
    padding: "16px 16px"
  link-card-donate-hover:
    backgroundColor: "{colors.spotlight-gold}"
    textColor: "{colors.cinder-black}"
  badge-new:
    backgroundColor: "{colors.signal-deep}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.full}"
    padding: "3px 10px"
  badge-live:
    backgroundColor: "{colors.signal-live}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "3px 10px"
  post-close:
    backgroundColor: "{colors.oxblood}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.full}"
    size: "48px"
  post-close-hover:
    backgroundColor: "{colors.ember-red}"
    textColor: "{colors.signal-link}"
---

# Design System: SocialLinker

## Overview

**Creative North Star: "The Ember Stage"**

A late-night stream made tangible: a dark room, an ember-red glow, one gold spotlight reserved for the donate block. The palette is warm and nocturnal — near-black maroon ground, oxblood cards, a hot signal red that acts as both accent and alarm. Nothing here is corporate, nothing is daylight.

The personality is playful inside the dark frame. Cards scale up when touched, badges float gently with a recording-dot pulse, and clicking an article morphs the card into a modal via a shared-element View Transition (with a directional slide for prev/next). Motion is the brand's voice; the static page is just the intermission.

Confirmed anti-references: never a sterile light-mode SaaS look, never purple/blue gamer gradients, never corporate blue links on white. The ember palette is the identity; departure from it is departure from the product.

**Key Characteristics:**
- Single centered column (40rem) on a near-black maroon gradient
- One accent (Signal Red) + one reserved spotlight (gold = donate only)
- Lists read as one clipped pill-block; hover breaks a card out into a full pill
- Flat surfaces; depth comes from tonal steps and motion, never resting shadows
- Three-voice typography: Unbounded (display) + Rubik (body/UI) + JetBrains Mono (code), with system stacks as load-time floor

## Colors

A warm maroon family graded as an **OKLCH lightness ramp** from near-black ground to hot red, with a single gold that appears exactly once per page. Every role has a defined lightness, so contrast is structural rather than accidental — the palette was rebuilt this way to retire the contrast patches the old hex-by-feel values forced.

### Primary — one signal hue, three roles
The signal red lives at anchor hue 27 (ember) and appears in three lightness steps with non-overlapping jobs:
- **Signal** (`{colors.signal-red}`, L≈0.585): the resting accent — *fills, borders, rails, and the avatar ring.* Not used as text; as a non-text accent it clears 3:1 on Cinder and Oxblood. Selection uses **Signal Sel** (`{colors.signal-sel}`), a half-step tuned so Cinder text clears 4.5:1 on it.
- **Signal Bright** (`{colors.signal-link}`, L≈0.725): the accent as **text or icon on any surface**, including the heated Ember hover. This is the single readable rendering of the red — all in-prose links, focus rings, post-nav hovers, and the close-button hover icon use it. It clears 4.5:1 as text on Cinder/Oxblood and 3:1 as an icon on Ember (the close-button tension that was previously *Open* is now resolved — no more red-on-red failure on hover).
- **Signal Deep** (`{colors.signal-deep}`, L≈0.505) / **Signal Live** (`{colors.signal-live}`, L≈0.54): the two fill steps behind light text. New! uses Deep (Bone ≈ 5.1:1); Live's hotter fill drops Bone to 4.41 (fails AA), so Live text is pure white (5.51) — a contrast requirement, not a stylistic choice. "On air" still reads hotter than "fresh" via the fill step itself.
- **Ember** (`{colors.ember-red}`, L≈0.405): the heated surface — hover/focus state for every card. Cards literally heat (lighten + gain chroma) when touched.

### Secondary
- **Spotlight Gold** (`{colors.spotlight-gold}`): donate block only — the section title plus card text on Hearth Brown at rest, full gold fill on hover. Its scarcity is the point.

### Neutral
- **Cinder Black** (`{colors.cinder-black}`): page ground (with a subtle vertical gradient to `{colors.cinder-grad}`), backdrop under the modal.
- **Oxblood** (`{colors.oxblood}`): the card surface. Every interactive surface starts here.
- **Hearth Brown** (`{colors.hearth-brown}`): donate card surface; a warm brown (hue drifts toward gold, h55) lifted to a clear tonal step above Oxblood so the donate block reads as a warm peak at rest.
- **Bone White** (`{colors.bone-white}`): primary text.
- **Ash Rose** (`{colors.ash-rose}`): muted text — section titles, dates, excerpts, descriptions, footer. Lifted to clear 4.5:1 on every resting surface including Hearth (the old value failed on the donate card).
- **Scrollbar** / **Scrollbar Hover** (`{colors.scrollbar}` / `{colors.scrollbar-hover}`): warm ember scrollbar tones, tonal with the maroon ramp rather than neutral gray.

### Named Rules
**The One Spotlight Rule.** Gold appears only in the donate block. Anywhere else it stops meaning "support" and starts meaning "decoration."
**The Heat-On-Touch Rule.** Ember (`#7b2a25`) is a state, not a surface. It exists only under a hovered or activated element — and heat lifts everything on the card: the surface, the primary text, and the muted description/excerpt/date lines all brighten together (Ash would dip below 4.5:1 on the heated surface, so secondary lines promote to Bone on hover/focus).
**The Readable-Red Rule.** Signal is the accent for fills, borders, rails, and (as Signal Sel) selection. The moment that red appears as *text or an icon* — links, focus rings, hover icons — use **Signal Bright**, which clears AA on every surface including its own Ember hover.

## Typography

Two voices, one job each: **Unbounded** carries display (logo, headings, the 404 number) — a wide, geometric face that gives the hero and section headings real presence. **Rubik** carries body, UI, captions, and meta — a clean rounded sans that stays readable at small sizes and dark-surface contrast. **JetBrains Mono** carries code and pre — a clean monospaced face so code reads as code. All three load from Google Fonts with `display=swap`; the system stacks (`--font-sans`, `--font-display`, `--font-mono`) remain as the load-time floor so a blocked or slow font request degrades to the incumbent look, not a broken page — same fail-silent discipline as the live badges.

**Character:** Three sourced faces with clear roles; hierarchy is carried by face, then size, weight, tracking, and case — in that order. The display voice is deliberately wide and bold; the body voice is deliberately rounded and dense; the mono voice is a clean monospaced face for code and data. This contrast across the three voices is the typographic identity.

### Hierarchy
The size ramp is **fluid** — each scalable role is a `clamp()` that breathes between a small-viewport floor (380px) and a desktop ceiling, instead of jumping at breakpoints. Endpoints preserve the chat-readable phone sizes and desktop presence.
- **Display** (Unbounded 900, `clamp(2rem → 3rem)`, leading 1.1): the nick in the hero. The only oversized text on the page.
- **Headline** (Unbounded 800, `clamp(1.4rem → 1.75rem)`, leading 1.2): article titles on post pages and in the modal; also the prose `h1`.
- **Prose headings:** `h2` (`clamp(1.15rem → 1.4rem)`) and `h3` (`clamp(1.05rem → 1.25rem)`), both Unbounded 700, leading 1.2 — a real sub-scale inside long-form copy.
- **Title** (Unbounded 700, 1rem, +0.1em, uppercase, Ash Rose): section labels. Small, tracked-out, quiet. Donate's title is the one exception — Spotlight Gold, lifting the spotlight to the section level (One Spotlight Rule).
- **Body** (Rubik 400, `clamp(1rem → 1.25rem)`, leading 1.5): everything else. Generous size — this page is read on phones from stream chats. Long-form prose (`.post-content`) opens to leading 1.7.
- **Meta** (Rubik 600, 1rem, Ash Rose): the muted secondary layer — dates, excerpts, link/project descriptions, post nav, footer. One step heavier than body at the same size for small-text legibility.
- **Tagline** (Rubik 500, `clamp(0.95rem → 1.125rem)`, Ash Rose): the optional hero one-liner, one step above meta.
- **Label** (Rubik 600, 0.75rem, +0.05em, uppercase): badges. Loud at tiny size.
- **Strong / Emphasis** (Rubik 700): inline emphasis in prose — heavier than body weight, distinct from both meta and body.

### Named Rules
**The Two-Voice Rule.** Unbounded owns display roles (nick, headings, the 404 number); Rubik owns everything you read (body, UI, meta, captions); JetBrains Mono owns code. Never mix: display-face text on body-sized elements looks clumsy; body-face on display-sized elements looks timid; monospace outside code is costume. System stacks are the load-time floor, not the intended voice.
**The Dark-Compensation Note.** Light text on dark surfaces reads looser, so body gets `letter-spacing: 0.005em` (near-imperceptible) plus the Leading-Arc air — a clarity adjustment, not a style change.
**The Leading-Arc Rule.** Leading tightens as size grows: 1.1 display → 1.2 headline/prose-headings → 1.5 body → 1.7 long-form prose. Big type never inherits the body's air. Headings use `text-wrap: balance`; body and prose use `text-wrap: pretty` — native, zero-cost, no asset.

## Layout

One centered column does all the work. `.container` caps at 40rem with 2rem/1.5rem/3rem padding; the post modal widens to `min(56rem, 100vw - 2rem)` for comfortable reading. Sections stack with 2rem gaps (1.5rem on phone), cards inside a list sit 0.5rem apart.

Desktop is the base stylesheet; type is a fluid `clamp` scale, so phones adapt at 768px only in layout (denser padding, stacked post-card heads) with a small-phone refinement at 380px. There is no tablet-specific layout — portrait tablets fold into the phone rules.

## Elevation & Depth

Flat by doctrine. No element casts a shadow at rest; depth is conveyed by tonal steps — Cinder Black page → Oxblood card → Ember hover — and by motion (hover scale 1.03, press scale 0.97). Soft ambient glows are permitted only as a state response: hover, focus, or live activity. The modal's dim backdrop (`rgba(13,7,6,0.6)`) is the sole overlay treatment.

### Named Rules
**The Flat-At-Rest Rule.** If a surface needs to feel closer, move it (scale) or heat it (Ember Red). Do not give it a resting shadow.

## Shapes

The pill is the form language. The master radius is 2rem (`--radius`), applied to card caps, article surfaces, the modal, and circular controls. Cards inside a list default to 1rem so a list reads as one clipped block: first and last cards carry 2rem outer caps, and a hovered card inflates to the full 2rem pill — visually breaking out of the block. Avatars, badges, and close buttons are fully round. Code chips use the small 0.25rem radius.

### Named Rules
**The Block-And-Breakout Rule.** Lists are one block at rest (1rem inner, 2rem caps). Hover grants the full pill (2rem). A list that doesn't break out on hover is off-brand.

## Components

### Link Cards (signature)
The product's core unit — every social link, project, and post is one.
- **Shape:** gently rounded (1rem) inside lists, full pill (2rem) at list ends and on hover
- **Default:** Oxblood background, Bone White 500-weight text, 1rem padding, 2rem brand icon left, external-link glyph right at 40% opacity
- **Description line:** optional `description:` (social.yml) renders one muted line (Ash Rose, 1rem, 400-weight, ellipsis) under the card name — disambiguates same-brand links (YouTube vs YouTube Second)
- **Hover:** background heats to Ember Red, scale 1.03, radius inflates to 2rem, glyph fades to full opacity (0.3s ease), and a soft radial ember bloom fades in inside the card (`::before`, Signal-Link-tinted; gold-tinted on the donate variant) — the Heat-On-Touch rule made literal. Hover styles are gated behind `@media (hover: hover)`; touch devices never receive them. On fine-pointer devices only, a cursor-tracking parallax leans the card ±4px toward the pointer (composes with the hover scale, transform-driven); excluded on touch and under reduced-motion (default.html).
- **Focus (`:focus-visible`):** mirrors hover heat + a double keyboard ring (`box-shadow: 0 0 0 2px Cinder, 0 0 0 4px Signal Link`) so the focused row is unambiguous. Donate variant heats to full gold + dark text. Focus is not hover-gated — keyboard users on any device get the ring. Mouse clicks suppress it via `:focus-visible`.
- **Touch:** no hover — press scales to 0.97 (0.15s)
- **Donate variant:** Hearth Brown + Spotlight Gold text at rest; full gold fill with dark text and a soft gold glow on hover

### Badges
Live/New! chips on link cards; rendered hidden, revealed by `badges.js` only on confirmed fresh data.
- **Pinning (standing rule):** a revealed badge moves its card to the top of the list — live/fresh destinations always lead. Stable in `social.yml` order (Twitch leads statically); the reorder morphs via View Transition, instant under reduced motion. Pinning moves the real DOM node, so tab and AT order always match the visual order.
- **Style:** pill (999px), Label type, bob animation (3s gentle float: translateY + soft scale, lifting the whole chip rather than pivoting a side)
- **Reveal:** one-shot scale-in pop (0.35s, slight overshoot) when un-hidden — freshness arrival feels earned, not silent. Then bob takes over.
- **Live-pin afterglow:** on confirmed Twitch live, the freshly-pinned card flashes hot (Ember Red → Oxblood over 1.4s) so the eye finds it after the reorder morph.
- **Live:** Signal Live fill, pure white text and pulsing dot (1.2s recording pulse). White clears 5.51; Bone dips to 4.41 on this hotter fill and fails AA — white is required here, while New!'s darker Deep fill lets Bone pass (5.12).
- **New!:** Signal Deep fill, Bone White text (passes AA for 12px/700). Saturated Signal Red + dark text failed at ~3.9:1, so the deeper red was introduced for this fill.
- **Motion safety:** animations off under `prefers-reduced-motion`

### Post Cards & Article
Post cards reuse the link-card block with `user-select: none`; the single-article surface is an Oxblood card at full 2rem radius with 2rem padding. Opening a post fills the modal with the fetched `.post-article` and morphs the clicked card into the dialog via a shared-element View Transition; it morphs back to the card on close. The dialog is shown/closed synchronously inside the transition, so continuity never delays the action surface; the fallback is plain navigation. Card heads and article headers carry the date. Article body reads at 1.7 line-height, capped at 44rem measure; headings get 2rem air above, 0.75rem below. The modal is URL-synced (pushState/popstate) — a refreshed modal URL lands on the standalone page.

### Modal
`<dialog>` morphing into place over the page via a shared-element View Transition — the clicked card expands into the dialog on open and morphs back on close (`view-transition-name: post-morph`, ~0.34s confident-arrival): Oxblood surface, 2rem radius, `min(56rem, 100vw - 2rem)`, max 85vh (92vh phone), dim maroon backdrop, circular close button top-right. Falls back to instant open/close under `prefers-reduced-motion` or where View Transitions are unavailable.

**Deferred — modal loading state (backlog, implement only if it bites):** `open()` currently `await`s `getArticle()` *before* `showModal()`, so a cache-miss fetch (mobile, no reliable `pointerover` prefetch, slow data) produces ~1-3s of dead air on the clicked card with no status signal. Acceptable while fetches stay fast (they typically do — posts are tiny, cached after first hit, and desktop prefetches on hover). If slow opens are ever observed, upgrade to: `showModal()` (or start the View Transition) immediately with an ember-pulse skeleton in `.post-modal-body`, then `fill()` on resolve — keep the gen-token guard so a stale fetch can't overwrite.

### Close Button
- **Style:** 48px circle, Oxblood, no border
- **Hover:** Ember background, Signal Bright icon, scale 1.08. (Resolved: Signal Bright on Ember ≈ 3.7:1, clearing the 3:1 non-text floor — the close button no longer carries the documented contrast tension. Kept the "red on heat" intent without dropping to a bone-white icon.)
- **Focus (`:focus-visible`):** double ring (Cinder gap + Signal Link), no bg change.
- **Touch:** press scales to 0.92

### Hero & Avatar
The hero is the Ember Stage at rest: a soft radial Signal-Red glow (`.hero::before`, blurred, low-opacity) breathes behind the avatar (~6s scale/opacity oscillation) so the room reads as warm and lived-in, never dead. Avatar is a 96px circle (80px phone) with a 2px Signal Red ring — the only bordered element in the system. The glow is stage-light, not a surface: the Heat-On-Touch Rule targets cards; the north star itself calls for "a dark room, an ember-red glow," so the brief earns this one ambient exception. Arrival is the first authored beat: on load the glow wakes from cold to its resting breath (1s) and the hero content settles out of a soft blur (0.6s, role-staggered) — the dark room coming into focus. Only the stage animates; link cards are ready at first paint so the one-click action surface is never delayed. Ignition is the authored focal moment: when `badges.js` confirms Twitch live and adds `.avatar.live`, the stage catches — a one-time match-strike flare (1s, brightness+scale surge) hands off to a hotter, larger, glowing breath (7s, brighter on the inhale so it reads like real breathing), and the avatar ring heats to Signal Bright over 0.9s. The sonar ring ping (1.6s, Signal Red expanding outward) plus a persistent soft glow remains the page's primary "on air now" signal; badges stay secondary. All hero motion off under `prefers-reduced-motion` (glow stays static, just no breathing; content visible with no settle).

### Tagline
Optional one-liner (`profile.tagline`) under the nick: Ash Rose, 1.125rem (1rem phone), centered with the hero. Absent key = absent element.

### Post Nav
Prev/next (`Новее`/`Старее`) at the foot of `.post-article`, separated by a hairline Bone-White-at-12% rule. Muted links (1rem, ellipsis-truncated titles) heating to Signal Bright on hover. Lives inside the article so the index modal copies it; modal JS swaps content instead of navigating — the new article slides in from the clicked button's side (240ms WAAPI: Новее from the left, Старее from the right), explaining the newer/older step. Instant under `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** build every new interactive row as a link card: Oxblood at rest, Ember Red + scale on hover, full pill on breakout.
- **Do** keep the page dark — Cinder Black ground, Oxblood surfaces; new surfaces pick from the maroon ramp.
- **Do** animate routine state changes at 0.3s ease and gate all motion behind `prefers-reduced-motion`. One authored focal moment may run longer: the hero ignition flare (1s), the live-pin afterglow (1.4s), and the card⇄modal morph (~0.34s) are the exceptions — the morph is continuity (the dialog shows synchronously inside the transition, so nothing waits), the others are exit-style state feedback.
- **Do** keep badges honest: hidden by default, revealed only on confirmed data, silent on any fetch error.
- **Do** use native platform features (View Transitions, `<dialog>`) before writing JS or adding assets.

### Don't:
- **Don't** add resting box-shadows — depth is tonal steps plus motion (The Flat-At-Rest Rule).
- **Don't** use Spotlight Gold outside the donate block (The One Spotlight Rule).
- **Don't** add webfont faces beyond Unbounded, Rubik, and JetBrains Mono — three voices with clear roles, not a type specimen.
- **Don't** mix the voices: Unbounded on body-sized text, Rubik on display-sized text, monospace outside code.
- **Don't** use purple/blue gamer gradients, corporate blue, or a light theme.
- **Don't** give hover styles to touch devices — use the `@media (hover: hover)` / `(hover: none)` split with press-scale feedback.
- **Don't** add API keys, tokens, or build steps to make a visual effect work; if it needs a server, it's off-brand.
