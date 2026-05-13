# Video migration report — 2026-05-13

Финальная фиксация media migration: external video URL → Supabase Storage (`vendor-videos`), Postgres UPDATE (Lap 2).

**Статус:** завершено.  
**SEO FAQ:** не затрагивался (отдельная будущая задача).  
**Instagram-sync:** не запускался в ходе миграции.

---

## 1. Baseline (до миграции, prod)

| Метрика | Значение |
|---------|----------|
| External video **instances** (`product_videos[]` в БД) | **1472** |
| Approved с external **lead** video (`product_videos[1]`) | **189** |
| Vendors с хотя бы одним external video URL | **216** |
| Уникальных external video URL (dry-run) | **1472** |
| External photo URL | **0** (фото уже на `vendor-media`) |
| `product_videos` digest (pre-Lap 2) | `9c541e4ce0135393268849003fa7c78cfef02b21ac3e45ec8ac8f872c7f1250c` |

**Root cause (аудит):** публичный каталог зависел от временных Instagram/fbcdn URL; UI без `onError`/fallback; gate публикации не проверял видео на Storage.

---

## 2. Что сделано

### 2.1 Pilot — Storage-only, `limit=20`

```text
npm run sync:all-media -- --dry-run=false --skip-db-phase=true --limit=20 --checkpoint-file=.sync-all-media.checkpoint.pilot.json
```

- Обработано: **20 / 20** URL в map.
- Все 20 уже были в Storage (HEAD reuse); CDN не дергался.
- Ошибок: **0**. БД не менялась.

### 2.2 Lap 1 — full Storage-only

```text
npm run sync:all-media -- --dry-run=false --skip-db-phase=true --delay-ms=500 --batch-size=2 --fetch-timeout-ms=120000 --upload-timeout-ms=600000 --checkpoint-file=.sync-all-media.checkpoint.video-migrate.json
```

- Очередь: **1472** unique external video URL.
- В map: **1471**; ошибок фазы 2: **1** (oversized ~392 MB, лимит bucket 100 MB).
- Переиспользовано из Storage: **1470**; новый CDN upload: **1** (~10.5 MB).
- Длительность: **~28 мин**. БД не менялась.
- Checkpoint: `.sync-all-media.checkpoint.video-migrate.json` (**1471** video hash).

### 2.3 Backup `product_videos` (pre–Lap 2)

| Файл | Строк | Размер |
|------|-------|--------|
| `backups/vendors-media-backup-2026-05-13.json` | 511 | ~2.42 MB |
| `backups/vendors-external-video-backup-2026-05-13.json` | 216 | ~1.54 MB |

Колонки: `id`, `slug`, `status`, `product_videos` (+ `product_photos`, `logo_url` в полном backup).

### 2.4 Lap 2 — Postgres UPDATE (phase 3)

```text
npm run sync:all-media -- --dry-run=false --skip-db-phase=false --delay-ms=500 --batch-size=2 --checkpoint-file=.sync-all-media.checkpoint.video-migrate.json
```

- Exit code: **0**; длительность: **~6 мин 19 с**.
- Checkpoint prefill: **1471** URL в map; фаза 2 retry oversized: **1** failed (тот же лимит).
- **`vendors` обновлено:** **216** строк (`product_videos`).
- **`vendor_photo_batch_items` обновлено:** **0**.
- Ошибок БД: **0**.

Логи (локально, не для git): `sync-all-media-pilot.log`, `sync-all-media-lap1.log`, `sync-all-media-lap2.log`.

---

## 3. Итог (после Lap 2)

| Метрика | Было | Стало |
|---------|------|-------|
| External video **instances** | 1472 | **1** |
| Approved external **lead** video | 189 | **0** |
| Vendors с external video | 216 | **1** |
| Vendors **mixed** (Storage + external в одном массиве) | 56 | **1** |
| Storage video instances | 1235 | **2706** |
| `product_videos` digest | `9c541e4…` | `9cc5afee78442157a8fc1a2f748f8f411d8c4f4d0591b3e267d59dcfb27de527` |

### Единственный остаток

| Поле | Значение |
|------|----------|
| **slug** | `muratti-kg` |
| **status** | `approved` |
| **External URL** | **позиция 8** (не lead) |
| **Причина** | ~392 MB mp4; Supabase bucket `vendor-videos` limit **100 MB** |
| **Lead video (`[1]`)** | **Storage** (`vendor-videos`) — в каталоге первый слайд с Supabase |
| **Видимость в UI** | Проблема только при раскрытии карточки и листании до **8-го** слайда |

**Заменено URL:** **1471** external → `vendor-videos` Storage URL.

---

## 4. Риски и защита от отката

### 4.1 `sync-instagram-profiles` может затереть Storage → fbcdn

**Да.** Скрипт без проверки «уже на Storage» перезаписывает `product_photos` и `product_videos` из scraper JSON.

**Операционная политика до code fix (anti-clobber):**

