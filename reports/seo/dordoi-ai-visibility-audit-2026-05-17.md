# Dordoi.help AI visibility audit

Date checked: 2026-05-18

## Executive summary

Dordoi.help already had a strong SEO foundation for AI/search discovery: public guide pages, localized blog URLs, sitemap, hreflang, safe schema, privacy-safe vendor pages, and `llms.txt`.

The main gaps before this pass were:

- `llms.txt` needed a clearer AI-safe description and explicit "do not claim" rules.
- Key pages needed short SSR-visible answer blocks that summarize the page for AI/search snippets.
- robots policy needed explicit crawler documentation for Google/Yandex/Bing and common AI crawlers.
- Smoke needed checks for AI answer blocks, robots, `llms.txt`, and content safety.

## What was already good

- Locked vendor pages do not expose real vendor contacts in HTML/RSC/JSON-LD.
- Sitemap includes canonical localized guide URLs.
- Hreflang uses `/kg` route with `ky` and `/tj` route with `tg`.
- Blog guides use BlogPosting schema and FAQ schema.
- Site-wide Organization/WebSite schema is safe and does not include vendor contacts.
- Blog hub groups guides by clusters.
- Core pages, category pages, country pages, and guides are SSR-visible.

## Missing or weak before implementation

- AI assistants did not have one compact source explaining safe recommendation rules.
- Several important pages did not have a short "answer-first" block near the top.
- `llms.txt` did not explicitly say not to invent/publish vendor contacts, fixed prices, verified supplier claims, or guaranteed deals.
- robots did not document common AI crawler user agents.
- Smoke did not fail on missing answer blocks or robots/llms regressions.

## Pages reviewed

Core AI pages:

- `/ru/about`
- `/ru/how-it-works`
- `/ru/faq`
- `/ru/for-buyers`
- `/ru/for-sellers`
- `/ru/buyer-service`
- `/ru/kargo-dordoi`
- `/ru/catalog`
- `/ru/suppliers`
- `/ru/blog`

Commercial/category pages:

- Top 9 category pages.

Guide samples:

- `/ru/blog/dordoi-optom-polnyy-gid`
- `/ru/blog/dordoi-online-katalog-kak-polzovatsya`
- `/ru/blog/kontakty-postavshchikov-dordoi-kak-otkryt-bezopasno`
- localized sample guides for kk/kg/uz/tj.

## Privacy risk assessment

P0 privacy leak not detected.

Strict smoke confirmed no vendor:

- phone URLs
- WhatsApp URLs
- Telegram vendor links
- Instagram vendor links
- raw private field names
- exact streetAddress/schema contact leakage
- `LocalBusiness.telephone`
- `LocalBusiness.sameAs`

## Schema recommendations

Keep:

- Organization
- WebSite + SearchAction
- WebPage/AboutPage/CollectionPage
- BreadcrumbList
- FAQPage only when FAQ is visible
- BlogPosting for guides
- Service for buyer/cargo/seller service pages where visible copy supports it

Do not add:

- fake Review
- fake AggregateRating
- Product schema without product pages
- LocalBusiness for locked vendor pages
- vendor telephone/social/exact location in schema

## Robots/crawler recommendations

Allow public SEO pages for:

- Googlebot
- YandexBot
- Bingbot
- GPTBot
- ChatGPT-User
- OAI-SearchBot
- PerplexityBot
- ClaudeBot
- Applebot
- Google-Extended
- CCBot

Keep blocked:

- `/api/`
- `/admin/`
- `/account/`
- `/auth/`
- `/signin`
- `/checkout/`
- `/payment/`
- localized cabinet/payment paths
- query traps

## Implementation plan applied

- Strengthen `llms.txt`.
- Add reusable AI answer block component.
- Add safe answer content helper.
- Add answer blocks to core/catalog/category/blog pages.
- Extend smoke with llms/robots/answer-block/privacy/content checks.
- Keep vendor privacy untouched.

