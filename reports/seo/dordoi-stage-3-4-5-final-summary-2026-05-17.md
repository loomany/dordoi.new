# Dordoi.help Stage 3-4-5 Final Summary — 2026-05-17

## Final Verdict

Ready for review before commit.

No commit or push was performed.

Stage order was preserved:

1. Stage 3 — categories + trust + monitoring
2. Stage 4 — localization
3. Stage 5 — guides/content expansion
4. Final smoke

No auth, payments, Lemon Squeezy, Supabase RLS, database migrations, subscription logic, checkout, pricing, or admin logic was changed.

## Stage 3 Completed

### Category SEO

Strengthened top 9 commercial category pages:

- Женская одежда
- Мужская одежда
- Детская одежда
- Обувь
- Ткани и фурнитура
- Сумки
- Нижнее белье / купальники
- Домашний текстиль
- Аксессуары

Added / improved:

- unique category content
- commercial H1/intro
- "Что можно найти" blocks
- "Как выбрать поставщика" blocks
- FAQ content
- related category links
- country/buyer/cargo links
- safe CollectionPage / FAQ / ItemList behavior

### Trust

Added trust blocks and payment-adjacent FAQ language to:

- `/ru/about`
- `/ru/how-it-works`
- `/ru/faq`
- `/ru/for-buyers`
- `/ru/for-sellers`
- `/ru/buyer-service`
- `/ru/kargo-dordoi`

Trust copy explains:

- what is visible for free
- what opens after access
- why contacts are gated
- Dordoi.help is not the seller or deal guarantor
- buyer/cargo terms must be clarified separately

### Monitoring

Created:

- `reports/seo/dordoi-stage-3-monitoring-checklist-2026-05-17.md`
- `reports/seo/dordoi-stage-3-category-trust-monitoring-2026-05-17.md`
- `scripts/seo/smoke-dordoi-seo.ts`

Added npm script:

- `npm run seo:smoke:dordoi`

## Stage 4 Completed

Created:

- `reports/seo/dordoi-stage-4-localization-audit-plan-2026-05-17.md`
- `reports/seo/dordoi-localization-glossary-2026-05-17.md`
- `reports/seo/dordoi-stage-4-localization-2026-05-17.md`
- `lib/seo/stage4-localized-content.ts`

Localized priority pages for `kk`, `kg`, `uz`, `tj`:

- `/about`
- `/how-it-works`
- `/faq`
- `/for-buyers`
- `/for-sellers`
- country pages
- top category pages
- first 3 blog guides

Locale mapping:

- `/kk` -> `kk`
- `/kg` -> `ky`
- `/uz` -> `uz`
- `/tj` -> `tg`

Schema language fix:

- `SafePageSchemaJsonLd`
- `BlogPostingJsonLd`

Stage 4 crawl result:

- `LOCALIZATION_CRAWL 96/96 passed`

## Stage 5 Completed

Created:

- `reports/seo/dordoi-stage-5-editorial-framework-2026-05-17.md`
- `reports/seo/dordoi-stage-5-guides-content-expansion-2026-05-17.md`
- `lib/seo/stage5-guides.ts`

Published 20 RU-first guides:

- `/ru/blog/kak-proverit-postavshchika-dordoi`
- `/ru/blog/chek-list-zakupki-na-dordoe`
- `/ru/blog/kak-sravnit-postavshchikov-dordoi`
- `/ru/blog/kak-napisat-postavshchiku-dordoi`
- `/ru/blog/kak-zakupat-na-dordoe-udalenno`
- `/ru/blog/dostavka-s-dordoya-v-kazakhstan`
- `/ru/blog/dostavka-s-dordoya-v-uzbekistan`
- `/ru/blog/dostavka-s-dordoya-v-tajikistan`
- `/ru/blog/dostavka-s-dordoya-v-russia`
- `/ru/blog/kargo-dordoi-skolko-vremeni-zanimaet`
- `/ru/blog/bayer-dordoi-kto-eto-i-zachem-nuzhen`
- `/ru/blog/kak-vybrat-bayera-dordoi`
- `/ru/blog/bayer-dordoi-dlya-kazakhstana`
- `/ru/blog/bayer-ili-samostoyatelnaya-zakupka-dordoi`
- `/ru/blog/zhenskaya-odezhda-optom-dordoi`
- `/ru/blog/muzhskaya-odezhda-optom-dordoi`
- `/ru/blog/detskaya-odezhda-optom-dordoi`
- `/ru/blog/obuv-optom-dordoi`
- `/ru/blog/sumki-optom-dordoi`
- `/ru/blog/tkani-i-furnitura-dordoi`

