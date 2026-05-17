# Dordoi.help Stage 5 final commit review

Date checked: 2026-05-18

## Verdict

Ready for commit after owner approval. No commit or push was made in this review step.

## Git/worktree summary

Current worktree contains intended SEO/content changes from Stage 3, Stage 4, Stage 5, plus the AI/GEO readiness layer.

Tracked modified files:

- `app/[locale]/blog/[slug]/page.tsx`
- `app/[locale]/blog/page.tsx`
- `app/[locale]/buyer-service/page.tsx`
- `app/[locale]/catalog/page.tsx`
- `app/[locale]/suppliers/page.tsx`
- `app/llms.txt/route.ts`
- `app/robots.ts`
- `components/seo/BlogGuidePage.tsx`
- `components/seo/BlogHubPage.tsx`
- `components/seo/SafePageSchemaJsonLd.tsx`
- `components/seo/SeoCategoryLanding.tsx`
- `components/seo/SeoCoreLanding.tsx`
- `components/seo/SeoGrowthLandingPage.tsx`
- `lib/catalog/seo-category-content.ts`
- `lib/catalog/seo-category-route-data.ts`
- `lib/seo.ts`
- `lib/seo/seo-internal-links.ts`
- `lib/seo/stage2-content.ts`
- `lib/sitemap/build-core-sitemap-xml.ts`
- `lib/sitemap/build-sitemap-index-xml.ts`
- `package.json`

New intended files:

- `components/seo/AiAnswerBlock.tsx`
- `components/seo/Stage3TrustSections.tsx`
- `lib/seo/ai-answer-content.ts`
- `lib/seo/dordoi-blog-localized.ts`
- `lib/seo/dordoi-blog-localized.test.ts`
- `lib/seo/stage3-trust-content.ts`
- `lib/seo/stage4-localized-content.ts`
- `lib/seo/stage5-guides.ts`
- `scripts/seo/smoke-dordoi-seo.ts`
- `reports/seo/*` reports created by this SEO task

## Change groups

Stage 3 category/trust/monitoring:

- Top category SEO content and category route data.
- Trust blocks for buyer/seller/cargo/service pages.
- SEO smoke script and `seo:smoke:dordoi` package script.
- Monitoring checklist report.

Stage 4 localization:

- Static localized content helpers.
- Localization glossary and audit plan.
- Localized metadata/content support for kk, kg route with `ky`, uz, tj route with `tg`.

Stage 5 keyword guides/blog/sitemap:

- 34 published guide pages in the existing blog system.
- 170 localized guide routes across ru/kk/kg/uz/tj.
- Localized slug resolver and tests.
- Blog hub cluster grouping.
- Sitemap inclusion for canonical localized guide URLs.

AI/GEO readiness:

- `llms.txt` strengthened with safe AI description, languages, privacy rules, sitemap reference, and what not to claim.
- `robots.txt` documents search/AI crawler policy while keeping private paths blocked.
- AI answer blocks added to catalog, suppliers, buyer-service, core SEO pages, category pages, blog hub, and guide pages.

## Excluded/unrelated files

No unrelated files were identified in `git status --short --untracked-files=all`.

No env files, raw logs, temporary exports, old sitemap dumps, secrets, admin/auth/payment/database files, or unrelated analytics files are included.

## Forbidden area check

No modified path is in:

- auth implementation
- payments
- Lemon Squeezy
- Supabase RLS
- database migrations
- subscription logic
- checkout
- pricing
- admin

Note: the build route list still includes existing auth/payment/admin routes, but they are not changed by this SEO work.

## Content architecture review

- No second blog system was created.
- Existing blog route files are still used: `app/[locale]/blog/page.tsx` and `app/[locale]/blog/[slug]/page.tsx`.
- Blog content is centralized through `lib/seo/stage2-content.ts`, `lib/seo/stage5-guides.ts`, `lib/seo/dordoi-blog-localized.ts`, and `lib/seo/stage4-localized-content.ts`.
- Total published guide count: 34.
- Total localized guide routes: 170.
- Duplicate localized slug count: 0.
- Blog cards use localized paths.

Count check:

