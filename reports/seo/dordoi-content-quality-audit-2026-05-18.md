# Dordoi.help — Content quality audit

Date: 2026-05-18  
Mode: audit only (no content changes)

## Method

- Live smoke content spot checks (585 checks)
- Full crawl 389 routes (language/body flags)
- Manual review of core/category/guide samples via HTML size + schema/FAQ presence

## Summary

**Verdict: Good foundation for indexing** — intent-aligned guides, FAQ, internal links, no fake guarantees in smoke. Some P1/P2 polish items remain.

## Strengths

| Area | Evidence |
|------|----------|
| Search intent | 34 RU guides + 170 localized URLs map to keyword clusters |
| FAQ | Present on about, how-it-works, FAQ, categories, guides |
| Internal links | Blog hub 67+ locale links; categories link to guides/cargo/buyer |
| Trust copy | Controlled-access messaging; no guaranteed deal/delivery in smoke |
| AI answer blocks | In DOM (`data-ai-answer-block`); **hidden in UI** by default (SEO/AI layer retained) |
| E-E-A-T signals | About, how-it-works, privacy-safe contact guides |

## Issues by priority

### P0 — Critical (harmful)

**None found** in automated audit (no fake ratings, no vendor contact leaks, no guaranteed-deal language in smoke).

### P1 — High (trust/indexing friction)

| Issue | Detail |
|-------|--------|
| `/ru/buyer-service` meta thin | Title/description shorter vs other core landings; may underperform snippets |
| DB Cyrillic on UZ | Vendor/store names from DB not translated — visible language leak on some UZ pages |
| Hidden AI blocks | «Коротко» blocks hidden (`hidden=true`) — good for UX, still in HTML for crawlers; confirm this matches product intent |

### P2 — Medium (improve after GSC data)

| Issue | Detail |
|-------|--------|
| Large HTML payloads | `/ru/catalog` ~382 KB HTML; categories ~327 KB — may affect CWV |
| Repetitive site graph | Organization block on every page (normal but heavy) |
| Some overlay strings identical to RU | Allowed terms (FAQ, Telegram brand) — human review optional |
| Country pages RU-only in sitemap count | 25 country URLs (5 countries × 5 locales pattern — verify impressions per locale in GSC) |

### P3 — Later

- Native copywriter review for kk/kg/uz/tj
- Visual/media enrichment on category pages
- Stronger author/byline on guides if Yandex/Google request E-E-A-T depth

## Cluster coverage (guides)

34 RU guide slugs + localized variants cover: wholesale core, catalog usage, supplier find/check, cargo, buyer, category commercial, marketplace, prices, safe contacts, country delivery.

See `dordoi-keyword-gap-audit-2026-05-18.md` for gap analysis.
