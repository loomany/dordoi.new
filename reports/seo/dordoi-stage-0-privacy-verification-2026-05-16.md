# Dordoi.help Stage 0 Privacy Verification

Date: 2026-05-16  
Mode: STRICT AUDIT ONLY  
Scope: supplier/vendor profile SEO privacy check for live site and current branch static code review.  
No code, database, env, auth, payments, Lemon Squeezy, Supabase RLS, subscriptions, or payment logic was changed.

## Verdict

**P0 leak confirmed.**

If seller contacts and store identity are intended to be gated until catalog access is unlocked, the current live implementation exposes private vendor data before unlock.

Confirmed locked state evidence:

- Live RSC/Flight payload contains `"contactsUnlocked":false`.
- The same payload contains `primaryWhatsapp`, `telegramHref`, `instagramHref`, `telHref`, and `twoGisHref`.
- The rendered page source contains `LocalBusiness` JSON-LD with `telephone`, `sameAs`, and address.

Important nuance: visible locked buttons are not the main issue by themselves. On the checked catalog profile, the visible UI renders buttons without `href` while locked. The issue is that the real contact URLs are still present in the HTML/RSC payload and JSON-LD before unlock.

## Checked routes

### Current branch routes found

- `app/[locale]/catalog/[slug]/page.tsx`
  - Static registry provider routes: `container-04-12`, `tkani-dordoi`.
  - Database vendor catalog profile route by opaque/safe slug.
  - Legacy SEO slug handling redirects old SEO slug to opaque catalog slug.
- `app/[locale]/suppliers/[seoSlug]/page.tsx`
  - Indexable SEO supplier profile route.
- `app/[locale]/categories/[categorySlug]/page.tsx`
  - Category landing pages with vendor cards and `ItemList` JSON-LD.

No other public vendor profile routes were found under `app/` during this audit.

## Live URLs checked

| URL | Purpose | Result |
|---|---|---|
| `https://dordoi.help/ru/suppliers/asso-corsets` | Indexable supplier SEO page | **Leaks confirmed** in HTML, JSON-LD, RSC payload, metadata, breadcrumbs, canonical/slug, sitemap |
| `https://dordoi.help/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9` | Safe/opaque catalog slug page linked from category/profile | **Leaks confirmed** in RSC payload; visible UI is locked; metadata is generic; page is `noindex, follow` |
| `https://dordoi.help/ru/catalog/asso-corsets` | Legacy SEO slug page | No direct contact leak in redirect shell; exposes redirect mapping to opaque slug |
| `https://dordoi.help/ru/categories/zhenskaya-odezhda-optom` | Category-linked supplier list | No phone/social contact leak found; **store names exposed** in visible HTML and `ItemList` JSON-LD |
| `https://dordoi.help/ru/catalog/container-04-12` | Static provider registry route | No direct contact leak observed in live HTML/RSC for checked markers |
| `https://dordoi.help/ru/catalog/tkani-dordoi` | Static provider registry route | No direct contact leak observed in live HTML/RSC for checked markers |
| `https://dordoi.help/sitemaps/vendors/vendors-1.xml` | Vendor sitemap | No phone/social contact leak; `seo_slug` values such as `asso-corsets` are indexed |
| `https://dordoi.help/api/catalog/vendors/0f55275a-916b-4496-9419-7e1c4cf2a9e9/photo-batches?limit=1` | Public vendor photo API | No contact markers found; returns batch ids and public photo URLs |

Local dev runtime note: `http://localhost:3000/ru/suppliers/asso-corsets` and `http://127.0.0.1:3000/ru/suppliers/asso-corsets` timed out. I did not start a dev server to avoid creating build artifacts in strict audit-only mode. Current branch was verified statically against the live behavior.

## Fields leaked

Confirmed on `https://dordoi.help/ru/suppliers/asso-corsets`:

| Field / value type | Example observed | Where exposed |
|---|---|---|
| Store name | `Asso, магазин женской одежды` | title, description, OG, Twitter, H1, breadcrumb, JSON-LD, RSC |
| Phone | `996709072606` | JSON-LD `telephone`, RSC `telHref`, RSC `primaryWhatsapp` |
| WhatsApp | `https://wa.me/996709072606` | RSC/Flight client props |
| Telegram | `https://t.me/ASSO` | JSON-LD `sameAs`, RSC/Flight client props |
| Instagram | `https://instagram.com/asso.corsets` | JSON-LD `sameAs`, RSC/Flight client props |
| Location row | `Мурас спорт -1-й проход, 176` | visible HTML, JSON-LD address, FAQ JSON-LD, RSC |
| 2GIS map link | `https://2gis.kg/bishkek/firm/70000001113650587` | RSC/Flight client props |
| SEO slug | `asso-corsets` | canonical, sitemap, hreflang, URL |

## Where the leak happens

### 1. JSON-LD leak on `/suppliers/[seoSlug]`

Live page source contains:

```html
<script type="application/ld+json">{
  "@context":"https://schema.org",
  "@type":"LocalBusiness",
  "name":"Asso, магазин женской одежды",
  "url":"https://dordoi.help/ru/suppliers/asso-corsets",
  "address":{
    "@type":"PostalAddress",
    "streetAddress":"Мурас спорт -1-й проход, 176",
    "addressLocality":"Бишкек",
    "addressCountry":"KG"
  },
  "telephone":"996709072606",
  "sameAs":["https://instagram.com/asso.corsets","https://t.me/ASSO"]
}</script>
```

Responsible code:

- `app/[locale]/suppliers/[seoSlug]/page.tsx:73` builds vendor JSON-LD via `buildVendorSeoLocalBusinessJsonLd`.
- `app/[locale]/suppliers/[seoSlug]/page.tsx:77` renders it with `<JsonLd data={jsonLd} />`.
- `lib/catalog/vendor-local-business-jsonld.ts:46-53` reads `store_name`, `location_row`, `phone_number`, Instagram and Telegram.
- `lib/catalog/vendor-local-business-jsonld.ts:71-80` writes `streetAddress`, `telephone`, and `sameAs`.

### 2. RSC/Flight payload leak while `contactsUnlocked:false`

Live source contains:

```json
{
  "listingKey":"slug:postavshik-zhenskoy-odezhdy-a9e9",
  "primaryWhatsapp":"https://wa.me/996709072606",
  "telegramHref":"https://t.me/ASSO",
  "instagramHref":"https://instagram.com/asso.corsets",
  "telHref":"tel:996709072606",
  "twoGisHref":"https://2gis.kg/bishkek/firm/70000001113650587",
  "contactsUnlocked":false
}
```

Observed in App Router Flight payload:

- `__NEXT_DATA__`: not present.
- `self.__next_f`: present and contains the sensitive props.

Responsible code:

- `components/provider/DatabaseProviderProfileView.tsx:116` computes `catalogAccessUnlocked` with `hasFullCatalogAccess(profile)`.
- `components/provider/DatabaseProviderProfileView.tsx:187-205` computes contact/map hrefs before checking `catalogAccessUnlocked`.
- `components/provider/DatabaseProviderProfileView.tsx:562-570` passes those hrefs into `VendorContactActions` together with `contactsUnlocked={catalogAccessUnlocked}`.
- `components/provider/VendorContactActions.tsx:73-83` prevents rendering `<a href>` when locked, but because this is a client component the props are serialized to the RSC payload before the client receives them.

### 3. Catalog safe slug page leaks contacts in RSC while UI is locked

Checked URL:

`https://dordoi.help/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`

Good:

- Metadata is generic: `Поставщик женской одежды на рынке Дордой | Dordoi.help`.
- Robots are `noindex, follow`.
- Canonical points to `https://dordoi.help/ru/suppliers/asso-corsets`.
- Visible locked contact buttons are rendered as `<button>`, not direct `<a href>`.

Problem:

- The RSC payload still contains `primaryWhatsapp`, `telegramHref`, `instagramHref`, `telHref`, `twoGisHref`, and `"contactsUnlocked":false`.

Responsible code is the same `DatabaseProviderProfileView` -> `VendorContactActions` path listed above.

### 4. Supplier metadata exposes store name

Checked URL:

`https://dordoi.help/ru/suppliers/asso-corsets`

Observed metadata:

