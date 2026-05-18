# Dordoi.help — Post-deploy i18n/SEO validation

Date: 2026-05-18  
Production base: `https://dordoi.help`

## 1. Push

| Item | Value |
|------|--------|
| Branch | `main` |
| Pushed commit | `f884f65` — feat(i18n): complete multilingual SEO translation coverage |
| Remote range | `9f9f719..f884f65` |
| Push result | Success (`origin/main` updated) |

No additional commit was created for this validation run.

## 2. Deploy status

| Check | Result |
|-------|--------|
| Production probe | `https://dordoi.help/kk` returned HTTP 200 with self-canonical `https://dordoi.help/kk` |
| Post-push smoke | Live checks passed immediately after push (no deploy blocker observed) |
| Deploy platform API | Not available in this environment (`gh` CLI missing); status inferred from live HTTP + smoke |

**Verdict:** Production is serving the pushed build. Treat deploy as **complete** for validation purposes.

## 3. Production environment (inferred from live behavior)

Server env vars are not readable from outside the host. Behavior on `https://dordoi.help` matches the required production settings:

| Variable | Expected | Live evidence |
|----------|----------|---------------|
| `NEXT_PUBLIC_SITE_INDEXABLE` | `true` | `robots.txt` allows `/` for `*`, Googlebot, YandexBot, AI crawlers; not `Disallow: /` globally |
| `NEXT_PUBLIC_APP_URL` | `https://dordoi.help` | `Host: dordoi.help`; `Sitemap: https://dordoi.help/sitemap.xml`; page canonicals use `https://dordoi.help/...` (no `localhost` / `127.0.0.1` in sitemaps or sampled HTML) |

**Action for owner:** Confirm both vars remain set in Railway/hosting dashboard after future redeploys.

## 4. Live smoke — `seo:smoke:dordoi`

```bash
BASE_URL=https://dordoi.help npm run seo:smoke:dordoi
```

| Result | Detail |
|--------|--------|
| **PASS** | **585/585** checks |

Highlights:

- Redirects: `/ru/dordoi-market` → `/ru/rynok-dordoi`, `/ru/wholesale` → `/ru/dordoi-optom`, `/ru/cargo` → `/ru/kargo-dordoi`
- `llms.txt`, `robots.txt`, `sitemap.xml`, `sitemaps/core.xml` — OK
- Sitemap contains localized guide URLs (`kk`, `kg`, `uz`, `tj`); no localhost
- Privacy grep on locked pages — PASS (see §8)
- Localized guide samples — PASS (canonical, hreflang, BlogPosting, no private leaks)

## 5. Full i18n smoke — `seo:i18n:full`

```bash
BASE_URL=https://dordoi.help NEXT_PUBLIC_APP_URL=https://dordoi.help npm run seo:i18n:full
```

| Result | Detail |
|--------|--------|
| **PASS** | **10/10** gate checks |
| Crawl | **389** public routes |

Gate checks: sitemap index, `sitemaps/core.xml`, no localhost in sitemaps, no noncanonical localized source slugs in sitemap, legacy redirects.

Per-route crawl (CSV): **0** rows with `canonicalOk=false`, `hreflangOk=false`, or `privateLeakFound` set.

Reports updated:

- `reports/seo/dordoi-i18n-full-crawl-2026-05-18.csv`
- `reports/seo/dordoi-i18n-visible-crawl-2026-05-18.csv`
- `reports/seo/dordoi-hreflang-canonical-all-locales-2026-05-18.csv`

## 6. Sitemap / robots / llms

| URL | HTTP | Notes |
|-----|------|-------|
| https://dordoi.help/sitemap.xml | 200 | Index (~386 B); points to sub-sitemaps |
| https://dordoi.help/sitemaps/core.xml | 200 | ~318 KB; contains localized URLs |
| https://dordoi.help/robots.txt | 200 | `Allow: /`; disallows API/admin/auth/checkout/query params; `Sitemap: https://dordoi.help/sitemap.xml` |
| https://dordoi.help/llms.txt | 200 | Describes site, languages, privacy rules |

**Sitemap spot-check (in `sitemaps/core.xml`):**

- `kk/blog/dordoi-koterme-tolyk-nuskaulyk` — present
- `kg/blog/dordoi-dununon-toluk-koldonmo` — present
- `uz/blog/dordoy-ulgurji-toliq-qollanma` — present
- `tj/blog/dordoi-yakluht-dasturi-purra` — present
- `localhost` / `127.0.0.1` — **not found**

## 7. Sample localized URL checks

