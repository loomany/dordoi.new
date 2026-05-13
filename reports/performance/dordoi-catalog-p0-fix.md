# Dordoi `/ru/catalog` — P0 paginated fetch fix

**Дата:** 2026-05-13  
**Scope:** P0.2 — `fetchPublishedVendorsCatalogPage()` + подключение в `CatalogBrowseLayout`

См. также: [`dordoi-speed-audit.md`](./dordoi-speed-audit.md)

---

## P0.2 step 2 verification

**Режим:** verification only (код не менялся в этом шаге).

### Build / typecheck

| Check | Result | Notes |
|-------|--------|-------|
| `npx tsc --noEmit` | **PASS** | Первый прогон упал на transient parse error в `CatalogCardPhotoRail.tsx`; повторный — OK |
| `npm run build` | **PASS** | Next.js 16.2.6, Turbopack, ~33 s |
| `npm run start` | **PASS** | `http://localhost:3000` (старый процесс на :3000 остановлен, поднят fresh build) |

### Local TTFB after fix

Окружение: Windows, `curl.exe -w @curl-format.txt`, production server `npm run start` на **порту 3000**.  
Метрика: **TTFB** = `time_starttransfer`.

| URL | Run 1 | Run 2 | Run 3 | Notes |
|-----|------:|------:|------:|-------|
| `/ru/catalog` | 0.835 s | 0.671 s | 0.624 s | HTTP 200; HTML ~257 KB |
| `/ru/catalog?page=2` | 0.608 s | 0.671 s | 0.612 s | HTTP 200; 12 cards |
| `/ru/catalog?cat=womens` | 0.639 s | 0.592 s | 0.617 s | HTTP 200; filter OK |
| `/ru` (control) | 0.226 s | 0.233 s | 0.223 s | HTTP 200 |
| `/ru/suppliers` (control) | 0.223 s | 0.219 s | 0.241 s | HTTP 200 |

**Средний TTFB `/ru/catalog` (3 runs):** ~**0.71 s** (page 1).

### Comparison with audit baseline

| Metric | Before (audit) | After (this verification) | Delta |
|--------|----------------|---------------------------|-------|
| `/ru/catalog` local TTFB | **2.1–2.8 s** | **~0.62–0.84 s** | **~3–4× быстрее** |
| `/ru/catalog` prod warm TTFB | 2.5–4.4 s | *(не замерялось в этом шаге)* | deploy + prod curl — отдельно |
| `/ru/catalog` HTML size | ~262 KB | ~257 KB | небольшое снижение |
| `/ru/suppliers` local TTFB | ~0.015 s | ~0.22 s | control; разброс connect на Windows |

**Вывод:** фикс **дал заметный эффект** на локальном TTFB каталога. Каталог всё ещё **~3× медленнее** `/ru/suppliers` на том же сервере — остаётся overhead SSR (auth, favorites, Supabase round-trip, dynamic route).

### Query behavior confirmed

| Проверка | Статус | Источник |
|----------|--------|----------|
| Обычный `/ru/catalog` не вызывает `fetchPublishedVendorsForCatalog()` | **OK** | `CatalogBrowseLayout.tsx` — ветка `else` → `fetchPublishedVendorsCatalogPage` |
| `parsed_ai_data` не в list SELECT | **OK** | `PUBLISHED_VENDOR_CATALOG_LIST_SELECT_FIELDS` без `parsed_ai_data` |
| `pageSize: 12` на обычном пути | **OK** | `CATALOG_PAGE_SIZE = 12`; HTML: 12× `data-vendor-card` на p1 и p2 |
| `?compare=1` → старый full fetch | **OK** | ветка `compareWithPreview` → `fetchPublishedVendorsForCatalog()` |
| `?page=2` работает | **OK** | HTTP 200, 12 карточек, другой HTML vs p1 |
| `?cat=womens` работает | **OK** | HTTP 200, страница рендерится |

### Visual check

Проверка по сохранённому HTML + `curl -I` (браузер не открывался; контент эквивалентен SSR).

