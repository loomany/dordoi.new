# Dordoi.help Final i18n/SEO Commit Review

Date: 2026-05-18
Mode: final review, clean commit readiness, deploy/indexation checklist

## Verdict

Ready for commit and deploy after owner approval.

The final multilingual i18n/SEO implementation passed local validation. No forbidden areas were changed, no env files were changed, no DB writes were performed, no external/OpenAI translation API was used, and no vendor private contact leak was detected in the sampled locked pages, sitemap output, or sampled localized blog pages.

## Git Status Summary

Working tree contains intended i18n/SEO/content/report changes only.

Forbidden-area check result:

- auth: not changed
- payments/Lemon Squeezy: not changed
- Supabase RLS/database migrations: not changed
- checkout/pricing/subscription/admin: not changed
- env/secrets: not changed
- raw DB exports/private contact dumps: not present

## Intended Files

### Full i18n implementation

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

### Static translation/message files

- `messages/ru.json`
- `messages/kk.json`
- `messages/kg.json`
- `messages/uz.json`
- `messages/tj.json`

### Smoke/check scripts

- `scripts/seo/smoke-dordoi-i18n-full.ts`
- `package.json`

### Reports

- `reports/seo/dordoi-full-route-i18n-inventory-2026-05-18.csv`
- `reports/seo/dordoi-full-multilingual-route-inventory-2026-05-18.csv`
- `reports/seo/dordoi-i18n-visible-crawl-2026-05-18.csv`
- `reports/seo/dordoi-i18n-full-crawl-2026-05-18.csv`
- `reports/seo/dordoi-hreflang-canonical-all-locales-2026-05-18.csv`
- `reports/seo/dordoi-db-localization-readonly-audit-2026-05-18.md`
- `reports/seo/dordoi-db-public-content-translation-audit-2026-05-18.md`
- `reports/seo/dordoi-full-text-source-audit-2026-05-18.md`
- `reports/seo/dordoi-full-text-source-inventory-2026-05-18.md`
- `reports/seo/dordoi-localization-glossary-full-2026-05-18.md`
- `reports/seo/dordoi-sitemap-all-locales-validation-2026-05-18.md`
- `reports/seo/dordoi-translation-pipeline-audit-2026-05-18.md`
- `reports/seo/dordoi-full-i18n-implementation-2026-05-18.md`
- `reports/seo/dordoi-full-i18n-final-validation-2026-05-18.md`
- `reports/seo/dordoi-final-i18n-seo-commit-review-2026-05-18.md`

## Excluded Files

No unrelated files were identified for exclusion.

The commit must not include temporary exports, raw logs, raw DB exports, env files, secrets, old sitemap dumps, or unrelated admin/auth/payment/database files.

## Checks Run

| Check | Result |
|---|---:|
| `npm run check:i18n` | Passed |
| `npx.cmd tsc --noEmit` | Passed |
| `node --test --import tsx lib/seo/dordoi-blog-localized.test.ts` | Passed, 4/4 tests |
| `NEXT_PUBLIC_SITE_INDEXABLE=true NEXT_PUBLIC_APP_URL=https://dordoi.help npm.cmd run build` | Passed |
| `BASE_URL=http://127.0.0.1:3005 npm run seo:smoke:dordoi` | Passed, 585/585 |
| `BASE_URL=http://127.0.0.1:3005 npm run seo:i18n:full` | Passed, 10/10 critical checks |
| Strict privacy grep | Passed |
| Reports/scripts raw private contact scan | Passed |

Known build note: Next.js middleware-to-proxy deprecation warning is unrelated and was not changed in this commit.

## Build Result

Production SEO build passed with `NEXT_PUBLIC_SITE_INDEXABLE=true` and `NEXT_PUBLIC_APP_URL=https://dordoi.help`.

Static generation count: 435 static pages.

## Route Inventory

- Full crawl/inventory routes: 389 rows
- Per-locale route count: `ru=77`, `kk=77`, `kg=77`, `uz=77`, `tj=77`

## Sitemap Status

Checked locally against `http://127.0.0.1:3005` with production SEO env.

- `/sitemap.xml`: HTTP 200
- `/sitemaps/core.xml`: HTTP 200
- Core sitemap URL count: 375
- URLs per locale in core sitemap: `ru=74`, `kk=74`, `kg=74`, `uz=74`, `tj=74`
- Localized guide URLs: 170
- No `localhost`
- No `127.0.0.1`
- Redirect aliases excluded
- Query URLs excluded
- Drafts/private/admin/auth/payment/API endpoints excluded

Confirmed present:

- `/ru/blog/dordoi-optom-polnyy-gid`
- `/kk/blog/dordoi-koterme-tolyk-nuskaulyk`
- `/kg/blog/dordoi-dununon-toluk-koldonmo`
- `/uz/blog/dordoy-ulgurji-toliq-qollanma`
- `/tj/blog/dordoi-yakluht-dasturi-purra`

Confirmed absent as noncanonical localized source slugs:

- `/kk/blog/dordoi-optom-polnyy-gid`
- `/kg/blog/dordoi-optom-polnyy-gid`
- `/uz/blog/dordoi-optom-polnyy-gid`
- `/tj/blog/dordoi-optom-polnyy-gid`

Confirmed absent redirect aliases:

- `/ru/dordoi-market`
- `/ru/wholesale`
- `/ru/cargo`

## Hreflang, Canonical, HTML Lang

Sample pages checked:

- `/ru/blog/dordoi-optom-polnyy-gid`
- `/kk/blog/dordoi-koterme-tolyk-nuskaulyk`
- `/kg/blog/dordoi-dununon-toluk-koldonmo`
- `/uz/blog/dordoy-ulgurji-toliq-qollanma`
- `/tj/blog/dordoi-yakluht-dasturi-purra`

