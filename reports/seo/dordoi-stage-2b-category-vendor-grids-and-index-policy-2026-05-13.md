# Stage 2B — Category Vendor Grids + Index Policy + Card Category Links

Date: 2026-05-13  
Base commits: `d29a68e` (Stage 1), `4a9b1a6` (Stage 2A)  
Commit/push: **not done** (awaiting approve)

## Summary

Stage 2B connects SEO category pages to the real catalog: vendors are fetched by `sourceCategoryIds`, up to 12 cards are shown, robots become `index,follow` when `totalCount >= minVendorsToIndex`, and catalog card subtitles link to `/categories/{localized-slug}` instead of query filters. Vendor profile breadcrumbs now include an SEO category crumb when mappable.

## Changed files

| File | Change |
|------|--------|
| `lib/catalog/seo-category-vendors.ts` | **new** — cached vendor fetch for category pages + metadata |
| `lib/catalog/seo-category-metadata.ts` | Dynamic robots from `vendorCount` |
| `lib/catalog/seo-category-routes.ts` | `resolveSeoCategoryHrefForMainId`, `resolveSeoCategoryHrefForVendorCategories` |
| `lib/catalog/published-vendors.ts` | `categoryHref` on `CatalogCardSourceRow` |
| `lib/seo/seo-page-labels.ts` | Empty vs with-vendors preview copy |
| `app/[locale]/categories/[categorySlug]/page.tsx` | Fetch vendors, build cards, pass grid + count to metadata |
| `components/seo/SeoCategoryLanding.tsx` | Vendor grid section, wider layout for cards |
| `components/catalog/CatalogCard.tsx` | `categoryHref` — subtitle links outside profile anchor |
| `components/catalog/CatalogBrowseCardGrid.tsx` | Pass `categoryHref` to cards |
| `components/provider/DatabaseProviderProfileView.tsx` | Breadcrumb SEO category link |

## How vendor filtering works

1. SEO manifest `sourceCategoryIds` holds catalog main IDs (`womens`, `footwear`, …).
2. `getSeoCategoryVendorPageData(route)` calls existing `fetchPublishedVendorsCatalogPage({ subcategorySlugs: sourceCategoryIds, pageSize: 12 })`.
3. Supabase filter uses `catalogCategoryOverlapTokens()` → `overlaps("categories", tokens)` (same as `/catalog?cat=`).
4. Vendor `categories` column stores RU labels / main slugs; `normalizeVendorCategoryMainSlugs()` maps to main IDs for card subtitles and href resolution.
5. `React.cache` dedupes fetch between `generateMetadata` and page render per request.

**Count limitation:** `totalCount` comes from Supabase `count: "exact"` on the filtered query (accurate). Grid shows max 12 cards; index policy uses full `totalCount`, not visible card count.

## Index / noindex table (RU smoke, 2026-05-13)

| Category ID | RU slug | Vendors (approx) | Robots |
|-------------|---------|------------------|--------|
| womens | zhenskaya-odezhda-optom | ≥1 | index, follow |
| mens | muzhskaya-odezhda-optom | ≥1 | index, follow |
| kids | detskaya-odezhda-optom | ≥1 | index, follow |
| underwear-swim | nizhnee-bele-kupalniki-optom | ≥1 | index, follow |
| footwear | obuv-optom | ≥1 | index, follow |
| bags-leather | sumki-kozhgalantereya-optom | ≥1 | index, follow |
| accessories | aksessuary-optom | ≥1 | index, follow |
| fabrics-notions | tkani-shveynaya-furnitura-optom | ≥1 | index, follow |
| home-textiles | tekstil-dlya-doma-optom | ≥1 | index, follow |
| beauty | kosmetika-parfyumeriya-uhod-optom | ≥1 | index, follow |
| toys-children | igrushki-tovary-dlya-detey-optom | ≥1 | index, follow |
| electronics | elektronika-mobilnye-aksessuary-optom | ≥1 | index, follow |
| packaging-retail | upakovka-torgovoe-oborudovanie | ≥1 | index, follow |
| household | tovary-dlya-doma-hoztovary-optom | ≥1 | index, follow |
| sports-outdoors | sport-turizm-otdyh-optom | ≥1 | index, follow |

**No categories remain `noindex,follow` in current data.** Empty categories would stay `noindex,follow` per `noindex_if_empty` + `vendorCount < minVendorsToIndex` (default 1).

## Category badge links

- `buildCatalogCardSourceRowForPublishedVendor` sets `categoryHref` via `resolveSeoCategoryHrefForVendorCategories(categories, locale)`.
- `CatalogCard` renders subtitle as `<Link href={categoryHref}>` with `stopPropagation` (not nested inside profile link).
- `/ru/catalog` smoke: 12+ `/ru/categories/...` hrefs, **0** `?cat=` badge links.
- Profile category pills unchanged (text only); **breadcrumb** adds linked category crumb when manifest mapping exists.

## Vendor profile breadcrumb

**Added:** Home / Catalog / {SEO category H1} / {vendor title leaf}  
Uses `resolveSeoCategoryForMainId` + `seoCategoryPath`. Vendor H1 unchanged.

## Privacy grep

New/changed public paths checked — no `instagram.com`, `t.me`, `wa.me`, `tel:`, `telephone`, `sameAs` in category page content or card subtitle links.

Pre-existing: vendor profile `storeMetaTitleTemplate` may still duplicate `| Dordoi.help` (Stage 3).

## Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | Pass |
| `npm run build` | Pass |
| Sample category URLs | 200, vendor cards visible |
| `/ru/categories/random-fake-category` | 404 |
| Title duplication (categories) | 1× suffix |
| Canonical | Self URL |
| Sitemap | Not changed (Stage 2C) |

## Remaining risks / Stage 2C+

- Sitemap does not yet include indexable category URLs.
- Footer/home internal linking not added.
- KG/TJ copy still needs native review.
- Category pills on vendor profile not linked (breadcrumb only).
- Vendor H1 / legacy slug noindex → Stage 3.

## Git status

Modified + new Stage 2B files only; untracked junk unchanged. **Commit not done.**
