# Dordoi.help Full SEO Audit

**Date:** 2026-05-13  
**Site:** https://dordoi.help  
**Locales:** ru, kk, kg (hreflang `ky`), uz, tj (hreflang `tg`)  
**Mode:** audit-only — code, DB, env, auth, payments, commit/push **not modified**.

---

## Executive Summary

Dordoi.help is **technically indexable** on production: `robots.txt` allows crawling, `sitemap.xml` returns 65 URLs (13 static routes × 5 locales), pages emit `index, follow`, canonical and hreflang (`ky`/`tg`) are correct in HTML and sitemap.

**Readiness for 5-language SEO traffic: partial.**

| Area | Status |
|------|--------|
| Technical base (robots, sitemap, canonical, hreflang) | Good |
| RU content / intent coverage | Weak–medium |
| URL architecture for commercial queries | Incomplete |
| Vendor privacy / slug safety | **Critical risk** |
| KK/UZ | Cautious index |
| KG/TJ | Index after manual translation review |

**Top blockers:** (1) vendor slugs and public titles expose Instagram brands; contacts public without gating; (2) `/ru/suppliers` is seller-facing not buyer SEO; (3) missing landings `/dordoi-market`, `/wholesale`, `/cargo`, `/categories/*`; (4) catalog query URLs duplicate canonical; (5) thin commercial copy on catalog/suppliers.

---

## Critical Issues

1. **Vendor slug = brand/handle** — live slugs `asso-corsets`, `arusha-kg`, `slavyana-moda`, `gukakg0`, `topnus312` (translit from `store_name`). Users can Google the brand and bypass the catalog.

2. **Vendor profile H1/title = brand** — e.g. `/ru/catalog/asso-corsets` → H1 `Asso`, title `Asso — оптовый поставщик`.

3. **Full contacts on profiles without paywall** — live: `wa.me`, `t.me`, `tel:`, `instagram.com` in HTML; `telephone` in JSON-LD `LocalBusiness`.

4. **Catalog cards expose brands + IG affordance** — ~13 `instagram.com` references in `/ru/catalog` HTML/RSC; visible IG-styled button on cards; titles like Asso, Arusha, Slavyana moda.

5. **`/ru/suppliers` wrong search intent** — title/H1 «Поставщикам» (for sellers). Competes with nothing for «поставщики Дордой» buyer queries.

6. **Catalog query duplicates indexed** — `/ru/catalog?page=2`, `?cat=women-outerwear`, `?compare=1` all `200` with same canonical `/ru/catalog` and `index, follow`.

---

## High Priority Issues

1. **Missing SEO landings (404):** `/ru/cargo`, `/ru/dordoi-market`, `/ru/wholesale`, `/ru/categories/*`.

2. **Catalog H1/title weak for browse intent** — H1 «Прямые оптовые поставщики» (no «Дордой», no «каталог»); title «Каталог категорий».

3. **No SEO body below catalog grid** — no FAQ, no category hub links, no footer SEO blocks.

4. **Vendor URLs not in sitemap** — only static routes; approved vendor pages discoverable only via catalog links.

5. **Title template duplication** — some pages show `| Dordoi.help | Dordoi.help` (template + suffix).

6. **Subtitle overclaims** — catalog subtitle says «связывайтесь напрямую» while business model may gate contacts.

7. **Footer lacks commercial links** — no catalog, suppliers, buyers, cargo in [`SiteFooter.tsx`](../components/layout/SiteFooter.tsx).

8. **No `ItemList` / `BreadcrumbList` / catalog `FAQPage` JSON-LD**.

9. **`/faq` has no `FAQPage` schema** despite visible Q&A.

10. **404 page** hardcoded `lang="ru"` in [`app/not-found.tsx`](../app/not-found.tsx).

---

## Medium Priority Issues

- Home value prop says «прямые контакты» — align with gating policy.
- `/ru/buyer-service`, `/ru/about`, `/ru/suppliers` are thin `ArticlePage` (one paragraph).
- Search input on catalog appears client-side only — no dedicated search URL strategy.
- `?compare=1` debug URL indexable.
- KG/TJ translations shorter on legal/about pages.
- Competitors (dordoi.com, dordoi.me, Qoovee) have more long-form market content and direct contacts — dordoi.help must differentiate on curation + buyers, not raw contact dump.

---

## Low Priority / Nice to Have

