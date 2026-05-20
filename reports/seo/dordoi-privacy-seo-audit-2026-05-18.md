# Dordoi.help — Privacy / paywall / vendor contact SEO audit

Date: 2026-05-18  
Mode: audit only

## Summary

**Verdict: PASS** for vendor-private data on locked pages.

## Smoke-tested locked pages

| URL | HTTP | Private pattern grep |
|-----|------|----------------------|
| `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9` | 200 | **PASS** |
| `/ru/categories/zhenskaya-odezhda-optom` | 200 | **PASS** |
| `/ru/suppliers/asso-corsets` | 200 | **PASS** |

Full i18n crawl (389 routes): **0** rows with `privateLeakFound`.

## Strict pattern coverage

Checked: `wa.me`, `tel:`, vendor `t.me`/`instagram.com`, `phone_number`, `whatsapp_*`, `telegram_url`, `instagram_url`, map URIs, `LocalBusiness`, `telephone`, `sameAs`, `streetAddress`.

## False positives (allowed public contacts)

Homepage HTML may contain **`t.me/dordoi_help_admin_bot`** — platform support bot, whitelisted in smoke script. **Not** a vendor contact leak.

## Guide pages

Contact-intent guides (e.g. `/ru/blog/kontakty-postavshchikov-dordoi-kak-otkryt-bezopasno`) explain safe access workflow without publishing vendor phone/Telegram lists (smoke content spot checks PASS).

## Sitemap

No API/auth/payment/admin/private endpoints in `sitemaps/core.xml`.

## Residual risk (P2)

- DB-backed vendor **names/descriptions** may remain Cyrillic on UZ pages (content/i18n, not contact leak).
- Future catalog cards must keep gated contact fields out of SSR/JSON-LD (regression risk — monitor via smoke).
