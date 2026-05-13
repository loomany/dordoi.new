# SEO Pages UX Cleanup — 2026-05-13

## Changed files

| File | Change |
|------|--------|
| `components/seo/SeoCategoryLanding.tsx` | Marketplace hub layout: stats row, tighter spacing, vendor grid above guide, compact guide block |
| `components/seo/SeoCoreLanding.tsx` | Hub layout: short intro, CTA row, quick links, compact body card below fold |
| `lib/catalog/seo-category-content.ts` | Short intro template, 2-paragraph guide, cleaned FAQ (no contact-channel leaks) |
| `lib/catalog/seo-category-route-data.ts` | `categoryNameByLocale`, `seoTextByLocale` as `string[]` |
| `lib/seo/core-seo-landings.ts` | Short RU/KK/KG/UZ/TJ intros, compact `bodyByLocale` paragraphs |
| `lib/seo/seo-page-labels.ts` | Stats labels, guide title, shorter vendor subtext, core quick-link labels |
| `app/[locale]/categories/[categorySlug]/page.tsx` | Vendor preview body label (string, not function) |

## What was wrong visually

- Category pages opened with 300–500 word intros before any vendor cards.
- Block titled «О закупке в этой категории» read like a long-form article.
- Vendor grid started too far below the fold due to `py-16`, `space-y-8`, and article-width text above the grid.
- Visible copy mentioned Instagram, Telegram, WhatsApp, phones, messengers, and «открытый HTML».
- Core landings (`rynok-dordoi`, `dordoi-optom`, `kargo-dordoi`) stacked intro + long body before CTAs, feeling like blog posts.

## Category page layout after cleanup

```
Breadcrumbs
H1
Short intro (2 lines)
Stats row: поставщиков / категория / контакт через сервис
H2: Поставщики категории + 1-line subtext
Vendor grid (full max-w-6xl width)
CTA row (compact)
H2: Как выбрать поставщика (2 short paragraphs)
Related categories
FAQ
```

Spacing: `py-10` / `space-y-6`; text sections `max-w-3xl`, grid uses parent `max-w-6xl`.

## Core landing layout after cleanup

```
Breadcrumbs
H1
Short intro (2–4 lines)
CTA row: каталог / байер / карго (where applicable)
Quick links: каталог / категории / байеры / карго
Compact body card (1–2 short paragraphs)
FAQ
```

## Copy changes

### Category intro (RU template)

> Поставщики категории «{categoryName}» на рынке Дордой. Сравните ассортимент, условия работы и откройте профиль продавца через Dordoi.help.

### Category guide (RU, 2 paragraphs)

1. Сравнение ассортимента, формата, MOQ, отгрузки; карточки Dordoi.help.
2. Работа через байера при отсутствии личного визита; условия выкупа/доставки обсуждаются отдельно.

### Core RU intros

- **rynok-dordoi:** Dordoi.help помогает ориентироваться на рынке: поставщики, категории, байеры, разделы закупки.
- **dordoi-optom:** Раздел для оптовой закупки; каталог, категории, закупка через сервис.
- **kargo-dordoi:** Доставка и организация закупки; поставщик, байер, следующий шаг отправки.

### Removed from visible SEO body

Instagram, Telegram, WhatsApp, телефоны, мессенджеры, открытый HTML — replaced with «контакт через сервис» / «без публикации прямых контактов» where relevant.

## SEO signals unchanged

- Category URLs and slugs unchanged.
- `generateMetadata` / canonical / hreflang logic untouched.
- Sitemap, robots, index policy (`noindex_if_empty`) unchanged.
- Vendor grids, FAQ, related links, JSON-LD FAQ retained.
- Title/description/H1 in manifest seeds unchanged (only intro/body/seoText/FAQ copy generators updated).

## Data quality note

Некоторые карточки могут не идеально соответствовать выбранной категории, потому что текущая разметка продавцов может быть широкой или мультикатегорийной. Например, в мужской категории может встретиться описание с женской одеждой. Это не layout bug, а задача будущей модерации/чистки категорий. Vendors не скрываются автоматически, если кодовая категория совпадает.

## Checks result

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS (205 static pages) |

Manual URL verification (expected after deploy/local `next start`):

- `/ru/categories/muzhskaya-odezhda-optom` — short intro, grid above guide
- `/ru/categories/zhenskaya-odezhda-optom`
- `/ru/categories/obuv-optom`
- `/ru/categories/sumki-kozhgalantereya-optom`
- `/ru/rynok-dordoi`, `/ru/dordoi-optom`, `/ru/kargo-dordoi`, `/ru/catalog`

## Privacy result

Grep on `lib/catalog/seo-category-content.ts`, `lib/seo/core-seo-landings.ts`, `lib/seo/seo-page-labels.ts`, `components/seo/*`:

| Pattern | SEO visible copy |
|---------|------------------|
| instagram / telegram / whatsapp | None |
| t.me / wa.me / tel: | None |
| telephone / sameAs | None |
| мессенджер / открытый HTML / телефон (body) | None |

Allowed elsewhere (admin bundle, vendor profiles, i18n admin labels) — not modified.

## Final git status

Modified by this task (SEO UX cleanup scope):

- `app/[locale]/categories/[categorySlug]/page.tsx`
- `components/seo/SeoCategoryLanding.tsx`
- `components/seo/SeoCoreLanding.tsx`
- `lib/catalog/seo-category-content.ts`
- `lib/catalog/seo-category-route-data.ts`
- `lib/seo/core-seo-landings.ts`
- `lib/seo/seo-page-labels.ts`

Other modified/untracked files in working tree pre-exist outside this task.

## Commit / push

Not done (per task instructions).
