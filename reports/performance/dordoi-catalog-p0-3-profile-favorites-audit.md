# Dordoi Catalog P0.3 Profile/Favorites Audit

**Дата:** 2026-05-13  
**Режим:** AUDIT ONLY — код не коммитился; временные `console.log` в `CatalogBrowseLayout` добавлялись и **откачены**.

---

## Summary

Для **anonymous visitor** на `/ru/catalog` узкое место **не** `getSessionProfile` / favorites на локали:  
`fetchPublishedVendorsCatalogPage()` занимает **~700–1000 ms** из **~950–1070 ms** `CatalogBrowseLayout`.

`getSessionProfile()` **всегда вызывается** (стр. 124), но при отсутствии сессии локально стоит **~1–15 ms**; `fetchBuyerFavoriteKeySet` **не вызывается**.

Разрыв **catalog ~1.0 s** vs **suppliers ~0.23 s** (local prod) объясняется в основном **дополнительным Supabase list query на каталоге**, а не favorites.

На **production** второй `getUser()` в `getSessionProfile` (поверх middleware) может добавлять **десятки–сотни ms** только на страницах, где вызывается layout каталога — но это **меньше**, чем оставшийся catalog query (~1 s warm prod).

**Вывод P0.3:** skip/defer `getSessionProfile` на каталоге для anonymous — **low-risk micro-win**; основной следующий выигрыш — **ускорение/кэш `fetchPublishedVendorsCatalogPage`**, не favorites SSR.

---

## Current flow

`components/catalog/CatalogBrowseLayout.tsx` (async RSC, блокирует HTML):

```
getTranslations ×2 + getLocale()
  → await getSessionProfile()                    // всегда
  → profile ? fetchBuyerFavoriteKeySet() : ∅    // только signed-in
  → await fetchPublishedVendorsCatalogPage()    // обычный путь
  → buildCatalogCardSourceRowForPublishedVendor ×12
  → <CatalogBrowseCardGrid favoriteKeys={...} />
```

### `getSessionProfile()` (`lib/auth/session-profile.ts`)

| Step | Supabase / IO | Anonymous | Signed-in |
|------|---------------|-----------|-----------|
| `createClient()` + `auth.getUser()` | Auth API | **Да** — возврат `null` если нет user | Да |
| `profiles` SELECT | DB | Нет | Да |
| `fetchVendorRowForAuthenticatedUser` | Admin `vendors` + optional link | Нет | Да (buyer/vendor) |

**Cookies:** читает Supabase auth cookies через `@/utils/supabase/server` (SSR).

**Дублирование:** `middleware.ts` уже делает `await supabase.auth.getUser()` на **каждый** HTML hit → на каталоге возможен **второй** `getUser()` в RSC.

### `fetchBuyerFavoriteKeySet()` (`lib/favorites/buyer-favorites.ts`)

- Вызывается **только если** `profile !== null` (`CatalogBrowseLayout` L125–127).
- Один запрос: `buyer_catalog_favorites` SELECT `listing_key` WHERE `user_id`.
- Результат → `favoriteKeys` → props в `CatalogBrowseCardGrid` → `initialFavorite` на `CatalogFavoriteButton`.

### Client favorites (`CatalogFavoriteButton.tsx`)

- Отдельно: `getSession()` + `onAuthStateChange` на клиенте.
- Toggle избранного — client Supabase insert/delete.
- Без SSR favorites: `initialFavorite=false` → краткий flash «не в избранном» до client hydrate (приемлемо для P0.3).

### Dynamic / cache

- `app/[locale]/catalog/page.tsx`: `export const dynamic = "force-dynamic"`.
- `getSessionProfile()` использует `cookies()` косвенно через Supabase server client → участвует в dynamic SSR.
- Production headers: `Cache-Control: private, no-cache` (как в P0.2 prod verification).
- **Suppliers** не вызывает `getSessionProfile` → меньше server work, тот же middleware.

---

## Timing results

### Server segments (`[catalog-perf]` logs, anonymous, `npm run start` local)

Временные логи (не в git). 9 hits по `/ru/catalog`, `/ru/catalog?page=2`, `?cat=womens`.

| Segment | Run 1 | Run 2 | Run 3 | Notes |
|---------|------:|------:|------:|-------|
| `i18nMs` | 7 | 1 | 1 | `getTranslations` + `getLocale` |
| `profileMs` | 15 | 2 | 2 | `getSessionProfile`, anonymous |
| `favoritesMs` | 0 | 0 | 0 | не вызывается |
| `catalogQueryMs` | 1028 | 1007 | 946 | `fetchPublishedVendorsCatalogPage` |
| `cardBuildMs` | 13 | 2 | 2 | map ×12 vendors |
| `layoutTotalMs` | 1071 | 1012 | 952 | сумма в layout |

Доп. прогоны (runs 4–9): `profileMs` **1–3**, `catalogQueryMs` **694–853**, `layoutTotalMs` **698–860**.

