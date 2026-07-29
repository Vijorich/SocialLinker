---
name: SocialLinker
description: Nocturnal ember-red business card — one page that routes viewers to every place Vijor lives online.
colors:
  cinder-black: "#140d0d"
  oxblood: "#481f1f"
  ember-red: "#a12727"
  signal-red: "#da2c2c"
  signal-link: "#ff6b59"
  signal-deep: "#b6261f"
  signal-live: "#d0342c"
  spotlight-gold: "#fad879"
  hearth-brown: "#6a4628"
  ash-rose: "#af9c9c"
  bone-white: "#e7e4e4"
  scrollbar: "#b06a6a"
  scrollbar-hover: "#c47a7a"
typography:
  display:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "3rem"
    fontWeight: 500
    letterSpacing: "-0.02em"
    lineHeight: 1.1
  headline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 600
    letterSpacing: "-0.02em"
    lineHeight: 1.2
  title:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    letterSpacing: "0.1em"
  body:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
  tagline:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 400
  label:
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
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
    textColor: "{colors.signal-red}"
---

# Design System: SocialLinker

## Overview

**Creative North Star: "The Ember Stage"**

A late-night stream made tangible: a dark room, an ember-red glow, one gold spotlight reserved for the donate block. The palette is warm and nocturnal — near-black maroon ground, oxblood cards, a hot signal red that acts as both accent and alarm. Nothing here is corporate, nothing is daylight.

The personality is playful inside the dark frame. Cards scale up when touched, badges bob and wobble with a recording-dot pulse, and clicking an article makes the card itself unfold into the reading surface via a native View Transition morph. Motion is the brand's voice; the static page is just the intermission.

Confirmed anti-references: never a sterile light-mode SaaS look, never purple/blue gamer gradients, never corporate blue links on white. The ember palette is the identity; departure from it is departure from the product.

**Key Characteristics:**
- Single centered column (40rem) on a near-black maroon gradient
- One accent (Signal Red) + one reserved spotlight (gold = donate only)
- Lists read as one clipped pill-block; hover breaks a card out into a full pill
- Flat surfaces; depth comes from tonal steps and motion, never resting shadows
- System font stack only — zero webfonts, zero build, keyless everything

## Colors

Warm maroon family from near-black to hot red, with a single gold that appears exactly once per page.

### Primary
- **Signal Red** (`{colors.signal-red}`): the accent — used for *fills, borders, and decorative state*: avatar ring, blockquote rails, selection background, the 404 code gradient, badge hovers. The voice of the page. As saturated *text* on dark surfaces it only clears ~3:1, so it is not used for link text directly (see Signal Link).
- **Signal Link** (`{colors.signal-link}`): the readable rendering of Signal Red as link text and the keyboard focus ring on dark/card surfaces — same red lifted to ≥4.5:1. All in-prose links, post-nav hovers, and `:focus-visible` rings use this.
- **Signal Deep** (`{colors.signal-deep}`): a deeper Signal Red for high-contrast fills behind light text (the New! badge). Needed because saturated Signal Red + dark text ≈ 3.9:1, failing AA for small bold.
- **Signal Live** (`{colors.signal-live}`): the hotter Live-badge fill. Bone White on this red ≈ 3.95:1 (fails AA small-bold), so the Live badge pairs it with pure white text/dot — the only place pure white appears instead of Bone White.
- **Ember Red** (`{colors.ember-red}`): hover state for every card. Cards literally heat up when touched.

### Secondary
- **Spotlight Gold** (`{colors.spotlight-gold}`): donate block only — the section title plus card text on Hearth Brown at rest, full gold fill on hover. Its scarcity is the point.

### Neutral
- **Cinder Black** (`{colors.cinder-black}`): page ground (with a subtle vertical gradient to `#1a1010`), backdrop under the modal.
- **Oxblood** (`{colors.oxblood}`): the card surface. Every interactive surface starts here.
- **Hearth Brown** (`{colors.hearth-brown}`): donate card surface; a warm brown lifted to a clear tonal step above Oxblood, reaching toward gold so the donate block reads as a warm peak at rest.
- **Bone White** (`{colors.bone-white}`): primary text.
- **Ash Rose** (`{colors.ash-rose}`): muted text — section titles, dates, excerpts, footer.
- **Scrollbar** / **Scrollbar Hover** (`{colors.scrollbar}` / `{colors.scrollbar-hover}`): warm ember scrollbar tones, tonal with the maroon ramp rather than neutral gray.

### Named Rules
**The One Spotlight Rule.** Gold appears only in the donate block. Anywhere else it stops meaning "support" and starts meaning "decoration."
**The Heat-On-Touch Rule.** Ember Red (`#a12727`) is a state, not a surface. It exists only under a hovered or activated element.
**The Readable-Red Rule.** Signal Red is the accent for fills, borders, rings, and selection. When the same red appears as *text* on a dark surface (links, focus outlines, hover icons on red), use **Signal Link** so contrast clears WCAG AA 4.5:1. For a light-text fill that must read as Signal Red, use **Signal Deep**.

