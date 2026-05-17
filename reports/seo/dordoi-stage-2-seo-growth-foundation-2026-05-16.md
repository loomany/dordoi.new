# Dordoi.help Stage 2 SEO growth foundation report

Date: 2026-05-16  
Mode: scoped SEO implementation after Stage 1 P0 privacy fix  
Commit/push: not performed

## Executive summary

Stage 2 implemented the SEO/GEO foundation without changing auth, payments, Lemon Squeezy, Supabase RLS, database migrations, subscription logic, checkout, pricing, or admin behavior.

Implemented:

- SEO aliases now redirect with HTTP 301 instead of 404.
- Safe site/schema foundation was added for Organization, WebSite SearchAction, WebPage, CollectionPage, FAQPage, BlogPosting, Service, BreadcrumbList.
- AI-friendly pages were added for About, How it works, FAQ, Buyers, Sellers.
- Five country landing pages were added for Kazakhstan, Uzbekistan, Tajikistan, Russia, Kyrgyzstan.
- Blog foundation was added with a blog hub and three high-intent guides.
- `llms.txt` was added with an explicit vendor privacy rule for AI assistants.
- Header, footer, homepage, category pages, cargo/core SEO pages, and buyer pages now link into the new SEO pages.
- Query-param SEO policy was expanded for noisy URLs (`utm_*`, `gclid`, `yclid`, `fbclid`, `filter`, plus existing `search`, `sort`, `page`, `cat`, `compare`).
- Core sitemap cache key was bumped so the new SEO routes are emitted after deploy.

Privacy regression status: P0 supplier contact leak was not reintroduced. Strict checks on locked supplier/catalog/category pages found no real vendor contact URLs, no private field names, no LocalBusiness/telephone/sameAs/streetAddress leakage.

## Files changed for Stage 2

Primary SEO additions:

- `app/llms.txt/route.ts`
- `app/[locale]/how-it-works/page.tsx`
- `app/[locale]/for-buyers/page.tsx`
- `app/[locale]/for-sellers/page.tsx`
- `app/[locale]/dordoi-kazakhstan/page.tsx`
- `app/[locale]/dordoi-uzbekistan/page.tsx`
- `app/[locale]/dordoi-tajikistan/page.tsx`
- `app/[locale]/dordoi-russia/page.tsx`
- `app/[locale]/dordoi-kyrgyzstan/page.tsx`
- `app/[locale]/blog/page.tsx`
- `app/[locale]/blog/[slug]/page.tsx`
- `components/seo/SafePageSchemaJsonLd.tsx`
- `components/seo/SeoGrowthLandingPage.tsx`
- `components/seo/BlogHubPage.tsx`
- `components/seo/BlogGuidePage.tsx`
- `components/seo/HomeSeoGrowthLinks.tsx`
- `lib/seo/stage2-content.ts`

SEO integrations:

- `next.config.ts`
- `lib/seo.ts`
- `lib/catalog/catalog-page-seo.ts`
- `lib/sitemap/build-core-sitemap-xml.ts`
- `components/seo/SiteBrandJsonLd.tsx`
- `components/seo/SeoCoreLanding.tsx`
- `components/seo/SeoCategoryLanding.tsx`
- `components/layout/SiteHeader.tsx`
- `components/layout/SiteFooter.tsx`
- `app/[locale]/page.tsx`
- `app/[locale]/about/page.tsx`
- `app/[locale]/faq/page.tsx`
- `app/[locale]/catalog/page.tsx`
- `app/[locale]/suppliers/page.tsx`
- `app/[locale]/buyer-service/page.tsx`
- `app/[locale]/buyers/page.tsx`
- `app/[locale]/sell/page.tsx`

Note: Stage 1 privacy files are still present in the working tree from the previous scoped task. They were not reverted.

## Added URLs

AI/GEO core pages:

- `/ru/about`
- `/ru/how-it-works`
- `/ru/faq`
- `/ru/for-buyers`
- `/ru/for-sellers`
- `/llms.txt`

Country pages:

- `/ru/dordoi-kazakhstan`
- `/ru/dordoi-uzbekistan`
- `/ru/dordoi-tajikistan`
- `/ru/dordoi-russia`
- `/ru/dordoi-kyrgyzstan`

Blog foundation:

- `/ru/blog`
- `/ru/blog/kak-nayti-postavshchika-dordoi`
- `/ru/blog/kargo-dordoi-kak-rabotaet-dostavka`
- `/ru/blog/kak-kupit-optom-na-dordoe`

The same route structure is available under configured locales because the pages live under `[locale]`.

## Redirects added

Implemented in `next.config.ts` with `statusCode: 301`:

- `/:locale/dordoi-market` -> `/:locale/rynok-dordoi`
- `/:locale/wholesale` -> `/:locale/dordoi-optom`
- `/:locale/cargo` -> `/:locale/kargo-dordoi`

Verified:

- `/ru/dordoi-market` -> 301 `/ru/rynok-dordoi`
- `/ru/wholesale` -> 301 `/ru/dordoi-optom`
- `/ru/cargo` -> 301 `/ru/kargo-dordoi`
- sampled `kk`, `kg`, `uz`, `tj` aliases also return 301.

## Schema added or strengthened

| Schema | Where | Privacy status |
|---|---|---|
| Organization | site-wide `SiteBrandJsonLd` | Safe site-level contact only, no vendor contacts |
| WebSite + SearchAction | site-wide `SiteBrandJsonLd` | Safe, points to `/ru/catalog?search={search_term_string}` |
| WebPage | AI/core/country/landing pages | Safe |
| CollectionPage | catalog, suppliers, categories, blog hub | Safe |
| BreadcrumbList | SEO landings, categories, blog, core pages | Safe |
| FAQPage | pages with visible FAQ content | Safe |
| Service | cargo, buyer-service, sell/for-sellers where relevant | Safe |
| BlogPosting | first three blog guides | Safe |

