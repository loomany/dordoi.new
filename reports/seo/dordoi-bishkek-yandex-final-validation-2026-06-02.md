# Dordoi.help - Bishkek/Yandex SEO final validation

Date: 2026-06-02

## Scope

Implemented a scoped SEO/content expansion for the clusters:

- рынок Бишкек
- рынок Дордой Бишкек
- поставщики Бишкек
- каталог поставщиков Бишкек
- одежда оптом Бишкек
- товары оптом Бишкек
- оптовые рынки Бишкека

Catalog seller display logic, payment logic, auth, Lemon Squeezy, Supabase RLS, database writes, checkout, pricing, subscription and admin logic were not changed.

## Implemented

- Added a new multilingual core landing: `/{locale}/rynok-bishkek`.
- Added 8 new RU guide pages for Bishkek/Dordoi supplier and wholesale-market intent.
- Added localized blog slugs for kk/kg/uz/tj for the new guide set.
- Added internal links to the new hub from home SEO links and footer service links.
- Added AI/GEO answer block support for `rynok-bishkek`.
- Extended SEO smoke scripts to cover the new guide samples and the new core route.
- Fixed localized blog related-link rendering so localized pages use localized blog slugs and localized labels instead of RU source labels.

## New high-priority URLs

- `/ru/rynok-bishkek`
- `/ru/blog/rynok-bishkek-optovye-rynki-gde-iskat-postavshchikov`
- `/ru/blog/postavshchiki-bishkek-kak-nayti-optovogo-partnera`
- `/ru/blog/rynok-dordoi-bishkek-postavshchiki-katalog-i-kategorii`
- `/ru/blog/optovye-rynki-bishkeka-dordoi-madina-alamedin-kak-vybrat`
- `/ru/blog/odezhda-optom-bishkek-postavshchiki-dordoi`
- `/ru/blog/tovary-optom-bishkek-dlya-magazina-i-marketpleysa`
- `/ru/blog/katalog-postavshchikov-bishkek-kak-polzovatsya`
- `/ru/blog/kak-vybrat-rynok-v-bishkeke-dlya-optovoy-zakupki`

## Validation

- `npm.cmd run check:i18n` - passed.
- `node --test --import tsx lib/seo/dordoi-blog-localized.test.ts` - passed, 4/4.
- `npx.cmd tsc --noEmit` - passed.
- `NEXT_PUBLIC_SITE_INDEXABLE=true NEXT_PUBLIC_APP_URL=https://dordoi.help npm.cmd run build` - passed, 481 static pages.
- `BASE_URL=http://127.0.0.1:3005 npm run seo:smoke:dordoi` - passed, 693/693.
- `BASE_URL=http://127.0.0.1:3005 npm run seo:i18n:full` - passed, 10/10 critical checks, 434 routes crawled.

The known Next.js middleware-to-proxy warning is unrelated to this SEO task and was not changed.

## Privacy status

Smoke checks confirm no private vendor contact leaks on sampled locked vendor/category/supplier pages and new guide pages.

The new content does not publish:

- vendor phone numbers;
- WhatsApp/Telegram/Instagram vendor links;
- exact vendor locations or map links;
- LocalBusiness telephone/sameAs/streetAddress for locked vendors;
- fake prices, fake reviews, fake ratings or guaranteed deals.

## Yandex post-deploy checklist

After deploy:

1. Submit `https://dordoi.help/sitemap.xml` in Yandex Webmaster.
2. Request recrawl for:
   - `/ru/rynok-bishkek`
   - `/ru/rynok-dordoi`
   - `/ru/catalog`
   - `/ru/suppliers`
   - the 8 new guide URLs above.
3. After 7-14 days, export query data for:
   - рынок Бишкек
   - поставщики Бишкек
   - рынок Дордой Бишкек
   - каталог поставщиков Бишкек
   - одежда оптом Бишкек
4. If impressions appear but CTR is weak, tune title/description by real Yandex query wording.
5. If pages are top 20 but not top 5, add more internal links from relevant category/country pages after the main content block, before footer.

## Remaining risks

- Direct automated Yandex SERP checks were blocked by captcha; exact top-5 positions should be verified from Yandex Webmaster or manual clean SERP checks.
- Top-3 movement depends on indexing, behavioral signals, internal link weight and external/entity signals after deploy.
- DB-backed vendor/store texts may remain source-language where they come from supplier data; this was not changed by design.

## Verdict

Ready for commit and push.
