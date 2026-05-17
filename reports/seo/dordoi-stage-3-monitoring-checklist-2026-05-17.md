# Dordoi.help Stage 3 SEO Monitoring Checklist

Date: 2026-05-17
Mode: audit + monitoring checklist, no env changes

## Production Env Checklist

- `NEXT_PUBLIC_SITE_INDEXABLE=true`
- `NEXT_PUBLIC_APP_URL=https://dordoi.help`
- Submit only canonical HTTPS URLs.
- Do not submit query-param URLs, redirect aliases, drafts, admin/auth/payment URLs, or private vendor contact endpoints.

## Google Search Console

- Add and verify `https://dordoi.help/`.
- Submit `https://dordoi.help/sitemap.xml`.
- Check `Sitemaps`:
  - `sitemap.xml` discovered successfully.
  - `sitemaps/core.xml` discovered successfully.
  - No `localhost` or test host URLs.
  - Redirect aliases are absent.
- Check `Pages` weekly:
  - Indexed pages count.
  - `Discovered - currently not indexed`.
  - `Crawled - currently not indexed`.
  - `Duplicate without user-selected canonical`.
  - `Alternate page with proper canonical`.
  - `Not found (404)`.
  - `Page with redirect`.
  - `Excluded by noindex`.
- Check query-param discoveries:
  - `?search`, `?sort`, `?filter`, `?compare`, `utm_*`, `gclid`, `yclid`, `fbclid`.
  - Expected: clean canonical and `noindex, follow`.
- Check `Core Web Vitals`:
  - LCP for `/ru`, `/ru/catalog`, top category pages, country pages, blog.
  - INP on catalog/category pages with vendor cards.
  - CLS on category/blog pages.
- Check `Page Experience` and mobile usability.
- Check `Performance` weekly:
  - Top 20 queries.
  - Top 20 pages.
  - Countries.
  - Devices.
  - CTR and average position.
  - New impressions for category pages.
  - New impressions for country pages.
  - New impressions for blog guides.

## Yandex Webmaster

- Add and verify `https://dordoi.help/`.
- Submit `https://dordoi.help/sitemap.xml`.
- Check `robots.txt`.
- Check indexing:
  - Indexed pages.
  - Excluded pages.
  - Pages with redirects.
  - 404 errors.
  - Canonical conflicts.
  - Duplicate pages.
- Check regionality:
  - Kyrgyzstan/Bishkek signal.
  - CIS buyer pages and country pages.
- Check crawl status:
  - Important pages visited by YandexBot.
  - No crawl traps from query parameters.

## Weekly SEO Metrics

Record every week:

- Indexed pages count in Google and Yandex.
- Impressions.
- Clicks.
- CTR.
- Average position.
- Top 20 queries.
- Top 20 pages.
- Category page performance.
- Country page performance.
- Blog guide performance.
- New indexed pages.
- Pages discovered but not indexed.
- Pages crawled but not indexed.
- Duplicate canonical issues.
- `noindex` mistakes.
- 404 and redirect issues.
- Googlebot hits in logs.
- YandexBot hits in logs.
- AI crawler hits if user agents are visible in logs.

## Server / Log Checks

Filter logs weekly for:

- `/ru/categories/*`
- `/ru/dordoi-kazakhstan`
- `/ru/dordoi-uzbekistan`
- `/ru/dordoi-tajikistan`
- `/ru/dordoi-russia`
- `/ru/dordoi-kyrgyzstan`
- `/ru/blog/*`
- `/ru/catalog?*`
- `/ru/suppliers/*`
- Googlebot
- YandexBot
- Bingbot
- PerplexityBot, GPTBot, ClaudeBot, Google-Extended and other AI crawlers if logged

## Privacy Monitoring

Run strict grep on locked supplier/category pages after each deploy:

```bash
wa\.me|tel:|t\.me/[A-Za-z0-9_+-]{3,}|instagram\.com/[A-Za-z0-9_.-]{2,}|phone_number|whatsapp_1|whatsapp_2|telegram_url|instagram_url|google_maps_uri|two_gis_uri|yandex_maps_uri|primaryWhatsapp|secondaryWhatsapp|telegramHref|instagramHref|telHref|twoGisHref|LocalBusiness|telephone|sameAs|streetAddress
```

Expected:

- Generic labels like WhatsApp/Telegram may appear.
- Real vendor contact URLs must not appear.
- Locked buttons may remain visible.
- No `LocalBusiness.telephone`, `sameAs`, exact address or map URL for locked vendors.

## Decision Rules After 2-4 Weeks

- If category pages get impressions: add more supplier-safe content, related guides, and internal links for those categories.
- If country pages get impressions: expand country-specific buying/delivery content.
- If blog guides get impressions: publish more guides in the same cluster.
- If pages are `Discovered - currently not indexed`: improve visible content, internal links, and sitemap freshness.
- If pages are `Crawled - currently not indexed`: reduce thin content, add FAQ, improve category/vendor context.
- If duplicate canonical appears: review canonical/noindex logic and redirect aliases.
- If query-param URLs are discovered: confirm `noindex, follow` and canonical to clean URL.
- If privacy grep fails: treat as P0 and stop SEO expansion until fixed.
