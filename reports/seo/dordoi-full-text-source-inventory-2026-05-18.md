# Dordoi.help Full Text Source Inventory

Date: 2026-05-18

## Scope

Audited public text sources for RU/KK/KG(KY)/UZ/TJ(TG) pages, metadata, schema, sitemap-facing labels, AI answer blocks, locked vendor UI, and blog/category SEO content. Auth, payments, Lemon Squeezy, RLS, DB writes, checkout, pricing, and admin logic were not changed.

## Static Sources Audited

- `messages/*.json`: navigation, footer, public pages, catalog UI, vendor profile UI, empty states, contact/support/legal copy.
- `app/[locale]/**`: public page routes, metadata entry points, catalog/supplier/category/blog pages.
- `components/layout/*`: header/footer/language navigation.
- `components/seo/*`: landing pages, blog hub/guide pages, category blocks, AI answer blocks, schema renderers.
- `components/provider/*`: locked supplier profile UI, safe location and contact actions.
- `lib/seo/*.ts`: Stage 2/3/4/5 content, localized guide slugs, localized copy helpers, AI answer content.
- `lib/catalog/*.ts`: SEO category routes/content, vendor privacy helpers, public vendor card/profile description helpers.
- `app/llms.txt/route.ts`, `app/robots.ts`, sitemap generators.

## Findings Fixed

- Footer category key `Footer.seoCategories.underwear-swim` was missing in all locale files and could render as a raw key. Added translations for all locales.
- Header nav labels were hardcoded RU on non-RU pages. They now use the existing localized link label helper.
- Home SEO link block had hardcoded RU group titles and link labels. It now receives locale and localizes link groups.
- Blog guide related-link heading was hardcoded RU. It now uses localized `usefulLinks` copy.
- Growth landing breadcrumbs/FAQ heading had hardcoded RU labels. They now use localized Stage 4 copy.
- AI answer block link labels and generic core landing answer text were RU on localized pages. They now use localized content/link labels.
- Catalog CollectionPage schema name/description were RU-only. They now use localized SEO metadata.
- Locked vendor profile coarse location fallback was RU-only. It now localizes by route locale.
- Vendor FAQ min-order fallback could surface DB placeholder text such as `Не указано`; it now uses localized display fallback.

## Sources Still Requiring Future DB/Content Approval

Some catalog/category pages still contain Cyrillic public vendor names from DB-backed supplier records, for example store names such as `Ювелирный магазин`. These are public DB content/brand identity, not static UI fallback. They were not translated or rewritten because the task forbids DB writes and vendor identity changes need business approval.

