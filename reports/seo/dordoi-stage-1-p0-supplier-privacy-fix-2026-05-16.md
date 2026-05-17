# Dordoi.help Stage 1 P0 Supplier Privacy Fix

Date: 2026-05-16  
Mode: scoped implementation, no commit/push  
Verdict: P0 leak fixed in current branch privacy contract; live must be rechecked after deploy.

## What leaked before

Stage 0 confirmed that locked supplier/catalog pages could serialize private vendor data while `contactsUnlocked:false`.

- `/ru/suppliers/asso-corsets`: `LocalBusiness` JSON-LD exposed `telephone`, `sameAs` with Instagram/Telegram, and exact `address`.
- `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`: RSC Flight payload exposed `primaryWhatsapp`, `telegramHref`, `instagramHref`, `telHref`, `twoGisHref`.
- `/ru/categories/zhenskaya-odezhda-optom`: category `ItemList` exposed locked vendor names beyond free-card access rules.

Private fields in scope:

- `phone_number`
- `whatsapp_1`
- `whatsapp_2`
- `telegram_url`
- `instagram_url`
- `google_maps_uri`
- `two_gis_uri`
- `yandex_maps_uri`
- `google_place_id`
- generated contact/map hrefs: `telHref`, `primaryWhatsapp`, `secondaryWhatsapp`, `telegramHref`, `instagramHref`, `twoGisHref`
- exact `location_row`
- `store_name` for locked public views unless explicitly accessible

## Files changed

- `lib/catalog/vendor-privacy.ts`
- `lib/catalog/vendor-privacy-types.ts`
- `lib/catalog/catalog-vendor-access.ts`
- `components/provider/DatabaseProviderProfileView.tsx`
- `components/provider/VendorContactActions.tsx`
- `lib/catalog/vendor-local-business-jsonld.ts`
- `app/[locale]/suppliers/[seoSlug]/page.tsx`
- `app/[locale]/categories/[categorySlug]/page.tsx`
- `lib/catalog/vendor-privacy.test.ts`
- `lib/catalog/vendor-local-business-jsonld.test.ts`

No auth, payments, Lemon Squeezy, Supabase RLS, DB migrations, subscription logic, checkout, pricing, or admin code was changed.

## New privacy contract

Locked public state must not send real private contact data to the browser. This is enforced server-side before props reach client components.

- `stripLockedVendorContacts()` removes sensitive vendor keys instead of setting them to `null`, so serialized payloads do not include raw private field names.
- `lockedVendorContactAvailability()` keeps only boolean channel availability for the locked UI, using non-href key names such as `whatsappPrimaryAvailable` and `telegramAvailable`.
- `DatabaseProviderProfileView` computes `catalogAccessUnlocked` first, then uses a redacted `publicVendor` for public content and omits contact/map href props entirely when locked.
- `VendorContactActions` still renders visual WhatsApp/Telegram/Instagram/Phone/Map controls when locked, but renders buttons without hrefs and receives no real URL props.
- Supplier JSON-LD no longer emits `LocalBusiness`; it now emits privacy-safe `ProfilePage` data without `telephone`, `sameAs`, `address`, `streetAddress`, contact links, or exact location.
- Category `ItemList` is built from `accessibleVendors` only and uses generic locked names where needed.

## Verification

### Automated checks

Passed:

```powershell
npx.cmd tsc --noEmit
npx.cmd tsx --test lib/catalog/vendor-privacy.test.ts lib/catalog/vendor-local-business-jsonld.test.ts
$tests = Get-ChildItem -Path lib -Recurse -Filter *.test.ts | ForEach-Object { $_.FullName }; npx.cmd tsx --test $tests
npm.cmd run build
```

Results:

- TypeScript: passed.
- New privacy tests: 4/4 passed.
- Existing lib tests: 65/65 passed.
- Production build: passed.

### Local curl/source checks

Local production server command used for verification:

```powershell
npx.cmd next start -H 127.0.0.1 -p 3005
```

Because the project `npm run start` script binds to `0.0.0.0` and uses only `PORT`, it failed inside this sandbox with `EACCES` on `0.0.0.0:3000`. Direct `next start` on `127.0.0.1:3005` was used without changing project files.

Checked URLs:

