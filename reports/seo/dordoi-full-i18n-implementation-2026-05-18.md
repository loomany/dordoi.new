# Dordoi.help Full i18n Implementation Report

Date: 2026-05-18

## Implemented

- Added `npm run seo:i18n:full` via `scripts/seo/smoke-dordoi-i18n-full.ts`.
- Generated full route inventories and crawl reports for 389 routes.
- Fixed public static translation leaks in header, footer, home SEO links, blog guide related links, growth landing breadcrumbs/FAQ, AI answer blocks, catalog schema, and locked supplier profile coarse location/MOQ fallback.
- Added missing `Footer.seoCategories.underwear-swim` translations in `ru`, `kk`, `kg`, `uz`, `tj`.
- Kept vendor privacy contract intact: no private phone/social/map/exact location fields are sent by locked supplier pages.

## Files Changed By Implementation

- `app/[locale]/page.tsx`
- `app/[locale]/buyers/page.tsx`
- `app/[locale]/catalog/page.tsx`
- `components/layout/SiteHeader.tsx`
- `components/layout/SiteFooter.tsx`
- `components/provider/DatabaseProviderProfileView.tsx`
- `components/seo/HomeSeoGrowthLinks.tsx`
- `components/seo/SeoGrowthLandingPage.tsx`
- `components/seo/BlogGuidePage.tsx`
- `lib/seo/ai-answer-content.ts`
- `lib/seo/stage4-localized-content.ts`
- `messages/*.json`
- `scripts/seo/smoke-dordoi-i18n-full.ts`
- `package.json`

## Not Changed

No auth, payments, Lemon Squeezy, Supabase RLS, database migrations, checkout, pricing, subscription, or admin logic was changed.

## Remaining Translation Risk

DB-backed public supplier/store names and some imported descriptions can remain source-language content. This needs a future approved DB/content localization pipeline; no DB write was performed.