- **Не запускать** `sync-instagram-profiles` на prod без стратегии ingest.
- После любого Instagram-sync — dry-run `sync-all-media` и сверка external count.
- Будущий **P0 code patch** (отдельный approve): не перезаписывать Storage URL; enrich-only режим; gate для `approved`.

### 4.2 Oversized video остаётся external

Один URL вне map/checkpoint. Не влияет на lead video. Отдельный план: transcode, поднять лимит bucket, или удалить URL из массива (все — с approve).

### 4.3 UI без graceful degradation

`CatalogCardPhotoRail`: нет `onError`, fallback, skeleton. Битый слайд 8 у `muratti-kg` — серый блок без сообщения. Отдельная задача (P1 UI).

### 4.4 Кэш каталога

Список `/catalog`: `unstable_cache` TTL **120 s**. После Lap 2 данные в БД обновлены; UI может отставать до 2 мин без hard refresh.

---

## 5. Что НЕ коммитить в git

| Паттерн | Причина |
|---------|---------|
| `backups/*.json` | Полные `product_videos` + внешние URL |
| `sync-all-media-*.log` | Логи с CDN URL |
| `.sync-all-media.checkpoint*.json` | Локальный прогресс миграции |
| Любые экспорты с полными Instagram/fbcdn URL | Секреты/PII, протухающие ссылки |

**Можно коммитить:** этот отчёт (`reports/media/video-migration-2026-05-13.md`) — без полных external URL.

---

## 6. Финальные проверки (2026-05-13, post–Lap 2)

### 6.1 Dry-run `sync-all-media`

```bash
npm run sync:all-media -- --dry-run=true --no-checkpoint
```

**Результат:** уникальных external video **1**; external photo **0**.

### 6.2 SQL (read-only, Supabase SQL Editor)

**Approved external lead video = 0:**

```sql
SELECT count(*) AS approved_external_lead_video
FROM public.vendors
WHERE status = 'approved'
  AND slug IS NOT NULL
  AND cardinality(product_videos) > 0
  AND (
    product_videos[1] ILIKE '%cdninstagram%'
    OR product_videos[1] ILIKE '%fbcdn%'
    OR product_videos[1] ILIKE '%instagram.com%'
  );
-- Ожидание: 0
```

**Vendors mixed = 1:**

```sql
WITH per_vendor AS (
  SELECT
    v.slug,
    bool_or(u.url ILIKE '%cdninstagram%' OR u.url ILIKE '%fbcdn%' OR u.url ILIKE '%instagram.com%') AS has_external,
    bool_or(u.url LIKE '%/storage/v1/object/public/vendor-videos/%') AS has_storage
  FROM public.vendors v
  CROSS JOIN LATERAL unnest(v.product_videos) u(url)
  WHERE v.status = 'approved' AND v.slug IS NOT NULL
  GROUP BY v.slug
)
SELECT count(*) AS vendors_mixed FROM per_vendor WHERE has_external AND has_storage;
-- Ожидание: 1 (muratti-kg)
```

**Факт (readonly snapshot):** `approvedExternalLeadVideo = 0`, `vendorsMixed = 1`, `externalVideoInstances = 1`.

### 6.3 Spot-check lead video (HEAD, бывшие external lead)

Проверены slug: `trendy-shoes-kg`, `televizoro-bishkek`, `beautypro-kg`, `fulfillment-lux`, `saulebrand-kg`, `niuniu-kg`, `smartstorekg`, `zoloto-bish`, `muratti-kg`.

| Проверка | Результат |
|----------|-----------|
| `product_videos[0]` host | `*.supabase.co` / `vendor-videos` |
| fbcdn / cdninstagram на lead | **нет** |
| HEAD status | **200** |

**Браузер:** `/ru/catalog` — развернуть карточки выше; Network не должен показывать cdninstagram/fbcdn для **первого** видео-слайда. Кэш списка до 120 s.

---

## 7. Артефакты миграции (локально)

| Артефакт | Назначение |
|----------|------------|
| `backups/vendors-media-backup-2026-05-13.json` | Rollback `product_videos` |
| `backups/vendors-external-video-backup-2026-05-13.json` | Срез 216 vendors pre–Lap 2 |
| `.sync-all-media.checkpoint.video-migrate.json` | 1471 hash; повторный sync без CDN |
| `.sync-all-media.checkpoint.pilot.json` | Pilot 20 URL (отдельно) |

---

## 8. Следующие шаги (только с approve)

1. **Anti-clobber** в `sync-instagram-profiles` — code patch.
2. **Oversized** `muratti-kg` position 8 — transcode / bucket limit / remove URL.
3. **UI fallback** — `onError`, placeholder, skeleton в `CatalogCardPhotoRail`.
4. **Commit** этого отчёта — отдельный approve (без backups/logs/checkpoints).

---

*Отчёт сформирован после Lap 2. Instagram-sync не выполнялся. SEO FAQ не изменялся.*