```json
{
  "publishedGuides": 34,
  "totalLocalizedGuideRoutes": 170,
  "uniquePaths": 170,
  "staticParams": 170,
  "duplicates": 0
}
```

## Sample multilingual URL checks

Checked in local production smoke:

- `/ru/blog/dordoi-optom-polnyy-gid`
- `/kk/blog/dordoi-koterme-tolyk-nuskaulyk`
- `/kg/blog/dordoi-dununon-toluk-koldonmo`
- `/uz/blog/dordoy-ulgurji-toliq-qollanma`
- `/tj/blog/dordoi-yakluht-dasturi-purra`

Result:

- HTTP 200
- self-canonical
- localized H1
- BlogPosting schema
- AI answer block
- hreflang includes `ru`, `kk`, `ky`, `uz`, `tg`, `x-default`
- no `hreflang=kg`
- no `hreflang=tj`
- no private vendor contact patterns

## Sitemap review

Checked:

- `/sitemap.xml`
- `/sitemaps/core.xml`

Result:

- HTTP 200
- no localhost / 127.0.0.1
- RU guide URLs present
- kk/kg/uz/tj localized guide URLs present
- core/category/country pages present
- redirect aliases excluded

Confirmed sample URLs present:

- `/ru/blog/dordoi-optom-polnyy-gid`
- `/kk/blog/dordoi-koterme-tolyk-nuskaulyk`
- `/kg/blog/dordoi-dununon-toluk-koldonmo`
- `/uz/blog/dordoy-ulgurji-toliq-qollanma`
- `/tj/blog/dordoi-yakluht-dasturi-purra`

## Privacy regression

Smoke checked locked pages:

- `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`
- `/ru/categories/zhenskaya-odezhda-optom`
- `/ru/suppliers/asso-corsets`

Strict private patterns were not found:

- `wa.me`
- `tel:`
- vendor `t.me`
- vendor `instagram.com`
- raw private field names
- `LocalBusiness`
- `telephone`
- `sameAs`
- `streetAddress`

## Query/redirect status

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

## Content spot check

Checked 10 content URLs:

- `/ru/blog/dordoi-optom-polnyy-gid`
- `/ru/blog/dordoi-online-katalog-kak-polzovatsya`
- `/ru/blog/kontakty-postavshchikov-dordoi-kak-otkryt-bezopasno`
- `/ru/blog/zhenskaya-odezhda-optom-dordoi`
- `/ru/blog/postavshchiki-dlya-wildberries-bishkek`
- `/ru/blog/kak-nayti-postavshchika-dordoi`
- `/kk/blog/dordoi-koterme-tolyk-nuskaulyk`
- `/kg/blog/dordoi-dununon-toluk-koldonmo`
- `/uz/blog/dordoy-ulgurji-toliq-qollanma`
- `/tj/blog/dordoi-yakluht-dasturi-purra`

Result:

- H1 present
- body not empty
- FAQ present
- no private vendor contact patterns
- no obvious fake guarantee phrasing

## Checks run

- `npx.cmd tsc --noEmit` — passed
- `node --test --import tsx lib/seo/dordoi-blog-localized.test.ts` — 4/4 passed
- `NEXT_PUBLIC_SITE_INDEXABLE=true NEXT_PUBLIC_APP_URL=https://dordoi.help npm.cmd run build` — passed, 435 static pages
- `BASE_URL=http://127.0.0.1:3005 npm run seo:smoke:dordoi` via local production server — 585/585 passed

Known build warning:

- Next.js `middleware` file convention deprecation warning is unrelated to this SEO task and was not changed.

## Production env checklist

Production should have:

- `NEXT_PUBLIC_SITE_INDEXABLE=true`
- `NEXT_PUBLIC_APP_URL=https://dordoi.help`

Env files were not changed.

## Remaining risks

- Live validation is pending until commit, push, and deployment approval.
- Google Search Console and Yandex Webmaster submission cannot be completed from local code alone.
- Future Stage 6 should use real Search Console/Yandex data before creating more content.

## Commit readiness

Ready to stage and commit after explicit approval.

Suggested commit:

```text
feat(seo): add multilingual keyword-driven guide content
```

