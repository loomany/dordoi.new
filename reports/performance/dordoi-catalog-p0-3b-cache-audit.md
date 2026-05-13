# Dordoi Catalog P0.3b Cache Audit

**Дата:** 2026-05-13  
**Режим:** AUDIT ONLY — временный `unstable_cache` patch **применялся и откачен**, не закоммичен.

---

## Summary

Самый безопасный и эффективный путь — **Option A: `unstable_cache` на `fetchPublishedVendorsCatalogPage()`** с ключом `page + pageSize + cat slugs`, TTL **120 s**, tag `catalog-vendors-list`.

Локальный probe (TTL 120 s):

| Scenario | First hit TTFB | Second hit TTFB |
|----------|---------------:|----------------:|
| `/ru/catalog` | 1.46 s | **0.25 s** |
| `/ru/catalog?page=2` | 1.07 s | **0.23 s** |
| `/ru/catalog?cat=womens` | 1.00 s | **0.24 s** |
| `/ru/suppliers` (control) | — | **0.24 s** |

Warm cache TTFB каталога **сравнялся с suppliers** (~0.23–0.25 s local). На production это может дать **~0.3–0.6 s warm** вместо **~1.0–1.3 s**, если overhead middleware/layout останется как у `/ru/suppliers`.

**Option B** (`export const revalidate = 60` вместо `force-dynamic`) — **не рекомендуется** как первый шаг: `searchParams` (`?page=`, `?cat=`), `force-dynamic`, `headers()` в root layout и cookies в layout chain не дают простого page-level ISR.

**Option C** (split public cache + user favorites) — **рекомендуется вместе с A**: кэшировать только public vendor rows; favorites/profile не блокируют и не попадают в cache key.

---

## Current dynamic blockers

| Blocker | Где | Влияние на cache |
|---------|-----|------------------|
| `export const dynamic = "force-dynamic"` | `app/[locale]/catalog/page.tsx` L9 | Явно отключает static ISR страницы |
| `searchParams` (`page`, `cat`, `compare`) | `catalog/page.tsx` | Много URL-вариантов; нужен **per-key** cache, не одна static page |
| `await headers()` | `app/layout.tsx` L47 | Все маршруты `ƒ` dynamic в build |
| `getSessionProfile()` + cookies | `CatalogBrowseLayout` L124, `utils/supabase/server.ts` | User-specific path; **не должно входить в cache key** |
| `fetchBuyerFavoriteKeySet` | только signed-in | Вне public cache |
| Middleware `getUser()` | `middleware.ts` | На всех страницах; не мешает `unstable_cache` data layer |
| `nuqs` `createLoader` | `catalog/page.tsx` | Парсит query на сервере — OK с helper cache |
| Supabase **admin** client | `fetchPublishedVendorsCatalogPage` | Детерминированный public read; **кэшируемо** |
| `revalidatePath('/catalog')` после moderation | `vendor-moderation.ts`, photo batch actions | **Не инвалидирует** `unstable_cache` без `revalidateTag` |

### Почему сейчас `force-dynamic`

Комментарий в `catalog/page.tsx`: список читает Supabase на каждый запрос. Добавлено в P0.2 осознанно после перехода на paginated fetch. Раньше — тяжёлый full scan.

`force-dynamic` **не запрещает** `unstable_cache` внутри helper — кэшируется результат fetch, страница остаётся dynamic из‑за cookies/searchParams/layout.

---

## Existing cache patterns in repo

| Pattern | Где | Для каталога |
|---------|-----|--------------|
| `unstable_cache` | **нет** в production code | Кандидат для P0.3b |
| `revalidatePath` | `lib/actions/vendor-moderation.ts`, `vendor-photo-batch-moderation.ts`, `vendor-admin-pending-edit.ts` | Уже `revalidatePath(..., '/catalog')` — нужно **добавить `revalidateTag('catalog-vendors-list')`** |
| `Cache-Control` header | `app/sitemap.xml/route.ts`, photo-batches API | Не для HTML catalog |
| `revalidate` export | **нет** на pages | — |
| Custom TTL helpers | **нет** | — |