| URL | Result |
|-----|--------|
| `/ru/catalog` | 12 карточек (`data-vendor-card`); ссылки `/ru/catalog/{slug}`; sample placeholders **не** видны (vendors > 0) |
| `/ru/catalog?page=2` | 12 карточек; пагинация в разметке |
| `/ru/catalog?cat=womens` | HTTP 200, карточки рендерятся |
| `/ru/catalog/container-04-12` | HTTP **200**, profile page OK |
| `/ru/catalog?compare=1` | debug path отвечает (full fetch path) |

### Remaining bottlenecks

**Не чинить в этом P0 — только список:**

1. **`getSessionProfile()` + `fetchBuyerFavoriteKeySet`** на каждый заход в каталог (`CatalogBrowseLayout` L123–126)
2. **`force-dynamic`** на `app/[locale]/catalog/page.tsx` — нет ISR / edge cache
3. **Middleware `supabase.auth.getUser()`** на каждый HTML hit
4. **`product_photos`** в list SELECT + plain `<img>` без оптимизации
5. **Client JS bundle** — `CatalogBrowseCardGrid`, `CatalogCard`, header, analytics, nuqs
6. **Без `parsed_ai_data` на list** — тексты карточек только из колонок БД (ИИ-overlay на списке временно не применяется)
7. **`?cat=` DB filter** — `overlaps` по slug-ам, без нормализации русских синонимов в БД (ограничение step 1 helper)

### Acceptance criteria

| Criterion | Met? |
|-----------|------|
| `npx tsc --noEmit` проходит | Yes (на повторном прогоне) |
| `npm run build` проходит | Yes |
| Есть before/after TTFB | Yes |
| `/ru/catalog` быстрее | Yes (~3–4× local TTFB) |
| Обычный каталог не делает full fetch | Yes (code + 12 cards/page) |
| Отчёт обновлён | Yes |
| Код не менялся во время verification | Yes |

---

## Implementation log (кратко)

### P0.2 step 1

- Добавлен `fetchPublishedVendorsCatalogPage()` в `lib/catalog/published-vendors.ts`
- `.range()`, `count: exact`, SELECT без `parsed_ai_data`

### P0.2 step 2

- `CatalogBrowseLayout` подключён к paginated helper (кроме `?compare=1`)

---

## P0.2 production verification

**Дата:** 2026-05-13  
**Режим:** verification only (код/коммиты не менялись). Отчёт обновлён локально, **не закоммичен**.

### Deployed commit

| Check | Result |
|-------|--------|
| `origin/main` HEAD | **`c860f58`** — `perf(catalog): paginate vendor list without parsed_ai_data` |
| Pre-requisite on `main` | `a6224ad` — `fetchPublishedVendorsCatalogPage` helper в `published-vendors.ts` |
| Railway deploy SHA | **Не проверялось** (нет доступа к Railway dashboard/logs в этом шаге) |
| Косвенный признак deploy | Production отвечает **HTTP 200** на все catalog URLs; warm TTFB **~1.0–1.3 s** (было **2.5–4.4 s**) |

### Production TTFB

`curl.exe` → `https://dordoi.help`, метрика **TTFB** = `time_starttransfer`. 5 прогонов.

| URL | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Notes |
|-----|------:|------:|------:|------:|------:|-------|
| `/ru/catalog` | 3.251 s | 1.275 s | 1.248 s | 1.260 s | 1.282 s | HTTP 200; run1 cold spike |
| `/ru/catalog?page=2` | 1.311 s | 1.280 s | 1.296 s | 1.364 s | 1.283 s | HTTP 200 |
| `/ru/catalog?cat=womens` | 1.286 s | 1.266 s | 1.331 s | 0.997 s | 1.038 s | HTTP 200 |
| `/ru` (control) | 0.349 s | 0.320 s | 0.349 s | 0.312 s | 0.306 s | HTTP 200 |
| `/ru/suppliers` (control) | 0.336 s | 0.329 s | 0.332 s | 0.336 s | 0.284 s | HTTP 200 |

**Warm median `/ru/catalog` (runs 2–5):** ~**1.26 s** TTFB.

### Headers

`/ru/catalog`, `?page=2`, `?cat=womens` — одинаково:

| Header | Value |
|--------|--------|
| Status | **200 OK** |
| `Cache-Control` | `private, no-cache, no-store, max-age=0, must-revalidate` |
| `cf-cache-status` | **DYNAMIC** |
| `Location` | нет (без redirect) |
| `:8080` в URL/Location | **нет** |
| `x-railway-edge` | `railway/europe-west4-drams3a` |

### Visual check

Проверка по production HTML (`curl -s`); браузер/консоль не открывались.

| URL | HTTP | Проверка |
|-----|------|----------|
| `/ru/catalog` | 200 | **12**× `data-vendor-card`; **24** profile links `/ru/catalog/{slug}`; sample placeholders не доминируют |
| `/ru/catalog?page=2` | 200 | **12** карточек; HTML ~263 KB |
| `/ru/catalog?cat=womens` | 200 | страница рендерится |
| `/ru/catalog/container-04-12` | 200 | profile page OK |

Консольные ошибки: **не проверялись** (нет browser session).

### Result

| Metric | Before (prod audit) | After deploy (this check) |
|--------|---------------------|---------------------------|
| `/ru/catalog` prod warm TTFB | **2.5–4.4 s** | **~1.0–1.3 s** (runs 2–5); run1 **3.25 s** |
| `/ru/catalog?page=2` | *(не в audit)* | **~1.28–1.36 s** |
| `/ru/catalog?cat=womens` | *(не в audit)* | **~1.0–1.33 s** |
| Local after P0.2 | 0.62–0.84 s | Prod ~**2× медленнее** local (middleware + network + auth path) |

**Вердикт:** P0.2 **дал заметный выигрыш на production** (~**2×** на warm TTFB, до **~3×** vs верх audit range). Цель **0.7–1.2 s** на prod **почти достигнута** на `?cat=womens` (run 4–5), но `/ru/catalog` стабильно **~1.25 s** — следующий слой: `getSessionProfile`/favorites, middleware, cache.

### Remaining bottlenecks

Не чинить без отдельного approve:

- `getSessionProfile` / favorites
- `force-dynamic` / cache
- middleware `getUser`
- images / `product_photos`
- client JS bundle

---

## P0.3b implementation — cached public catalog query

**Дата:** 2026-05-13  
**Scope:** `unstable_cache` на `fetchPublishedVendorsCatalogPage()` + `revalidateTag` в moderation.  
**Не в scope:** `force-dynamic`, middleware, `getSessionProfile`, favorites, UI, schema.

### What changed

| File | Change |
|------|--------|
| `lib/catalog/published-vendors.ts` | `fetchPublishedVendorsCatalogPageRaw()` (Supabase query) + cached `fetchPublishedVendorsCatalogPage()` via `unstable_cache`; export `CATALOG_VENDORS_LIST_CACHE_TAG` |
| `lib/actions/vendor-moderation.ts` | `revalidateTag(CATALOG_VENDORS_LIST_CACHE_TAG, "max")` в `revalidateCabinetAfterModeration()` (approve/reject vendor) |
| `lib/actions/vendor-photo-batch-moderation.ts` | то же в `revalidateAllAfterPhotoBatch()` (фото на карточке каталога) |

Кэш оборачивает **только** paginated public vendor rows. `CatalogBrowseLayout` по-прежнему вызывает `getSessionProfile()` / favorites **вне** cache wrapper.

### Cache key

```txt
[
  "published-vendors-catalog-page",
  String(page),
  String(pageSize),
  normalizedSubcategorySlugs.join(","),  // unique + sorted after normalizeCatalogCategorySlugs
]
```

### TTL / tags

| Setting | Value |
|---------|-------|
| `revalidate` | **120** s |
| `tags` | **`catalog-vendors-list`** (`CATALOG_VENDORS_LIST_CACHE_TAG`) |

### Revalidation coverage

| Event | File | Status |
|-------|------|--------|
| Vendor approve / reject | `vendor-moderation.ts` | **Done** — `revalidateTag(..., "max")` |
| Photo batch approve (карточка) | `vendor-photo-batch-moderation.ts` | **Done** |
| Admin pending vendor edit | `vendor-admin-pending-edit.ts` | **Not wired** — pending vendors не в public list; низкий приоритет |
| Vendor self-edit (approved) | — | **Next step** — если есть server action без moderation path |
| Media sync scripts | `scripts/sync-all-media.ts` | **Not wired** — TTL 120s покрывает; tag при необходимости позже |

