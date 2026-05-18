# Dordoi.help DB Localization Read-Only Audit

Date: 2026-05-18

## Method

No DB writes were performed. No raw DB export was created. To avoid exposing private contacts in tool output, this pass audited DB-backed public content through code-level read-only SELECT lists and render paths.

## Public/Gated Field Classification

| Field/source | Public rendering | Privacy | Translation need | Recommendation |
|---|---|---|---|---|
| `store_name` | Catalog/profile cards when business logic allows | Public brand identity, but sensitive if policy changes | Can be RU-only | Add approved localized display names or keep brand names as-is |
| `description`, `parsed_ai_data` public description | Catalog card/profile description | Public after sanitization | Needs localized variants | Add DB/content pipeline for localized public descriptions |
| `categories` | Catalog/category/profile labels | Public | Already mapped through localized category tree where possible | Keep code mapping; audit new categories |
| `location_row` | Exact row/container is gated; coarse location only when locked | Private when exact | Do not translate exact location publicly | Keep stripped in locked state; translate only coarse fallback |
| `phone_number`, `whatsapp_1`, `whatsapp_2` | Should not render locked | Private | Never translate/expose | Keep Stage 1 privacy regression |
| `telegram_url`, `instagram_url` | Should not render locked | Private | Never translate/expose | Keep stripped before client/RSC/JSON-LD |
| `google_maps_uri`, `two_gis_uri`, `yandex_maps_uri` | Should not render locked | Private | Never translate/expose | Keep stripped before client/RSC/JSON-LD |
| `min_batch`, `payment_methods`, `returns_policy` | Visible terms when public | Public business terms; may contain RU placeholders | Needs localized fallback | Use display helpers for placeholders; future localized DB fields |

## Findings

- Public DB supplier/store names can remain Cyrillic on `uz` pages. These are not static UI fallbacks and were not modified.
- Locked exact location remains gated; public locked pages now use localized coarse location labels.
- Placeholder MOQ text is normalized through localized display fallback before FAQ rendering.

## Future DB Plan Requiring Approval

Add localized public fields or JSON columns for safe public vendor copy only, for example `public_description_i18n`, `store_display_name_i18n`, and `terms_i18n`. Migration/write approval is required before any DB update.