- `<title>Asso, магазин женской одежды — поставщик женской одежды на рынке Дордой | Dordoi.help</title>`
- `<meta name="description" content="Поставщик Asso, магазин женской одежды ...">`
- `og:title`, `og:description`, `twitter:title`, `twitter:description` also include the store name.

Responsible code:

- `app/[locale]/suppliers/[seoSlug]/page.tsx:39-60` uses `vendor.store_name` in metadata for an indexable page.

If store names are intentionally public on `/suppliers/*`, this is SEO behavior, not a privacy leak. If store names are gated by the subscription model, this is part of the P0 leak.

### 5. Category `ItemList` exposes store names beyond locked UI logic

Checked URL:

`https://dordoi.help/ru/categories/zhenskaya-odezhda-optom`

Observed `ItemList` JSON-LD includes store names and catalog URLs:

```json
{
  "@type":"ItemList",
  "itemListElement":[
    {"position":1,"name":"Muhsina.kg","url":"https://dordoi.help/ru/catalog/postavshik-zhenskoy-odezhdy-1f12"},
    {"position":2,"name":"Lima, магазин женской одежды","url":"https://dordoi.help/ru/catalog/postavshik-zhenskoy-odezhdy-4463"},
    {"position":7,"name":"Asso, магазин женской одежды","url":"https://dordoi.help/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9"}
  ]
}
```

No direct phone/WhatsApp/Telegram/Instagram contact markers were found on the category page.

Potential issue:

- `GUEST_FREE_CATEGORY_PAGE_CARDS_BY_MAIN.womens` allows 3 free cards, but the category `ItemList` includes at least position 7 with store name.
- If store names are intended to be gated after the free limit, this leaks names through JSON-LD even when UI cards are locked/masked.

Responsible code:

- `app/[locale]/categories/[categorySlug]/page.tsx:58-67` builds UI cards from `accessibleVendors`.
- `app/[locale]/categories/[categorySlug]/page.tsx:111-113` passes unredacted `fetchedVendors` names into JSON-LD.
- `components/seo/VendorItemListJsonLd.tsx:14-26` emits those names and `/catalog/{slug}` URLs.

### 6. Sitemap and canonical exposure

Checked sitemap:

`https://dordoi.help/sitemaps/vendors/vendors-1.xml`

Findings:

- No direct `wa.me`, `telegram`, `instagram`, `tel:`, `phone_number`, or `store_name` markers found.
- `asso-corsets` appears in vendor sitemap URLs and hreflang alternates.
- Safe opaque slug `postavshik-zhenskoy-odezhdy-a9e9` was not in the vendor sitemap sample because sitemap indexes `/suppliers/{seo_slug}`, not `/catalog/{opaqueSlug}`.

If `seo_slug` is derived from private brand/store identity, sitemap/canonical URLs leak that identity.

Responsible code:

- `lib/catalog/vendor-sitemap.ts:24-45` selects and emits approved `seo_slug`.
- `lib/sitemap/build-vendor-chunk-sitemap-xml.ts` builds `/suppliers/{seoSlug}` for every locale and hreflang alternate.
- `app/[locale]/suppliers/[seoSlug]/page.tsx` canonicalizes the supplier URL.

### 7. API responses

Public API routes found:

- `app/api/catalog/vendors/[vendorId]/photo-batches/route.ts`
- auth/webhook/analytics/admin bootstrap routes.

No public vendor detail API route was found under `app/api`.

Checked:

`GET /api/catalog/vendors/0f55275a-916b-4496-9419-7e1c4cf2a9e9/photo-batches?limit=1`

Result:

- Returns batch id, createdAt, and public photo URLs.
- No `wa.me`, `telegram`, `instagram`, `tel:`, `phone_number`, `whatsapp_1`, `store_name`, or `996709` markers found.

Responsible code:

- `app/api/catalog/vendors/[vendorId]/photo-batches/route.ts` returns only `{ batches }` from `fetchApprovedVendorPhotoBatches`.

## Commands/checks used

Route/code discovery:

