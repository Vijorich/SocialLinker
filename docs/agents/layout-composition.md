# Layout & composition

- `_layouts/default.html` owns ALL shared chrome — head, meta, OG tags, script/style loading. Never duplicate it in includes.
- `index.html` iterates `_data/sections.yml`: array order is render order; add or omit entries to show/hide sections. Each section `type` maps to a `_includes/*.html`.
- Section titles: override via `title:` in `sections.yml`; omit for the locale default; `false` hides the heading.
- The standalone post page is `_layouts/post.html` wrapping `.post-article`; the modal copies that node (see [post-modal.md](post-modal.md)).
