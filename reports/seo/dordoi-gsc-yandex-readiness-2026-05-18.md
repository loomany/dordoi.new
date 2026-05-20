# Dordoi.help — Google Search Console / Yandex Webmaster readiness

Date: 2026-05-18

## Pre-submission checklist

| Item | Status |
|------|--------|
| Sitemap URL ready | ✅ `https://dordoi.help/sitemap.xml` |
| robots allows indexing | ✅ |
| Canonical host consistent | ✅ `https://dordoi.help` |
| hreflang complete | ✅ ru/kk/ky/uz/tg/x-default |
| Favicon crawler-safe | ✅ BMP-in-ICO live |
| Privacy-safe vendor pages | ✅ |
| Build/smoke green | ✅ 585 + 10/10 + 6/6 |

## Submit in GSC / Yandex

1. Add property `https://dordoi.help` (if not done)
2. Submit sitemap: `https://dordoi.help/sitemap.xml`
3. Yandex: set region relevance (Kyrgyzstan / CIS wholesale)
4. Re-check favicon in Yandex Diagnostics

## Priority 1 — Request indexing / monitor first

- https://dordoi.help/ru
- https://dordoi.help/kk
- https://dordoi.help/kg
- https://dordoi.help/uz
- https://dordoi.help/tj
- https://dordoi.help/ru/catalog
- https://dordoi.help/ru/blog
- https://dordoi.help/ru/about
- https://dordoi.help/ru/how-it-works
- https://dordoi.help/ru/faq

## Priority 2

**Top 9 categories (RU):**

- zhenskaya-odezhda-optom, muzhskaya-odezhda-optom, detskaya-odezhda-optom, obuv-optom, tkani-shveynaya-furnitura-optom, sumki-kozhgalantereya-optom, nizhnee-bele-kupalniki-optom, tekstil-dlya-doma-optom, aksessuary-optom

**Country pages:**

- dordoi-kazakhstan, dordoi-uzbekistan, dordoi-tajikistan, dordoi-russia, dordoi-kyrgyzstan (×5 locales in sitemap)

**Localized guide samples:**

- /ru/blog/dordoi-optom-polnyy-gid
- /kk/blog/dordoi-koterme-tolyk-nuskaulyk
- /kg/blog/dordoi-dununon-toluk-koldonmo
- /uz/blog/dordoy-ulgurji-toliq-qollanma
- /tj/blog/dordoi-yakluht-dasturi-purra

## Priority 3

Remaining ~34 RU guide clusters + localized slugs (170 guide URLs in sitemap).

## Expected exclusions (normal)

- `?cat=`, `?page=`, `?search=` — robots Disallow + noindex meta on catalog filters
- `/auth/`, `/payment/`, `/admin/`, `/api/` — blocked

## Likely “Discovered – not indexed” candidates

- Long-tail localized guides until crawl budget grows
- Some `/kg` `/tj` pages until hreflang signals propagate

## Monitoring schedule

| Window | Action |
|--------|--------|
| Days 3–7 | GSC Coverage, Yandex indexing, favicon status |
| Weeks 2–4 | Impressions by locale; CTR on top categories/guides |
| After data | Stage 6 — strengthen winners only; no bulk new pages |
