# Dordoi.help Stage 5 final summary — 2026-05-17

Final verdict: ready for commit review, not pushed. Commit/push still requires explicit approval.

Completed:
- Keyword clustering report created.
- Multilingual URL strategy created.
- Content plan created.
- Static localization pipeline documented and implemented without OpenAI API.
- 34 published guide pages available through the existing blog system.
- Localized blog slugs implemented for kk/kg/uz/tj.
- Blog route, metadata, sitemap and smoke checks now understand localized guide URLs.
- Blog hub grouped by SEO clusters.
- Sitemap index cache key fixed to avoid stale localhost root.
- Privacy regression remains clean.

Counts:
- Keyword clusters: 21.
- Published guide URLs: 34 RU canonical source guides.
- Localized route variants: ru, kk, kg/ky, uz, tj/tg.
- Smoke checks: 376/376 passed.
- Unit tests: 4/4 passed.
- Build: passed, 435 static pages generated.

Files changed in this task:
- `app/[locale]/blog/[slug]/page.tsx`
- `components/seo/BlogHubPage.tsx`
- `lib/seo.ts`
- `lib/seo/dordoi-blog-localized.ts`
- `lib/seo/dordoi-blog-localized.test.ts`
- `lib/seo/stage2-content.ts`
- `lib/seo/stage4-localized-content.ts`
- `lib/seo/stage5-guides.ts`
- `lib/sitemap/build-core-sitemap-xml.ts`
- `lib/sitemap/build-sitemap-index-xml.ts`
- `scripts/seo/smoke-dordoi-seo.ts`
- New reports in `reports/seo/`.

Important existing worktree note:
- The repo already had uncommitted Stage 3/4/5 SEO changes before this task. Final commit should include only intended SEO/content/report files after review.

Git status snapshot:
- Modified app/content/SEO files include blog route/page, SEO components, category content, sitemap builders, `lib/seo.ts`, `stage2-content.ts`, and `package.json`.
- New task files include `lib/seo/dordoi-blog-localized.ts`, `lib/seo/dordoi-blog-localized.test.ts`, and the seven Stage 5 reports.
- Existing untracked Stage 3/4/5 files remain present: `Stage3TrustSections.tsx`, `stage3-trust-content.ts`, `stage4-localized-content.ts`, `stage5-guides.ts`, earlier Stage 3/4/5 reports, and `scripts/seo/`.
- No env files, secrets, auth/payment/RLS/database/admin files were intentionally changed.

Latest diff stat:
- Tracked diff: 17 files changed, 1053 insertions, 102 deletions.
- Untracked SEO/content/report files are not included in `git diff --stat` until staged.

Remaining risks:
- Static kk/kg/tj translations are SEO-safe but should receive native human review.
- Category localized aliases were intentionally deferred to avoid duplicate indexable category URLs.
- No fake ratings/reviews were added; real cases/reviews should be collected later with permission.
- Live deploy still depends on production env:
  - `NEXT_PUBLIC_SITE_INDEXABLE=true`
  - `NEXT_PUBLIC_APP_URL=https://dordoi.help`

Post-deploy Google/Yandex checklist:
1. Open `https://dordoi.help/sitemap.xml` and `https://dordoi.help/sitemaps/core.xml`; confirm 200, no localhost, RU and localized guide URLs present.
2. In Google Search Console submit sitemap and inspect:
   - `/ru/catalog`
   - top category pages
   - country pages
   - `/ru/blog`
   - `/ru/blog/dordoi-optom-polnyy-gid`
   - `/kk/blog/dordoi-koterme-tolyk-nuskaulyk`
   - `/kg/blog/dordoi-dununon-toluk-koldonmo`
   - `/uz/blog/dordoy-ulgurji-toliq-qollanma`
   - `/tj/blog/dordoi-yakluht-dasturi-purra`
3. In Yandex Webmaster submit sitemap, check robots, indexing, canonical, excluded pages and crawl errors.
4. After 3-7 days monitor indexed pages, discovered/crawled not indexed, top queries, top pages, country impressions and guide impressions.
5. After 2-4 weeks expand clusters only where GSC/Yandex show impressions.

Recommended next step:
- Stage 6: authority/trust growth, real cases/reviews with permission, CWV/performance pass, and GSC/Yandex-driven content expansion.