```powershell
rg --files app | rg "(catalog|suppliers|vendor|provider|slug)"
rg -n "phone_number|whatsapp_1|whatsapp_2|telegram_url|instagram_url|store_name|contactsUnlocked|contact|social|wa\.me|tel:|map|location_row" app components lib scripts -S
rg -n "buildVendorSeoLocalBusinessJsonLd|JsonLd|DatabaseProviderProfileView|generateMetadata|storeName|vendorSuppliersSeoRobotsPolicy" app\[locale]\suppliers\[seoSlug]\page.tsx
rg -n "primaryWhatsapp|secondaryWhatsapp|telegramHrefResolved|instagramHrefResolved|telHrefResolved|contactsUnlocked|hasFullCatalogAccess" components\provider\DatabaseProviderProfileView.tsx
rg -n "ContactPill|if \(!unlocked\)|href=|contactsUnlocked" components\provider\VendorContactActions.tsx
rg -n "vendorListItems|VendorItemListJsonLd|store_name|fetchedVendors|accessibleVendors" app\[locale]\categories\[categorySlug]\page.tsx components\seo\SeoCategoryLanding.tsx components\seo\VendorItemListJsonLd.tsx
rg --files app\api
rg -n "phone_number|whatsapp_1|whatsapp_2|telegram_url|instagram_url|store_name|location_row|google_maps_uri|two_gis_uri|yandex_maps_uri" app\api -S
```

Live fetches:

```powershell
curl.exe -sL https://dordoi.help/ru/suppliers/asso-corsets -o .codex-live-supplier.html
curl.exe -sL https://dordoi.help/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9 -o .codex-catalog-safe.html
curl.exe -sL https://dordoi.help/ru/catalog/asso-corsets -o .codex-catalog-legacy.html
curl.exe -sL https://dordoi.help/ru/categories/zhenskaya-odezhda-optom -o .codex-category.html
curl.exe -sL https://dordoi.help/sitemaps/vendors/vendors-1.xml -o .codex-vendors-sitemap.xml
curl.exe -sL "https://dordoi.help/api/catalog/vendors/0f55275a-916b-4496-9419-7e1c4cf2a9e9/photo-batches?limit=1" -o .codex-api-photo-batches.json
```

Marker checks:

```powershell
Select-String -Path .codex-live-supplier.html -Pattern "wa\.me|telegram|instagram|phone|tel:|whatsapp|store_name|application/ld\+json" -AllMatches
Select-String -Path .codex-catalog-safe.html -Pattern "canonical|robots|wa\.me|telegram|instagram|phone|tel:|application/ld\+json|contactsUnlocked" -AllMatches
Select-String -Path .codex-catalog-legacy.html -Pattern "NEXT_REDIRECT|__next-page-redirect|canonical|robots|instagram\.com|wa\.me|tel:" -AllMatches
Select-String -Path .codex-category.html -Pattern "ItemList|/ru/catalog/postavshik|instagram\.com|wa\.me|tel:|store_name" -AllMatches
```

Counts from checked files:

| File | Key contact/privacy markers |
|---|---|
| `.codex-live-supplier.html` | `wa.me=1`, `tel:=1`, `https://t.me=3`, `instagram.com=4`, `telephone=2`, `sameAs=2`, `streetAddress=2`, `contactsUnlocked:false` present |
| `.codex-catalog-safe.html` | `wa.me=1`, `tel:=1`, `https://t.me=1`, `instagram.com=2`, `contactsUnlocked:false` present |
| `.codex-catalog-legacy.html` | no direct `wa.me`/`tel:` vendor leak; contains `NEXT_REDIRECT` to opaque slug |
| `.codex-category.html` | no direct phone/social contact markers; `ItemList` includes real store names |
| `.codex-vendors-sitemap.xml` | contact markers `0`; `asso-corsets` present |
| `.codex-api-photo-batches.json` | contact markers `0`; photo URLs only |

## Current branch root causes

1. `PUBLISHED_VENDOR_PROFILE_SELECT_FIELDS` includes sensitive contact fields for public profile rendering.
   - `lib/catalog/published-vendors.ts:134-135`
   - selected fields: `location_row`, `phone_number`, `whatsapp_1`, `whatsapp_2`, `instagram_url`, `telegram_url`, `google_maps_uri`, `google_place_id`.

