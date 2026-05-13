# Vendor SEO & Privacy Plan

**Site:** https://dordoi.help  
**Date:** 2026-05-13  
**Mode:** audit-only — no code/DB changes in this document.

---

## Current vendor model

### Database

Table `public.vendors` (migrations under `supabase/migrations/`). Key fields:

| Field | Role |
|-------|------|
| `id`, `slug` | UUID; unique public slug |
| `store_name` | Display source; used for slug generation |
| `status` | `pending_moderation`, `pending_review`, `approved`, `rejected` |
| `categories` | `text[]` |
| `description`, `description_detail` | Public text |
| `instagram_url`, `telegram_url`, `whatsapp_1`, `whatsapp_2`, `phone_number` | Contacts |
| `application_source` | `telegram` \| `google_places` |
| `google_place_id`, `google_maps_uri` | Import metadata |
| `parsed_ai_data` | AI card overlay JSONB |

### Public URLs

- Pattern: `/{locale}/catalog/{slug}` (e.g. `/ru/catalog/asso-corsets`)
- Slug algorithm: [`lib/catalog/vendor-slug.ts`](../../lib/catalog/vendor-slug.ts) — transliterate `store_name` → Latin; collision adds UUID suffix
- Assigned once at admin approve ([`lib/actions/vendor-moderation.ts`](../../lib/actions/vendor-moderation.ts))

### Live examples (2026-05-13)

| Slug | H1 (live) | Risk |
|------|-----------|------|
| `asso-corsets` | Asso | Brand = searchable IG handle |
| `arusha-kg` | Arusha | Brand + `-kg` suffix |
| `slavyana-moda` | Slavyana moda | Transliterated shop name |
| `gukakg0`, `topnus312`, `kayakg1` | (similar) | Handle-like slugs |

### Catalog list payload

[`PUBLISHED_VENDOR_CATALOG_LIST_SELECT_FIELDS`](../../lib/catalog/published-vendors.ts) includes `instagram_url` in server/RSC data even though list UI routes IG button to profile when `href` is set.

### Card UI

[`CatalogCard.tsx`](../../components/catalog/CatalogCard.tsx): Instagram gradient button visible on every card with `instagram_url`. Card titles from [`catalog-card-title.ts`](../../lib/catalog/catalog-card-title.ts) may show brand derived from `store_name` / Instagram / AI.

### Profile page

[`DatabaseProviderProfileView.tsx`](../../components/provider/DatabaseProviderProfileView.tsx):

- H1 = `storeTitle` (brand)
- [`VendorContactActions`](../../components/provider/VendorContactActions.tsx): WhatsApp, Telegram, Instagram, phone in public HTML
- JSON-LD `LocalBusiness` with `telephone` when `phone_number` present
- `FAQPage` JSON-LD via `FaqJsonLd` when ≥3 FAQ items
- **No login/payment gate** before contacts

Live check `/ru/catalog/asso-corsets`: `ig=9`, `tme=4`, `wa=2`, `tel=2`, `telephone` in JSON-LD, H1 `Asso`.

---

## Risks

| Risk | Severity | Evidence |
|------|----------|----------|
| Slug from `store_name` / IG brand | **Critical** | `asso-corsets`, `arusha-kg`, `slavyana-moda` |
| H1/title = brand name | **Critical** | Live vendor pages |
| Full contacts in HTML without paywall | **Critical** | wa.me, t.me, tel:, instagram.com on profiles |
| `telephone` in JSON-LD | **High** | `DatabaseProviderProfileView` |
| `instagram_url` in catalog list API/RSC | **High** | `published-vendors.ts` select |
| IG icon on catalog cards | **Medium** | Visible affordance; navigates to profile not IG when `href` set, but brand still visible |
| Buyer directory contacts | **Medium** | `/ru/buyers` exposes wa/tel in HTML (by design for buyers) |
| Showcase/static providers | **Low** | `container-04-12` — demo with WhatsApp in meta/description |

---

## Public URL policy

### Allowed slug format

```
{category-or-service-prefix}-{random4}
```

Examples:

- `postavshik-zhenskoy-odezhdy-a7f3`
- `dordoi-obuv-opt-k91p`
- `optovyy-postavshik-sumok-m3q8`
- `vendor-8x2q`

### Forbidden patterns

- Instagram/Telegram username (`asso`, `arusha`, `topnus312`)
- Phone fragments (`8705…`)
- Exact transliterated unique shop name if Googleable (`slavyana-moda`)
- `@handle`, `instagram-*`, `telegram-*`

### Rules

- Lowercase Latin, hyphens only
- Assigned once at publish; change only by admin
- Unique across `vendors.slug`

---

## Private fields (never in slug, title, H1, meta, JSON-LD, public HTML)

- `source_platform`, `source_url`
- `instagram_username` (raw handle)
- `telegram_username` / `telegram_chat_id`
- `raw_profile_name`
- `phone`, `whatsapp` (until access granted)
- `admin_notes`, `moderation_notes`
- `google_place_id`
- `application_source`

## Public fields (after moderation)

- `public_display_name` — generic or approved brand only
- `public_slug`
- `category`, `subcategory`
- `market_location`, `container_or_row` (if approved)
- `description` (sanitized)
- `products_summary`
- `languages`, `works_with_countries`
- `has_buyer_service`, `has_cargo`
- `verified_status`

---

## Index / noindex policy

### Index when ALL true

- `status = approved`
- Safe `public_slug`
- Category assigned
- ≥300–500 chars unique description
- Photo or acceptable placeholder
- No direct IG/TG in title/H1/slug
- No duplicate of another card

### noindex when ANY true

- `pending_review` / empty / rejected
- Unsafe slug (brand/handle/phone)
- Google Places import without manual review
- Thin or duplicate content
- Contact leak in title/H1

### Sitemap

Include vendor URLs only when indexable + safe slug + sufficient content. **Currently:** vendor URLs not in sitemap at all (only static `publicRoutes`).

---

## Recommended vendor page structure

**H1:** `Поставщик женской одежды на рынке Дордой` (category-based, not brand)

**Subtitle:** `Оптовые товары, работа с покупателями из Казахстана и СНГ`

Sections: category, location (if allowed), product summary, countries served, buyer/cargo badges, trust badges, CTA «Получить контакт через сервис», similar suppliers, links to category hubs.

**After access:** optional real `store_name`, IG/TG/WA/phone per business rules.

**JSON-LD:** `LocalBusiness` without `telephone`/social until gated; no private source fields.

---

## Implementation stages (future — not in this audit)

1. **Policy:** approve slug rules; migration plan for existing slugs (301 only with explicit approve)
2. **Data model:** add `public_display_name`, `public_slug` separate from internal `store_name`
3. **Catalog cards:** generic titles; remove IG icon pre-access; strip `instagram_url` from list select
4. **Profile:** contact gate component; strip contacts from SSR for anonymous users
5. **JSON-LD:** remove phone/social from public schema
6. **Sitemap:** dynamic vendor sitemap for approved safe cards only
7. **Admin:** slug override, «publish with safe slug» workflow
