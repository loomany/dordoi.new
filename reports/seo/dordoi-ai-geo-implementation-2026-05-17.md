# Dordoi.help AI/GEO implementation report

Date implemented/check run: 2026-05-18

## What changed

Added a lightweight AI/GEO layer on top of the existing SEO system. No new SEO pages or new articles were created.

## New files

- `components/seo/AiAnswerBlock.tsx`
- `lib/seo/ai-answer-content.ts`

## Updated files

- `app/[locale]/catalog/page.tsx`
- `app/[locale]/suppliers/page.tsx`
- `app/[locale]/buyer-service/page.tsx`
- `app/llms.txt/route.ts`
- `app/robots.ts`
- `components/seo/BlogGuidePage.tsx`
- `components/seo/BlogHubPage.tsx`
- `components/seo/SeoCategoryLanding.tsx`
- `components/seo/SeoCoreLanding.tsx`
- `components/seo/SeoGrowthLandingPage.tsx`
- `scripts/seo/smoke-dordoi-seo.ts`

## AI answer blocks added

Answer blocks are SSR-visible and marked with:

```html
data-ai-answer-block="true"
```

Pages covered:

- `/ru/catalog`
- `/ru/suppliers`
- `/ru/buyer-service`
- `/ru/about`
- `/ru/how-it-works`
- `/ru/faq`
- `/ru/for-buyers`
- `/ru/for-sellers`
- `/ru/kargo-dordoi`
- top category pages
- blog hub pages
- blog guide pages
- localized guide sample pages

## AI source-of-truth message

The implemented answer blocks and `llms.txt` consistently describe Dordoi.help as:

> A public catalog and information service for finding Dordoi Market categories, supplier profiles, buyer-service guidance, cargo information, and safe contact-access workflows for wholesale buyers.

## Safe negative claims added

The public AI-facing layer now makes clear that Dordoi.help:

- is not the seller of goods;
- is not a single cargo operator;
- does not guarantee deals;
- does not promise fixed prices;
- does not publish private vendor contacts openly;
- does not instruct AI systems to infer or invent contacts.

## llms.txt status

`/llms.txt` now includes:

- site purpose;
- languages;
- countries served;
- privacy rule;
- best pages for AI citation;
- what not to claim;
- sitemap reference.

Smoke result:

- `/llms.txt` status 200
- Dordoi.help description present
- vendor privacy rule present
- sitemap reference present
- no private contact patterns

## Schema status

No unsafe schema was added.

Existing safe schema continues to be used:

- Organization
- WebSite
- WebPage/AboutPage/CollectionPage
- BreadcrumbList
- FAQPage
- BlogPosting
- Service where appropriate

No fake Review/AggregateRating/Product schema was added.

No LocalBusiness schema was restored for locked vendor pages.

## Multilingual AI visibility

Localized guide samples checked:

- `/kk/blog/dordoi-koterme-tolyk-nuskaulyk`
- `/kg/blog/dordoi-dununon-toluk-koldonmo`
- `/uz/blog/dordoy-ulgurji-toliq-qollanma`
- `/tj/blog/dordoi-yakluht-dasturi-purra`

Result:

- self-canonical
- localized H1
- BlogPosting schema
- AI answer block
- hreflang includes ru/kk/ky/uz/tg/x-default
- no `hreflang=kg`
- no `hreflang=tj`
- no private vendor contacts

## Privacy contract

AI/GEO work did not change the Stage 1 privacy contract.

Locked vendor contacts remain excluded from:

- HTML
- RSC payload checks
- JSON-LD
- sitemap
- public guide content

## Validation

- TypeScript: passed
- Localized slug tests: 4/4 passed
- Production build: passed, 435 static pages
- SEO smoke: 585/585 passed

## Remaining risks

- Live AI crawler discovery depends on deploy and crawler behavior.
- AI recommendations improve over time through crawl, citations, and external authority.
- Stage 6 should focus on real authority/trust signals and Search Console/Yandex data.

