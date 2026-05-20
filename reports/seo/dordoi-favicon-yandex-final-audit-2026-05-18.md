# Dordoi.help — Favicon / Yandex final audit

Date: 2026-05-18 (post-deploy)

## Live checks

| URL | Status | Content-Type | Size |
|-----|--------|--------------|------|
| `/favicon.ico` | 200 | `image/x-icon` | **5430 B** |
| `/favicon-16.png` | 200 | `image/png` | 347 B |
| `/favicon-32.png` | 200 | `image/png` | 581 B |
| `/apple-touch-icon.png` | 200 | `image/png` | 3310 B |
| `/manifest.webmanifest` | 200 | `application/manifest+json` | — |

## YandexFavicons UA

```
User-Agent: Mozilla/5.0 (compatible; YandexFavicons/1.0; +http://yandex.com/bots)
GET https://dordoi.help/favicon.ico → 200 image/x-icon
```

## Format validation

| Check | Before fix | Now (live) |
|-------|------------|------------|
| ICO payload | PNG-in-ICO (603 B) | **BMP DIB (`0x28`)** |
| `audit:favicon` PNG-in-ICO guard | FAIL | **PASS** |

## HTML head (`/ru`)

```html
<link rel="shortcut icon" href="/favicon.ico"/>
<link rel="icon" href="/favicon.ico" sizes="any"/>
<link rel="icon" href="/favicon-120.png" sizes="120x120" type="image/png"/>
```

**P3:** add explicit `type="image/x-icon"` on `.ico` links (Yandex doc recommendation).

## robots.txt

Favicon paths **not** blocked.

## Commits

- `0be316d` fix(seo): restore favicon availability for crawlers
- `8f48b65` docs: live validation appended

## Manual Yandex step

Re-check favicon in Webmaster → Diagnostics; allow up to ~2 weeks for warning to clear.

**Verdict: PASS**