- `BreadcrumbList` JSON-LD on catalog and category pages.
- `ItemList` on `/ru/catalog` for rich results (after privacy fix).
- English locale for export queries — not in scope.
- PageSpeed/CWV formal audit — not run in this pass; catalog is image-heavy (vendor photos).
- Split sitemap when vendor count grows.

---

## Route Inventory

See [`dordoi-route-inventory-2026-05-13.csv`](dordoi-route-inventory-2026-05-13.csv).

**Existing public routes:** `/`, `/catalog`, `/catalog/[slug]`, `/sell`, `/suppliers`, `/buyers`, `/buyer-service`, `/about`, `/help`, `/faq`, `/contact`, `/privacy`, `/terms`, `/refund`.

**Missing (404 on live):** `/cargo`, `/dordoi-market`, `/wholesale`, `/categories/*`, `/providers`, `/for-buyers-from-*`.

---

## Technical SEO Findings

### robots.txt

- `Allow: /`
- `Disallow:` `/api/`, `/admin/`, `/account/`, `/signin`, `/legacy/`, `/test/`, `/preview/`, `/*/cabinet/`
- `Sitemap: https://dordoi.help/sitemap.xml`
- `Host: dordoi.help`

### sitemap.xml

- `200`, `Content-Type: application/xml; charset=utf-8`
- **65 URLs** = 13 `publicRoutes` × 5 locales
- hreflang: `ru`, `kk`, `ky`, `uz`, `tg`, `x-default` → `/ru/...`
- No `:8080`, `localhost`, `instagram`, `t.me`
- **Vendor profile URLs omitted**

### Canonical / hreflang

- Implemented in [`lib/seo.ts`](../lib/seo.ts) + [`lib/hreflang.ts`](../lib/hreflang.ts)
- HTML contains 6 `rel=alternate` + self canonical (verified `/ru`, `/ru/catalog`)
- URL segments `kg`/`tj`; hreflang `ky`/`tg` — **correct**

### metadataBase

- [`lib/site.ts`](../lib/site.ts) → `NEXT_PUBLIC_APP_URL`; strips `:8080` on HTTPS

### Redirects

- `/` → `307` → `/ru`
- Invalid vendor slug → `404`

### Structured data (current)

| Page | Schema |
|------|--------|
| All pages | `Organization` + `WebSite` ([`SiteBrandJsonLd.tsx`](../components/seo/SiteBrandJsonLd.tsx)) |
| Vendor profile | `LocalBusiness` + optional `FAQPage` |
| `/faq` | None |
| `/catalog` | None (`ItemList` missing) |

---

## URL Architecture & Intent Map

**Principle:** one URL = one intent. No duplicate grids or identical FAQ across landings.

| URL | Role | Main keyword |
|-----|------|--------------|
| `/ru` | Brand, product explanation | (brand) |
| `/ru/catalog` | **Browse** — cards, filters, search | каталог поставщиков Дордой |
| `/ru/suppliers` | **SEO landing** — about suppliers (buyers) | поставщики Дордой |
| `/ru/sell` | Seller onboarding | разместить магазин |
| `/ru/dordoi-market` | Market info (create) | рынок Дордой Бишкек |
| `/ru/wholesale` | Wholesale guide (create) | Дордой оптом |
| `/ru/cargo` | Cargo/delivery (create later) | карго Дордой |
| `/ru/categories/{slug}` | Category SEO (create) | e.g. женская одежда оптом Дордой |

**Do not** rename `/ru/catalog`. **Do not** put full vendor grid on `/suppliers`, `/wholesale`, `/dordoi-market`.

**`/ru/suppliers` conflict:** currently H1 «Поставщикам» (seller). Target: buyer SEO; seller → `/ru/sell`.

### Query params (`/ru/catalog`)

| URL | Recommendation |
|-----|----------------|
| `/ru/catalog` | index, follow |
| `?page=N` | noindex or canonical → `/ru/catalog` |
| `?cat=*` | noindex; canonical → `/ru/categories/{mapped}` when live |
| `?compare=1` | noindex, nofollow |
| `?search=`, `?sort=` | noindex when implemented |

---

## /ru/catalog Browse Page Audit

### Current (live 2026-05-13)

| Field | Value |
|-------|-------|
| Title | Каталог категорий — Dordoi.help |
| Meta description | Категории оптовых товаров рынка Дордой: одежда, обувь, ткани… |
| H1 | Прямые оптовые поставщики |
| Subtitle | …рынка Дордой… (~1 sentence) |
| Canonical | https://dordoi.help/ru/catalog |
| Robots | index, follow |
| Hreflang | 6 tags (ru/kk/ky/uz/tg/x-default) |
| Sitemap | Included |
| JSON-LD | Sitewide only; no ItemList |
| FAQ block | None |
| Content below grid | None |
| Categories | `?cat=` filter only — not SEO URLs |