2. `/suppliers/[seoSlug]` is indexable and uses vendor identity in metadata and JSON-LD.
   - `app/[locale]/suppliers/[seoSlug]/page.tsx:39-60`
   - `app/[locale]/suppliers/[seoSlug]/page.tsx:73-78`

3. `LocalBusiness` JSON-LD directly emits private contact and social fields.
   - `lib/catalog/vendor-local-business-jsonld.ts:46-53`
   - `lib/catalog/vendor-local-business-jsonld.ts:71-80`

4. Contact hrefs are computed before access gating and passed into a client component.
   - `components/provider/DatabaseProviderProfileView.tsx:187-205`
   - `components/provider/DatabaseProviderProfileView.tsx:562-570`
   - `components/provider/VendorContactActions.tsx:73-83`

5. Category JSON-LD uses unredacted `fetchedVendors`, not `accessibleVendors`.
   - `app/[locale]/categories/[categorySlug]/page.tsx:111-113`
   - `components/seo/VendorItemListJsonLd.tsx:14-26`

## Recommended minimal fix plan

No code was changed in this audit. Minimal patch plan for the next implementation stage:

1. Define a single privacy contract for public unauthenticated vendor pages.
   - Decide explicitly whether `store_name`, `seo_slug`, `location_row`, map links, logo, product photos, and social handles are public or gated.
   - Treat phone, WhatsApp, Telegram, Instagram, direct map links, and exact location row as gated unless business rules say otherwise.

2. Split public SEO vendor data from unlocked contact data.
   - Create a safe public vendor profile shape that excludes `phone_number`, `whatsapp_1`, `whatsapp_2`, `telegram_url`, `instagram_url`, `google_maps_uri`, exact map links, and exact contact rows.
   - Fetch contact fields only after `hasFullCatalogAccess(profile)` is true, or only inside a gated API/server action that checks access.

3. Stop passing real contact hrefs to client components when locked.
   - In `DatabaseProviderProfileView`, compute/pass `null` for contact href props when `catalogAccessUnlocked === false`.
   - Keep visible locked buttons, but do not serialize real URLs into RSC props.

4. Make vendor JSON-LD privacy-safe.
   - For locked/public pages, remove `telephone`, `sameAs`, exact `streetAddress`, and individual vendor `LocalBusiness` contact fields.
   - Use safer schema such as `ProfilePage`, `WebPage`, `BreadcrumbList`, and possibly `ItemList` with generic names.
   - Only emit individual `LocalBusiness` contact fields if they are intentionally public.

5. Rework supplier SEO pages if store identity is gated.
   - If `store_name` is private, do not use it in title, description, OG/Twitter, H1, breadcrumb, FAQ, JSON-LD, sitemap slug, or canonical.
   - Prefer safe slugs like `postavshik-zhenskoy-odezhdy-a9e9`.
   - If legacy brand slugs already exist, 301/noindex them carefully without exposing direct mapping in indexable sitemap.

6. Redact category `ItemList`.
   - Use `accessibleVendors` or a separately redacted list.
   - For locked vendors, emit generic names like `Поставщик женской одежды #A9E9` or omit locked vendors from JSON-LD.
   - Use canonical safe URLs consistently.

7. Add regression tests.
   - For a locked guest request, assert page source does not contain `wa.me`, `tel:`, `t.me`, `instagram.com/{vendor}`, raw phone digits, `whatsapp_1`, `phone_number`, `telegram_url`, `instagram_url`, or exact gated location/map URLs.
   - Test both `/suppliers/{seoSlug}` and `/catalog/{slug}`.
   - Test category pages and JSON-LD.

8. Re-run verification after patch.
   - Repeat the exact curl/Select-String checks above.
   - Add Playwright check for rendered DOM and network/Flight payload if a dev server is available.

## Final status

- Leak confirmed: **yes, P0**.
- Most severe exposure: `/ru/suppliers/asso-corsets` emits direct contacts in JSON-LD and RSC while locked.
- Secondary exposure: `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9` serializes direct contacts in RSC while locked.
- Category exposure: store names are emitted in `ItemList` beyond the visible free-card logic; severity depends on whether `store_name` is considered gated.
- API contact leak: not confirmed in checked public API.
- Sitemap direct contact leak: not confirmed; brand/SEO slug exposure is present.