---

## Option A — cache helper

### Feasibility

**Высокая.** Probe с `unstable_cache` в `fetchPublishedVendorsCatalogPage`:

```ts
unstable_cache(
  () => fetchImpl({ page, pageSize, subcategorySlugs }),
  ["catalog-vendors-page", String(page), String(pageSize), slugKey],
  { revalidate: 120, tags: ["catalog-vendors-list"] },
)
```

- Ключ покрывает `?page=` и `?cat=` (отдельный entry per combination).
- `compare=1` debug path использует `fetchPublishedVendorsForCatalog` — **вне cache** (OK).
- Admin client внутри callback — стандартный паттерн для read-only public data.
- Не требует снятия `force-dynamic` или рефактора middleware.

### Expected gain

- **Cache miss (first hit per key):** ~1.0–1.5 s local TTFB (как сейчас).
- **Cache hit (repeat within TTL):** ~**0.23–0.25 s** local TTFB — **~4–5×** быстрее на warm.
- Prod extrapolation: warm **~0.3–0.6 s** при baseline suppliers **~0.3 s**.

### Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Stale list после approve/reject | Medium | `revalidateTag('catalog-vendors-list')` в существующих moderation actions рядом с `revalidatePath` |
| Stale `totalCount` / pagination | Low–medium | Тот же tag bust |
| Per-key cold miss (много `?cat=` × pages) | Low | TTL 120s; ограниченное число filter combos |
| Memory на Railway | Low | JSON ~12 vendors × N keys |
| Favorites в cache key | **Must avoid** | Option C — не включать user id в key |

---

## Option B — page-level revalidate

### Feasibility

**Низкая** для `/ru/catalog` в текущей архитектуре.

- `searchParams` делает каждый `?page=&cat=` отдельным dynamic render.
- `force-dynamic` перебивает `revalidate` на page segment.
- Root `headers()` → dynamic shell для всех locale routes.
- `getSessionProfile()` в `CatalogBrowseLayout` тянет cookies → personalized dynamic render даже если убрать `force-dynamic`.

Чтобы B сработал полноценно, нужны: вынести session/favorites из blocking path, убрать/изолировать `headers()`, возможно route groups — **большой refactor**, out of scope P0.3b.

### Expected gain

Теоретически CDN/HTML cache — но при текущих blockers **маловероятно** без C.

### Risks

- Сломать favorites SSR state.
- Неверный cache shared между users если не разделить public/private.
- `compare=1` и signed-in edge cases.

---

## Option C — split public data and user favorites

### Feasibility

**Высокая**, дополняет Option A.

```
Cached: fetchPublishedVendorsCatalogPage()  // public rows only
Uncached (optional / deferred): getSessionProfile + fetchBuyerFavoriteKeySet
Render: CatalogBrowseCardGrid(favoriteKeys=[] | client-hydrated)
```

- Anonymous: уже не нужны favorites на SSR (P0.3 audit).
- Signed-in: client fetch favorites или отдельный uncached micro-call **после** cached public HTML.

### Expected gain

- Убирает лишний `getUser` из critical path (P0.3a synergy).
- Public HTML одинаков для всех → **максимальная hit rate** cache.

### Risks

| Risk | Mitigation |
|------|------------|
| Heart icon flash | Acceptable; или skeleton |
| Signed-in sees stale favorite state | Client reconcile after hydrate |
| Favorite toggle | Уже client-side — не ломается |

---

## Temporary benchmark (tested, reverted)

**Setup:** `npm run build` + `npm run start`, `unstable_cache` TTL **120 s**, tag `catalog-vendors-list`.

**Without cache** (same session, earlier runs):

