# Post modal

The whole session machine lives in `assets/post-modal.js`, loaded as an ES module from `default.html`; the layout keeps only event wiring plus `data-home` on `<body>` for the standalone close fallback.

## Interface

`open(card)` / `swap(url, dir)` / `close()` / `popstate(state)` / `prefetch(url)`. Fetch, history, View Transitions, and event emission enter as injected adapters — that's what the tests fake.

## Behaviour

Fetches the post page, extracts `.post-article`, fills the dialog, and morphs the clicked card into it via a shared-element View Transition (`post-morph`; morphs back on close). Prev/next swaps slide in from the clicked side (WAAPI). Both fall back to instant under reduced motion or without View Transition support.

URL-synced: `pushState` on open, `replaceState` per swap, `popstate` closes/reopens. Refreshing with a modal URL lands on the standalone post page — the no-JS/direct-link fallback.

Prev/next nav lives inside `.post-article` (`_layouts/post.html`), so the modal copies it and intercepts its links.

## Guarantees

- In-flight fetches carry a generation token (`gen`) so stale fetches can't fill the dialog or push history out of order.
- Failed fetches are never cached; they fall back to standalone navigation.
- A `popstate` naming a post with no matching card hard-navigates there.

## Events

Emits window events **`post-modal-open`** `{url, source: 'card'|'history'}` and **`post-modal-close`**. Consumers subscribe to these instead of observing the dialog — piano.js does for its swell/farewell (see [audio-piano.md](audio-piano.md)).
