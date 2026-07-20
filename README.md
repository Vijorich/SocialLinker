# SocialLinker

Личная визитка на GitHub Pages (Jekyll, без сборки, без CI).

## Структура

| Что | Где менять |
|---|---|
| Ник, аватар, био | `_data/profile.yml` |
| Соцсети | `_data/social.yml` |
| Донат-блок | `_data/donate.yml` |
| Перевод UI (RU/EN) | `_data/locale.yml` |
| Аватар-картинка | `assets/avatar.svg` (или поменяй путь в `profile.yml`) |
| Иконки (SVG) | `_includes/icon.html` (добавь `case` для нового бренда) |
| Стили | `assets/style.css` |
| Переключатель языка | `assets/i18n.js` |

## Добавить статью

Создай файл `_posts/YYYY-MM-DD-zagolovok.md`:

```markdown
---
layout: post
title: "Заголовок"
date: 2026-08-01 00:00:00 +0300
---

Текст статьи в markdown.
```

Статья появится в ленте автоматически.

## Локальный запуск

```bash
bundle install
bundle exec jekyll serve --baseurl ""
```

Открой `http://localhost:4000`.

Если Ruby/Jekyll не установлен: см. [официальный гайд](https://jekyllrb.com/docs/installation/).
Альтернатива — пушить на GitHub, GH Pages соберёт сам.

## Деплой на GitHub Pages

1. Создай репозиторий `SocialLinker` на GitHub.
2. `git init && git add . && git commit -m "init"`.
3. `git remote add origin git@github.com:USERNAME/SocialLinker.git && git push -u origin main`.
4. Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `(root)`.
5. Через ~1 минуту сайт доступен на `https://USERNAME.github.io/SocialLinker`.

Поменять `baseurl` в `_config.yml` если репо назван иначе.

## i18n

Сервер рендерит RU по умолчанию. JS-переключатель в шапке меняет строки и био, выбор сохраняется в `localStorage`. Чтобы поменять язык первого захода — `i18n.js`, функция `detectLang`.

`ponytail:` SEO видит только RU. Для полного i18n нужен `jekyll-polyglot` + GH Actions (GH Pages safe-mode его не разрешает).