## Typography

**Display/Body/Label Font:** system-ui (with -apple-system, Segoe UI, Roboto fallback) — one stack for everything.

**Character:** No webfonts by design. The system stack keeps the site zero-asset and instant on any device; hierarchy is carried by size, weight, tracking, and case — not by typeface contrast.

### Hierarchy
- **Display** (500, 3rem / 2.25rem phone, -0.02em, leading 1.1): the nick in the hero. The only oversized text on the page.
- **Headline** (600, 1.75rem / 1.5rem phone, -0.02em, leading 1.2): article titles on post pages and in the modal.
- **Title** (500, 1rem, +0.1em, uppercase, Ash Rose): section labels. Small, tracked-out, quiet. Donate's title is the one exception — Spotlight Gold, lifting the spotlight to the section level (One Spotlight Rule).
- **Body** (400, 1.25rem, leading 1.5): everything else. Generous size — this page is read on phones from stream chats. Drops to 1.125rem (<768px) and 1rem (<380px). Long-form prose (`.post-content`) opens to leading 1.7.
- **Meta** (400, 1rem, Ash Rose): the muted secondary layer — dates, excerpts, link/project descriptions, post nav, footer. The quiet information that surrounds the primary text.
- **Tagline** (400, 1.125rem / 1rem phone, Ash Rose): the optional hero one-liner, one step above meta.
- **Label** (700, 0.75rem, +0.05em, uppercase): badges. Loud at tiny size.

### Named Rules
**The One-Stack Rule.** Never add a webfont. If hierarchy is needed, reach for weight, size, tracking, or case — in that order.
**The Negative-Tracking Rule.** Tight letter-spacing (-0.02em) is reserved for display and headline sizes only; body and labels stay at natural or positive tracking.
**The Leading-Arc Rule.** Leading tightens as size grows: 1.1 display → 1.2 headline → 1.5 body → 1.7 long-form prose. Big type never inherits the body's air. Headings use `text-wrap: balance`; body and prose use `text-wrap: pretty` — native, zero-cost, no asset.

## Layout

One centered column does all the work. `.container` caps at 40rem with 2rem/1.5rem/3rem padding; the post modal widens to `min(56rem, 100vw - 2rem)` for comfortable reading. Sections stack with 2rem gaps (1.5rem on phone), cards inside a list sit 0.5rem apart.

Desktop is the base stylesheet; phones adapt at 768px (denser padding, 2.25rem nick, stacked post-card heads) with a small-phone refinement at 380px. There is no tablet-specific layout — portrait tablets fold into the phone rules.

## Elevation & Depth

Flat by doctrine. No element casts a shadow at rest; depth is conveyed by tonal steps — Cinder Black page → Oxblood card → Ember Red hover — and by motion (hover scale 1.03, press scale 0.97). Soft ambient glows are permitted only as a state response: hover, focus, or live activity. The modal's dim backdrop (`rgba(10,6,6,0.6)`) is the sole overlay treatment.

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
- **Hover:** background heats to Ember Red, scale 1.03, radius inflates to 2rem, glyph fades to full opacity (0.3s ease), and a soft radial ember bloom fades in inside the card (`::before`, Signal-Link-tinted; gold-tinted on the donate variant) — the Heat-On-Touch rule made literal. Hover styles are gated behind `@media (hover: hover)`; touch devices never receive them.
- **Focus (`:focus-visible`):** mirrors hover heat + a double keyboard ring (`box-shadow: 0 0 0 2px Cinder, 0 0 0 4px Signal Link`) so the focused row is unambiguous. Donate variant heats to full gold + dark text. Focus is not hover-gated — keyboard users on any device get the ring. Mouse clicks suppress it via `:focus-visible`.
- **Touch:** no hover — press scales to 0.97 (0.15s)
- **Donate variant:** Hearth Brown + Spotlight Gold text at rest; full gold fill with dark text on hover

### Badges
Live/New! chips on link cards; rendered hidden, revealed by `badges.js` only on confirmed fresh data.
- **Pinning (standing rule):** a revealed badge moves its card to the top of the list — live/fresh destinations always lead. Stable in `social.yml` order (Twitch leads statically); the reorder morphs via View Transition, instant under reduced motion. Pinning moves the real DOM node, so tab and AT order always match the visual order.
- **Style:** pill (999px), Label type, bob animation (2.5s float with ±2° wobble)
- **Reveal:** one-shot scale-in pop (0.35s, slight overshoot) when un-hidden — freshness arrival feels earned, not silent. Then bob takes over.
- **Live-pin afterglow:** on confirmed Twitch live, the freshly-pinned card flashes hot (Ember Red → Oxblood over 1.4s) so the eye finds it after the reorder morph.
- **Live:** Signal Live fill, pure white text and pulsing dot (1.2s recording pulse). Pure white is AA-mandated here — Bone White on Signal Live ≈ 3.95:1.
- **New!:** Signal Deep fill, Bone White text (passes AA for 12px/700). Saturated Signal Red + dark text failed at ~3.9:1, so the deeper red was introduced for this fill.
- **Motion safety:** animations off under `prefers-reduced-motion`

