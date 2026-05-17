# Dordoi.help multilingual URL strategy — 2026-05-17

Goal: make each important language version indexable on a separate URL with self-canonical and reciprocal hreflang.

Implemented decision:
- Route locales remain `/ru`, `/kk`, `/kg`, `/uz`, `/tj`.
- HTML/hreflang language policy remains: `/kg` => `ky`, `/tj` => `tg`.
- Core pages keep stable route slugs (`/about`, `/faq`, `/for-buyers`, etc.) but content/metadata is localized by locale.
- Blog guides now support localized slugs through a central map in `lib/seo/dordoi-blog-localized.ts`.
- Category URLs stay on the existing category route system for this stage to avoid duplicate indexable category aliases.

Canonical policy:
- RU guide: `/ru/blog/<ru-slug>` self-canonical.
- KK guide: `/kk/blog/<kk-slug>` self-canonical.
- KG route guide: `/kg/blog/<ky-slug>` self-canonical and `hreflang=ky`.
- UZ guide: `/uz/blog/<uz-slug>` self-canonical.
- TJ route guide: `/tj/blog/<tg-slug>` self-canonical and `hreflang=tg`.
- `x-default` points to the RU canonical version.
- No localized page canonicalizes to `/ru` when localized content is available.

Sample canonical URL set:

| Guide ID | RU | KK | KG/KY | UZ | TJ/TG |
|---|---|---|---|---|---|
| dordoi-optom-polnyy-gid | `/ru/blog/dordoi-optom-polnyy-gid` | `/kk/blog/dordoi-koterme-tolyk-nuskaulyk` | `/kg/blog/dordoi-dununon-toluk-koldonmo` | `/uz/blog/dordoy-ulgurji-toliq-qollanma` | `/tj/blog/dordoi-yakluht-dasturi-purra` |
| kak-nayti-postavshchika-dordoi | `/ru/blog/kak-nayti-postavshchika-dordoi` | `/kk/blog/dordoi-zhetkizushini-qalai-tabu` | `/kg/blog/dordoi-zhetkiruuchunu-kantip-tabuu` | `/uz/blog/dordoy-yetkazib-beruvchini-qanday-topish` | `/tj/blog/dordoi-taminkunandaro-chi-tavr-yoftan` |
| kontakty-postavshchikov-dordoi-kak-otkryt-bezopasno | `/ru/blog/kontakty-postavshchikov-dordoi-kak-otkryt-bezopasno` | `/kk/blog/dordoi-zhetkizushi-kontaktary-qauipsiz-ashu` | `/kg/blog/dordoi-zhetkiruuchu-kontaktaryn-koopsuz-achuu` | `/uz/blog/dordoy-yetkazib-beruvchi-kontaktlarini-xavfsiz-ochish` | `/tj/blog/kontakt-hoi-taminkunandagoni-dordoi-behatar-kushodan` |

Sitemap policy:
- `lib/sitemap/build-core-sitemap-xml.ts` now emits canonical localized guide URLs, not a single RU slug repeated across all locales.
- Redirect aliases (`/ru/dordoi-market`, `/ru/wholesale`, `/ru/cargo`) stay excluded.
- Query URLs, drafts, auth/payment/admin/private endpoints stay excluded.
- Sitemap index cache key now includes `baseUrl` to avoid stale localhost sitemap index entries.

Redirect/alias policy:
- Non-RU legacy source slugs can redirect to localized slugs through `resolveBlogPostRedirectPath`.
- Only canonical localized slugs are emitted in sitemap.

Stage 6 recommendation:
- Add localized category aliases only after a dedicated redirect/canonical migration plan. Current category slugs are stable and localized content is safer than introducing duplicate category URLs now.
