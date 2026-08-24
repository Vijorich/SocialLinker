# Audio: engine + piano vocabulary

Two modules, both ES modules loaded from `default.html`:

- `assets/audio-engine.js` — the deep engine: AudioContext lifecycle, mute gate, master bus, every envelope (`play`/`note`/`chord`/`hold`/`drone`/`tok`/`echo`/`releaseAll`). Callers never touch nodes; the mute gate is checked inside every voice creator.
- `assets/piano.js` — wiring + vocabulary: DOM listeners, the pentatonic ladder math (`SEMI`/`rungAt`), the walker step (`nextRung`, clamped rung ±4), and the `MELODIES` data table (importance-ladder click melodies, glance/swell/farewell).

Exact frequencies, semitone sets, and timings live in the code — treat the code as the source of truth; this doc records intent.

## Vocabulary

- **Hover**: every card entry sounds, no throttle — hovering up/down the list plays like an instrument. Card position in DOM order climbs an A-minor pentatonic scale across octaves.
- **Click**: each card's click root is its OWN pentatonic tonic (the same `order` map hover uses), so re-clicking a card sings in the same key. Click melodies follow the importance ladder — the more important the component, the longer and more playful the chord, exactly one voice per rung: donate, links, projects, posts (shortest). `MELODIES` in `piano.js` holds the actual notes.
- **Modal reopen swell** matches the post rung: piano hears `post-modal-open` with `source: 'history'`; `source: 'card'` stays silent because the click chord already spoke (events from [post-modal.md](post-modal.md)). Closing the modal is two notes sagging RE→DO.
- **Middle-click** hits the same vocabularies. **Right-click** is a questioning two-tone glance, a perfect fourth apart, left unresolved.
- **Glide**: voices glide in — pitch glides to the chord rather than starting on it (shared mistune `GLIDE_SEMIS` in the engine).
- **Skip link** (`.skip-link:focus`): a single clean tok — the door is this way.
- **GitHub card** (href `github.com/Vijorich/*`): a faint octave echo after its hover note — Vijor's own workshop voice in the same scale.

## Focus instruments

- **Avatar hover** layers an ember drone: detuned sines through a lowpass, gain breathing in step with the CSS ember-breath animation; released on leave; tab-hide stops it.
- **Attune** (hover-hold any card ~3.5 s): a small chord sharing the card's pentatonic ladder runs an evolving random-walk melody clamped to the card's rung ±4 — pitch changes, no two attunes land on the same sequence.
- **One clock, two skins**: the ambient breathes on a real gain LFO, and the glow (`attune-shimmer` in `assets/attune.css`, `.attuned::after`) runs on that exact period — JS stamps `--attune-period` on the card at hold start, CSS adds a −¼-period delay, so the brightness peak lands on the loudness peak. Donation cards shimmer warmer, at higher contrast, walking the same ladder an octave up (`ladderScale: 2`) so they sit above the fold.
- Tab-hide releases all holds; a badge-reveal landing in a hidden tab stays silent.

## System-driven tick

When badges.js reveals a live/new chip it dispatches `badge-reveal` (see [badges.md](badges.md)); piano answers with a short two-note wake-tick — major third for Live, tritone for New!. This is the only moment the page sounds without a gesture.

## Autoplay & mute

AudioContexts are created lazily inside the engine (an optimistic `unlock()` at load, re-armed on the first pointer/key) so autoplay policy can't block them. Piano no-ops under `prefers-reduced-motion` and on touch (no hover).

Mute: the fixed `.sound-toggle` button (bottom-right, every page, revealed by piano.js — no-JS pages have no audio) flips the engine gate and releases sounding holds/drone mid-flight via the single `releaseAll()` chokepoint (tab-hide lands there too). Persists in `localStorage` key `sl-audio` (`off`/`on`), default ON. Labels live in `locale.yml` (`sound_mute`/`sound_unmute`) and ride to JS via data-attributes on the button.
