# Stage 1 SEO Safety Fix — dordoi.help

**Date:** 2026-05-13  
**Scope:** Minimal pre-indexation safety fixes (no DB, env, auth, migrations, URL renames).

---

## What changed

### 1. `/catalog` as main browse/money-page

- Updated `Seo.catalog` and `Pages.catalogBrowse` in all 5 locales (`ru`, `kk`, `kg`, `uz`, `tj`).
- RU targets applied; KK/UZ/KK-style translations added; **KG and TJ marked for manual copy review**.
- `CatalogBrowseLayout` renders `subtitle` + new `intro` paragraph (~120 words RU).
- H1 comes from `Pages.catalogBrowse.title` (RU: «Каталог оптовых поставщиков рынка Дордой»).

### 2. Query duplicate policy for `/catalog`

- New helper `lib/catalog/catalog-page-seo.ts`:
  - Clean `/[locale]/catalog` → `index, follow`, canonical unchanged.
  - `?page=N` (N≠1), `?cat=*`, `?search=*`, `?sort=*` → `noindex, follow`, canonical → `/[locale]/catalog`.
  - `?compare=1` → `noindex, nofollow`, canonical → `/[locale]/catalog`.
- `app/[locale]/catalog/page.tsx` wires `generateMetadata` to `buildCatalogPageMetadata`.

### 3. Vendor privacy (public HTML)

- `VendorContactActions`: `contactsLocked` prop → locked CTA copy, no WA/TG/IG/tel links.
- `DatabaseProviderProfileView`: contacts locked; `telephone` removed from `LocalBusiness` JSON-LD; FAQ contact flags forced off (no «WhatsApp/Instagram» in FAQ text).
- `CatalogCard`: Instagram footer button removed.
- `published-vendors`: catalog card mapping sets `instagramUrl: null` (list payload still selects DB fields server-side — see remaining risks).
- Static showcase profiles: `ProviderSidebar` + `ProviderProfileView` locked; `telephone` removed from static JSON-LD in `catalog/[slug]/page.tsx`.

### 4. New vendor slug policy (generator only)

- `lib/catalog/vendor-slug.ts`: new slugs = category prefix + random 4-char suffix from UUID; `store_name` not used for new slugs.
- `lib/actions/vendor-moderation.ts`: passes `categories` into slug builder on approve.
- **Old slugs not migrated** (asso-corsets, arusha-kg, slavyana-moda unchanged).

### 5. `/suppliers` buyer intent

- `Seo.suppliers` + `Pages.suppliers` rewritten (buyer SEO, CTA → `/catalog`, seller block → `/sell`, 3-item FAQ).
- `app/[locale]/suppliers/page.tsx`: custom landing (replaces generic `ArticlePage` seller copy).

---

## Files changed

| File | Change |
|------|--------|
| `lib/catalog/catalog-page-seo.ts` | **NEW** — catalog query metadata |
| `app/[locale]/catalog/page.tsx` | metadata + searchParams |
| `app/[locale]/catalog/[slug]/page.tsx` | remove `telephone` from static JSON-LD |
| `app/[locale]/suppliers/page.tsx` | buyer landing |
| `components/catalog/CatalogBrowseLayout.tsx` | intro paragraph |
| `components/catalog/CatalogCard.tsx` | no Instagram button |
| `components/provider/VendorContactActions.tsx` | `contactsLocked` |
| `components/provider/DatabaseProviderProfileView.tsx` | locked contacts, JSON-LD, FAQ flags |
| `components/provider/ProviderProfileView.tsx` | locked static sidebar |
| `components/provider/ProviderSidebar.tsx` | `contactsLocked` |
| `lib/catalog/vendor-slug.ts` | category-prefix + random suffix |
| `lib/actions/vendor-moderation.ts` | categories for slug |
| `lib/catalog/published-vendors.ts` | null instagram on cards |
| `messages/ru.json` | catalog, suppliers, contactLockedMessage |
| `messages/kk.json` | same |
| `messages/kg.json` | same (needs review) |
| `messages/uz.json` | same |
| `messages/tj.json` | same (needs review) |

