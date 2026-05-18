# Dordoi.help Full i18n Final Validation

Date: 2026-05-18

## Audit Coverage

- Full public route inventory: 389 rows.
- Per-locale route count: `ru=77`, `kk=77`, `kg=77`, `uz=77`, `tj=77`, technical=4.
- Route types: core=120, category=80, blog hub=5, blog guide=170, locked vendor samples=10, technical=4.
- Hreflang/canonical validation rows: 385 localized/indexable rows.

Generated files:

- `reports/seo/dordoi-full-route-i18n-inventory-2026-05-18.csv`
- `reports/seo/dordoi-full-multilingual-route-inventory-2026-05-18.csv`
- `reports/seo/dordoi-i18n-visible-crawl-2026-05-18.csv`
- `reports/seo/dordoi-i18n-full-crawl-2026-05-18.csv`
- `reports/seo/dordoi-hreflang-canonical-all-locales-2026-05-18.csv`

## SEO/i18n Status

- HTML lang: correct for route locales, including `/kg` => `ky` and `/tj` => `tg`.
- Hreflang: `ru`, `kk`, `ky`, `uz`, `tg`, `x-default`; no wrong `kg`/`tj` hreflang found.
- Canonical: self-canonical for localized indexable pages; catalog slug aliases canonicalize to supplier page where expected.
- Sitemap: all 170 localized guide URLs present; no localhost; noncanonical localized source slugs excluded.
- Schema language: no wrong `inLanguage` values found.
- AI answer blocks: present on key SEO/core/category/blog pages and localized where static.
- Missing translation keys: none found in full crawl.
- Privacy: no private vendor contact fields or `LocalBusiness` locked-vendor leaks found.

## Test Results

- `npx.cmd tsc --noEmit`: passed.
- `npm.cmd run check:i18n`: passed.
- `node --test --import tsx lib/seo/dordoi-blog-localized.test.ts`: passed, 4/4.
- `NEXT_PUBLIC_SITE_INDEXABLE=true NEXT_PUBLIC_APP_URL=https://dordoi.help npm.cmd run build`: passed, 435 static pages.
- `BASE_URL=http://127.0.0.1:3005 npm run seo:smoke:dordoi`: passed 585/585.
- `BASE_URL=http://127.0.0.1:3005 npm run seo:i18n:full`: passed 10/10 critical checks, crawled 389 routes.

## Remaining Risks

- Some public DB-backed vendor/store names are Cyrillic on Uzbek pages. They are brand/source content from the database, not static UI fallback. Translating them requires owner approval and DB/content pipeline work.
- `npm run report:i18n-identical-to-ru` still reports identical strings, mostly allowed brand/support/admin/payment/contact terms and borrowed terms such as `FAQ`, `Telegram`, `Instagram`, `Каталог`. Admin/auth/payment areas were intentionally not changed.
- Next.js middleware-to-proxy deprecation warning remains unrelated and was not fixed in this task.

## Production Checklist

Production must set:

- `NEXT_PUBLIC_SITE_INDEXABLE=true`
- `NEXT_PUBLIC_APP_URL=https://dordoi.help`

After deploy:

1. Run `BASE_URL=https://dordoi.help npm run seo:smoke:dordoi`.
2. Run `BASE_URL=https://dordoi.help npm run seo:i18n:full`.
3. Check `/sitemap.xml`, `/sitemaps/core.xml`, `/robots.txt`, `/llms.txt`.
4. Submit `https://dordoi.help/sitemap.xml` in Google Search Console and Yandex Webmaster.
5. Inspect/request indexing for home locales, `/ru/catalog`, top categories, `/ru/blog`, sample localized guides, country pages, `/ru/about`, `/ru/how-it-works`, `/ru/faq`.

## Final Verdict

Ready for owner review. Do not commit or push until owner approval.

