# P0 SEO fixes — dordoi.help

**Дата:** 2026-05-11  
**Основание:** аудит `reports/seo/dordoi-help-seo-audit.md` и задача на P0-only.

---

## 1) Summary

Сайт приведён к **технически корректному SEO-конфигу** при `NEXT_PUBLIC_SITE_INDEXABLE=true` и корректном `NEXT_PUBLIC_APP_URL`: **robots** с `Allow` и точечными `Disallow`, **динамический** `robots.txt` / `sitemap.xml` (чтобы флаг индексации не «запекался» при сборке), **hreflang** с языковыми кодами **ky/tg** для URL **/kg** и **/tj**, **x-default** на **финальный `/ru/...` без редиректа**, **canonical** на текущую локаль, **index,follow** на публичных страницах и **noindex** в кабинете, **og:image** через `app/opengraph-image.tsx`, **`<html lang>`** по языку (ky/tg для маршрутов kg/tj), отключены дублирующие **Link**-заголовки hreflang от next-intl.

---

## 2) Что было исправлено

| Область | Изменение |
|---------|-----------|
| Индексация | `app/robots.ts` и `app/sitemap.ts`: `export const dynamic = "force-dynamic"`, чтобы `NEXT_PUBLIC_SITE_INDEXABLE` учитывался **на запросе**, а не только на этапе `next build`. |
| Robots | В indexable-режиме: `Allow: /`, явные `Disallow` для `/api/`, `/admin/`, `/account/`, `/signin`, `/legacy/`, `/test/`, `/preview/`, `/*/cabinet/`, строка **Sitemap** и **Host**. |
| Sitemap | Те же `hreflang` / **x-default**, что и в `<head>` (через общий хелпер). |
| hreflang BCP 47 | URL остаются `/kg`, `/tj`; в `alternates` и в sitemap: **`hreflang="ky"`** → URL на `/kg/...`, **`hreflang="tg"`** → URL на `/tj/...`. |
| x-default | Всегда **`https://…/ru{path}`** (200, без редиректа с безлокалевого URL). |
| next-intl Link | В `i18n/routing.ts`: **`alternateLinks: false`**, чтобы не отдавать второй, конфликтующий набор `Link: rel=alternate` с кодами `kg`/`tj` и `x-default` на URL без локали. |
| Meta robots | В `buildPageMetadata`: при indexable — **index, follow**; для кабинета — флаг **`privateArea: true`** → всегда **noindex**, без hreflang-набора в alternates. |
| OG / Twitter | `openGraph.images`, `twitter.images`, `siteName: "Dordoi Help"`, локали OG `ru_RU`, `kk_KZ`, `ky_KG`, `uz_UZ`, `tg_TJ`. |
| HTML `lang` | Middleware пробрасывает **`x-dordoi-route-locale`**; корневой `app/layout.tsx` (async) выставляет **`lang`** через маппинг kg→ky, tj→tg; `DocumentLang` синхронизирует после клиентских переходов. |
| Следы ScholarshipTop | По репозиторию (grep) — **не найдено** в публичных метаданных/OG. |

---

## 3) Изменённые файлы

- `lib/hreflang.ts` — **новый**: маппинг html lang, OG locale, hreflang + x-default.  
- `lib/seo.ts` — `buildPageMetadata`: robots, alternates, OG/Twitter images, `privateArea`, `siteName`.  
- `lib/site.ts` — комментарий про env и сборку.  
- `app/robots.ts` — disallow-лист, `dynamic`, indexable-ветка.  
- `app/sitemap.ts` — `dynamic`, `hreflangAlternatesForPath`.  
- `app/layout.tsx` — async, `headers()` → `lang` на HTML.  
- `app/opengraph-image.tsx` — **новый**: дефолтное OG/Twitter изображение.  
- `middleware.ts` — заголовок `x-dordoi-route-locale` на запросе.  
- `components/layout/DocumentLang.tsx` — маппинг kg→ky, tj→tg.  
- `i18n/routing.ts` — `alternateLinks: false`.  
- `app/[locale]/cabinet/**/page.tsx` (admin, admin edit, vendor, buyer, buyer-agent) — `privateArea: true`.  
- `.env.example` — пояснение про env и сборку.

---

## 4) Env на Railway production (выставить вручную, не из этого репо)

Обязательно:

1. **`NEXT_PUBLIC_SITE_INDEXABLE=true`**  
2. **`NEXT_PUBLIC_APP_URL=https://dordoi.help`**  

Рекомендация для CI: переменные должны быть доступны **до** команды `next build`, чтобы **canonical / metadataBase / абсолютные URL в пререндере** совпадали с прод-доменом. `robots.txt` и `sitemap.xml` при этом дополнительно читают флаг индексации **на запросе** благодаря `force-dynamic`.

---

## 5) Финальный список indexable routes (при `NEXT_PUBLIC_SITE_INDEXABLE=true`)