**Note:** Next.js 16 требует второй аргумент у `revalidateTag` — используем `"max"`.

### Local benchmark

Окружение: Windows, fresh `npm run build` + `npm run start` (порт 3000 освобождён), `curl.exe -w @curl-format.txt`.  
Метрика: **TTFB** = `time_starttransfer`. Run 1 = cold cache, Run 2 = warm cache (тот же URL).

| URL | First hit | Warm hit | Notes |
|-----|----------:|---------:|-------|
| `/ru/catalog` | **1.52 s** | **0.23 s** | HTTP 200; ~6.5× на warm |
| `/ru/catalog?page=2` | **1.05 s** | **0.25 s** | HTTP 200 |
| `/ru/catalog?cat=womens` | **1.05 s** | **0.23 s** | HTTP 200 |

**Сравнение с P0.2 (без cache):** warm TTFB каталога **~0.62–0.84 s** → **~0.23–0.25 s** (близко к `/ru/suppliers` ~0.22 s в P0.2 verification). Cold first hit остаётся ~1.0–1.5 s (Supabase + SSR shell).

### Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** (Next.js 16.2.6) |
| Cache key: page / pageSize / slugs | **OK** |
| User profile/favorites вне cache | **OK** — только `fetchPublishedVendorsCatalogPageRaw` |
| `/ru/catalog`, `?page=2`, `?cat=womens` | **HTTP 200** |
| `force-dynamic` / middleware / auth untouched | **OK** |
| `parsed_ai_data` в list SELECT | **Removed** (pre-commit check) — см. ниже |

### Known limitations

1. **Cold TTFB** всё ещё ~1–1.5 s — первый запрос после restart / новый cache key бьёт в Supabase.
2. **`force-dynamic`** на странице — HTML не edge-cached; выигрыш только на data layer.
3. **`getSessionProfile()`** на каждый hit — отдельный слой (P0.3a).
4. **Stale list до 120 s** если approve без moderation path (редко).
5. **`revalidatePath('/catalog')` alone** не bust `unstable_cache` — нужен tag (добавлен в moderation).

### Next step

1. Deploy P0.3b → prod curl (cold/warm) vs P0.2 baseline.
2. P0.3a: skip/defer `getSessionProfile` + favorites для anonymous на `/catalog`.
3. Опционально: `revalidateTag` в vendor self-edit path; убрать `parsed_ai_data` из list SELECT (отдельный perf task).
4. **Не коммитить** в этом шаге — ждать review diff.

### P0.3b pre-commit SELECT check

- **parsed_ai_data in list SELECT:** **Yes** (был в `PUBLISHED_VENDOR_CATALOG_LIST_SELECT_FIELDS` на working tree / post-P0.2 regression)
- **Action taken:** удалён из `PUBLISHED_VENDOR_CATALOG_LIST_SELECT_FIELDS` и из `mapPublishedVendorCatalogListRow`; в `vendorToCatalogCardSource` description fallback на `vendor.description` при отсутствии AI overlay
- **Build:** **PASS** (`npm run build`, Next.js 16.2.6)
- **Typecheck:** **PASS** (`npx tsc --noEmit`)
- **Warm benchmark** (post-fix, `curl.exe -w @curl-format.txt`, TTFB):

| URL | Run 1 | Run 2 (warm) |
|-----|------:|-------------:|
| `/ru/catalog` | 0.28 s | **0.26 s** |
| `/ru/catalog?page=2` | 1.06 s | **0.25 s** |
| `/ru/catalog?cat=womens` | 0.96 s | **0.24 s** |

List SELECT теперь **не включает** `parsed_ai_data`; profile/detail SELECT без изменений.

---

## P0.3b production verification

**Дата:** 2026-05-13  
**Режим:** verification only (код/коммиты не менялись).

### Deployed commit

