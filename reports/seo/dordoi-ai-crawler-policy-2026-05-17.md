# Dordoi.help AI crawler and robots policy

Date checked: 2026-05-18

## Policy summary

Public SEO pages may be crawled by search engines and selected AI crawlers.

Private, admin, auth, payment, account, cabinet, API, and query-trap areas remain blocked.

## Allowed public crawler groups

`robots.txt` now documents policy for:

- `*`
- `Googlebot`
- `YandexBot`
- `Bingbot`
- `GPTBot`
- `ChatGPT-User`
- `OAI-SearchBot`
- `PerplexityBot`
- `ClaudeBot`
- `Applebot`
- `Google-Extended`
- `CCBot`

Each group allows `/` and disallows private/noisy paths.

## Blocked paths

Blocked when site is indexable:

- `/api/`
- `/admin/`
- `/account/`
- `/auth/`
- `/checkout/`
- `/payment/`
- `/signin`
- `/legacy/`
- `/test/`
- `/preview/`
- `/*/cabinet/`
- `/*/payment/`
- `/*?cat=*`
- `/*?page=*`
- `/*?search=*`
- `/*?sort=*`
- `/*?filter=*`
- `/*?compare=*`
- `/*?utm_*`
- `/*?gclid=*`
- `/*?yclid=*`
- `/*?fbclid=*`

## Public areas not globally blocked

Smoke confirmed robots does not globally block public SEO pages when:

- `NEXT_PUBLIC_SITE_INDEXABLE=true`
- `NEXT_PUBLIC_APP_URL=https://dordoi.help`

## Sitemap

`robots.txt` references:

- `https://dordoi.help/sitemap.xml`

## Privacy note

Allowing crawlers to public SEO pages does not expose gated vendor contacts.

Vendor phone numbers, WhatsApp, Telegram, Instagram, exact location, map URLs, and raw private fields remain excluded from locked HTML/JSON-LD and smoke checks.

## Validation

Smoke checks passed:

- robots status 200
- sitemap reference present
- Google/Yandex/Bing crawler policy present
- AI crawler policy present
- private paths blocked
- payment paths blocked
- public SEO not globally blocked