### Sample vendor slugs on page 1

`asso-corsets`, `arusha-kg`, `slavyana-moda`, `gukakg0`, `dordoi-sulay-brand`, `kayakg1`, `topnus312`, `aistudiobrand-kg`, `melocotton-wear`, `korea-global-kg`, `lima-brand-kg`, `giza-optom`

### Privacy signals on catalog

- `instagram.com` references in HTML: **~13** (RSC payload + UI)
- `t.me`: ~2
- No `wa.me` / `tel:` on list page itself
- Card titles = searchable brand names

### Recommended (implementation later)

- **H1:** `Каталог оптовых поставщиков рынка Дордой`
- **Title:** `Каталог поставщиков Дордой — оптовые продавцы, фильтры и поиск | Dordoi.help`
- **Description:** include каталог, поставщики, опт, Бишкек, доступ через сервис
- **Intro:** 120–200 words under H1 (browse-focused)
- **Footer blocks:** how to use catalog; popular categories → `/categories/*`; links to `/suppliers`, `/wholesale`, `/cargo`, `/buyers`
- **FAQ:** 4–5 questions about catalog navigation only (not duplicate `/suppliers` FAQ)

---

## /ru/suppliers SEO Landing Gap

| | Current | Target |
|---|---------|--------|
| H1 | Поставщикам | Поставщики рынка Дордой — оптовые продавцы |
| Title | Поставщикам — Dordoi.help | Поставщики Дордой — оптовые продавцы рынка в Бишкеке |
| Audience | Sellers joining platform | Buyers researching suppliers |
| Content | 1 paragraph | 800–1200 words + unique FAQ |
| CTA | None | «Смотреть каталог» → `/ru/catalog` |
| Seller block | Primary | Secondary → `/ru/sell` |

---

## 5-Language SEO Readiness

| Locale | hreflang | Title/description | Index now? |
|--------|----------|-------------------|------------|
| ru | ru | Full `Seo.*` + rich home | **Yes** (priority) |
| kk | kk | Translated; suppliers still seller-intent | Cautious |
| kg | ky | Translated; some RU loanwords in UI | After review |
| uz | uz | Latin UZ; catalog OK | Cautious |
| tj | tg | Translated; shorter legal copy | After review |

All locales: `index, follow` on public pages; hreflang cluster complete per URL path.

---

## Content Audit (key RU pages)

| Page | Title intent match | H1 | Body depth |
|------|-------------------|-----|------------|
| Home | Good | Strong | Good (sections) |
| Catalog | Weak | Weak (no Дордой) | Thin above grid only |
| Suppliers | Wrong (seller) | Wrong | Thin |
| Buyers | Good | Good | Medium (directory) |
| Sell | Good | Good | Medium |
| About/Help/FAQ | OK | OK | Thin ArticlePage |
| Cargo | N/A | 404 | — |

---

## Missing SEO Landing Pages

See [`dordoi-seo-landing-pages-plan-2026-05-13.csv`](dordoi-seo-landing-pages-plan-2026-05-13.csv).

**Order:** P0 catalog metadata + suppliers rewrite → P1 dordoi-market + wholesale + 3–5 categories → P2 cargo → P3 country pages.

---

## Vendor SEO & Privacy Architecture

See [`dordoi-vendor-seo-privacy-plan-2026-05-13.md`](dordoi-vendor-seo-privacy-plan-2026-05-13.md).

**Safe slug:** `{category-prefix}-{random4}` — not `store_name` translit.

**Public card before access:** `Поставщик женской одежды №1024` — no IG icon, no brand H1.

---

## Keyword Matrix

See [`dordoi-keyword-matrix-2026-05-13.csv`](dordoi-keyword-matrix-2026-05-13.csv).

---

## Internal Linking Plan

