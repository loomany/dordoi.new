# Dordoi.help — Full SEO audit (final)

Date: 2026-05-18  
Scope: post i18n / AI-GEO / favicon / privacy work  
Mode: **AUDIT ONLY** — no code, env, DB, or deploy changes made during this audit

---

## 1. Executive summary

| Dimension | Status | Score |
|-----------|--------|-------|
| Indexability | **Ready** | ✅ |
| Multilingual (5 locales) | **Ready** | ✅ |
| Sitemap / robots | **Ready** | ✅ |
| Privacy (vendor contacts) | **Ready** | ✅ |
| AI / GEO (llms + crawlers) | **Ready** | ✅ |
| Favicon (Yandex) | **Fixed & live** | ✅ |
| Content depth (guides) | **Strong** | ✅ |
| Performance / CWV | **Unknown / heavy HTML** | ⚠️ P2 |
| GSC/Yandex data | **Pending** | ⏳ |

**Overall verdict:** Site is **ready for indexing and promotion** in Google, Yandex, Bing, and major AI crawlers. Do **not** add bulk content until 2–4 weeks of Search Console / Webmaster data.

---

## 2. What is already good

- **585/585** live SEO smoke checks
- **389 routes** i18n crawl — 0 canonical/hreflang/privacy failures
- **375 URLs** in sitemap; 170 localized guides; no localhost/aliases
- **hreflang:** ru, kk, ky, uz, tg, x-default; `/kg`→ky, `/tj`→tg
- **34 RU guides** + full locale slug matrix
- **llms.txt** with privacy + sitemap + anti-hallucination rules
- **AI crawlers** allowed in robots.txt
- **Favicon:** BMP-in-ICO 5430 B live; YandexFavicons 200
- **Privacy:** locked vendor pages pass strict grep
- **Schema:** FAQPage, BlogPosting, Service, CollectionPage — no fake ratings
- **Git:** clean tree; commits `f884f65` (i18n), `0be316d` (favicon)

---

## 3. Problems by priority

### P0 — Critical

**None** identified in automated + live audit.

### P1 — High

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| GSC/Yandex data not yet analyzed | Can't prioritize content ROI | Submit sitemap; monitor 3–7 days |
| DB Cyrillic vendor names on UZ | Locale quality / trust | Content pipeline when approved |
| `/ru/buyer-service` thin meta | Snippet quality | Tune after impression data |

### P2 — Medium

| Issue | Impact | Recommendation |
|-------|--------|----------------|
| Large HTML (catalog ~382 KB) | CWV / mobile | Lighthouse after indexing; lazy-load if needed |
| AI blocks hidden in UI | UX vs SEO tradeoff | Product decision; DOM retained |
| Yandex favicon warning may linger | UX in Webmaster | Manual recheck; wait ~2 weeks |
| favicon.ico missing explicit `type` in head | Minor Yandex doc gap | Optional metadata tweak later |

### P3 — Later

- Human translation review (kk/kg/uz/tj)
- Backlinks / brand authority
- Stage 6 snippet wins from GSC queries
- Category URL alias localization (deferred)

---

## 4. Residual risks

1. **Vendor DB content** not fully localized
2. **Category localized aliases** deferred
3. **CWV** not measured with Lighthouse (TTFB 200–280 ms; HTML 170–382 KB)
4. **Authority** — new domain / limited backlinks
5. **AI hallucination** of contacts despite llms.txt
6. **Regression** — future features must keep smoke green

---

## 5. What to do next

### Owner manual (now)

1. Submit `https://dordoi.help/sitemap.xml` in **Google Search Console** and **Yandex Webmaster**
2. Request indexing for Priority 1 URLs (see `dordoi-gsc-yandex-readiness-2026-05-18.md`)
3. Re-check favicon in Yandex Diagnostics
4. Set up weekly export: impressions, clicks, indexed pages by locale

### Team (after data — week 2–4)

1. **No new bulk SEO pages**
2. Improve titles/descriptions on pages with impressions & low CTR
3. Run Lighthouse on `/ru/catalog` and top category if CWV flags appear
4. Plan Stage 6 from keyword gap report winners only

---

## 6. Status table

| Area | Status | Risk | Recommendation |
|------|--------|------|----------------|
| Git / deploy state | ✅ Clean | Low | None |
| robots.txt | ✅ Pass | Low | Monitor query exclusions |
| Sitemap | ✅ 375 URLs | Low | Keep smoke on deploy |
| hreflang / canonical | ✅ Pass | Low | Monitor GSC i18n report |
| i18n content | ✅ Pass | Med | DB names on UZ |
| Guides / clusters | ✅ Covered | Low | Wait for GSC |
| Schema | ✅ Pass | Low | Watch rich results |
| Privacy | ✅ Pass | Med | Regression tests each deploy |
| AI / llms.txt | ✅ Pass | Low | Optional AI traffic tracking |
| Favicon / Yandex | ✅ Live fix | Low | Manual Webmaster recheck |
| Performance | ⚠️ Heavy HTML | Med | Lighthouse when indexed |
| GSC readiness | ⏳ Pending | Med | Submit + monitor |

---

## 7. Automated test summary

| Test | Result |
|------|--------|
| `check:i18n` | PASS |
| `tsc --noEmit` | PASS |
| blog localized tests | 4/4 |
| production build | 435 pages |
| `seo:smoke:dordoi` | 585/585 |
| `seo:i18n:full` | 10/10, 389 routes |
| `audit:favicon` | 6/6 |
| Technical URL sample (44) | 44/44 HTTP 200 |

---

## 8. Deliverables index

| Report |
|--------|
| `dordoi-full-seo-audit-2026-05-18.md` |
| `dordoi-technical-seo-audit-2026-05-18.csv` |
| `dordoi-sitemap-audit-2026-05-18.md` |
| `dordoi-sitemap-url-inventory-2026-05-18.csv` |
| `dordoi-robots-ai-crawler-audit-2026-05-18.md` |
| `dordoi-multilingual-seo-audit-2026-05-18.csv` |
| `dordoi-content-quality-audit-2026-05-18.md` |
| `dordoi-internal-linking-audit-2026-05-18.md` |
| `dordoi-schema-audit-2026-05-18.md` |
| `dordoi-privacy-seo-audit-2026-05-18.md` |
| `dordoi-ai-visibility-audit-final-2026-05-18.md` |
| `dordoi-favicon-yandex-final-audit-2026-05-18.md` |
| `dordoi-performance-cwv-audit-2026-05-18.md` |
| `dordoi-gsc-yandex-readiness-2026-05-18.md` |
| `dordoi-keyword-gap-audit-2026-05-18.md` |
| **`dordoi-full-seo-audit-final-2026-05-18.md`** (this file) |

---

## 8. Final verdict

| Question | Answer |
|----------|--------|
| Ready for indexing? | **Yes** |
| Ready for more content? | **No** — wait for GSC/Yandex (2–4 weeks) |
| Ready for Google / Yandex / Bing / AI crawlers? | **Yes** (technical layer complete) |
| Owner action required? | **Yes** — submit sitemap, request indexing, monitor |

**No code was modified during this audit. No commit. No push.**