| URL | Status | robots | Canonical | hreflang | Localization |
|-----|--------|--------|-----------|----------|--------------|
| https://dordoi.help/ru | 200 | index, follow | self | ru, kk, ky, uz, tg, x-default | RU UI |
| https://dordoi.help/kk | 200 | index, follow | self | full set | KK UI |
| https://dordoi.help/kg | 200 | index, follow | self | full set | KG route, `html lang=ky` |
| https://dordoi.help/uz | 200 | index, follow | self | full set | UZ UI |
| https://dordoi.help/tj | 200 | index, follow | self | full set | TJ route, `html lang=tg` |
| https://dordoi.help/ru/blog/dordoi-optom-polnyy-gid | 200 | index, follow | self | full set | RU guide |
| https://dordoi.help/kk/blog/dordoi-koterme-tolyk-nuskaulyk | 200 | index, follow | self | full set | KK guide |
| https://dordoi.help/kg/blog/dordoi-dununon-toluk-koldonmo | 200 | index, follow | self | full set | KY guide |
| https://dordoi.help/uz/blog/dordoy-ulgurji-toliq-qollanma | 200 | index, follow | self | full set | UZ guide |
| https://dordoi.help/tj/blog/dordoi-yakluht-dasturi-purra | 200 | index, follow | self | full set | TG guide |

Crawl CSV confirms for sample guides: `canonicalOk=true`, `hreflangOk=true`, `titleLanguageOk=true`, `h1LanguageOk=true`, no `privateLeakFound`.

## 8. Privacy grep (locked / sensitive pages)

Paths checked (same as `seo:smoke:dordoi`):

| Path | HTTP | Smoke result |
|------|------|--------------|
| /ru/catalog/postavshik-zhenskoy-odezhdy-a9e9 | 200 | PASS |
| /ru/categories/zhenskaya-odezhda-optom | 200 | PASS |
| /ru/suppliers/asso-corsets | 200 | PASS |

Patterns excluded by smoke: `wa.me`, `tel:`, vendor `t.me` / `instagram.com`, `phone_number`, `whatsapp_1`, `telegram_url`, `instagram_url`, `LocalBusiness`, `telephone`, `sameAs`, `streetAddress` (vendor-private context).

Full i18n crawl (389 routes): **0** `privateLeakFound` rows.

## 9. Remaining risks

1. **DB-backed Cyrillic on UZ pages** — some vendor/store names remain in source language; not a static i18n gap; needs content/owner workflow if translation is desired.
2. **Identical-to-RU report noise** — `npm run report:i18n-identical-to-ru` may still flag allowed terms (`FAQ`, brand names, `Каталог`, etc.).
3. **Deploy observability** — no CI/deploy URL captured here; rely on hosting dashboard for build logs.
4. **Prior UX commit** — `9f9f719` (hide «Коротко» UI block) is included in history before `f884f65`; block remains in HTML (`hidden`) for SEO smoke `data-ai-answer-block` checks.

No new SEO code changes were made during this validation.

## 10. Manual steps — Google Search Console / Yandex Webmaster

1. **Google Search Console** — add/verify property `https://dordoi.help` if not already.
2. Submit sitemap: `https://dordoi.help/sitemap.xml`.
3. **URL inspection / Request indexing** (priority):
   - `https://dordoi.help/ru`, `/kk`, `/kg`, `/uz`, `/tj`
   - `https://dordoi.help/ru/catalog`
   - Top categories, e.g. `/ru/categories/zhenskaya-odezhda-optom`
   - `https://dordoi.help/ru/blog`
   - Sample guides (RU + KK/KG/UZ/TJ slugs from §7)
   - `/ru/about`, `/ru/how-it-works`, `/ru/faq`
   - Country pages: `/ru/dordoi-kazakhstan`, `/ru/dordoi-kyrgyzstan`, etc.
4. **Yandex Webmaster** — same sitemap URL; confirm region Kyrgyzstan / CIS relevance.
5. Monitor **Coverage** / **Pages** for excluded URLs (`?cat=`, `?page=`, cabinet, payment) — expected via `robots.txt`.
6. After 1–2 weeks, review queries for localized locales (`kk`, `uz`, …) and fix only real CTR/snippet issues (no bulk rewrites without approval).

## Summary

| Step | Status |
|------|--------|
| Push `f884f65` to `main` | Done |
| Deploy | Live production OK |
| Env (indexable + APP_URL) | Matches expected (inferred) |
| `seo:smoke:dordoi` | **585/585 PASS** |
| `seo:i18n:full` | **10/10 PASS**, 389 routes crawled |
| Sitemap / robots / llms | PASS |
| Localized samples | PASS |
| Privacy grep | PASS |

**Overall:** Production i18n/SEO validation **passed**. Proceed with Search Console / Yandex manual submission (§10).