| From | To | Anchor examples |
|------|-----|-----------------|
| Home | /catalog, /suppliers, /buyers | «Каталог поставщиков», «Байеры» |
| /catalog footer | /categories/*, /suppliers, /wholesale, /cargo | «Женская одежда оптом», «Поставщики Дордой» |
| /suppliers | /catalog | «Открыть каталог поставщиков» |
| /dordoi-market, /wholesale | /catalog, /categories/* | CTA buttons |
| Vendor profiles | category hub, similar suppliers | Category name |
| **Footer (add)** | catalog, suppliers, buyers, cargo, about | Commercial nav |

**Pass link equity:** `/suppliers`, `/dordoi-market`, `/wholesale` → `/catalog`.

---

## Structured Data Recommendations

| Page | Add (later) |
|------|-------------|
| `/faq` | `FAQPage` |
| `/catalog` | `BreadcrumbList`; `ItemList` after privacy fix |
| `/categories/*` | `BreadcrumbList`, `ItemList` |
| Vendor (gated) | `LocalBusiness` without phone/social until access |
| All landings | Unique `FAQPage` per page where FAQ exists |

Do not put Instagram/Telegram/phone in JSON-LD for gated vendors.

---

## Performance Notes

- Not measured with Lighthouse in this audit.
- Catalog loads 12 vendor cards with photos/videos per page — likely LCP sensitive.
- Fonts preloaded on HTML responses.
- `Cache-Control: private, no-cache` on HTML — expected for dynamic catalog.
- Recommend: measure LCP/CLS/INP on `/ru/catalog` mobile before ad spend.

---

## SERP / Competitor Notes

| Competitor | Strength | dordoi.help gap |
|------------|----------|-----------------|
| [dordoi.com](https://www.dordoi.com/) | Classic market catalog, long history | Less market encyclopedia content |
| [dordoi.me](https://dordoi.me/) | Marketplace, direct supplier contacts | They expose contacts; you need gated value prop |
| Qoovee Dordoi listings | B2B aggregator, bulk categories | More indexed supplier pages |

**Quick wins:** unique landings for «поставщики Дордой», «Дордой оптом», «рынок Дордой» with curated catalog CTA. **Hard:** head terms vs established dordoi.com without strong backlinks.

---

## 30-Day SEO Roadmap

1. Approve URL architecture + anti-duplicate checklist  
2. `/ru/catalog`: H1/title/description, intro, footer links, query noindex policy  
3. `/ru/suppliers`: rewrite as buyer SEO landing; seller → `/sell`  
4. Vendor privacy plan phase 1 (generic card titles, safe slugs for new vendors)  
5. Create `/ru/dordoi-market` + `/ru/wholesale`  
6. Launch 3–5 `/ru/categories/*`  
7. Register GSC; submit sitemap; monitor catalog vs suppliers impressions  

---

## 90-Day SEO Roadmap

1. `/ru/cargo` + country buyer pages (RU then locales)  
2. Dynamic vendor sitemap (safe slugs only)  
3. KK/UZ/KG/TJ mirror landings after RU content proof  
4. 5–10 combo country+category pages (noindex → index by data)  
5. CWV optimization pass on catalog images  
6. Backlink outreach to B2B/wholesale communities  

---

## Cursor Implementation Plan (do not execute now)

1. `messages/ru.json` — `Seo.catalog`, `Pages.catalogBrowse`, new namespaces for suppliers landing, dordoi-market, wholesale, cargo, categories  
2. New routes: `app/[locale]/dordoi-market/page.tsx`, `wholesale/page.tsx`, `cargo/page.tsx`, `categories/[slug]/page.tsx`  
3. Refactor `suppliers/page.tsx` from seller `ArticlePage` to buyer SEO layout  
4. `lib/seo.ts` — add routes to `publicRoutes`; catalog pagination metadata `noindex`  
5. `lib/catalog/vendor-slug.ts` — safe slug generator  
6. `published-vendors.ts` — remove `instagram_url` from list select; generic display names  
7. `CatalogCard.tsx` — remove IG button pre-access  
8. `DatabaseProviderProfileView.tsx` — contact gate + JSON-LD without phone  
9. `SiteFooter.tsx` — commercial links  
10. Sitemap: optional `sitemap-vendors.xml` dynamic route  

---

## Related deliverables

- [`dordoi-route-inventory-2026-05-13.csv`](dordoi-route-inventory-2026-05-13.csv)
- [`dordoi-keyword-matrix-2026-05-13.csv`](dordoi-keyword-matrix-2026-05-13.csv)
- [`dordoi-seo-landing-pages-plan-2026-05-13.csv`](dordoi-seo-landing-pages-plan-2026-05-13.csv)
- [`dordoi-vendor-seo-privacy-plan-2026-05-13.md`](dordoi-vendor-seo-privacy-plan-2026-05-13.md)
