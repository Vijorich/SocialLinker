# SocialLinker

Статический сайт-визитка на [Jekyll](https://jekyllrb.com) для GitHub Pages. Весь контент — в `_data/*.yml`, шаблоны трогать не нужно. Форкните, впишите свои данные — и сайт готов.

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Jekyll](https://img.shields.io/badge/Jekyll-3.9-red?logo=jekyll)](https://jekyllrb.com)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github)](https://pages.github.com)

## Возможности

- Секции набираются из `_data/sections.yml`: порядок строк = порядок на странице, удалил строку — секция скрыта.
- Соцссылки с живыми бейджами **Live** (Twitch) и **New!** (YouTube, Telegram) — клиентский JS, без ключей API.
- Список проектов, блок донатов, блог на `_posts/*.md`.
- Никаких плагинов и CI: работает в safe mode GitHub Pages, деплой пушем в `main`.

## Форк под себя

1. **Fork** репозитория (или **Use this template**).
2. В форке: **Settings → Pages → Deploy from a branch**, ветка `main`, корень `/`. Сборка ~1 минуту.
3. Поправьте `_config.yml`:
   ```yaml
   url: "https://<ваш-ник>.github.io"
   baseurl: "/<имя-репозитория>"   # для user-page (ник.github.io) оставьте пустым: ""
   ```
4. Замените контент (см. таблицу ниже) и `assets/avatar.webp`.
5. Запушьте в `main` — сайт обновится сам.

## Локальный запуск

Нужны [Ruby+DevKit](https://rubyinstaller.org/) и Bundler.

```bash
bundle install
bundle exec jekyll serve --baseurl ""
```

> [!IMPORTANT]
> `--baseurl ""` обязателен: в `_config.yml` прописан production-baseurl, без переопределения локально ломаются пути к стилям и ссылкам. Сайт будет на `http://localhost:4000`.

## Где что менять

| Что | Файл |
|---|---|
| Порядок и видимость секций, заголовки | `_data/sections.yml` |
| Ник, аватар, био | `_data/profile.yml` |
| Соцссылки, бейджи Live/New! | `_data/social.yml` |
| Проекты | `_data/projects.yml` |
| Блок «Поддержать» | `_data/donate.yml` |
| Тексты интерфейса | `_data/locale.yml` |
| Иконки (inline SVG) | `_includes/icon.html` |
| Стили | `assets/style.css` |

Нюансы:

- Заголовок секции: `title: "Текст"` — свой, без `title` — из `locale.yml`, `title: false` — скрыть.
- Бейдж YouTube требует `channel_id` (смотрите на youtube.com/account_advanced); пустой — бейдж не рендерится.
- Посты: `_posts/YYYY-MM-DD-slug.md` с `title`, `date`, `lang` в front matter — попадают в секцию «Статьи» автоматически.

Больше деталей — в [AGENTS.md](AGENTS.md).

## Как помочь проекту

Баги и идеи — в [Issues](../../issues). Код — через Pull Request:

1. Форк → ветка от `main` (`feat/...` или `fix/...`).
2. Коммиты: короткое сообщение в повелительном наклонении, префикс `feat:`/`fix:` приветствуется (`feat: add VK badge support`).
3. Перед PR проверьте локально: `bundle exec jekyll build` проходит без ошибок, страница выглядит как задумано.
4. Один PR — одно изменение. Правки контента автора (`_data/profile.yml` и т.п.) в PR не включаем.

## Лицензия

[MIT](LICENSE) — берите, форкайте, меняйте под себя. Указание авторства приветствуется, но не обязательно.
