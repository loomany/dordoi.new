# Dordoi.help Stage 4 Localization Audit Plan

Date: 2026-05-17
Mode: scoped localization implementation

## Initial Findings

- Routes already exist for `ru`, `kk`, `kg`, `uz`, `tj`.
- `hreflang` mapping already supports:
  - `/kg` route -> `ky`
  - `/tj` route -> `tg`
  - `x-default` -> `/ru`
- Before Stage 4, AI/GEO pages and country/blog content used a RU-first content source for non-RU routes.
- Some UI labels in SEO/blog components were hardcoded in Russian.
- JSON-LD `inLanguage` used route locale directly, so `/kg` and `/tj` needed `ky`/`tg` correction.
- Category routes already had localized slugs, H1 and metadata, but top commercial category body/FAQ needed stronger localized copy.

## Priority Order

1. Priority 1:
   - `/about`
   - `/how-it-works`
   - `/faq`
   - `/for-buyers`
   - `/for-sellers`
2. Priority 2:
   - `/dordoi-kazakhstan`
   - `/dordoi-uzbekistan`
   - `/dordoi-tajikistan`
   - `/dordoi-russia`
   - `/dordoi-kyrgyzstan`
3. Priority 3:
   - top commercial category pages
4. Priority 4:
   - `/blog`
   - first 3 guide pages

## What Was Localized In This Stage

- Added controlled locale overlay for `kk`, `kg`, `uz`, `tj`.
- Localized title, description, H1, intro, primary CTA labels, sections and FAQ for priority AI/GEO pages.
- Localized country landing page copy for the 5 country pages.
- Localized first 3 blog guide pages and blog hub labels.
- Localized top category content/FAQ generation for non-RU locales.
- Localized sidebar/internal link labels for SEO landing pages, category pages and blog pages.
- Corrected safe JSON-LD `inLanguage` for `/kg -> ky` and `/tj -> tg`.

## Pages To Localize Later

- Legacy static/help/legal pages can remain message-file driven until they become SEO targets.
- `/buyer-service` can receive full non-RU trust content in a later stage; current priority was AI/GEO core pages and country/category/blog SEO.
- Future Stage 6 should use GSC/Yandex query data to decide deeper category and guide localization.

## Terms And Review

Glossary:

- `reports/seo/dordoi-localization-glossary-2026-05-17.md`

Human review needed:

- Kazakh country-case endings.
- Kyrgyz wholesale terminology.
- Uzbek buyer-agent wording.
- Tajik commercial wording for `байер`, `карго`, `опт`.

## QA Plan

Check for each locale:

- HTTP 200.
- Unique localized title/description.
- Localized H1.
- Canonical points to current locale URL.
- `hreflang` includes `ru`, `kk`, `ky`, `uz`, `tg`, `x-default`.
- JSON-LD `inLanguage` is correct.
- No private vendor contact leaks.
- Header/footer links stay on the current locale.
- Top categories are reachable and have localized content.

Privacy grep remains mandatory:

```bash
wa\.me|tel:|t\.me/[A-Za-z0-9_+-]{3,}|instagram\.com/[A-Za-z0-9_.-]{2,}|phone_number|whatsapp_1|whatsapp_2|telegram_url|instagram_url|google_maps_uri|two_gis_uri|yandex_maps_uri|primaryWhatsapp|secondaryWhatsapp|telegramHref|instagramHref|telHref|twoGisHref|LocalBusiness|telephone|sameAs|streetAddress
```