Not added:

- No fake `Review` / `AggregateRating`.
- No `Product` schema without real product pages.
- No `LocalBusiness` for locked supplier pages.
- No vendor phone/social/map fields in new JSON-LD.

## Internal linking

Header now links to:

- Catalog
- Suppliers
- Buyers
- Sellers
- Cargo
- How it works

Footer now links to:

- Core catalog/supplier/buyer/cargo pages
- Market/wholesale/cargo/buyer-service
- Buyers/sellers/how-it-works/blog
- Country pages
- Main categories
- Legal/support pages

Homepage now includes a compact SEO link block for:

- Suppliers/catalog/buyers
- Popular categories
- Country pages
- Buying/selling/how-it-works/FAQ/cargo

Category pages now include:

- Related categories
- Buyer/cargo/wholesale support links
- Country landing links

Core SEO landings now include country links.

Buyers page now links to country landing pages.

## Query-param SEO policy

Clean `/catalog` remains indexable when production indexing is enabled.

Noisy query-param versions now resolve to canonical clean catalog URLs with noindex/follow policy:

- `?cat`
- `?page`
- `?search`
- `?sort`
- `?filter`
- `?compare`
- `utm_*`
- `gclid`
- `yclid`
- `fbclid`

Verified sample:

- `/ru/catalog?search=test&utm_source=x&gclid=abc`
- HTTP 200
- canonical: `/ru/catalog`
- robots under production-like indexing: `noindex, follow`

## Sitemap

`publicRoutes` was extended with the new Stage 2 routes and first three blog posts.

Core sitemap cache key was changed from `sitemap-core-xml` to `sitemap-core-xml-v2` to avoid serving stale XML after deployment.

Verified with read-only local production server and network access:

- `/sitemaps/core.xml` HTTP 200
- alias hits: `0`
- missing new routes: none
- XML length: 178463

Local note: when `NEXT_PUBLIC_SITE_INDEXABLE=false`, sitemap intentionally returns an empty URL set and pages emit `noindex,nofollow`.

Production note: canonical host in the normal local build is `http://localhost:3000` because `NEXT_PUBLIC_APP_URL` is build-time. Production build/deploy must set `NEXT_PUBLIC_APP_URL=https://dordoi.help` before `next build`.

## Privacy regression check

Checked locked/public pages:

- `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`
- `/ru/categories/zhenskaya-odezhda-optom`
- `/ru/suppliers/asso-corsets`

Strict pattern checked:

```text
https?://wa\.me/[A-Za-z0-9_+%-]+|tel:\+?[0-9][0-9()\-\s]{5,}|https?://t\.me/[A-Za-z0-9_+-]{3,}|https?://(?:www\.)?instagram\.com/[A-Za-z0-9_.-]{2,}|telephone|sameAs|phone_number|whatsapp_1|whatsapp_2|telegram_url|instagram_url|google_maps_uri|two_gis_uri|yandex_maps_uri|primaryWhatsapp|secondaryWhatsapp|telegramHref|instagramHref|telHref|twoGisHref|LocalBusiness|streetAddress
```

Result:

- Catalog page: HTTP 200, strict matches empty.
- Category page: HTTP 200, strict matches empty.
- Supplier page: HTTP 200, strict matches empty.

Broad grep still finds generic false positives:

- `https://www.instagram.com/…` from an admin playground placeholder string serialized in messages.
- `t.Me` from `Next.Metadata` text fragments.

These are not real vendor contacts and do not include vendor handles, phone numbers, WhatsApp links, Telegram profile links, map links, or private field names.

## Verification commands

Passed:

```powershell
npx.cmd tsc --noEmit
```

Passed:

```powershell
$tests = rg --files -g "*.test.ts" -g "*.test.tsx"; node --test --import tsx $tests
```

Result: 65 tests passed, 0 failed.

Passed:

```powershell
npm.cmd run build
```

Build result:

- compiled successfully
- TypeScript finished
- generated 280 static pages
- `llms.txt` route present
- new Stage 2 routes present

Local route crawl:

- Important Stage 2 and existing SEO URLs returned 200.
- Redirect aliases returned 301 after final build.
- Query-param catalog sample returned `noindex, follow` under production-like indexing.
- Core sitemap returned 200 with new routes present when network access was available.

## Remaining risks / follow-up

1. Local `.env.local` intentionally emits `noindex,nofollow`; production must have `NEXT_PUBLIC_SITE_INDEXABLE=true`.
2. Production canonical URLs require `NEXT_PUBLIC_APP_URL=https://dordoi.help` before `next build`.
3. Generic admin i18n strings are serialized into public RSC payloads; not a vendor privacy leak, but it adds noisy strings such as `https://www.instagram.com/…`. Consider pruning public message payloads in a later non-privacy-critical optimization.
4. Blog foundation has only 3 guides by design; Stage 3 should expand content based on Search Console impressions and country/category demand.
5. Country pages are RU-first. Other locales resolve but should receive native localized content in a later localization pass.

## Stage 3 recommendations

1. Add dedicated category expansion pages for top commercial clusters: women's clothing, men's clothing, kids, footwear, fabrics, bags.
2. Build native localized content for `kk`, `kg/ky`, `uz`, `tj`.
3. Add a real `/contact` trust upgrade if business contact details are ready.
4. Add editorial review workflow for blog/guides before scaling beyond the first three articles.
5. Add GSC/Yandex monitoring for redirects, indexed pages, duplicate canonicals, and query-param discovery.
6. Add automated smoke check for: redirects, `/llms.txt`, sitemap aliases, query noindex, and strict vendor privacy grep.
