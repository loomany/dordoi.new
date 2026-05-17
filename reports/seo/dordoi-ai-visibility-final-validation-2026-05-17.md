# Dordoi.help AI visibility final validation

Date checked: 2026-05-18

## Final verdict

AI visibility / GEO / AEO implementation is ready for commit after owner approval.

No commit, push, deploy, or live validation was performed in this step.

## Build and tests

Commands run:

```powershell
npx.cmd tsc --noEmit
node --test --import tsx lib/seo/dordoi-blog-localized.test.ts
NEXT_PUBLIC_SITE_INDEXABLE=true NEXT_PUBLIC_APP_URL=https://dordoi.help npm.cmd run build
BASE_URL=http://127.0.0.1:3005 npm run seo:smoke:dordoi
```

Results:

- TypeScript passed.
- Localized slug tests passed: 4/4.
- Production build passed: 435 static pages.
- Local production smoke passed: 585/585.

Known non-blocking warning:

- Next.js `middleware` file convention is deprecated; this was already known and not part of the SEO task.

## AI page validation

Core pages checked:

- `/ru/about`
- `/ru/how-it-works`
- `/ru/faq`
- `/ru/for-buyers`
- `/ru/for-sellers`
- `/ru/buyer-service`
- `/ru/kargo-dordoi`

Result:

- HTTP 200
- self-canonical
- H1 present
- AI answer block present
- schema present
- FAQ present where expected
- no private vendor contacts

## Blog and localized validation

Blog hubs checked:

- `/ru/blog`
- `/kk/blog`
- `/kg/blog`
- `/uz/blog`
- `/tj/blog`

Result:

- HTTP 200
- self-canonical
- H1 present
- cluster navigation visible
- AI answer block present
- no private vendor contacts

Localized guide samples checked:

- `/kk/blog/dordoi-koterme-tolyk-nuskaulyk`
- `/kg/blog/dordoi-dununon-toluk-koldonmo`
- `/uz/blog/dordoy-ulgurji-toliq-qollanma`
- `/tj/blog/dordoi-yakluht-dasturi-purra`

Result:

- HTTP 200
- self-canonical
- H1 present
- BlogPosting schema
- AI answer block
- hreflang includes ru/kk/ky/uz/tg/x-default
- no wrong `hreflang=kg`
- no wrong `hreflang=tj`
- no private vendor contacts

## Category validation

Top 9 category pages checked.

Result:

- HTTP 200
- canonical present
- H1 present
- FAQ present
- JSON-LD present and safe
- AI answer block present
- no private vendor contact leakage

## Sitemap validation

Checked:

- `/sitemap.xml`
- `/sitemaps/core.xml`

Result:

- HTTP 200
- no localhost
- core pages present
- top category pages present
- RU guide URLs present
- localized guide URLs present
- redirect aliases absent

## Privacy validation

Locked pages checked:

- `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`
- `/ru/categories/zhenskaya-odezhda-optom`
- `/ru/suppliers/asso-corsets`

Strict pattern result: clean.

No:

- `wa.me`
- `tel:`
- vendor `t.me`
- vendor `instagram.com`
- `phone_number`
- `whatsapp_1`
- `whatsapp_2`
- `telegram_url`
- `instagram_url`
- map URL fields
- `primaryWhatsapp`
- `telegramHref`
- `instagramHref`
- `telHref`
- `twoGisHref`
- `LocalBusiness`
- `telephone`
- `sameAs`
- `streetAddress`

## Redirect/query validation

Redirects:

- `/ru/dordoi-market` -> 301 `/ru/rynok-dordoi`
- `/ru/wholesale` -> 301 `/ru/dordoi-optom`
- `/ru/cargo` -> 301 `/ru/kargo-dordoi`

Query URL:

- `/ru/catalog?search=test&utm_source=x&gclid=abc`

Result:

- HTTP 200
- canonical `/ru/catalog`
- robots `noindex, follow`

## Post-deploy validation plan

After approved commit/push/deploy, run:

```powershell
BASE_URL=https://dordoi.help npm run seo:smoke:dordoi
```

Then check live:

- `https://dordoi.help/llms.txt`
- `https://dordoi.help/sitemap.xml`
- `https://dordoi.help/sitemaps/core.xml`
- `https://dordoi.help/ru/about`
- `https://dordoi.help/ru/how-it-works`
- `https://dordoi.help/ru/blog/dordoi-optom-polnyy-gid`
- localized sample guides

## Google/Yandex next actions after deploy

Google Search Console:

- Submit `https://dordoi.help/sitemap.xml`.
- Inspect/request indexing for `/ru/catalog`, `/ru/blog`, top guides, top category pages, country pages, and localized guide samples.

Yandex Webmaster:

- Submit `https://dordoi.help/sitemap.xml`.
- Check robots, indexing, canonical, excluded pages, crawl errors.
- Request reindex for important RU/Cyrillic pages where available.

## Stage 6 recommendation only

Do not expand content further until data is reviewed.

Recommended Stage 6:

- real authority/trust growth;
- real cases/reviews only with permission;
- no fake ratings;
- performance/Core Web Vitals pass;
- public i18n payload cleanup;
- localized category aliases migration plan;
- Search Console/Yandex-driven content expansion based on impressions.

