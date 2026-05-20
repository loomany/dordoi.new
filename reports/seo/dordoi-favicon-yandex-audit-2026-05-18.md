# Dordoi.help — Favicon / Yandex Webmaster audit

Date: 2026-05-18  
Site: `https://dordoi.help`

## 1. Yandex Webmaster symptom

Warning in Yandex Webmaster:

> «Нашему роботу не удалось загрузить изображение для favicon сайта dordoi.help.»

This means HTTP may succeed while the **image payload** is not decodable by `YandexFavicons`.

## 2. Live URL audit (before fix)

| URL | Status | Content-Type | Size | Notes |
|-----|--------|--------------|------|-------|
| `/favicon.ico` | **200** | `image/x-icon` | 603 B | **PNG-in-ICO** (magic `89 50 4E 47` at image offset) |
| `/favicon.png` | 404 | — | — | Not used in repo |
| `/icon.ico` | 404 | — | — | Not used |
| `/icon.png` | 404 | — | — | Not used |
| `/apple-icon.png` | 404 | — | — | Repo uses `/apple-touch-icon.png` |
| `/apple-touch-icon.png` | **200** | `image/png` | 3310 B | OK |
| `/manifest.webmanifest` | **200** | `application/manifest+json` | — | OK |
| `/manifest.json` | 404 | — | — | Next serves `.webmanifest` only |
| `/favicon-32.png` | **200** | `image/png` | 581 B | OK |
| `/favicon-120.png` | **200** | `image/png` | 2130 B | OK (Yandex snippet size) |
| `/favicon-32x32.png` | 404 | — | — | Not in repo (uses `favicon-32.png`) |
| `/favicon-16x16.png` | 404 | — | — | Missing before fix |
| `/icon-192.png` | 404 | — | — | Repo uses `/brand/logo-192.png` (200) |
| `/icon-512.png` | 404 | — | — | Repo uses `/brand/logo-512.png` (200) |

### Yandex user-agents (before fix)

| User-Agent | `/favicon.ico` |
|------------|----------------|
| `YandexFavicons/1.0` | 200, `image/x-icon`, 603 B |
| `YandexBot/3.0` | 200, `image/x-icon`, 603 B |

No redirect loop, no locale redirect, no auth, no HTML body, no localhost.

### Cache / CDN (before fix)

- `cache-control: public, max-age=14400`
- `cf-cache-status: REVALIDATED`
- Served from Cloudflare → Railway static `public/`

## 3. Root cause

**Primary:** `public/favicon.ico` was generated as **PNG compressed inside an ICO container** (`scripts/generate-brand-icons.mjs` → `pngToIco()`). Browsers accept this (Vista+), but **YandexFavicons often fails to decode PNG-in-ICO** while still reporting fetch success at HTTP layer → Webmaster warning.

**Secondary (non-blocking):**

- HTML listed `favicon-120.png` before `favicon.ico` (Yandex still probes `/favicon.ico` directly).
- No dedicated `favicon-16.png` (16×16 only inside broken ICO).
- Some conventional paths (`favicon-16x16.png`, `icon-192.png`) 404 — not referenced in metadata; acceptable.

**Not the cause:**

- robots.txt does **not** block favicon paths
- middleware excludes `.*\..*` static files — favicon not redirected to `/ru/...`
- Live PNG/SVG assets return 200
- No stale localhost in responses

## 4. Repo inventory

| Path | Role |
|------|------|
| `public/favicon.ico` | Root ICO (fixed → BMP 16+32) |
| `public/favicon-16.png` | **Added** |
| `public/favicon-32.png` | 32×32 PNG |
| `public/favicon-120.png` | 120×120 for Yandex snippets |
| `public/apple-touch-icon.png` | 180×180 |
| `public/brand/logo-192.png` | Manifest / PWA |
| `public/brand/logo-512.png` | Manifest / PWA |
| `public/brand/icon.svg` | Source art (not primary favicon link) |
| `app/layout.tsx` | `metadata.icons` |
| `app/manifest.ts` | Web manifest icons |
| `scripts/generate-brand-icons.mjs` | Generator |
| `scripts/seo/audit-favicon.mts` | Live/local audit |

No `app/favicon.ico` — static files served from `public/`.

## 5. robots.txt

`https://dordoi.help/robots.txt`:

- `Allow: /` for `*` and `YandexBot`
- **No** `Disallow` on `/favicon.ico`, `/favicon-*.png`, `/apple-touch-icon.png`, `/manifest.webmanifest`
- `/_next/static` not globally disallowed

## 6. HTML head (live before fix)

From `https://dordoi.help/ru`:

```html
<link rel="shortcut icon" href="/favicon.ico"/>
<link rel="icon" href="/favicon-120.png" sizes="120x120" type="image/png"/>
<link rel="icon" href="/favicon.ico" sizes="32x32" type="image/x-icon"/>
<link rel="icon" href="/favicon-32.png" sizes="32x32" type="image/png"/>
<link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" type="image/png"/>
<link rel="manifest" href="/manifest.webmanifest"/>
```

