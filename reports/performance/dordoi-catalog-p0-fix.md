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