Guide crawl result:

- `GUIDE_CRAWL 23/23 guide pages passed; failures=0`

## URLs Added / Updated

Added:

- 20 new RU blog guide URLs

Updated:

- top 9 RU category pages
- localized category body/FAQ content for `kk`, `kg`, `uz`, `tj`
- blog hub
- guide pages
- country pages via guide linking
- core SEO/trust pages via guide linking
- sitemap core output

## Sitemap Status

Updated `lib/sitemap/build-core-sitemap-xml.ts`:

- appends published blog URLs from `BLOG_POSTS_ALL`
- avoids duplicate public route entries
- cache key updated to `sitemap-core-xml-v4`

Final smoke confirmed:

- `/sitemap.xml` returns 200
- `/sitemaps/core.xml` returns 200
- no localhost
- Stage 5 guide URLs present
- redirect aliases absent
- query URLs absent from checks

## Privacy Status

Final privacy checks passed for locked/public supplier and category pages:

- `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`
- `/ru/categories/zhenskaya-odezhda-optom`
- `/ru/suppliers/asso-corsets`

Also checked localized category pages during Stage 4:

- `/kk/categories/ayelder-kiimi-koterme`
- `/kg/categories/ayaldar-kiyimi-dung`
- `/uz/categories/ayollar-kiyimi-ulgurji`
- `/tj/categories/libosi-zanona-yaklukht`

No vendor phone, WhatsApp URL, Telegram vendor URL, Instagram vendor URL, map URL, exact location row, `LocalBusiness`, `telephone`, `sameAs`, or `streetAddress` was found in locked output.

## Final Checks

- `npx.cmd tsc --noEmit` — passed
- `node --test --import tsx lib/catalog/*.test.ts` — passed, 46 tests
- `npm.cmd run build` with temporary production SEO env — passed
- `npm run seo:smoke:dordoi` — `212/212 passed`
- final route crawl — `FINAL_ROUTE_CRAWL 77/77 passed`

Temporary env used only for command execution:

- `NEXT_PUBLIC_SITE_INDEXABLE=true`
- `NEXT_PUBLIC_APP_URL=https://dordoi.help`

No env files were changed.

## Git Status Summary

Working tree contains only scoped SEO/content/report changes for this task.

No unrelated files were identified.

Commit and push were not performed.

Suggested commit message:

`feat(seo): expand Dordoi category trust localization and guide content`

## Known Risks

- New Stage 5 guides are RU-first. They should not be considered fully localized for `kk`, `kg`, `uz`, and `tj` until native review/localization is done.
- More guides should be added only after GSC/Yandex data shows impressions and indexing behavior.
- Real reviews/cases should only be added with permission and never as fake AggregateRating.
- Performance/CWV should be checked after deploy because more static content can affect payload and render time.

## Recommended Stage 6

Do not implement Stage 6 yet. Recommended next work:

1. External authority:
   - brand mentions
   - social profiles
   - local directories
   - partnerships with buyer/cargo services

2. Real reviews/cases:
   - only documented real cases
   - no fake ratings
   - no private vendor data

3. Performance / CWV:
   - Lighthouse
   - image optimization
   - RSC payload cleanup
   - public i18n payload cleanup

4. GSC/Yandex based expansion:
   - expand only pages with impressions
   - improve discovered-not-indexed pages
   - localize the guide clusters that show real search demand
