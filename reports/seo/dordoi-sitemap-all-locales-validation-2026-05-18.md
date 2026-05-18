# Dordoi.help Sitemap All Locales Validation

Date: 2026-05-18

## Result

Validated against local production server `http://127.0.0.1:3005` with production SEO settings:

- `NEXT_PUBLIC_SITE_INDEXABLE=true`
- `NEXT_PUBLIC_APP_URL=https://dordoi.help`

## Sitemap Checks

- `/sitemap.xml`: 200
- `/sitemaps/core.xml`: 200
- No `localhost` or `127.0.0.1` in sitemap output.
- Core sitemap URLs: 375
- Localized blog guide URLs: 170
- URLs per locale in core sitemap: `ru=74`, `kk=74`, `kg=74`, `uz=74`, `tj=74`

## Required Sample URLs Present

- `/ru/blog/dordoi-optom-polnyy-gid`
- `/kk/blog/dordoi-koterme-tolyk-nuskaulyk`
- `/kg/blog/dordoi-dununon-toluk-koldonmo`
- `/uz/blog/dordoy-ulgurji-toliq-qollanma`
- `/tj/blog/dordoi-yakluht-dasturi-purra`

## Noncanonical URLs Excluded

- `/kk/blog/dordoi-optom-polnyy-gid`
- `/kg/blog/dordoi-optom-polnyy-gid`
- `/uz/blog/dordoi-optom-polnyy-gid`
- `/tj/blog/dordoi-optom-polnyy-gid`
- Redirect aliases `/ru/dordoi-market`, `/ru/wholesale`, `/ru/cargo`
- Query URLs, drafts, auth/payment/admin/API/private endpoints