| URL | Run 1 | Run 2 | Run 3 |
|-----|------:|------:|------:|
| `/ru/catalog` | 1.231 s | 0.982 s | 0.928 s |

**With temporary cache:**

| Scenario | First hit | Second hit | Notes |
|----------|----------:|-----------:|-------|
| `/ru/catalog` | 1.461 s | **0.251 s** | page 1 key |
| `/ru/catalog?page=2` | 1.070 s | **0.233 s** | separate key |
| `/ru/catalog?cat=womens` | 1.002 s | **0.244 s** | separate key |
| `/ru/suppliers` | — | 0.239 s | control |

Patch **откачен** — `published-vendors.ts` без `unstable_cache` в рабочей копии (остаются unrelated uncommitted video diffs).

---

## Stale data / TTL

| Event | Delay if only TTL | With `revalidateTag` |
|-------|-------------------|---------------------|
| Admin approves vendor | до TTL | ~immediate after action |
| Vendor profile edit (approved) | до TTL | needs tag on edit actions too |
| Photo batch approved | до TTL | already `revalidatePath(catalog)` — add tag |
| New vendor rejected | N/A (not in list) | — |

**TTL recommendation:**

| TTL | Pros | Cons |
|-----|------|------|
| **60 s** | Fresher | Больше miss на low-traffic keys |
| **120 s** | Баланс (probe default) | **Рекомендуется** |
| **300 s** | Меньше DB load | Заметная задержка без tag bust |

**Обязательно:** `revalidateTag('catalog-vendors-list')` в:

- `lib/actions/vendor-moderation.ts` → `revalidateCabinetAfterModeration`
- `lib/actions/vendor-photo-batch-moderation.ts` → `revalidateAllAfterPhotoBatch`
- `lib/actions/vendor-admin-pending-edit.ts` (уже revalidate catalog layout)

---

## Recommendation

**Implement Option A + C (minimal):**

1. Wrap `fetchPublishedVendorsCatalogPage` in `unstable_cache` (TTL **120 s**, tag `catalog-vendors-list`).
2. Add `revalidateTag('catalog-vendors-list')` next to existing `revalidatePath(..., 'catalog')` in moderation flows.
3. **Optional same PR:** defer `getSessionProfile`/favorites on catalog (P0.3a) for higher cache hit / less work on miss.
4. **Не делать** page-level `revalidate` / снятие `force-dynamic` в первом PR.

Ожидаемый prod warm TTFB: **~0.3–0.6 s** (vs **~1.0–1.3 s**), ближе к `/ru/suppliers`.

---

## Proposed implementation step

**Один маленький PR (P0.3b):**

1. В `lib/catalog/published-vendors.ts`:
   - выделить `fetchPublishedVendorsCatalogPageUncached` (internal);
   - export wrapper с `unstable_cache`, key `["catalog-vendors-page", page, pageSize, sortedCatSlugs]`, `{ revalidate: 120, tags: ["catalog-vendors-list"] }`.
2. В `vendor-moderation.ts` (+ photo batch + admin edit): `import { revalidateTag } from "next/cache"` + `revalidateTag("catalog-vendors-list")`.
3. Локально: `npm run build`, curl first/second hit, prod curl после deploy.
4. **Не трогать:** middleware, auth, UI, `force-dynamic` (можно оставить).

Follow-up PR **P0.3a**: skip profile/favorites SSR on anonymous catalog.

---

## Files reviewed

- `app/[locale]/catalog/page.tsx`
- `components/catalog/CatalogBrowseLayout.tsx`
- `lib/catalog/published-vendors.ts`
- `app/layout.tsx`, `app/[locale]/layout.tsx`
- `utils/supabase/server.ts`, `utils/supabase/middleware.ts`
- `lib/actions/vendor-moderation.ts`
- `lib/actions/vendor-photo-batch-moderation.ts`
- `lib/actions/vendor-admin-pending-edit.ts`
- `app/api/catalog/vendors/[vendorId]/photo-batches/route.ts`