**Not touched:** DB, env, auth/payments, Lemon, Supabase RLS, migrations, unrelated dirty files, old vendor slugs, URL architecture.

`components/provider/DatabaseProviderProfileView.tsx` — minimal diff: JSON-LD, contact props, FAQ flags only; pre-existing local changes preserved.

---

## HTML verification (localhost:3000, dev)

| URL | robots | canonical | contact leaks* |
|-----|--------|-----------|----------------|
| `/ru/catalog` | index, follow | `/ru/catalog` | none |
| `/ru/catalog?page=2` | noindex, follow | `/ru/catalog` | none |
| `/ru/catalog?cat=women` | noindex, follow | `/ru/catalog` | none |
| `/ru/catalog?compare=1` | noindex, nofollow | `/ru/catalog` | none |
| `/ru/suppliers` | index, follow | `/ru/suppliers` | none |
| `/ru/catalog/asso-corsets` | index, follow | profile URL | none |
| `/ru/catalog/arusha-kg` | index, follow | profile URL | none |
| `/ru/catalog/slavyana-moda` | index, follow | profile URL | none |

\*Contact leaks checked: `wa.me/`, `t.me/`, `tel:`, Instagram profile `href`, `"telephone"`, `"sameAs"` in HTML.

- RU catalog H1/title/description match Stage 1 spec.
- RU suppliers H1/title/description match Stage 1 spec.
- Vendor profiles show locked message in UI.
- **hreflang:** not observed in raw `fetch()` HTML on dev (likely RSC/streaming); verify on production `view-source` before indexation.
- **Title duplication:** `| Dordoi.help | Dordoi.help` in `<title>` — pre-existing template quirk, not Stage 1 scope.

---

## Build checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** (Next.js 16.2.6) |

---

## Vendor privacy — remaining (Stage 2+)

1. **Product media CDN:** some `product_videos` still hosted on `cdninstagram.com` (media URL, not contact link) — media migration already tracked separately.
2. **List SELECT:** `PUBLISHED_VENDOR_CATALOG_LIST_SELECT_FIELDS` still includes `phone_number`, `instagram_url`, etc.; not rendered in UI but still fetched server-side — trim SELECT in Stage 2.
3. **Paid access gate:** Stage 1 locks all public contacts uniformly; real paywall/unlock flow unchanged (no auth/payment changes per scope).
4. **Buyer directory** (`/buyers`) still exposes buyer WhatsApp/Telegram — out of Stage 1 vendor scope.
5. **Legacy slugs** (brand-based H1/title on profiles) — Stage 2 vendor SEO plan.
6. **KG/TJ copy** — machine-assisted translations need native review.

---

## Stage 2 suggestions

- `/cargo`, `/dordoi-market`, `/wholesale`, `/categories/*` landings.
- Slug migration policy for legacy vendors (optional 301 plan).
- H1/title templates for vendor profiles (category + generic, not brand slug).
- Trim catalog list SQL SELECT; migrate IG CDN media to own storage.
- Fix duplicate `| Dordoi.help` in title template.
- hreflang verification on production deploy.

---

## Git status (end)

Modified tracked (Stage 1):

```
 M app/[locale]/catalog/[slug]/page.tsx
 M app/[locale]/catalog/page.tsx
 M app/[locale]/suppliers/page.tsx
 M components/catalog/CatalogBrowseLayout.tsx
 M components/catalog/CatalogCard.tsx
 M components/provider/DatabaseProviderProfileView.tsx
 M components/provider/ProviderProfileView.tsx
 M components/provider/ProviderSidebar.tsx
 M components/provider/VendorContactActions.tsx
 M lib/actions/vendor-moderation.ts
 M lib/catalog/published-vendors.ts
 M lib/catalog/vendor-slug.ts
 M messages/kg.json
 M messages/kk.json
 M messages/ru.json
 M messages/tj.json
 M messages/uz.json
?? lib/catalog/catalog-page-seo.ts
?? reports/seo/dordoi-stage-1-seo-safety-fix-2026-05-13.md
```

Untracked audit artifacts / tmp / backups not part of this commit.

**Ready for commit:** yes (after human review of KG/TJ strings and privacy spot-check on preview/production).

**Commit/push:** not performed (per task).