No localhost hrefs. `/favicon.ico` present but pointed to undecodable PNG-in-ICO file.

## 7. Minimal fix applied (local, not deployed)

### Changed files

| File | Change |
|------|--------|
| `scripts/generate-brand-icons.mjs` | Generate **classic BMP-in-ICO** with 16×16 + 32×32 entries |
| `public/favicon.ico` | Regenerated: 5430 B, DIB header `0x28` (not PNG) |
| `public/favicon-16.png` | New 16×16 PNG |
| `app/layout.tsx` | `favicon.ico` first with `sizes="any"`; add `favicon-16.png` |
| `app/manifest.ts` | ICO `sizes: "any"`, add 16×16 entry |
| `scripts/seo/audit-favicon.mts` | Fail if PNG-in-ICO detected |

**Not changed:** auth, payments, DB, env, SEO content/i18n pages.

### Local validation (after fix)

Server: `PORT=3005 npm run start`

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS (435 pages) |
| `BASE_URL=http://127.0.0.1:3005 npm run audit:favicon` | **6/6 PASS** |
| `/favicon.ico` | 200, `image/x-icon`, **5430 B**, BMP DIB |
| `/favicon-16.png` | 200, `image/png`, 347 B |
| HTML `/ru` | `favicon.ico sizes="any"` first |

## 8. Live deploy checklist (after owner approval)

```bash
curl -I https://dordoi.help/favicon.ico
curl -I https://dordoi.help/favicon-16.png
curl -I https://dordoi.help/favicon-32.png
curl -I https://dordoi.help/apple-touch-icon.png
curl -I https://dordoi.help/manifest.webmanifest

curl -I -A "Mozilla/5.0 (compatible; YandexFavicons/1.0; +http://yandex.com/bots)" https://dordoi.help/favicon.ico
```

Expected after deploy:

- HTTP **200**
- `favicon.ico` **> 1 KB**, image offset starts with **`0x28`** (BITMAPINFOHEADER), **not** `0x89 PNG`
- `npm run audit:favicon` with `BASE_URL=https://dordoi.help` — all PASS

## 9. Yandex Webmaster — manual steps (post-deploy)

See **§12** for current manual steps after deploy.

## 10. Remaining risks

- Yandex may still show the old warning until Webmaster recheck + favicon DB refresh (up to ~2 weeks).
- Favicon visual is brand SVG rasterized — design swap possible later via `npm run generate:brand-icons`.
- `favicon-32x32.png` / `icon-192.png` paths remain 404 by design; metadata uses `favicon-32.png` and `/brand/logo-192.png`.

## 11. Deploy and live validation

| Item | Value |
|------|--------|
| Commit | `0be316d` — `fix(seo): restore favicon availability for crawlers` |
| Push | `a351ec9..0be316d` → `origin/main` — success |
| Deploy | Live updated (audit passed on first post-push check) |

### Live HEAD checks

| URL | Status | Content-Type | Size |
|-----|--------|--------------|------|
| `/favicon.ico` | 200 | `image/x-icon` | **5430 B** |
| `/favicon-16.png` | 200 | `image/png` | 347 B |
| `/favicon-32.png` | 200 | `image/png` | 581 B |
| `/apple-touch-icon.png` | 200 | `image/png` | 3310 B |

### YandexFavicons user-agent

```
curl -I -A "Mozilla/5.0 (compatible; YandexFavicons/1.0; +http://yandex.com/bots)" https://dordoi.help/favicon.ico
```

Result: **200**, `image/x-icon`, 5430 B, DIB magic **`0x28`**, **not** PNG-in-ICO.

### robots.txt

`/favicon.ico` and icon PNG paths **not** blocked (`Disallow: /favicon` absent).

### Live audit

```bash
BASE_URL=https://dordoi.help npm run audit:favicon
```

Result: **6/6 PASS** (including PNG-in-ICO guard on `/favicon.ico`).

## 12. Yandex Webmaster — manual steps

1. In Yandex Webmaster → **Site diagnostics** / favicon → **Add** or **Re-check favicon**.
2. Server response check on `https://dordoi.help/favicon.ico` — expect 200 + image.
3. Wait up to ~2 weeks for favicon DB refresh if UI still shows stale warning.

## Summary

| Item | Before (live) | After deploy (live) |
|------|---------------|---------------------|
| `/favicon.ico` HTTP | 200 | 200 |
| ICO format | PNG-in-ICO (603 B) | BMP 16+32 (**5430 B**) |
| YandexFavicons decode | Likely **fail** | **OK** (BMP DIB `0x28`) |
| `audit:favicon` | Failed PNG-in-ICO check | **6/6 PASS** |

**Final verdict:** Fix deployed. Live favicon is crawler-safe BMP-in-ICO. Re-check in Yandex Webmaster manually.
