# Dordoi.help Stage 2 final review + vendor profile description fix

Date: 2026-05-17  
Mode: small scoped fix + review/check  
Commit/push: not performed

## Final verdict

Ready for commit/deploy after review.

The vendor profile description mismatch is fixed. The profile page now uses the same safe public description source as catalog cards, removes the old technical fallback from the visible "О поставщике" block, and keeps exact vendor location hidden in locked state.

## Description mismatch root cause

Catalog cards use:

- `buildCatalogCardSourceRowForPublishedVendor(...)`
- `vendorToCatalogCardSource(...)`
- `getAiCatalogDisplayOverlay(vendor.parsed_ai_data, locale)`
- final UI field: `cardRow.display.description`

Profile pages already built `cardRow`, but for locked state that row was built from `publicVendor`. Stage 1 correctly removes `parsed_ai_data` from `publicVendor` to keep raw AI payloads out of RSC/client serialization, so the profile could lose the same AI description that catalog cards still show. The previous "О поставщике" logic then fell back to raw vendor fields:

- `description`
- `description_detail`

Those raw fields can contain old technical fragments such as "Собственное производство", "Оптовая точка", exact location fragments, and repeated text.

## Fix implemented

Added:

- `lib/catalog/vendor-public-description.ts`
- `lib/catalog/vendor-public-description.test.ts`

Updated:

- `components/provider/DatabaseProviderProfileView.tsx`
- `lib/sitemap/build-core-sitemap-xml.ts`

Profile page now uses:

- a server-only card row built from the original vendor only to extract the sanitized public description string.
- `cardRow.display.description` semantics as the primary source, matching catalog card behavior.
- `buildSafeVendorPublicDescription(...)` as a safe normalizer/fallback.
- Safe fallback when card description is absent:
  - `Поставщик работает на рынке Дордой и предлагает оптовые товары в категории «...».`
  - or generic selected-category fallback.

The "О поставщике" block now renders one paragraph from this source, so the old raw technical description is not duplicated.

## Location privacy

Locked state:

- exact `location_row` is not rendered.
- profile header shows only coarse location: `Рынок Дордой, Бишкек`.
- exact private fragments checked and not found:
  - `232/17`
  - `3пр`
  - `Гоголя 191`

Unlocked state:

- exact location can still be shown if the existing business logic grants access.

## Sitemap cache fix

During final production-like check, page canonical was correct with `NEXT_PUBLIC_APP_URL=https://dordoi.help`, but `/sitemaps/core.xml` still served cached `localhost` URLs.

Fix:

- `lib/sitemap/build-core-sitemap-xml.ts`
- cache key changed to include `baseUrl()`:
  - `["sitemap-core-xml-v3", root]`

Final production-like check:

- about canonical: `https://dordoi.help/ru/about`
- sitemap core HTTP: 200
- `localhostHits=0`
- `dordoiHits=1540`

## Git status / diff review

Command run:

```powershell
git status --short
git diff --stat
```

Diff stat:

```text
23 files changed, 626 insertions(+), 318 deletions(-)
```

### A. Stage 1 privacy files

These are still part of the working tree from Stage 1 and should stay in the commit if the Stage 1 fix has not been committed separately:

- `app/[locale]/categories/[categorySlug]/page.tsx`
- `app/[locale]/suppliers/[seoSlug]/page.tsx`
- `components/provider/DatabaseProviderProfileView.tsx`
- `components/provider/VendorContactActions.tsx`
- `lib/catalog/catalog-vendor-access.ts`
- `lib/catalog/vendor-local-business-jsonld.ts`
- `lib/catalog/vendor-local-business-jsonld.test.ts`
- `lib/catalog/vendor-privacy.ts`
- `lib/catalog/vendor-privacy-types.ts`
- `lib/catalog/vendor-privacy.test.ts`
- `reports/seo/dordoi-stage-1-p0-supplier-privacy-fix-2026-05-16.md`

