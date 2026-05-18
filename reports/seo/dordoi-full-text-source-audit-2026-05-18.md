# Dordoi.help Full Text Source Audit

Date: 2026-05-18

## Result

Static public UI/SEO text sources were audited and safe code/static-content fixes were implemented. No auth/payment/admin/RLS/database migration files were changed.

## Already Localized

- Blog hub and 34 guides across `ru`, `kk`, `kg` with `ky` hreflang, `uz`, `tj` with `tg` hreflang.
- Core SEO growth pages and country/category SEO content via Stage 4/5 modules.
- Metadata, canonical, hreflang, and sitemap URL generation for localized guide/category/core routes.

## Fixed In This Pass

- Header, footer, home SEO link groups, blog related links, growth page breadcrumbs/FAQ labels.
- Localized AI answer block links and generic localized answer text for core landing pages.
- Localized catalog schema name/description.
- Localized locked vendor profile coarse location and MOQ fallback.
- Added missing footer `underwear-swim` translations in all message files.
- Added full i18n crawl script: `scripts/seo/smoke-dordoi-i18n-full.ts`.

## Remaining Non-Static Text

DB-backed supplier/store names and some imported descriptions can be RU-only on localized catalog/category pages. They are reported as future DB/content localization work, not changed in this task.

## Validation Summary

- `npm run check:i18n`: passed.
- `npx tsc --noEmit`: passed.
- `node --test --import tsx lib/seo/dordoi-blog-localized.test.ts`: passed.
- `NEXT_PUBLIC_SITE_INDEXABLE=true NEXT_PUBLIC_APP_URL=https://dordoi.help npm run build`: passed, 435 static pages.
- `BASE_URL=http://127.0.0.1:3005 npm run seo:smoke:dordoi`: passed 585/585.
- `BASE_URL=http://127.0.0.1:3005 npm run seo:i18n:full`: passed 10/10 critical checks, crawled 389 routes.