- `http://127.0.0.1:3005/ru/catalog/postavshik-zhenskoy-odezhdy-1f12`
- `http://127.0.0.1:3005/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`
- `http://127.0.0.1:3005/ru/categories/zhenskaya-odezhda-optom`
- `http://127.0.0.1:3005/ru/suppliers/asso-corsets`
- `http://127.0.0.1:3005/ru/suppliers/muhsina-kg`
- `http://127.0.0.1:3005/ru/suppliers/lima-brand-kg`
- `http://127.0.0.1:3005/ru/suppliers/bermet-factory`
- `http://127.0.0.1:3005/ru/suppliers/fam-optom-kg`

Local supplier SEO routes returned soft 404 in this sandbox/runtime data set, so supplier-profile HTML could not be fully validated against the live Stage 0 records locally. Catalog audit slug and category page rendered normally after the final build. The privacy grep returned no contact leaks in rendered output.

Grep patterns used:

```powershell
wa\.me|tel:|t\.me|instagram\.com|telephone|sameAs|phone_number|whatsapp_1|whatsapp_2|telegram_url|instagram_url|google_maps_uri|two_gis_uri|yandex_maps_uri
```

and stricter post-fix pattern:

```powershell
https?://wa\.me|whatsapp://|tel:\+|https?://t\.me/|https?://(?:www\.)?instagram\.com/[A-Za-z0-9_.-]+|phone_number|whatsapp_1|whatsapp_2|telegram_url|instagram_url|google_maps_uri|two_gis_uri|yandex_maps_uri|primaryWhatsapp|secondaryWhatsapp|telegramHref|instagramHref|telHref|twoGisHref|googleMapsPublicHref|yandexMapsPublicHref|LocalBusiness|telephone|sameAs|streetAddress
```

Observed local results after the final availability-key cleanup and optional href prop change:

- Category page: no matches for strict leak pattern; JSON-LD leak check: none.
- Catalog audit slug: no matches for strict leak pattern; JSON-LD leak check: none.
- Supplier SEO slugs tested locally returned soft 404, but no matches for strict leak pattern in the returned output.
- UI markers still present for WhatsApp/Telegram/Instagram labels, as expected for locked visual buttons.

Note: broad grep can still match generic translation/example text such as `instagram.com` or `t.me` placeholders. The stricter vendor-contact URL pattern found no real vendor contact URLs.

## Recommended post-deploy manual checks

Run these against the deployed environment after this branch is deployed:

```bash
curl -sL https://dordoi.help/ru/suppliers/asso-corsets | grep -Ei "wa\.me|tel:|t\.me|instagram\.com|telephone|sameAs|phone_number|whatsapp_1|telegram_url|instagram_url"
curl -sL https://dordoi.help/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9 | grep -Ei "wa\.me|tel:|t\.me|instagram\.com|contactsUnlocked|phone_number|whatsapp_1|telegram_url|instagram_url|primaryWhatsapp|telegramHref|instagramHref|telHref|twoGisHref"
curl -sL https://dordoi.help/ru/categories/zhenskaya-odezhda-optom | grep -Ei "wa\.me|tel:|t\.me|instagram\.com|phone_number|whatsapp_1|telegram_url|instagram_url|LocalBusiness|telephone|sameAs"
```

Expected:

- `contactsUnlocked:false` may appear.
- Real `wa.me`, `tel:`, `t.me/{vendor}`, `instagram.com/{vendor}`, map URLs, raw private field names, and JSON-LD `telephone`/`sameAs` must not appear.
- Visual locked contact buttons should remain visible but must be buttons/CTA without href.

## Remaining business decisions

- `store_name`: current implementation treats it as hidden on locked supplier profile SEO metadata/H1/breadcrumbs and locked category `ItemList`, but free preview cards may still show accessible vendor store names. Confirm whether any store name should be treated as private even in free preview cards.
- `seo_slug`: brand-based `/suppliers/{seo_slug}` URLs remain possible. This patch does not migrate slugs, remove sitemap URLs, or redirect legacy brand slugs because that is a separate SEO/URL migration decision.
- exact `location_row`: redacted for locked public profile views and JSON-LD. Confirm whether coarse market location can be added later as safe public copy.
- live validation: the exact Stage 0 supplier records were not available as normal rendered profile pages in the local sandbox, so the live post-deploy curl checks above are required before closing P0 operationally.

## Minimal rollback-safe patch plan applied

1. Centralized redaction in `lib/catalog/vendor-privacy.ts`.
2. Server-side redaction before passing props into `VendorContactActions`.
3. Locked UI now receives only boolean availability, never contact hrefs.
4. Supplier JSON-LD changed from `LocalBusiness` to safe `ProfilePage`.
5. Category `ItemList` now respects accessible vendors.
6. Regression tests added for locked serialization and JSON-LD privacy.