| Check | Result |
|-------|--------|
| `origin/main` HEAD | **`a179a78`** — `perf(catalog): cache public vendor list` |
| Railway deploy SHA | **Не проверялся** (нет доступа к Railway dashboard/logs) |
| Косвенный признак | Production отвечает **HTTP 200**; warm TTFB каталога **~1.0–1.1 s** — **без заметного улучшения** vs P0.2 prod baseline (~1.0–1.3 s). Возможны: deploy ещё не завершён, multi-instance без shared cache, или SSR overhead доминирует. |

### Production TTFB after cache

`curl.exe` → `https://dordoi.help`, метрика **TTFB** = `time_starttransfer`.

| URL | Run 1 | Run 2 | Run 3 | Run 4 | Run 5 | Run 6 | Notes |
|-----|------:|------:|------:|------:|------:|------:|-------|
| `/ru/catalog` | 2.95 s | 1.02 s | 1.06 s | 1.05 s | 1.07 s | 1.03 s | HTTP 200; run1 cold |
| `/ru/catalog?page=2` | 2.75 s | 1.01 s | 1.04 s | — | — | — | HTTP 200; 3 runs |
| `/ru/catalog?cat=womens` | 1.10 s | 1.27 s | 1.42 s | — | — | — | HTTP 200; 3 runs |
| `/ru` (control) | 0.31 s | — | — | — | — | — | HTTP 200 |
| `/ru/suppliers` (control) | 0.36 s | — | — | — | — | — | HTTP 200 |

### Warm cache result

**Before P0.3b:**
- `/ru/catalog` prod warm after P0.2: **~1.0–1.3 s**

**After P0.3b (this check):**
- `/ru/catalog` prod warm (runs 2–6): **~1.03–1.07 s** — **≈ без изменений**
- `/ru/catalog?page=2` prod warm: **~1.01–1.04 s**
- `/ru/catalog?cat=womens` prod warm: **~1.10–1.42 s** (разброс выше)

**Вывод:** цель **0.3–0.6 s** warm на prod **не достигнута** в этом замере. Локально P0.3b давал **~0.24–0.26 s** warm — разрыв prod vs local указывает на deploy lag, per-instance `unstable_cache`, и/или фиксированный ~1 s SSR path (middleware + `getSessionProfile` + dynamic layout).

### Headers

`/ru/catalog`, `?page=2`, `?cat=womens` — одинаково:

| Header | Value |
|--------|--------|
| Status | **200 OK** |
| `Cache-Control` | `private, no-cache, no-store, max-age=0, must-revalidate` |
| `cf-cache-status` | **DYNAMIC** (ожидаемо для server-side `unstable_cache`) |
| `x-railway-edge` | `railway/europe-west4-drams3a` |
| Redirect / `:8080` | **нет** |

### Visual check

Проверка по production HTML (`curl -sL`); браузер/консоль не открывались.

| URL | HTTP | Проверка |
|-----|------|----------|
| `/ru/catalog` | 200 | **12**× `data-vendor-card`; HTML ~262 KB |
| `/ru/catalog?page=2` | 200 | **12** карточек; ~263 KB |
| `/ru/catalog?cat=womens` | 200 | **12** карточек; ~262 KB |
| `/ru/catalog/container-04-12` | 200 | profile page ~144 KB |

Консольные ошибки: **не проверялись**.

### Result

| Metric | P0.2 prod warm | P0.3b prod warm (this check) | Local P0.3b warm |
|--------|----------------|------------------------------|------------------|
| `/ru/catalog` TTFB | ~1.0–1.3 s | **~1.03–1.07 s** | ~0.24–0.26 s |
| `/ru/suppliers` TTFB | ~0.28–0.34 s | **~0.36 s** | ~0.22 s |

**Вердикт:** функционально каталог **OK** (12 cards, pagination, filter, profile). **Perf:** warm prod TTFB **не улучшился** заметно vs P0.2 в этом окне — нужна повторная проверка после подтверждения Railway deploy `a179a78` и/или P0.3a (anonymous profile skip).

### Remaining bottlenecks

Do not fix yet:

- middleware `getUser`
- `force-dynamic` / page-level cache
- `getSessionProfile` duplicate user lookup
- images / `product_photos`
- client JS bundle
- prod multi-instance `unstable_cache` (no shared data cache between replicas)
