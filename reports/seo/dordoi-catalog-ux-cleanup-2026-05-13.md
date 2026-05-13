# Catalog UX Cleanup — dordoi.help

**Date:** 2026-05-13  
**Scope:** `/catalog` layout, intro copy, compact footer SEO links  
**Commit/push:** not done

## What was visually wrong

1. **Popular categories** sat above search/filters and pushed vendor cards below the fold.
2. **Intro** was one long paragraph (~120 words) duplicating subtitle value.
3. **Footer** used tall grid columns with uppercase «ДОРДОЙ» / «КАТЕГОРИИ» and 8 category links — heavy on catalog pages.

## `/catalog` layout

**Order now:**

```txt
Breadcrumbs → H1 → subtitle → short intro (2 paragraphs) → count → search + filter → cards → pagination → popular categories → footer
```

- `CatalogPopularCategories` removed from header column.
- Rendered after card grid and pagination (or after grid when a single page).
- Links remain `<Link href="/categories/...">` via `seoCategoryPath`; no `?cat=`.

## Intro (shortened)

**RU before:** single long paragraph about Bishkek, CIS buyers, buyers agents, etc.

**RU after (2 paragraphs):**

1. «Каталог Dordoi.help помогает находить оптовых поставщиков рынка Дордой…»
2. «Для выкупа, проверки товара и доставки можно воспользоваться разделом байеров.»

Keys: `Pages.catalogBrowse.intro` + `introBuyers` in `messages/{ru,kk,kg,uz,tj}.json`.

**Unchanged:** H1, SEO title/description, query `noindex` / canonical policy.

## Popular categories position

| | Before | After |
|--|--------|-------|
| Position | Under H1/stats, above search | Under pagination, before footer |
| Link count | 8 | 8 (unchanged — full set for catalog browse) |
| Link target | `/categories/...` | `/categories/...` |

## Footer cleanup

**Before:** 4-column grid, logo, bold uppercase section titles, 6 hub + 8 category links.

**After:** One compact wrap row (`text-[11px]`, `py-5`):

| Group | Links (4 each) |
|-------|----------------|
| Hub | Каталог, Поставщики, Байеры, Карго |
| Categories | Женская одежда, Обувь, Сумки, Ткани |

- `FOOTER_HUB_LINKS` + reduced `FOOTER_CATEGORY_IDS` in `lib/seo/seo-internal-links.ts`.
- SEO links **kept** (crawlable `<Link>`), not removed.
- Sitemap **not** modified.

## SEO links preserved

| Surface | Links |
|---------|-------|
| Catalog popular block | 8 categories → `/categories/...` |
| Footer | 4 hub + 4 categories |
| Home (`HomePopularSectionsBlock`) | unchanged |

## Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass |
| `/ru/catalog` | 200, `index,follow`, short intro, popular block after search in HTML |
| `/ru/catalog?cat=mens` | `noindex,follow`, canonical `/ru/catalog` |
| `/ru/categories/muzhskaya-odezhda-optom` | 200 |
| No `?cat=` in popular SEO links | OK |

## Changed files

- `components/catalog/CatalogBrowseLayout.tsx`
- `components/catalog/CatalogPopularCategories.tsx` (optional `className` prop)
- `components/layout/SiteFooter.tsx`
- `lib/seo/seo-internal-links.ts`
- `messages/ru.json`, `kk.json`, `kg.json`, `uz.json`, `tj.json`

## Final git status

Tracked modifications only (no commit). Untracked junk unchanged.

**Push not done.**
