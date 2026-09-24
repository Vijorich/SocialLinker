# Post modal

The whole session machine lives in `assets/post-modal.js`, loaded as an ES module from `default.html`; the layout keeps only event wiring plus `data-home` on `<body>` for the standalone close fallback.

## Interface

`open(card)` / `swap(url, dir)` / `close()` / `popstate(state)` / `prefetch(url)`. Fetch, history, View Transitions, and event emission enter as injected adapters — that's what the tests fake.

## Behaviour

Fetches the post page, extracts `.post-article`, and fills the dialog. A cache miss opens a busy dialog immediately with a localized loading state and bounded fetch timeout; the loaded content gets a short scale/fade entrance that never uses the post card as a transition snapshot. Closing may use the shared-element View Transition back to the card. Prev/next swaps focus the new title, announce it through a live region, and slide in from the clicked side (WAAPI). All motion falls back to instant under reduced motion or when the platform API is unavailable.

URL-synced: `pushState` on open, `replaceState` per swap, `popstate` closes/reopens. Refreshing with a modal URL lands on the standalone post page — the no-JS/direct-link fallback.

Prev/next nav lives inside `.post-article` (`_layouts/post.html`), so the modal copies it and intercepts its links.

## Guarantees

- In-flight fetches carry a generation token (`gen`) and share one promise per URL, so stale fetches can't fill the dialog or push history out of order; close invalidates the session synchronously.
- Failed fetches are never cached; they fall back to standalone navigation.
- Posts are author-controlled trusted content: modal insertion preserves the server-rendered HTML, while relative `href`/`src`/`srcset` values are normalized against the fetched post URL before insertion. If an untrusted-content importer is added, sanitize the parsed article at that boundary.
- A `popstate` naming a post with no matching card hard-navigates there.

## Events

Emits window events **`post-modal-open`** `{url, source: 'card'|'history'}` and **`post-modal-close`**. Consumers subscribe to these instead of observing the dialog — piano.js does for its swell/farewell (see [audio-piano.md](audio-piano.md)).
