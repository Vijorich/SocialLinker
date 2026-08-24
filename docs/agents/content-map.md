# Content map

Single source of truth per content type — all content lives in `_data/*.yml`.

| What | File |
|---|---|
| Section order, titles, visibility | `_data/sections.yml` |
| Nick, avatar path, tagline | `_data/profile.yml` |
| Bio | `_data/profile.yml` (`bio`, `\|` block scalar) |
| Social links + order + per-card `description` | `_data/social.yml` |
| Live/New! badges | `_data/social.yml` (`badge` per item, `badge_days`) |
| Projects list | `_data/projects.yml` |
| Donate block | `_data/donate.yml` |
| UI strings | `_data/locale.yml` |
| Icons (inline SVG) | `_includes/icon.html` (Liquid `case` over brand name) |
| Styles | `assets/style.css` |

## Posts

`_posts/YYYY-MM-DD-slug.md` with front matter `layout: post`, `title`, `date`, `lang`. New posts appear in `articles.html` automatically; on the index they open in the modal (see [post-modal.md](post-modal.md)).

## Icons

`_includes/icon.html` renders a `when` branch per brand from simpleicons.org; unknown `name` falls back to a globe SVG. Add a `case` to add a brand.

## Language

Single language (RU), fully server-rendered from `locale.yml` and `profile.yml`. Add strings to `locale.yml`, reference them via `{% raw %}{{ site.data.locale.key }}{% endraw %}`.
