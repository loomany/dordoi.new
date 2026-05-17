# Dordoi.help Stage 5 Guides Content Expansion — 2026-05-17

## Editorial Framework

Framework path:

- `reports/seo/dordoi-stage-5-editorial-framework-2026-05-17.md`

## Implementation Summary

Added 20 RU-first long-form guide pages using the existing blog data model instead of creating a parallel content system.

Key implementation files:

- `lib/seo/stage5-guides.ts`
- `lib/seo/stage2-content.ts`
- `components/seo/BlogGuidePage.tsx`
- `components/seo/SeoCategoryLanding.tsx`
- `components/seo/SeoGrowthLandingPage.tsx`
- `components/seo/SeoCoreLanding.tsx`
- `lib/sitemap/build-core-sitemap-xml.ts`
- `scripts/seo/smoke-dordoi-seo.ts`

## Created Guides

| # | URL | Cluster | Main keyword | Intent |
|---:|---|---|---|---|
| 1 | `/ru/blog/kak-proverit-postavshchika-dordoi` | Покупателям | как проверить поставщика Дордой | commercial investigation |
| 2 | `/ru/blog/chek-list-zakupki-na-dordoe` | Покупателям | чек-лист закупки на Дордое | how-to |
| 3 | `/ru/blog/kak-sravnit-postavshchikov-dordoi` | Покупателям | как сравнить поставщиков Дордой | comparison |
| 4 | `/ru/blog/kak-napisat-postavshchiku-dordoi` | Покупателям | как написать поставщику Дордой | how-to |
| 5 | `/ru/blog/kak-zakupat-na-dordoe-udalenno` | Покупателям | закупать на Дордое удаленно | how-to |
| 6 | `/ru/blog/dostavka-s-dordoya-v-kazakhstan` | Карго и доставка | доставка с Дордоя в Казахстан | commercial logistics |
| 7 | `/ru/blog/dostavka-s-dordoya-v-uzbekistan` | Карго и доставка | доставка с Дордоя в Узбекистан | commercial logistics |
| 8 | `/ru/blog/dostavka-s-dordoya-v-tajikistan` | Карго и доставка | доставка с Дордоя в Таджикистан | commercial logistics |
| 9 | `/ru/blog/dostavka-s-dordoya-v-russia` | Карго и доставка | доставка с Дордоя в Россию | commercial logistics |
| 10 | `/ru/blog/kargo-dordoi-skolko-vremeni-zanimaet` | Карго и доставка | карго Дордой сколько времени занимает | informational commercial |
| 11 | `/ru/blog/bayer-dordoi-kto-eto-i-zachem-nuzhen` | Байеры | байер Дордой | informational commercial |
| 12 | `/ru/blog/kak-vybrat-bayera-dordoi` | Байеры | как выбрать байера Дордой | commercial investigation |
| 13 | `/ru/blog/bayer-dordoi-dlya-kazakhstana` | Байеры | байер Дордой для Казахстана | commercial |
| 14 | `/ru/blog/bayer-ili-samostoyatelnaya-zakupka-dordoi` | Байеры | байер или самостоятельная закупка Дордой | comparison |
| 15 | `/ru/blog/zhenskaya-odezhda-optom-dordoi` | Категории | женская одежда оптом Дордой | commercial category |
| 16 | `/ru/blog/muzhskaya-odezhda-optom-dordoi` | Категории | мужская одежда оптом Дордой | commercial category |
| 17 | `/ru/blog/detskaya-odezhda-optom-dordoi` | Категории | детская одежда оптом Дордой | commercial category |
| 18 | `/ru/blog/obuv-optom-dordoi` | Категории | обувь оптом Дордой | commercial category |
| 19 | `/ru/blog/sumki-optom-dordoi` | Категории | сумки оптом Дордой | commercial category |
| 20 | `/ru/blog/tkani-i-furnitura-dordoi` | Категории | ткани и фурнитура Дордой | commercial category |

## Draft / Not Created Yet

The remaining requested ideas were intentionally not published in this batch to avoid too much content at once:

- `/ru/blog/nizhnee-bele-i-korsety-dordoi`
- `/ru/blog/domashniy-tekstil-dordoi`
- `/ru/blog/dordoi-dlya-pokupateley-iz-kazakhstana`
- `/ru/blog/dordoi-dlya-pokupateley-iz-uzbekistana`
- `/ru/blog/dordoi-dlya-pokupateley-iz-tajikistana`
- `/ru/blog/dordoi-dlya-pokupateley-iz-rossii`
- `/ru/blog/kak-prodavtsu-popast-v-katalog-dordoi`
- `/ru/blog/kak-oformit-kartochku-postavshchika`
- `/ru/blog/kak-prodavat-optom-pokupatelyam-iz-sng`
- `/ru/blog/kak-podgotovit-foto-i-opisanie-dlya-kataloga`

Recommended: publish these only after checking early GSC/Yandex impressions for the first 20 guides.

## Internal Linking Summary

Added per-article `relatedLinks` so each guide has relevant links to:

- catalog
- buyer pages
- buyer-service
- cargo page
- country pages
- relevant category pages
- FAQ / how-it-works

Added links from commercial category pages to relevant RU guides.

Added links from country pages, FAQ, how-it-works, kargo, dordoi-optom, and rynok-dordoi pages to relevant RU guides.

## Schema Summary

Each guide uses existing safe schema:

- `BlogPosting`
- `FAQPage`
- canonical through `buildPageMetadata`
- hreflang through existing metadata helper

No vendor contacts, exact vendor locations, fake reviews, fake ratings, `Product`, or locked `LocalBusiness` schema were added.

## Sitemap Status

Updated `lib/sitemap/build-core-sitemap-xml.ts` so new published blog URLs are appended from `BLOG_POSTS_ALL`.

Core sitemap cache key updated:

- `sitemap-core-xml-v4`

Stage 5 crawl confirmed:

- `/ru/blog` lists all new guide URLs
- `/sitemaps/core.xml` contains all new Stage 5 guide URLs
- no `localhost` in sitemap output under production SEO env

## Checks

- `npx.cmd tsc --noEmit` — passed
- `node --test --import tsx lib/catalog/*.test.ts` — passed, 46 tests
- `npm.cmd run build` with temporary production SEO env — passed
- guide route crawl — `GUIDE_CRAWL 23/23 guide pages passed; failures=0`

Guide crawl checked:

- HTTP 200
- canonical
- title
- description
- H1
- BlogPosting schema
- FAQPage schema
- at least 3 internal links
- sitemap presence
- no private vendor contacts

## Privacy Regression

No private vendor contact patterns were found in guide pages.

Stage 5 did not add:

- vendor phone numbers
- WhatsApp URLs
- Telegram vendor URLs
- Instagram vendor URLs
- map links
- exact vendor location rows
- fake reviews or ratings

## Remaining Content Risks

- Stage 5 is RU-first. New guides should not be treated as fully localized for `kk`, `kg`, `uz`, and `tj` until native review/localization is done.
- Some topics should be expanded only after Search Console/Yandex data shows impressions or queries.
- Seller-focused guides are intentionally deferred to avoid publishing too much content before measuring buyer/cargo/category clusters.

## Recommended Stage 6

- Track guide impressions and indexed status in Google Search Console and Яндекс Вебмастер.
- Expand seller guides only if buyer/category clusters index normally.
- Add real cases/reviews only with documented permission and without fake AggregateRating.
- Run Lighthouse/Core Web Vitals review after content expansion.