### B. Stage 2 SEO files

- `app/[locale]/about/page.tsx`
- `app/[locale]/buyer-service/page.tsx`
- `app/[locale]/buyers/page.tsx`
- `app/[locale]/catalog/page.tsx`
- `app/[locale]/faq/page.tsx`
- `app/[locale]/page.tsx`
- `app/[locale]/sell/page.tsx`
- `app/[locale]/suppliers/page.tsx`
- `app/[locale]/blog/`
- `app/[locale]/dordoi-kazakhstan/`
- `app/[locale]/dordoi-kyrgyzstan/`
- `app/[locale]/dordoi-russia/`
- `app/[locale]/dordoi-tajikistan/`
- `app/[locale]/dordoi-uzbekistan/`
- `app/[locale]/for-buyers/`
- `app/[locale]/for-sellers/`
- `app/[locale]/how-it-works/`
- `app/llms.txt/`
- `components/layout/SiteFooter.tsx`
- `components/layout/SiteHeader.tsx`
- `components/seo/BlogGuidePage.tsx`
- `components/seo/BlogHubPage.tsx`
- `components/seo/HomeSeoGrowthLinks.tsx`
- `components/seo/SafePageSchemaJsonLd.tsx`
- `components/seo/SeoCategoryLanding.tsx`
- `components/seo/SeoCoreLanding.tsx`
- `components/seo/SeoGrowthLandingPage.tsx`
- `components/seo/SiteBrandJsonLd.tsx`
- `lib/catalog/catalog-page-seo.ts`
- `lib/seo.ts`
- `lib/seo/stage2-content.ts`
- `next.config.ts`
- `reports/seo/dordoi-stage-2-seo-growth-foundation-2026-05-16.md`

### C. Vendor profile description fix files

- `components/provider/DatabaseProviderProfileView.tsx`
- `lib/catalog/vendor-public-description.ts`
- `lib/catalog/vendor-public-description.test.ts`
- `lib/sitemap/build-core-sitemap-xml.ts`

### D. Unrelated / exclude from commit unless intentionally needed

These were present as untracked files and should not be included in the Stage 2 commit unless separately reviewed:

- `exports/`
- `lib/dordoi/analytics/utmTelegramDisplay.ts`
- `reports/ai-pending-moderation-run-live.log`
- `reports/ai-pending-moderation-run.log`
- `reports/catalog-slug-instagram-audit.json`
- `reports/catalog-subtitle-category-audit.json`
- `reports/household-category-audit.json`
- `reports/i18n-audit-skip-live.json`
- `reports/i18n-full-latest.json`
- `reports/i18n-full-round-1.json`
- `reports/i18n-full-round-2.json`
- `reports/i18n-full-run.log`
- `reports/i18n-live-latest.json`
- `reports/i18n-live-run.log`
- `reports/no-ig-phone-telegram-all.tsv`
- `reports/no-ig-phone-telegram-pending.tsv`
- `reports/pending-instagram-urls.txt`
- `reports/sitemap-core.xml`
- `reports/sitemap-vendors-1.xml`
- `reports/sitemap.xml`

## Env readiness checklist

Production build/deploy must use:

- `NEXT_PUBLIC_SITE_INDEXABLE=true`
- `NEXT_PUBLIC_APP_URL=https://dordoi.help`

Do not rely on `.env.local` defaults for production SEO. These env values were not changed in files.

## Route checks

Production-like local server with `NEXT_PUBLIC_SITE_INDEXABLE=true` returned HTTP 200:

- `/ru`
- `/ru/catalog`
- `/ru/suppliers`
- `/ru/about`
- `/ru/how-it-works`
- `/ru/faq`
- `/ru/for-buyers`
- `/ru/for-sellers`
- `/ru/dordoi-kazakhstan`
- `/ru/dordoi-uzbekistan`
- `/ru/dordoi-tajikistan`
- `/ru/dordoi-russia`
- `/ru/dordoi-kyrgyzstan`
- `/ru/blog`
- `/ru/blog/kak-nayti-postavshchika-dordoi`
- `/ru/blog/kargo-dordoi-kak-rabotaet-dostavka`
- `/ru/blog/kak-kupit-optom-na-dordoe`
- `/llms.txt`

Redirects:

- `/ru/dordoi-market` -> 301 `/ru/rynok-dordoi`
- `/ru/wholesale` -> 301 `/ru/dordoi-optom`
- `/ru/cargo` -> 301 `/ru/kargo-dordoi`

SEO signals checked on route crawl:

- canonical present on HTML pages
- robots `index, follow` with production-like indexable env
- title present
- description present
- H1 present
- hreflang present on localized HTML pages
- JSON-LD present where expected

Note: `/llms.txt` is a plain text file; no canonical/H1/JSON-LD expected.

## Query-param check

Checked:

- `/ru/catalog?search=test&utm_source=x&gclid=abc`

Result:

- HTTP 200
- canonical: `/ru/catalog`
- robots: `noindex, follow`

## Sitemap checks

Checked:

- `/sitemap.xml`
- `/sitemaps/core.xml`

Results:

- HTTP 200
- sitemap index contains core sitemap
- new Stage 2 URLs present
- redirect aliases absent from final sitemap URLs
- no missing new routes
- final production-like build/check:
  - `localhostHits=0`
  - `dordoiHits=1540`

## Privacy regression checks

Checked URLs:

- `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`
- `/ru/categories/zhenskaya-odezhda-optom`
- `/ru/suppliers/asso-corsets`

Strict pattern:

```text
https?://wa\.me/[A-Za-z0-9_+%-]+|tel:\+?[0-9][0-9()\-\s]{5,}|https?://t\.me/[A-Za-z0-9_+-]{3,}|https?://(?:www\.)?instagram\.com/[A-Za-z0-9_.-]{2,}|telephone|sameAs|phone_number|whatsapp_1|whatsapp_2|telegram_url|instagram_url|google_maps_uri|two_gis_uri|yandex_maps_uri|primaryWhatsapp|secondaryWhatsapp|telegramHref|instagramHref|telHref|twoGisHref|LocalBusiness|streetAddress
```

Result:

- all strict matches empty
- exact location matches empty
- locked buttons remain available through `VendorContactActions`
- no real vendor phone/WhatsApp/Telegram/Instagram/map URLs found

Additional profile content check:

- `/ru/suppliers/muhsina-kg`: `Компания занимается`: found
- `/ru/suppliers/muhsina-kg`: `Поставщик работает на рынке Дордой`: not found
- `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`: `Поставщик работает на рынке Дордой`: not found
- `Рынок Дордой, Бишкек`: found
- `Собственное производство`: not found
- `Оптовая точка`: not found
- `232/17`: not found
- `3пр`: not found
- `Гоголя 191`: not found

## Tests/build results

Passed:

```powershell
npx.cmd tsc --noEmit
```

Passed:

```powershell
$tests = rg --files -g "*.test.ts" -g "*.test.tsx"; node --test --import tsx $tests
```

Result:

- 68 tests passed
- 0 failed

Passed:

```powershell
npm.cmd run build
```

Also passed production-like build:

```powershell
NEXT_PUBLIC_SITE_INDEXABLE=true
NEXT_PUBLIC_APP_URL=https://dordoi.help
npm.cmd run build
```

Note: first production-like build attempt inside the restricted sandbox failed fetching Google Fonts; rerun with approved network access passed.

## Commit preparation

No commit was created and no push was performed.

Suggested commit message:

```text
feat(seo): add AI-ready SEO growth foundation
```

Before committing, stage only the Stage 1 + Stage 2 + description-fix files listed above, and exclude unrelated reports/exports unless intentionally needed.
