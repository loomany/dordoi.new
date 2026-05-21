# Dordoi.help — fix P1 kk/kg category 404 links

**Date:** 2026-05-21  
**Issue:** 12 category URLs from `/kk` and `/kg` home returned **404** while `/ru` worked.

---

## Root cause

1. **Category pages exist** for all locales in `lib/catalog/seo-category-route-data.ts` with **localized slugs** per locale (e.g. kk: `ayelder-kiimi-koterme`, kg: `ayaldar-kiyimi-dung`).
2. **Home and SEO link blocks** used `POPULAR_CATEGORY_LINKS` with **Russian-only paths** (`/categories/zhenskaya-odezhda-optom`, etc.).
3. `localizeLinkItems()` in `stage4-localized-content.ts` only swapped **labels**, not **href** → `/kk` rendered links to RU slugs → `resolveSeoCategoryBySlug('kk', 'zhenskaya-odezhda-optom')` returned `undefined` → **404**.

`/ru/categories/{slug}` worked because slugs matched the RU index.

---

## Fix (Variant A)

### 1. Localized hrefs in link localization
- **`lib/seo/seo-internal-links.ts`**: added `localizedCategoryHref()` — maps RU category path → `seoCategoryPath(locale, route)`.
- **`lib/seo/stage4-localized-content.ts`**: `localizeLinkItem()` now rewrites category `href` for kk/kg/uz/tj (and keeps label map keyed by legacy RU path).

### 2. Resolve + canonical redirect (safety net)
- **`lib/catalog/seo-category-routes.ts`**: `resolveSeoCategoryBySlug()` falls back to `ru:{slug}` when locale slug missing (old bookmarks).
- **`app/[locale]/categories/[categorySlug]/page.tsx`**: **308 permanent redirect** to canonical localized slug when URL slug ≠ `route.slugsByLocale[locale]`.

Result:
- Home links point to **localized** category URLs.
- Old RU-slug URLs on `/kk` or `/kg` **redirect** to canonical slug (not 404).

---

## Files changed

| File | Change |
|------|--------|
| `lib/seo/seo-internal-links.ts` | `localizedCategoryHref()` |
| `lib/seo/stage4-localized-content.ts` | `localizeLinkItem()` uses localized category hrefs |
| `lib/catalog/seo-category-routes.ts` | RU slug fallback in resolver |
| `app/[locale]/categories/[categorySlug]/page.tsx` | Redirect to canonical localized slug |

**Not changed:** DB, auth, payments, analytics, Telegram, llms.txt, llms-full.txt, robots, sitemap logic.

---

## Slug mapping (6 categories × 2 locales)

| Category | RU slug (legacy link) | KK slug | KG slug |
|----------|----------------------|---------|---------|
| Women's | `zhenskaya-odezhda-optom` | `ayelder-kiimi-koterme` | `ayaldar-kiyimi-dung` |
| Men's | `muzhskaya-odezhda-optom` | `erler-kiimi-koterme` | `erkek-kiyimi-dung` |
| Kids | `detskaya-odezhda-optom` | `balalar-kiimi-koterme` | `baldar-kiyimi-dung` |
| Footwear | `obuv-optom` | `ayak-kiim-koterme` | `but-kiim-dung` |
| Fabrics | `tkani-shveynaya-furnitura-optom` | `matamen-shyru-furnitura-koterme` | `matamen-shyru-furnitura-dung` |
| Bags | `sumki-kozhgalantereya-optom` | `sumka-teriden-koterme` | `sumka-teri-dung` |

---

## Verification (local, `npm run build` + server :3010)

### All 12 legacy URLs → **200** (after redirect)

```
200 /kk/categories/zhenskaya-odezhda-optom  → redirects to /kk/categories/ayelder-kiimi-koterme
200 /kk/categories/muzhskaya-odezhda-optom
200 /kk/categories/detskaya-odezhda-optom
200 /kk/categories/obuv-optom
200 /kk/categories/tkani-shveynaya-furnitura-optom
200 /kk/categories/sumki-kozhgalantereya-optom
200 /kg/categories/zhenskaya-odezhda-optom  → redirects to /kg/categories/ayaldar-kiyimi-dung
… (all 12 OK)
```

### `/kk` home — category hrefs (no RU slugs)

Sample unique paths from HTML:
- `ayelder-kiimi-koterme`, `erler-kiimi-koterme`, `balalar-kiimi-koterme`, `ayak-kiim-koterme`, `matamen-shyru-furnitura-koterme`, `sumka-teriden-koterme`, …

No `zhenskaya-odezhda-optom` on `/kk` home after fix.

### Build / types

| Check | Result |
|-------|--------|
| `npm run build` | **OK** |
| `npx tsc --noEmit` | **OK** |

### Production smoke

`BASE_URL=https://dordoi.help npm run seo:smoke:dordoi` — **not run** in this task (deploy pending). Recommend after push/deploy.

---

## Acceptance criteria

| Criterion | Status |
|-----------|--------|
| All 12 URLs not 404 (200 or redirect → 200) | **Yes** (local) |
| `/kk`, `/kg` home without broken category links | **Yes** (local) |
| build OK | **Yes** |
| tsc OK | **Yes** |
| No DB/auth/payments/analytics/Telegram changes | **Yes** |
| llms files untouched | **Yes** |

---

## Next step

Commit + push + Railway deploy, then re-check on production:

```powershell
curl.exe -I -L https://dordoi.help/kk/categories/zhenskaya-odezhda-optom
curl.exe -s https://dordoi.help/kk | findstr /i "categories/"
```

Expected: final **200**, home links use **kk/kg localized slugs**.