### curl TTFB local (3 runs, после `npm run build && npm run start`)

| URL | Run 1 | Run 2 | Run 3 | Notes |
|-----|------:|------:|------:|-------|
| `/ru/catalog` | 1.196 s | 1.007 s | 0.921 s | HTTP 200 |
| `/ru/catalog?page=2` | 1.068 s | 0.936 s | 0.970 s | HTTP 200 |
| `/ru/catalog?cat=womens` | 0.972 s | 0.937 s | 1.092 s | HTTP 200 |
| `/ru/suppliers` | 0.234 s | 0.221 s | 0.244 s | control, HTTP 200 |

`layoutTotalMs` ≈ TTFB каталога (без middleware) — согласуется.

---

## Anonymous visitor behavior

| Вопрос | Ответ |
|--------|--------|
| `getSessionProfile()` вызывается? | **Да, всегда** |
| Сколько занимает (local)? | **~1–15 ms** (cold first ~15 ms) |
| `fetchBuyerFavoriteKeySet` вызывается? | **Нет** — `profile === null` → пустой `Set` |
| Блокирует render? | **Да** — `await` до catalog query (но быстрый при anonymous local) |
| Supabase запросов в layout (anonymous) | **1×** `getUser` в profile + **1×** paginated vendors query (+ middleware `getUser`) |

---

## Signed-in behavior (code analysis; live session не тестировалась)

| Step | Extra Supabase |
|------|----------------|
| `getSessionProfile` | `getUser` + `profiles` + admin `vendors` (+ optional link) |
| `fetchBuyerFavoriteKeySet` | `buyer_catalog_favorites` SELECT all keys for user |

Оценка на prod: **+100–400 ms** в зависимости от RTT и размера favorites (обычно мало строк).

---

## Bottleneck verdict

| Layer | Anonymous local | Вклад |
|-------|-----------------|-------|
| Middleware `getUser` | на всех страницах | baseline ~0.2 s suppliers |
| **`fetchPublishedVendorsCatalogPage`** | **700–1000 ms** | **~85–95% layout** |
| `getSessionProfile` (anonymous) | 1–15 ms | **<2% layout** local |
| `fetchBuyerFavoriteKeySet` | 0 | **0%** anonymous |
| Card build | 1–13 ms | negligible |

**Гипотеза prod (~1.0–1.3 s catalog vs ~0.3 s suppliers):**

- **~0.7–1.0 s** — catalog Supabase query (+ network EU).
- **~0–0.2 s** — возможный второй `getUser` в RSC (не измерен на prod отдельно).
- Favorites — **не причина** для anonymous.

---

## Safe fix proposal (P0.3)

### A. Anonymous fast path (recommended first)

В `CatalogBrowseLayout`:

```ts
// Pseudocode — не реализовано
const profile = hasSupabaseAuthCookie()
  ? await getSessionProfile()
  : null;
const favoriteKeys = profile
  ? await fetchBuyerFavoriteKeySet(profile.userId)
  : new Set();
```

Или проще для P0.3: **убрать `getSessionProfile` с каталога полностью**, передать `favoriteKeys=[]`, подгружать избранное на клиенте для signed-in.

**Эффект anonymous prod:** потенциально **−1 RTT `getUser`** (десятки–сотни ms), не гарантированно 300–600 ms.

### B. Client-side favorites hydrate (signed-in)

- SSR: `favoriteKeys=[]` всегда на list.
- Новый client helper / `useEffect` в `CatalogBrowseCardGrid`: один SELECT favorites после `getSession()`.
- `CatalogFavoriteButton` уже умеет toggle без SSR state.

**Что сломается:** краткий incorrect empty-heart до hydrate; SEO не затронут.

### C. Не делать в P0.3

- Менять middleware / auth flows.
- Менять RLS / schema.
- Менять UI favorite button behavior (кроме initial state source).

---

## Risk assessment

| Change | Risk | Mitigation |
|--------|------|------------|
| Skip profile when no auth cookie | Low | Проверить cookie names Supabase SSR |
| Client favorites hydrate | Low–medium | Один batch fetch; skeleton optional |
| Keep profile for signed-in only | Low | Cookie gate |

---

## Recommended next implementation step

1. **P0.3a (small):** не вызывать `getSessionProfile` / favorites на каталоге для anonymous (cookie check или всегда defer favorites).
2. **P0.3b (bigger win):** `unstable_cache` / `revalidate` на `fetchPublishedVendorsCatalogPage` (60–120 s) — без изменения auth.
3. Измерить prod после P0.3a отдельным curl (не смешивать с P0.3b).

---

## Файлы аудита

- `components/catalog/CatalogBrowseLayout.tsx` (L124–127, L190–215, L238–247)
- `lib/auth/session-profile.ts`
- `lib/favorites/buyer-favorites.ts`
- `components/favorites/CatalogFavoriteButton.tsx`
- `utils/supabase/middleware.ts`
- `app/[locale]/suppliers/page.tsx` (control — no profile fetch)