### Post Cards & Article
Post cards reuse the link-card block with `user-select: none`; the single-article surface is an Oxblood card at full 2rem radius with 2rem padding. The card and article share `view-transition-name: post-hero`, so opening a post morphs the card into the reading surface (0.5s, cubic-bezier(0.4,0,0.2,1)); the fallback is plain navigation. Card heads and article headers carry date + server-rendered reading time (`N мин`). Article body reads at 1.7 line-height, capped at 44rem measure; headings get 2rem air above, 0.75rem below. The modal is URL-synced (pushState/popstate) — a refreshed modal URL lands on the standalone page.

### Modal
`<dialog>` morphing from the clicked card: Oxblood surface, 2rem radius, `min(56rem, 100vw - 2rem)`, max 85vh (92vh phone), dim maroon backdrop, circular close button top-right.

### Close Button
- **Style:** 48px circle, Oxblood, no border
- **Hover:** Ember Red background, Signal Link icon, scale 1.08. (Known tension: Signal Link on Ember ≈ 2.6:1, still under the 3:1 non-text floor — the resting Bone White icon on Oxblood carries the visible affordance, and the focus ring guarantees keyboard visibility. A bone-white hover icon would pass; kept Signal Link to hold the "red on heat" intent. Open.)
- **Focus (`:focus-visible`):** double ring (Cinder gap + Signal Link), no bg change.
- **Touch:** press scales to 0.92

### Hero & Avatar
The hero is the Ember Stage at rest: a soft radial Signal-Red glow (`.hero::before`, blurred, low-opacity) breathes behind the avatar (~6s scale/opacity oscillation) so the room reads as warm and lived-in, never dead. Avatar is a 96px circle (80px phone) with a 2px Signal Red ring — the only bordered element in the system. The glow is stage-light, not a surface: the Heat-On-Touch Rule targets cards; the north star itself calls for "a dark room, an ember-red glow," so the brief earns this one ambient exception. Arrival is the first authored beat: on load the glow wakes from cold to its resting breath (0.8s) and the hero content settles out of a soft blur (0.6s, role-staggered) — the dark room coming into focus. Only the stage animates; link cards are ready at first paint so the one-click action surface is never delayed. Ignition is the authored focal moment: when `badges.js` confirms Twitch live and adds `.avatar.live`, the stage catches — a one-time match-strike flare (0.9s, brightness+scale surge) hands off to a hotter, larger breath, and the avatar ring heats to Signal Link. The sonar ring pulse (1.2s, Signal Red glow fading outward) remains the page's primary "on air now" signal; badges stay secondary. All hero motion off under `prefers-reduced-motion` (glow stays static, just no breathing; content visible with no settle).

### Tagline
Optional one-liner (`profile.tagline`) under the nick: Ash Rose, 1.125rem (1rem phone), centered with the hero. Absent key = absent element.

### Post Nav
Prev/next (`Новее`/`Старее`) at the foot of `.post-article`, separated by a hairline Bone-White-at-12% rule. Muted links (1rem, ellipsis-truncated titles) heating to Signal Red on hover. Lives inside the article so the index modal copies it; modal JS swaps content instead of navigating.

## Do's and Don'ts

### Do:
- **Do** build every new interactive row as a link card: Oxblood at rest, Ember Red + scale on hover, full pill on breakout.
- **Do** keep the page dark — Cinder Black ground, Oxblood surfaces; new surfaces pick from the maroon ramp.
- **Do** animate routine state changes at 0.3s ease and gate all motion behind `prefers-reduced-motion`. One authored focal moment may run longer: the hero ignition flare (0.9s) and the live-pin afterglow (1.4s) are the exceptions — exit-style state feedback, not choreography users wait through.
- **Do** keep badges honest: hidden by default, revealed only on confirmed data, silent on any fetch error.
- **Do** use native platform features (View Transitions, `<dialog>`, system stack) before writing JS or adding assets.

### Don't:
- **Don't** add resting box-shadows — depth is tonal steps plus motion (The Flat-At-Rest Rule).
- **Don't** use Spotlight Gold outside the donate block (The One Spotlight Rule).
- **Don't** introduce webfonts, purple/blue gamer gradients, corporate blue, or a light theme.
- **Don't** give hover styles to touch devices — use the `@media (hover: hover)` / `(hover: none)` split with press-scale feedback.
- **Don't** add API keys, tokens, or build steps to make a visual effect work; if it needs a server, it's off-brand.
