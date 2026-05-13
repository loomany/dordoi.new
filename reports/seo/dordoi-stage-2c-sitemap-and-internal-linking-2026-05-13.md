# Stage 2C — Sitemap + Footer/Home/Catalog Internal Linking

**Date:** 2026-05-13  
**Base commit:** `6f55c04` — feat(seo): add category vendor grids and index policy  
**Commit/push:** not done (awaiting review/approval)

## Changed files

| File | Change |
|------|--------|
| `lib/sitemap-xml-body.ts` | Async builder; core landings + indexable categories |
| `lib/catalog/seo-category-sitemap.ts` | **new** — vendor count + indexable filter for sitemap |
| `app/sitemap.xml/route.ts` | `await buildSitemapXmlBody()` |
| `lib/seo/seo-internal-links.ts` | **new** — hub/category ID constants + link resolver |
| `components/seo/SeoInternalLinkList.tsx` | **new** — reusable crawlable link list |
| `components/layout/SiteFooter.tsx` | SEO blocks «Дордой» + «Категории» |
| `components/catalog/CatalogPopularCategories.tsx` | **new** — catalog popular categories nav |
| `components/catalog/CatalogBrowseLayout.tsx` | Mount popular categories block |
| `components/landing/HomePopularSectionsBlock.tsx` | **new** — home hub + category links |
| `components/landing/LandingSections.tsx` | Insert popular sections before CTA band |
| `messages/{ru,kk,kg,uz,tj}.json` | Footer SEO labels, home/catalog popular copy |

## Sitemap changes

### Core SEO landings (15 URLs)

Added for all 5 locales with `hreflangAlternatesForPath`:

- `/rynok-dordoi`
- `/dordoi-optom`
- `/kargo-dordoi`

### Category pages (up to 75 URLs)

Added when:

- `sitemapEnabled === true`
- `indexPolicy !== "noindex"`
- `vendorCount >= minVendorsToIndex`
- `siteIndexable()` true

Hreflang uses **localized slugs** via `hreflangAlternatesFromLocalePaths` + `seoCategoryPathsByLocale` (`ky`/`tg`, not `kg`/`tj`).

### Tradeoff — vendor counts

`getIndexableSeoCategoriesForSitemap()` runs **15 parallel** `fetchPublishedVendorsCatalogPage({ pageSize: 1 })` calls per sitemap request (one per manifest category). No DB schema change; no React.cache (sitemap route is outside RSC tree). Acceptable for low-frequency crawler hits; could add short TTL server cache later if needed.

### URL counts

| | Count |
|--|--|
| **Before** (13 `publicRoutes` × 5 locales) | **65** |
| **After** (public + 15 core + 75 category) | **155** |
| **New SEO URLs** | **+90** |

Smoke: all **15** categories indexable → **75** category sitemap entries (×5 locales).

## Core landing sitemap (confirmed)

- `/ru/rynok-dordoi` ✓
- `/ru/dordoi-optom` ✓
- `/ru/kargo-dordoi` ✓

## Category sitemap (confirmed)

- `/ru/categories/zhenskaya-odezhda-optom` ✓
- `/ru/categories/obuv-optom` ✓
- `/ru/categories/sumki-kozhgalantereya-optom` ✓

## Sitemap exclusions (confirmed)

Absent: `?cat=`, `?page=`, `?search=`, `?sort=`, `?compare=`, `instagram.com`, `t.me`, `wa.me`, `tel:`, `undefined`, `null`, `hreflang="kg"`, `hreflang="tj"`.

Present: `hreflang="ky"`, `hreflang="tg"`, `x-default` → `/ru`.

**Note:** `localhost` appears in `<loc>` on local dev because `baseUrl()` reflects the dev host; production sitemap uses the production domain.

## Footer links

**«Дордой»** (locale-aware): catalog, suppliers, rynok-dordoi, dordoi-optom, buyers, kargo-dordoi.

**«Категории»** (top 8): womens, mens, kids, footwear, bags-leather, fabrics-notions, home-textiles, accessories → `/categories/{localized-slug}`.

## Home links

Block **«Популярные разделы»** before CTA band:

- Hubs: catalog, suppliers, rynok-dordoi, dordoi-optom, kargo-dordoi
- Categories: womens, footwear, bags-leather

All verified as crawlable `<Link>` hrefs in `/ru` HTML.

## Catalog links

**«Популярные категории на Дордое»** under catalog header — 8 category links to `/categories/...` (no `?cat=`).

## Hreflang / canonical validation

Sample `/ru/categories/zhenskaya-odezhda-optom`:

- `canonical`: locale category URL ✓
- `robots`: `index, follow` ✓
- `<link rel="alternate" hreflang="…">`: `ru`, `kk`, `ky`, `uz`, `tg`, `x-default` ✓

Category sitemap entries include matching `xhtml:link` alternates with localized paths.

## Privacy grep

Pages: `/ru`, `/ru/catalog`, `/ru/categories/*`, core landings.

| Pattern | Rendered vendor leak? |
|---------|------------------------|
| `instagram.com`, `whatsapp`, `telegram` in HTML source | Only in **next-intl JS message bundles** (cabinet/vendor-ai placeholders), not in visible vendor cards or JSON-LD |
| `t.me/`, `wa.me`, `tel:`, `sameAs` | Not found in public page context |
| Vendor profile direct social/phone in grids | None observed |

## Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | pass |
| `npm run build` | pass |
| HTTP 200 (listed URLs + `/sitemap.xml`) | pass |
| Footer / home / catalog links in HTML | pass |

## Remaining risks

1. **Sitemap build cost** — 15 Supabase count queries per `/sitemap.xml` request on cold path. Acceptable for now if sitemap is cached/revalidated and queries stay lightweight (`pageSize: 1`).
2. **Stage 3/4** — consider cached category indexability snapshot or longer sitemap revalidate if sitemap traffic grows.
3. **KG/TJ/KK/UZ copy** — footer/home/catalog labels are functional but not copy-reviewed (Stage 2D).
4. **Vendor title `| Dordoi.help` duplication** — still deferred to Stage 3.
5. **i18n bundle noise** — `instagram`/`telegram` strings in client bundles may still match naive greps; not a public vendor contact leak.

## Final git status

Tracked modifications + new Stage 2C files only (see table above). **Do not commit:** `.sync-*`, `backups/`, `tmp-*`, `sync-all-media-*.log`, unrelated audit CSVs/reports, `scripts/fix-div.mjs`, `scripts/precommit-seo-review.mjs`, `scripts/seo-stage1-html-check.mjs`.

**Commit/push not done.**