Result:

- Self-canonical: passed
- `/ru` HTML lang: `ru`
- `/kk` HTML lang: `kk`
- `/kg` HTML lang: `ky`
- `/uz` HTML lang: `uz`
- `/tj` HTML lang: `tg`
- Hreflang includes `ru`, `kk`, `ky`, `uz`, `tg`, `x-default`
- No wrong `hreflang=kg`
- No wrong `hreflang=tj`
- Localized H1/title/description present on sampled pages

## Translation Coverage

Final i18n smoke result:

- 389 routes crawled
- 10/10 critical checks passed
- No missing translation keys detected in full crawl
- No visible `undefined`, `null`, `TODO`, `[object Object]`, or raw key leaks detected
- Header/footer localized on `kk`, `kg`, `uz`, `tj`
- Home SEO links localized
- Blog related link headings localized
- Growth page breadcrumbs/FAQ localized
- AI answer block links localized
- Catalog schema name/description localized
- Locked supplier coarse location fallback localized
- MOQ fallback localized

## DB Content Limitation

Known remaining limitation is accepted for this release:

DB-backed public vendor/store names and imported descriptions may remain source-language/Cyrillic on localized pages. This is not a static UI fallback. It requires a future approved DB/content localization pipeline and must not be changed in this task because DB writes and migrations are forbidden.

Recommended future plan:

- Add `public_description_i18n`
- Add `store_display_name_i18n` only with business approval
- Add localized category/vendor public terms where appropriate
- Build a privacy-safe read/write translation workflow
- Keep vendor private contact fields excluded from translation/export pipelines

## Privacy Status

Strict privacy grep passed for:

- `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`
- `/ru/categories/zhenskaya-odezhda-optom`
- `/ru/suppliers/asso-corsets`
- sampled localized blog page
- `/sitemaps/core.xml`

Pattern checked:

`wa\.me|tel:|t\.me/[A-Za-z0-9_+-]{3,}|instagram\.com/[A-Za-z0-9_.-]{2,}|phone_number|whatsapp_1|whatsapp_2|telegram_url|instagram_url|google_maps_uri|two_gis_uri|yandex_maps_uri|primaryWhatsapp|secondaryWhatsapp|telegramHref|instagramHref|telHref|twoGisHref|LocalBusiness|telephone|sameAs|streetAddress`

Result:

- No real vendor contact URLs
- No raw private field names
- No locked-vendor `LocalBusiness.telephone`, `sameAs`, or `streetAddress`
- No phone/container/social contact lists in sampled guide content

Generic WhatsApp/Telegram labels remain allowed where they are visual UI labels without private URLs.

## Production Env Checklist

Production must have:

- `NEXT_PUBLIC_SITE_INDEXABLE=true`
- `NEXT_PUBLIC_APP_URL=https://dordoi.help`

Env files were not changed.

## Remaining Risks

- DB-backed public vendor descriptions and store names may remain source-language until a future approved DB/content localization pipeline exists.
- Search Console and Yandex indexation outcomes depend on crawl timing and perceived content quality after deployment.
- Localized category slug aliases were not migrated in this release to avoid duplicate indexable category URLs.
- Next.js middleware-to-proxy deprecation warning remains outside this SEO/i18n commit scope.

## Post-Deploy Live Validation Checklist

Do not deploy or push without owner approval.

After deploy:

1. Run live smoke:
   - `BASE_URL=https://dordoi.help npm run seo:smoke:dordoi`
2. Run full live i18n smoke:
   - `BASE_URL=https://dordoi.help npm run seo:i18n:full`
3. Check:
   - `https://dordoi.help/sitemap.xml`
   - `https://dordoi.help/sitemaps/core.xml`
   - `https://dordoi.help/robots.txt`
   - `https://dordoi.help/llms.txt`
4. Check language home pages:
   - `https://dordoi.help/ru`
   - `https://dordoi.help/kk`
   - `https://dordoi.help/kg`
   - `https://dordoi.help/uz`
   - `https://dordoi.help/tj`
5. Check sample localized guides:
   - `https://dordoi.help/ru/blog/dordoi-optom-polnyy-gid`
   - `https://dordoi.help/kk/blog/dordoi-koterme-tolyk-nuskaulyk`
   - `https://dordoi.help/kg/blog/dordoi-dununon-toluk-koldonmo`
   - `https://dordoi.help/uz/blog/dordoy-ulgurji-toliq-qollanma`
   - `https://dordoi.help/tj/blog/dordoi-yakluht-dasturi-purra`
6. Expected live:
   - HTTP 200
   - self-canonical
   - index/follow
   - hreflang `ru/kk/ky/uz/tg/x-default`
   - localized H1/title/description
   - no private vendor contacts
   - sitemap has all localized URLs
   - no localhost
7. Submit sitemap to Google Search Console:
   - `https://dordoi.help/sitemap.xml`
8. Submit sitemap to Yandex Webmaster:
   - `https://dordoi.help/sitemap.xml`
9. Inspect/request indexing:
   - `/ru`
   - `/kk`
   - `/kg`
   - `/uz`
   - `/tj`
   - `/ru/catalog`
   - `/ru/blog`
   - top 9 categories
   - country pages
   - sample localized guides
   - `/ru/about`
   - `/ru/how-it-works`
   - `/ru/faq`
10. Monitor after 3-7 days:
   - indexed pages
   - discovered not indexed
   - crawled not indexed
   - top queries
   - pages by language
   - impressions by language
   - category impressions
   - guide impressions
   - canonical issues
   - hreflang warnings
   - noindex mistakes
11. After 2-4 weeks:
   - expand only based on Search Console/Yandex data.

