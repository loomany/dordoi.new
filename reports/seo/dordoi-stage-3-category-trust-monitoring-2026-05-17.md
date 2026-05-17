# Dordoi.help Stage 3 - Category, Trust, Monitoring

Date: 2026-05-17
Mode: scoped SEO implementation
Commit/push: not performed

## Pre-check

- Start branch/worktree: `main`, clean before Stage 3.
- Previous SEO/privacy work already committed: `61f8ece feat(seo): add AI-ready SEO growth foundation`.
- Production env required for deploy:
  - `NEXT_PUBLIC_SITE_INDEXABLE=true`
  - `NEXT_PUBLIC_APP_URL=https://dordoi.help`
- Pre-check locked privacy grep: passed for catalog, category and supplier pages.

## Category Pages Strengthened

The existing SEO category routes were reused. No new duplicate category URLs were created.

Updated top commercial category content:

- `/ru/categories/zhenskaya-odezhda-optom`
- `/ru/categories/muzhskaya-odezhda-optom`
- `/ru/categories/detskaya-odezhda-optom`
- `/ru/categories/obuv-optom`
- `/ru/categories/tkani-shveynaya-furnitura-optom`
- `/ru/categories/sumki-kozhgalantereya-optom`
- `/ru/categories/nizhnee-bele-kupalniki-optom`
- `/ru/categories/tekstil-dlya-doma-optom`
- `/ru/categories/aksessuary-optom`

What changed:

- Added category-specific RU intro content.
- Added richer SEO paragraphs for commercial intent.
- Added visible blocks:
  - `Что можно найти в категории`
  - `Как выбрать поставщика`
- Added 6 visible FAQ items per top category.
- Existing safe schema remains:
  - `CollectionPage`
  - `FAQPage`
  - safe `ItemList` only from accessible/safe vendors.
- Existing index policy remains:
  - clean category pages can index when category has enough vendor content.
  - empty/weak categories stay controlled by `noindex_if_empty`.
- Footer internal links now include the top 9 commercial category routes.

Privacy status:

- No phone/WhatsApp/Telegram/Instagram/map/private field is added to category content.
- No exact `location_row`, container, row, phone or map URL is added.
- Locked vendor contacts are not exposed by the category copy or schema.

## Trust Blocks Added

Added reusable Stage 3 trust content for:

- `/ru/about`
- `/ru/how-it-works`
- `/ru/faq`
- `/ru/for-buyers`
- `/ru/for-sellers`
- `/ru/buyer-service`
- `/ru/kargo-dordoi`

Trust topics added:

- What is visible for free.
- What opens after access.
- How Dordoi.help protects seller contacts.
- Why contacts are gated.
- How to use a buyer safely.
- How to use cargo without unrealistic guarantees.
- What Dordoi.help does not guarantee.
- Dordoi.help is not the seller of goods and not a single cargo operator.

Schema:

- FAQ schema is generated only from visible FAQ items.
- No fake reviews, ratings, Product schema, or locked vendor `LocalBusiness` schema were added.

## Monitoring Checklist

Created:

- `reports/seo/dordoi-stage-3-monitoring-checklist-2026-05-17.md`

Includes:

- Google Search Console checklist.
- Yandex Webmaster checklist.
- Weekly SEO metrics.
- Server/log checks.
- Privacy grep policy.
- 2-4 week decision rules.

## Smoke Script

Created:

- `scripts/seo/smoke-dordoi-seo.ts`

Package script:

- `npm run seo:smoke:dordoi`

Checks covered:

- 301 redirects for aliases.
- `/llms.txt` status and privacy rule.
- `/sitemap.xml` and `/sitemaps/core.xml`.
- No localhost in sitemap.
- Stage 2 URLs and top category URLs in sitemap.
- Redirect aliases absent from sitemap.
- Query-param canonical/noindex policy.
- Locked supplier/category privacy grep.
- Top category status, canonical, H1, FAQ, JSON-LD and private-data grep.

Note:

- For sitemap presence checks, the app must be built and started with production SEO env:
  - `NEXT_PUBLIC_SITE_INDEXABLE=true`
  - `NEXT_PUBLIC_APP_URL=https://dordoi.help`

## Checks Run

### TypeScript

- Command: `npx.cmd tsc --noEmit`
- Result: passed.

### Build

- Command: `npm.cmd run build`
- Result: passed.

Production-env build also passed with temporary local process env:

- `NEXT_PUBLIC_SITE_INDEXABLE=true`
- `NEXT_PUBLIC_APP_URL=https://dordoi.help`

No env files were changed.

### SEO Smoke

Command:

- `BASE_URL=http://127.0.0.1:3005 npx.cmd tsx scripts/seo/smoke-dordoi-seo.ts`

Result after production-env build/start:

- `84/84 passed`

Important results:

- Redirects passed:
  - `/ru/dordoi-market -> /ru/rynok-dordoi`
  - `/ru/wholesale -> /ru/dordoi-optom`
  - `/ru/cargo -> /ru/kargo-dordoi`
- Sitemap passed:
  - `/sitemap.xml` 200
  - `/sitemaps/core.xml` 200
  - no localhost
  - Stage 2 URLs present
  - top category route present
  - redirect aliases absent
- Query-param policy passed:
  - `/ru/catalog?search=test&utm_source=x&gclid=abc` returns 200
  - canonical to `/ru/catalog`
  - robots `noindex, follow`
- Privacy grep passed:
  - `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`
  - `/ru/categories/zhenskaya-odezhda-optom`
  - `/ru/suppliers/asso-corsets`
- Top category crawl passed:
  - 9/9 category pages returned 200.
  - Canonical present.
  - H1 present.
  - FAQ present.
  - JSON-LD present.
  - private-data grep empty.

### Trust Route Check

Checked:

- `/ru/about`
- `/ru/how-it-works`
- `/ru/faq`
- `/ru/for-buyers`
- `/ru/for-sellers`
- `/ru/buyer-service`
- `/ru/kargo-dordoi`

Result:

- HTTP 200 for all.
- Trust text present for all.
- FAQ schema present for all.
- Private-data grep empty for all.

### Relevant Tests

- No dedicated local `tests/` suite was found.
- Stage 3 verification used TypeScript, production build and the new SEO smoke script.

## Files Changed In Stage 3

Category content and rendering:

- `lib/catalog/seo-category-content.ts`
- `lib/catalog/seo-category-route-data.ts`
- `components/seo/SeoCategoryLanding.tsx`
- `lib/seo/seo-internal-links.ts`

Trust content and rendering:

- `lib/seo/stage3-trust-content.ts`
- `components/seo/Stage3TrustSections.tsx`
- `components/seo/SeoGrowthLandingPage.tsx`
- `components/seo/SeoCoreLanding.tsx`
- `app/[locale]/buyer-service/page.tsx`

Monitoring and smoke:

- `reports/seo/dordoi-stage-3-monitoring-checklist-2026-05-17.md`
- `scripts/seo/smoke-dordoi-seo.ts`
- `package.json`

## Remaining Risks

- Stage 3 category/trust additions are RU-first. Stage 4 must localize kk/kg/uz/tj.
- Sitemap checks depend on production env being set during build and start.
- Category indexability still depends on vendor count/content. Empty categories should remain `noindex_if_empty`.
- New trust copy should be reviewed by business/legal if stronger guarantees are ever desired.
- No fake ratings/reviews were added; future review schema should wait for real verified reviews.

## Next Step - Stage 4

Proceed to localization:

- audit kk/kg/uz/tj routes;
- create localization glossary;
- localize priority pages first;
- verify hreflang/canonical/schema language;
- keep vendor contacts private.
