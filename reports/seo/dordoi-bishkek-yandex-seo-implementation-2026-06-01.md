# Dordoi.help - реализация SEO-усиления под "рынок Бишкек / поставщики Бишкек"

Дата: 2026-06-01

## Что сделано

Добавлен безопасный SEO-слой без изменений каталога, оплаты, auth, БД, Supabase RLS, pricing, subscription и admin.

### Новый core SEO hub

Создана страница:
- /ru/rynok-bishkek
- /kk/rynok-bishkek
- /kg/rynok-bishkek
- /uz/rynok-bishkek
- /tj/rynok-bishkek

Назначение:
- закрыть кластер "рынок Бишкек", "оптовые рынки Бишкека", "поставщики Бишкек";
- объяснить разницу между общим запросом "рынок Бишкек" и практическим сценарием Дордоя;
- вести пользователя в каталог, поставщиков, категории, байера и карго;
- дать Яндексу и AI отдельную landing page вместо размазывания текста по каталогу.

### Новые blog guides

Добавлено 8 RU-гайдов и localized routes через существующую blog architecture:

| URL | Main keyword | Intent |
|---|---|---|
| /ru/blog/rynok-bishkek-optovye-rynki-gde-iskat-postavshchikov | рынок Бишкек поставщики | широкий коммерческий |
| /ru/blog/postavshchiki-bishkek-kak-nayti-optovogo-partnera | поставщики Бишкек | supplier search |
| /ru/blog/rynok-dordoi-bishkek-postavshchiki-katalog-i-kategorii | рынок Дордой Бишкек поставщики | Dordoi supplier catalog |
| /ru/blog/optovye-rynki-bishkeka-dordoi-madina-alamedin-kak-vybrat | оптовые рынки Бишкека | comparison |
| /ru/blog/odezhda-optom-bishkek-postavshchiki-dordoi | одежда оптом Бишкек | category commercial |
| /ru/blog/tovary-optom-bishkek-dlya-magazina-i-marketpleysa | товары оптом Бишкек | marketplace/store sourcing |
| /ru/blog/katalog-postavshchikov-bishkek-kak-polzovatsya | каталог поставщиков Бишкек | catalog navigation |
| /ru/blog/kak-vybrat-rynok-v-bishkeke-dlya-optovoy-zakupki | рынок Бишкек оптом | checklist/how-to |

Для kk/kg/uz/tj добавлены localized slugs через `dordoi-blog-localized.ts`. Если full body seed не задан, используется существующий generic localized content builder с локализованным title/H1/description/excerpt/FAQ и безопасной privacy-логикой.

### Внутренняя перелинковка

Добавлены ссылки на /rynok-bishkek:
- в home SEO growth links;
- в footer service links;
- в новых guides;
- в localized link labels для kk/kg/uz/tj.

### AI/GEO

Добавлен answer block для core landing `rynok-bishkek`:
- объясняет, что страница помогает оптовому покупателю понять Дордой, категории, поставщиков, байера и карго;
- явно сохраняет privacy rule: приватные vendor contacts не публикуются открыто.

## Измененные файлы

Implementation:
- `app/[locale]/rynok-bishkek/page.tsx`
- `lib/seo/core-seo-landings.ts`
- `lib/seo/stage6-bishkek-guides.ts`
- `lib/seo/stage2-content.ts`
- `lib/seo/dordoi-blog-localized.ts`
- `lib/seo/ai-answer-content.ts`
- `lib/seo/stage3-trust-content.ts`
- `lib/seo/stage4-localized-content.ts`
- `components/seo/HomeSeoGrowthLinks.tsx`
- `components/layout/SiteFooter.tsx`
- `scripts/seo/smoke-dordoi-seo.ts`
- `scripts/seo/smoke-dordoi-i18n-full.ts`

Reports:
- `reports/seo/dordoi-bishkek-yandex-keyword-competitor-audit-2026-06-01.md`
- `reports/seo/dordoi-bishkek-yandex-seo-implementation-2026-06-01.md`

## Privacy contract

Новые страницы не содержат:
- телефоны поставщиков;
- WhatsApp/Telegram/Instagram vendor links;
- точные контейнеры/проходы;
- точные map URLs;
- LocalBusiness для locked vendors;
- fake reviews / fake ratings / fake guarantees.

Контент объясняет controlled access и ведет пользователя к каталогу, категориям, FAQ, байеру и карго.

## Что проверить после сборки

1. `npx.cmd tsc --noEmit`
2. `node --test --import tsx lib/seo/dordoi-blog-localized.test.ts`
3. `NEXT_PUBLIC_SITE_INDEXABLE=true NEXT_PUBLIC_APP_URL=https://dordoi.help npm.cmd run build`
4. При локальном сервере:
   - `BASE_URL=http://127.0.0.1:3005 npm run seo:smoke:dordoi`
   - `BASE_URL=http://127.0.0.1:3005 npm run seo:i18n:full`

## Ожидаемый sitemap эффект

Так как /rynok-bishkek добавлен в `CORE_SEO_LANDINGS`, core sitemap должен включить URL для всех локалей.

Так как новые гайды добавлены в `BLOG_POSTS_ALL`, sitemap должен включить:
- 8 новых RU guide URLs;
- localized guide URLs для kk/kg/uz/tj;
- не должен включать noncanonical source slugs для non-RU, если localized slug задан.

## Что делать после деплоя

В Яндекс Вебмастере:
- отправить sitemap.xml;
- проверить индексирование /ru/rynok-bishkek;
- запросить переобход для /ru/rynok-dordoi, /ru/catalog, /ru/suppliers и новых гайдов;
- через 7-14 дней смотреть показы/позиции по кластерам "рынок Бишкек", "поставщики Бишкек", "Дордой Бишкек поставщики".

Если страницы получают показы, но не входят в top 10:
- добавить ссылки на сильные новые гайды со страниц категорий после основного блока;
- точечно улучшить title/description по фактическим queries;
- расширить контент только по данным Яндекс Вебмастера, а не массово.