Все пары **локаль × путь** из `publicRoutes` в `lib/seo.ts` (12 путей × 5 локалей = **60 URL**), плюс фактически те же URL, что перечислены в ТЗ (дополнительно в проекте остаются публичные **`/contact`** и **`/refund`** в том же списке — юридические/контактные страницы).

Пути сегмента после локали:

`/`, `/catalog`, `/sell`, `/suppliers`, `/buyers`, `/buyer-service`, `/about`, `/help`, `/faq`, `/contact`, `/privacy`, `/terms`, `/refund`

Локали сегмента URL: **`ru`, `kk`, `kg`, `uz`, `tj`**.

---

## 6) Финальный список noindex routes

| Область | Поведение |
|---------|-----------|
| **`/[locale]/cabinet/**`** | `buildPageMetadata(..., privateArea: true)` + layout кабинета с `robots: noindex` — не индексировать. |
| **При `NEXT_PUBLIC_SITE_INDEXABLE` ≠ `true`** | Весь сайт: корневой layout + `buildPageMetadata` → **noindex, nofollow**; robots **Disallow: /**; sitemap пустой. |
| **Технические пути** | Закрытие через **robots.txt** `Disallow` (см. §2); страницы API не отдают HTML-лендинг. |

---

## 7) Решение kg/tj vs ky/tg

Выбран **вариант B (без миграции URL)**:

- Пользовательские URL остаются **`/kg/...`** и **`/tj/...`**.  
- В **hreflang** (metadata + sitemap) для этих страниц используются теги **`ky`** и **`tg`** с теми же URL.  
- В **`<html lang>`** для маршрутов `kg` / `tj` выставляются **`ky`** и **`tg`**.  

Полная смена сегментов **`/kg` → `/ky`** и редиректы **301** — вынесены в **отдельный этап** (не P0).

---

## 8) Исправление x-default

- Раньше: безлокалевый URL (редирект на `/ru/...`).  
- Сейчас: **`x-default` = `{baseUrl}/ru{path}`** — всегда **200** при существующей странице.  
- Реализация: `hreflangAlternatesForPath()` в `lib/hreflang.ts`.

---

## 9) Примеры canonical / hreflang

**`/ru/suppliers`**

- Canonical: `https://dordoi.help/ru/suppliers`  
- alternate: `ru` → `/ru/suppliers`, `kk` → `/kk/suppliers`, **`ky`** → `/kg/suppliers`, `uz` → `/uz/suppliers`, **`tg`** → `/tj/suppliers`, **`x-default`** → `/ru/suppliers`

**`/kg/suppliers`**

- Canonical: `https://dordoi.help/kg/suppliers`  
- Те же alternate hreflang-теги (для `ky` href остаётся `/kg/suppliers`).

---

## 10) Sitemap status

- При **закрытом** сайте: пустой набор URL.  
- При **открытом**: по одному `<url>` на каждую пару локаль + маршрут из `publicRoutes`, с **xhtml:link** для `ru`, `kk`, `ky`, `uz`, `tg`, `x-default`.  
- **Динамические карточки** `/catalog/{slug}` из БД в sitemap **не добавлялись** — остаётся **P1** (нужен отдельный approve).

---

## 11) Robots status

- Закрытый режим: `Disallow: /`.  
- Открытый: см. §2; **нет** `Disallow: /` для всего сайта.

---

## 12) Проверки

### `npm run build`

Успешно (после всех правок).

### `npx tsc --noEmit`

Успешно.

### Локальный `curl` (пример с `NEXT_PUBLIC_SITE_INDEXABLE=true`, `next start`)

Команды из задачи эквивалентны проверке на `http://127.0.0.1:3101` (порт по ситуации):

- `GET /robots.txt` — `Allow: /`, набор `Disallow`, строка `Sitemap:` (host в ответе берётся из **`NEXT_PUBLIC_APP_URL` на момент сборки** для `metadataBase`/`host`; на Railway после правильной сборки будет `dordoi.help`).  
- `GET /sitemap.xml` — непустой `<urlset>`, `hreflang` **ky/tg**, **x-default** на `/ru/...`.  
- `GET /ru/suppliers` — в HTML: **`index, follow`**, canonical и alternate с **ky/tg**, **og:image** на `/opengraph-image`, **нет** `noindex`.

**Production** после выставления env и деплоя рекомендуется повторить:

`curl -I https://dordoi.help/ru` … и запросы к `/robots.txt`, `/sitemap.xml`.

---

## 13) Что осталось в P1 / P2 (без approve не делать)

| Уровень | Содержание |
|---------|------------|
| **P1** | Динамические URL вендоров в sitemap; JSON-LD Organization/WebSite/FAQPage; расширение FAQ; Lighthouse/изображения. |
| **P2** | Миграция `/kg`→`/ky`, `/tj`→`/tg` с 301; блог; программные лендинги; `en`; GSC-мониторинг. |

---

*Работа по P0 завершена; дальнейшие изменения — только после отдельного approve.*
