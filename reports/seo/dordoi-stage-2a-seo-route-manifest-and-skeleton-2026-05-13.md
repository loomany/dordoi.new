# Stage 2A — SEO Route Manifest and Skeleton

Date: 2026-05-13  
Base commit: `d29a68e` (Stage 1)  
Commit/push: **not done** (awaiting approve)

## Summary

Stage 2A adds the SEO route foundation: a single category manifest (15 P0 categories × 5 locales), category landing skeleton at `/[locale]/categories/[categorySlug]`, and three core SEO landings. Canonical and hreflang are wired through metadata; vendor grids, sitemap, footer linking, and card badges are deferred to Stage 2B/2C.

## Changed / new files

### New — lib

| File | Role |
|------|------|
| `lib/seo/route-locale.ts` | `RouteLocale` type + guard |
| `lib/seo/core-seo-landings.ts` | Core landing content (3 pages × 5 locales) |
| `lib/seo/seo-page-labels.ts` | UI labels for breadcrumbs/CTA (5 locales) |
| `lib/catalog/seo-category-content.ts` | Template intro/seoText/FAQ builders |
| `lib/catalog/seo-category-route-data.ts` | Manifest data (15 categories) |
| `lib/catalog/seo-category-routes.ts` | Helpers + static params |
| `lib/catalog/seo-category-metadata.ts` | Category page metadata + robots |

### New — components

| File | Role |
|------|------|
| `components/seo/SeoBreadcrumbs.tsx` | Reusable breadcrumbs |
| `components/seo/SeoCategoryLanding.tsx` | Category page layout |
| `components/seo/SeoCoreLanding.tsx` | Core landing layout |

### New — routes

| Route | File |
|-------|------|
| `/[locale]/categories/[categorySlug]` | `app/[locale]/categories/[categorySlug]/page.tsx` |
| `/[locale]/rynok-dordoi` | `app/[locale]/rynok-dordoi/page.tsx` |
| `/[locale]/dordoi-optom` | `app/[locale]/dordoi-optom/page.tsx` |
| `/[locale]/kargo-dordoi` | `app/[locale]/kargo-dordoi/page.tsx` |

### Modified

| File | Change |
|------|--------|
| `lib/hreflang.ts` | Added `hreflangAlternatesFromLocalePaths()` for localized category slugs |

## Category manifest overview

- **Source of truth:** `lib/catalog/seo-category-route-data.ts` + helpers in `seo-category-routes.ts`
- **15 categories** mapped to real filter IDs from `lib/constants/categories.ts` (`womens`, `mens`, `kids`, …)
- **Per locale:** slug, title, description, H1, intro, seoText, FAQ (5 items)
- **Index policy:** `noindex_if_empty`, `minVendorsToIndex: 1`, `sitemapEnabled: true` (sitemap wiring deferred to Stage 2C)
- **Related categories:** 4–6 cross-links per category in manifest

### RU slugs (sample)

| Main ID | RU slug |
|---------|---------|
| `womens` | `zhenskaya-odezhda-optom` |
| `mens` | `muzhskaya-odezhda-optom` |
| `footwear` | `obuv-optom` |
| `packaging-retail` | `upakovka-torgovoe-oborudovanie` |

Full list: 15 RU URLs under `/ru/categories/…` (see smoke section).

## Localized slug strategy

- **RU:** SEO slugs from TZ (Cyrillic transliteration, `-optom` suffix where specified)
- **KK / UZ:** Kazakh / Uzbek transliterations (temporary, not Russian copy)
- **KG / TJ:** Kyrgyz / Tajik slugs and copy — **needs native review** (marked in manifest; e.g. `ayaldar-kiyimi-dung`, `libosi-zanona-yaklukht`)
- **Hreflang tags:** `ru`, `kk`, `ky` (for `/kg`), `uz`, `tg` (for `/tj`), `x-default` → RU URL
- **URL segments** remain `kg` / `tj`; only hreflang language codes use `ky` / `tg`

## Canonical / hreflang strategy

- **Core landings:** same path across locales → `buildPageMetadata` + `hreflangAlternatesForPath`
- **Category pages:** localized slug per locale → `buildSeoCategoryMetadata` + `hreflangAlternatesFromLocalePaths(seoCategoryPathsByLocale(route))`
- **Canonical:** self-referencing absolute URL per locale/slug
- **Titles:** no embedded `| Dordoi.help` (layout template adds suffix once)
- **Category robots (Stage 2A):** `noindex, follow` for `noindex_if_empty` until vendor-count indexing is implemented in Stage 2B

## Core routes created

| Path | Locales |
|------|---------|
| `/rynok-dordoi` | ru, kk, kg, uz, tj |
| `/dordoi-optom` | ru, kk, kg, uz, tj |
| `/kargo-dordoi` | ru, kk, kg, uz, tj |

**Potential new URLs:** 15 categories × 5 locales = **75** + 3 core × 5 = **15** → **90** total (indexing/sitemap TBD in 2B/2C).

## Intentionally deferred

| Item | Stage |
|------|-------|
| Real filtered vendor grid on category pages | 2B |
| Category badge links on catalog cards | 2B |
| Vendor profile category breadcrumb | 2B |
| Sitemap integration for categories/core | 2C |
| Footer / home internal linking blocks | 2C |
| KG/TJ native copy polish | 2D |
| Vendor H1 rewrite, legacy slug noindex | 3 |

## Checks

### `npx tsc --noEmit`

Pass (exit 0).

### `npm run build`

Pass (exit 0). Static generation: **205** pages (includes 75 category + 15 core locale variants).

### HTML smoke (localhost dev)

| Check | Result |
|-------|--------|
| 18 RU URLs (3 core + 15 categories) | 200 |
| `/ru/categories/random-fake-category` | 404 |
| `/ru/random-fake-seo-page` | 404 |
| Title duplication | Single `\| Dordoi.help` on sample pages |
| Category `robots` | `noindex, follow` (expected for 2A skeleton) |
| Core `robots` | `index, follow` |
| Canonical | Self URL on sample pages |
| H1 | Matches manifest RU H1 |

**Note:** `hreflang` link tags are set via Next.js `metadata.alternates.languages`; they may not appear in a simple `hreflang=` string grep on dev HTML stream. Verify via view-source / production head after deploy.

### Privacy grep (new route + manifest source)

No matches in `app/[locale]/categories`, `lib/catalog/seo-category*.ts`, `lib/seo/core-seo-landings.ts`, `components/seo/SeoCategoryLanding.tsx`, `components/seo/SeoCoreLanding.tsx` for:

`instagram.com`, `t.me`, `wa.me`, `tel:`, `telephone`, `sameAs`

Sitewide layout may still contain non-vendor `instagram.com` references in shared chrome (pre-existing).

## Git status (end of Stage 2A)

Modified/untracked Stage 2A work only in new files above + `lib/hreflang.ts`.

**Not included (unchanged untracked junk):** `.sync-*`, `backups/`, `tmp-*`, media logs, old audit CSVs, unrelated scripts.

## Commit / push

Not performed — awaiting final approve.
