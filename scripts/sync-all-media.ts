/**
 * Полная синхронизация медиа: внешние (Instagram / fbcdn) фото и видео → Supabase Storage,
 * затем замена URL в vendors и vendor_photo_batch_items.
 *
 * Фото: скачивание → sharp → WebP quality 85 → бакет vendor-media (imports/photo-cache/{sha256}.webp).
 * Видео: скачивание mp4 как есть → бакет vendor-videos (imports/video-cache/{sha256}.mp4).
 *
 * Дедупликация по sha256(URL) — один объект на уникальный исходный URL.
 *
 * Бакеты:
 *   vendor-media — миграция 20250510150000_vendor_media_bucket.sql (скрипт создаст через API, если ещё нет).
 *   vendor-videos — миграция 20260515120000_vendor_videos_bucket.sql
 *
 * .env.local: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Опционально: VENDOR_MEDIA_BUCKET, VENDOR_VIDEOS_BUCKET
 *
 * Повторный запуск после Ctrl+C: безопасен. Объект в Storage лежит по стабильному пути
 * imports/photo-cache|video-cache/{sha256}.… — перед скачиванием делается HEAD; если файл уже
 * есть, CDN не дергаем, URL всё равно попадает в map, фаза 3 обновит Postgres.
 *
 * Чекпоинт (чтобы не «нагонять» очередь HEAD-ами после обрыва): по умолчанию пишется
 * `.sync-all-media.checkpoint.json` в корне репо — хеши успешно завершённых URL по фазам 1–2.
 * При следующем запуске они сразу попадают в map через getPublicUrl без HEAD/CDN.
 * Отключить: `--no-checkpoint`. Свой путь: `--checkpoint-file=...`.
 *
 * Ночной автоперезапуск при падении процесса: `npm run sync:all-media:overnight` (см. scripts/run-sync-all-media-overnight.mjs).
 *
 * Запуск:
 *   npm run sync:all-media -- --dry-run=true
 *   npm run sync:all-media -- --dry-run=false --delay-ms=500 --batch-size=2
 *   npm run sync:all-media -- --fetch-timeout-ms=120000   (таймаут fetch к Instagram, по умолчанию 120s)
 *   npm run sync:all-media -- --upload-timeout-ms=600000  (таймаут upload в Supabase Storage, по умолчанию 300s)
 *
 * Только фото + запись URL в БД (без фазы 2 видео), если фото уже в Storage / чекпоинте:
 *   npm run sync:all-media:photos-db
 *   (эквивалент: --dry-run=false --skip-video-phase=true)
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

import { createAdminClient } from "@/lib/supabase/admin";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const EXTERNAL_MARKERS = ["instagram.com", "cdninstagram.com", "fbcdn.net"] as const;

const PHOTO_FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.instagram.com/",
  "Sec-Fetch-Dest": "image",
  "Sec-Fetch-Mode": "no-cors",
  "Sec-Fetch-Site": "cross-site",
};

const VIDEO_FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept: "video/mp4,video/*;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.instagram.com/",
  "Sec-Fetch-Dest": "video",
  "Sec-Fetch-Mode": "no-cors",
  "Sec-Fetch-Site": "cross-site",
};

function loadEnvLocal() {
  const envPath = join(root, ".env.local");
  if (!existsSync(envPath)) return;
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function parseArgs() {
  const argv = process.argv.slice(2);
  const noCheckpoint = argv.includes("--no-checkpoint");
  let checkpointFile: string | null = join(root, ".sync-all-media.checkpoint.json");
  if (noCheckpoint) checkpointFile = null;
  const raw: Record<string, string> = {};
  for (const a of argv) {
    if (!a.startsWith("--")) continue;
    if (a === "--no-checkpoint") continue;
    const eq = a.indexOf("=");
    if (eq > 0) {
      const k = a.slice(2, eq);
      raw[k] = a.slice(eq + 1);
      if (k === "checkpoint-file" && !noCheckpoint) {
        const p = a.slice(eq + 1).trim();
        if (p) checkpointFile = p;
      }
    }
  }
  const dryRun = (raw["dry-run"] ?? "true").trim().toLowerCase() !== "false";
  const skipVideoPhase =
    (raw["skip-video-phase"] ?? "false").trim().toLowerCase() === "true";
  const delayMs = Math.max(
    0,
    Math.min(120_000, parseInt(raw["delay-ms"] ?? "500", 10) || 500),
  );
  const batchSize = Math.max(
    1,
    Math.min(32, parseInt(raw["batch-size"] ?? "2", 10) || 2),
  );
  const limitRaw = raw.limit?.trim();
  const limit =
    limitRaw && /^\d+$/.test(limitRaw) ? Math.min(1_000_000, parseInt(limitRaw, 10)) : null;
  const photoBucket = (raw["photo-bucket"] ?? process.env.VENDOR_MEDIA_BUCKET ?? "vendor-media").trim();
  const videoBucket = (raw["video-bucket"] ?? process.env.VENDOR_VIDEOS_BUCKET ?? "vendor-videos").trim();
  const fetchTimeoutMs = Math.max(
    5_000,
    Math.min(600_000, parseInt(raw["fetch-timeout-ms"] ?? "120000", 10) || 120_000),
  );
  const headTimeoutMs = Math.max(
    2_000,
    Math.min(60_000, parseInt(raw["head-timeout-ms"] ?? "15000", 10) || 15_000),
  );
  const uploadTimeoutMs = Math.max(
    10_000,
    Math.min(1_800_000, parseInt(raw["upload-timeout-ms"] ?? "300000", 10) || 300_000),
  );
  return {
    dryRun,
    skipVideoPhase,
    delayMs,
    batchSize,
    limit,
    photoBucket,
    videoBucket,
    fetchTimeoutMs,
    headTimeoutMs,
    uploadTimeoutMs,
    checkpointFile,
  };
}

type CheckpointJson = { v: 1; photo: string[]; video: string[] };

function loadCheckpoint(path: string | null): { photo: Set<string>; video: Set<string> } {
  const empty = () => ({ photo: new Set<string>(), video: new Set<string>() });
  if (!path || !existsSync(path)) return empty();
  try {
    const j = JSON.parse(readFileSync(path, "utf8")) as Partial<CheckpointJson>;
    if (j?.v !== 1 || !Array.isArray(j.photo) || !Array.isArray(j.video)) return empty();
    return { photo: new Set(j.photo), video: new Set(j.video) };
  } catch {
    return empty();
  }
}

function saveCheckpoint(path: string | null, photo: Set<string>, video: Set<string>) {
  if (!path) return;
  const body: CheckpointJson = {
    v: 1,
    photo: [...photo].sort(),
    video: [...video].sort(),
  };
  writeFileSync(path, JSON.stringify(body, null, 0), "utf8");
}

function hashKey(url: string): string {
  return createHash("sha256").update(url.trim(), "utf8").digest("hex").slice(0, 32);
}

function isExternalCdnUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u.startsWith("http://") && !u.startsWith("https://")) return false;
  return EXTERNAL_MARKERS.some((m) => u.includes(m));
}

function isOurStorageUrl(url: string, bucket: string): boolean {
  return url.trim().includes(`/storage/v1/object/public/${bucket}/`);
}

function shouldMigratePhoto(url: string, photoBucket: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (!isExternalCdnUrl(t)) return false;
  if (isOurStorageUrl(t, photoBucket)) return false;
  return true;
}

function shouldMigrateVideo(url: string, videoBucket: string): boolean {
  const t = url.trim();
  if (!t) return false;
  if (!isExternalCdnUrl(t)) return false;
  if (isOurStorageUrl(t, videoBucket)) return false;
  return true;
}

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

function isoTime(): string {
  return new Date().toISOString();
}

function logLine(msg: string) {
  console.log(`[${isoTime()}] ${msg}`);
}

async function ensureBuckets(
  admin: ReturnType<typeof createAdminClient>,
  photoBucket: string,
  videoBucket: string,
  dryRun: boolean,
) {
  if (dryRun) return;
  const photo = await admin.storage.createBucket(photoBucket, {
    public: true,
    fileSizeLimit: 15 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  if (photo.error && !/exists|duplicate/i.test(photo.error.message)) {
    console.warn(`[bucket] ${photoBucket}: ${photo.error.message}`);
  }
  const video = await admin.storage.createBucket(videoBucket, {
    public: true,
    fileSizeLimit: 100 * 1024 * 1024,
    allowedMimeTypes: ["video/mp4"],
  });
  if (video.error && !/exists|duplicate/i.test(video.error.message)) {
    console.warn(`[bucket] ${videoBucket}: ${video.error.message}`);
  }
}

async function publicObjectHeadOk(publicUrl: string, timeoutMs: number): Promise<boolean> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(publicUrl, { method: "HEAD", signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

async function downloadBytes(
  url: string,
  headers: Record<string, string>,
  timeoutMs: number,
): Promise<{ buffer: Buffer; contentType: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url.trim(), {
      redirect: "follow",
      headers,
      signal: ctrl.signal,
    });
    const ct = (res.headers.get("content-type") ?? "").split(";")[0]?.trim() || "";
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }
    const buffer = Buffer.from(await res.arrayBuffer());
    return { buffer, contentType: ct };
  } catch (e) {
    if (ctrl.signal.aborted) {
      throw new Error(`fetch timeout после ${timeoutMs}ms`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

/** Supabase `storage.upload` без своего таймаута может висеть бесконечно при сетевых сбоях. */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label}: timeout после ${timeoutMs}ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}

function looksLikeMp4(buffer: Buffer, contentType: string, url: string): boolean {
  if (contentType.toLowerCase().includes("mp4")) return true;
  if (url.toLowerCase().includes(".mp4")) return true;
  if (buffer.length >= 12) {
    const box = buffer.subarray(4, 8).toString("ascii");
    if (box === "ftyp") return true;
  }
  return false;
}

async function photoToWebp(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).webp({ quality: 85 }).toBuffer();
}

function photoObjectPath(url: string): string {
  return `imports/photo-cache/${hashKey(url)}.webp`;
}

function videoObjectPath(url: string): string {
  return `imports/video-cache/${hashKey(url)}.mp4`;
}

type VendorMediaRow = {
  id: string;
  logo_url: string | null;
  product_photos: string[] | null;
  product_videos: string[] | null;
};

type BatchItemRow = {
  id: string;
  photo_url: string;
};

/** PostgREST: последовательные PATCH по 4k+ строкам «висят» в логе; пачки + частый прогресс. */
const BATCH_ITEM_DB_CONCURRENCY = 12;

async function updateBatchItemPhotoUrlsParallel(
  admin: ReturnType<typeof createAdminClient>,
  patches: { id: string; next: string }[],
): Promise<{ updated: number; errors: number }> {
  let updated = 0;
  let errors = 0;
  const total = patches.length;
  if (total === 0) {
    logLine("DB batch_items: обновлять нечего (все URL уже совпадают или нет в map).");
    return { updated: 0, errors: 0 };
  }
  logLine(
    `DB batch_items: к обновлению ${total} строк, параллельность ${BATCH_ITEM_DB_CONCURRENCY}…`,
  );
  for (let i = 0; i < total; i += BATCH_ITEM_DB_CONCURRENCY) {
    const slice = patches.slice(i, i + BATCH_ITEM_DB_CONCURRENCY);
    const settled = await Promise.allSettled(
      slice.map((row) =>
        admin
          .from("vendor_photo_batch_items")
          .update({ photo_url: row.next })
          .eq("id", row.id)
          .then(({ error }) => {
            if (error) throw new Error(error.message);
          }),
      ),
    );
    for (let j = 0; j < settled.length; j++) {
      const r = settled[j]!;
      const row = slice[j]!;
      if (r.status === "fulfilled") {
        updated += 1;
      } else {
        errors += 1;
        logLine(
          `DB batch_items ✖ ${row.id}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`,
        );
      }
    }
    const done = Math.min(i + BATCH_ITEM_DB_CONCURRENCY, total);
    if (done % 50 === 0 || done === total) {
      logLine(`DB batch_items: обработано ${done}/${total}…`);
    }
  }
  return { updated, errors };
}

async function fetchAllVendors(admin: ReturnType<typeof createAdminClient>): Promise<VendorMediaRow[]> {
  const pageSize = 1000;
  const out: VendorMediaRow[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await admin
      .from("vendors")
      .select("id, logo_url, product_photos, product_videos")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`vendors: ${error.message}`);
    const rows = (data ?? []) as VendorMediaRow[];
    out.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}

async function fetchAllBatchItems(admin: ReturnType<typeof createAdminClient>): Promise<BatchItemRow[]> {
  const pageSize = 1000;
  const out: BatchItemRow[] = [];
  let offset = 0;
  for (;;) {
    const { data, error } = await admin
      .from("vendor_photo_batch_items")
      .select("id, photo_url")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(`vendor_photo_batch_items: ${error.message}`);
    const rows = (data ?? []) as BatchItemRow[];
    out.push(...rows);
    if (rows.length < pageSize) break;
    offset += pageSize;
  }
  return out;
}

function countExternalInDataset(
  vendors: VendorMediaRow[],
  items: BatchItemRow[],
): { photos: number; videos: number } {
  const seenP = new Set<string>();
  const seenV = new Set<string>();
  let photos = 0;
  let videos = 0;
  for (const v of vendors) {
    for (const u of [v.logo_url, ...(v.product_photos ?? [])]) {
      const t = u?.trim();
      if (t && isExternalCdnUrl(t) && !seenP.has(t)) {
        seenP.add(t);
        photos += 1;
      }
    }
    for (const u of v.product_videos ?? []) {
      const t = u?.trim();
      if (t && isExternalCdnUrl(t) && !seenV.has(t)) {
        seenV.add(t);
        videos += 1;
      }
    }
  }
  for (const it of items) {
    const t = it.photo_url?.trim();
    if (t && isExternalCdnUrl(t) && !seenP.has(t)) {
      seenP.add(t);
      photos += 1;
    }
  }
  return { photos, videos };
}

async function processInParallelBatches(
  urls: string[],
  batchSize: number,
  delayMsBetweenBatches: number,
  label: string,
  worker: (url: string, meta: { index1: number; total: number }) => Promise<void>,
  options?: {
    onBatchSuccess?: (successfulUrls: string[]) => void;
    /** Сдвиг нумерации в логах (например число URL, восстановленных из чекпоинта без очереди). */
    progressOffset?: number;
    /** Знаменатель в логах [k/total]; по умолчанию длина переданного массива urls. */
    progressTotal?: number;
  },
): Promise<number> {
  let errors = 0;
  const total = urls.length;
  const progressOffset = options?.progressOffset ?? 0;
  const progressTotal = options?.progressTotal ?? total;
  if (total === 0) {
    logLine(`${label}: очередь пуста, пропуск.`);
    return 0;
  }
  logLine(`${label}: всего URL в очереди: ${total}${progressTotal !== total ? ` (в полном списке: ${progressTotal})` : ""}, параллель=${batchSize}, пауза между пачками=${delayMsBetweenBatches}ms`);
  for (let i = 0; i < urls.length; i += batchSize) {
    const chunk = urls.slice(i, i + batchSize);
    const from = i + 1 + progressOffset;
    const to = Math.min(i + batchSize, total) + progressOffset;
    logLine(
      `${label}: ▶ пачка элементов ${from}–${to} из ${progressTotal} (${chunk.length} параллельно)`,
    );
    const settled = await Promise.allSettled(
      chunk.map((u, j) =>
        worker(u, { index1: i + j + 1 + progressOffset, total: progressTotal }),
      ),
    );
    const successes: string[] = [];
    for (let j = 0; j < settled.length; j++) {
      const r = settled[j]!;
      if (r.status === "rejected") {
        errors += 1;
        const u = chunk[j]!;
        logLine(
          `${label}: ✖ ошибка [${i + j + 1 + progressOffset}/${progressTotal}] ${u.slice(0, 96)}${u.length > 96 ? "…" : ""} — ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`,
        );
      } else {
        successes.push(chunk[j]!);
      }
    }
    if (successes.length > 0) options?.onBatchSuccess?.(successes);
    const doneGlobal = Math.min(i + batchSize, total) + progressOffset;
    logLine(`${label}: пачка завершена — готово ${doneGlobal}/${progressTotal}, накоплено ошибок: ${errors}`);
    if (i + batchSize < urls.length && delayMsBetweenBatches > 0) {
      logLine(`${label}: пауза ${delayMsBetweenBatches}ms перед следующей пачкой…`);
      await sleep(delayMsBetweenBatches);
    }
  }
  logLine(`${label}: фаза загрузки завершена, ошибок: ${errors}`);
  return errors;
}

async function main() {
  loadEnvLocal();
  const {
    dryRun,
    skipVideoPhase,
    delayMs,
    batchSize,
    limit,
    photoBucket,
    videoBucket,
    fetchTimeoutMs,
    headTimeoutMs,
    uploadTimeoutMs,
    checkpointFile,
  } = parseArgs();
  const admin = createAdminClient();

  logLine("=== sync-all-media старт ===");
  logLine(`dry-run: ${dryRun}`);
  logLine(
    `skip-video-phase: ${skipVideoPhase} (если true — после фото сразу фаза 3 Postgres; видео не качаем)`,
  );
  logLine(`delay-ms (между пачками): ${delayMs}`);
  logLine(`batch-size (параллель в пачке): ${batchSize}`);
  logLine(`photo-bucket: ${photoBucket}`);
  logLine(`video-bucket: ${videoBucket}`);
  logLine(`limit (на каждый тип): ${limit ?? "none"}`);
  logLine(
    `fetch-timeout-ms (CDN): ${fetchTimeoutMs}, head-timeout-ms (Storage HEAD): ${headTimeoutMs}, upload-timeout-ms (Storage PUT): ${uploadTimeoutMs}`,
  );
  logLine(
    checkpointFile
      ? `Чекпоинт: ${checkpointFile} (см. --no-checkpoint, --checkpoint-file=…)`
      : "Чекпоинт: выключен (--no-checkpoint).",
  );

  logLine("Проверка / создание бакетов…");
  await ensureBuckets(admin, photoBucket, videoBucket, dryRun);
  logLine("Бакеты: шаг завершён.");

  logLine("Чтение vendors (постранично)…");
  const vendors = await fetchAllVendors(admin);
  logLine(`vendors загружено строк: ${vendors.length}`);
  logLine("Чтение vendor_photo_batch_items…");
  const items = await fetchAllBatchItems(admin);
  logLine(`vendor_photo_batch_items загружено строк: ${items.length}`);

  const photoUrls = new Set<string>();
  const videoUrls = new Set<string>();
  for (const v of vendors) {
    for (const u of [v.logo_url, ...(v.product_photos ?? [])]) {
      const t = u?.trim();
      if (t && shouldMigratePhoto(t, photoBucket)) photoUrls.add(t);
    }
    for (const u of v.product_videos ?? []) {
      const t = u?.trim();
      if (t && shouldMigrateVideo(t, videoBucket)) videoUrls.add(t);
    }
  }
  for (const it of items) {
    const t = it.photo_url?.trim();
    if (t && shouldMigratePhoto(t, photoBucket)) photoUrls.add(t);
  }

  const photoList = [...photoUrls].sort();
  const videoList = [...videoUrls].sort();
  const photoWork = limit != null ? photoList.slice(0, limit) : photoList;
  const videoWork = limit != null ? videoList.slice(0, limit) : videoList;

  logLine(`Уникальных внешних фото URL: ${photoList.length} (к обработке: ${photoWork.length})`);
  logLine(`Уникальных внешних видео URL: ${videoList.length} (к обработке: ${videoWork.length})`);

  if (dryRun) {
    logLine("dry-run: загрузка и UPDATE пропущены");
    const rem = countExternalInDataset(vendors, items);
    logLine(`Снимок внешних ссылок в БД: фото ${rem.photos}, видео ${rem.videos} (уникальные)`);
    if (checkpointFile) {
      const cp = loadCheckpoint(checkpointFile);
      logLine(
        `Чекпоинт (только сводка): ${checkpointFile} — в файле хешей фото ${cp.photo.size}, видео ${cp.video.size}.`,
      );
    }
    return;
  }

  const photoUrlMap = new Map<string, string>();
  const videoUrlMap = new Map<string, string>();

  const loadedCp = loadCheckpoint(checkpointFile);
  const photoHashesDone = new Set(loadedCp.photo);
  const videoHashesDone = new Set(loadedCp.video);

  let photoPrefillFromCp = 0;
  for (const url of photoWork) {
    if (!photoHashesDone.has(hashKey(url))) continue;
    const path = photoObjectPath(url);
    const { data } = admin.storage.from(photoBucket).getPublicUrl(path);
    const pub = data.publicUrl;
    if (!pub) continue;
    photoUrlMap.set(url, pub);
    photoPrefillFromCp += 1;
  }
  const photoQueue = photoWork.filter((u) => !photoHashesDone.has(hashKey(u)));
  const photoProgressOffset = photoWork.length - photoQueue.length;

  let videoPrefillFromCp = 0;
  for (const url of videoWork) {
    if (!videoHashesDone.has(hashKey(url))) continue;
    const path = videoObjectPath(url);
    const { data } = admin.storage.from(videoBucket).getPublicUrl(path);
    const pub = data.publicUrl;
    if (!pub) continue;
    videoUrlMap.set(url, pub);
    videoPrefillFromCp += 1;
  }
  const videoQueue = videoWork.filter((u) => !videoHashesDone.has(hashKey(u)));
  const videoProgressOffset = videoWork.length - videoQueue.length;

  if (checkpointFile) {
    logLine(
      `Чекпоинт загружен: фото ${photoHashesDone.size} хешей (в map сразу: ${photoPrefillFromCp}), видео ${videoHashesDone.size} (в map: ${videoPrefillFromCp}). Очередь фазы 1: ${photoQueue.length}/${photoWork.length}, фазы 2: ${videoQueue.length}/${videoWork.length}.`,
    );
  }

  const persistCp = () => saveCheckpoint(checkpointFile, photoHashesDone, videoHashesDone);

  logLine("— Фаза 1: фото (скачивание → WebP → Storage) —");
  let photoReusedFromStorage = 0;
  const photoErrors = await processInParallelBatches(
    photoQueue,
    batchSize,
    delayMs,
    "фото",
    async (srcUrl, meta) => {
      const tAll = Date.now();
      const short = hashKey(srcUrl).slice(0, 10);
      const path = photoObjectPath(srcUrl);
      const { data: existingPublic } = admin.storage.from(photoBucket).getPublicUrl(path);
      const existingUrl = existingPublic.publicUrl;
      if (existingUrl && (await publicObjectHeadOk(existingUrl, headTimeoutMs))) {
        photoReusedFromStorage += 1;
        photoUrlMap.set(srcUrl, existingUrl);
        logLine(
          `фото [${meta.index1}/${meta.total}] ⊘ уже в Storage (${path}), CDN пропущен, за ${Date.now() - tAll}ms`,
        );
        return;
      }
      logLine(
        `фото [${meta.index1}/${meta.total}] hash=${short}… загрузка CDN…`,
      );
      const tDl = Date.now();
      const { buffer } = await downloadBytes(srcUrl, PHOTO_FETCH_HEADERS, fetchTimeoutMs);
      logLine(
        `фото [${meta.index1}/${meta.total}] скачано ${buffer.length} байт за ${Date.now() - tDl}ms → sharp WebP q=85…`,
      );
      const tSharp = Date.now();
      const webp = await photoToWebp(buffer);
      logLine(
        `фото [${meta.index1}/${meta.total}] WebP ${webp.length} байт за ${Date.now() - tSharp}ms → upload ${photoBucket}…`,
      );
      const tUp = Date.now();
      const { error: upErr } = await withTimeout(
        admin.storage.from(photoBucket).upload(path, webp, {
          contentType: "image/webp",
          upsert: true,
        }),
        uploadTimeoutMs,
        `upload ${photoBucket}`,
      );
      if (upErr) throw new Error(upErr.message);
      const { data } = admin.storage.from(photoBucket).getPublicUrl(path);
      const pub = data.publicUrl;
      if (!pub) throw new Error("empty publicUrl");
      photoUrlMap.set(srcUrl, pub);
      logLine(
        `фото [${meta.index1}/${meta.total}] ✓ upload за ${Date.now() - tUp}ms, всего ${Date.now() - tAll}ms → ${pub.slice(0, 80)}…`,
      );
    },
    {
      progressOffset: photoProgressOffset,
      progressTotal: photoWork.length,
      ...(checkpointFile
        ? {
            onBatchSuccess: (urls: string[]) => {
              for (const u of urls) photoHashesDone.add(hashKey(u));
              persistCp();
            },
          }
        : {}),
    },
  );

  let videoReusedFromStorage = 0;
  let videoErrors = 0;
  if (skipVideoPhase) {
    logLine(
      "— Фаза 2: видео — пропуск (--skip-video-phase=true). В map остаётся только префилл из чекпоинта (если есть).",
    );
  } else {
    logLine("— Фаза 2: видео (скачивание → mp4 → Storage) —");
    videoErrors = await processInParallelBatches(
      videoQueue,
      batchSize,
      delayMs,
      "видео",
      async (srcUrl, meta) => {
        const tAll = Date.now();
        const short = hashKey(srcUrl).slice(0, 10);
        const path = videoObjectPath(srcUrl);
        const { data: existingPublic } = admin.storage.from(videoBucket).getPublicUrl(path);
        const existingUrl = existingPublic.publicUrl;
        if (existingUrl && (await publicObjectHeadOk(existingUrl, headTimeoutMs))) {
          videoReusedFromStorage += 1;
          videoUrlMap.set(srcUrl, existingUrl);
          logLine(
            `видео [${meta.index1}/${meta.total}] ⊘ уже в Storage (${path}), CDN пропущен, за ${Date.now() - tAll}ms`,
          );
          return;
        }
        logLine(`видео [${meta.index1}/${meta.total}] hash=${short}… загрузка CDN…`);
        const tDl = Date.now();
        const { buffer, contentType } = await downloadBytes(
          srcUrl,
          VIDEO_FETCH_HEADERS,
          fetchTimeoutMs,
        );
        logLine(
          `видео [${meta.index1}/${meta.total}] скачано ${buffer.length} байт за ${Date.now() - tDl}ms, content-type=${contentType || "?"}`,
        );
        if (!looksLikeMp4(buffer, contentType, srcUrl)) {
          throw new Error(`not mp4 (content-type: ${contentType || "?"})`);
        }
        logLine(`видео [${meta.index1}/${meta.total}] upload ${videoBucket} ${path}…`);
        const tUp = Date.now();
        const { error: upErr } = await withTimeout(
          admin.storage.from(videoBucket).upload(path, buffer, {
            contentType: "video/mp4",
            upsert: true,
          }),
          uploadTimeoutMs,
          `upload ${videoBucket}`,
        );
        if (upErr) throw new Error(upErr.message);
        const { data } = admin.storage.from(videoBucket).getPublicUrl(path);
        const pub = data.publicUrl;
        if (!pub) throw new Error("empty publicUrl");
        videoUrlMap.set(srcUrl, pub);
        logLine(
          `видео [${meta.index1}/${meta.total}] ✓ upload за ${Date.now() - tUp}ms, всего ${Date.now() - tAll}ms → ${pub.slice(0, 80)}…`,
        );
      },
      {
        progressOffset: videoProgressOffset,
        progressTotal: videoWork.length,
        ...(checkpointFile
          ? {
              onBatchSuccess: (urls: string[]) => {
                for (const u of urls) videoHashesDone.add(hashKey(u));
                persistCp();
              },
            }
          : {}),
      },
    );
  }

  logLine("— Фаза 3: обновление строк в Postgres (vendors, batch_items) —");
  let vendorsUpdated = 0;
  let itemsUpdated = 0;
  let dbErrors = 0;

  let vendorScan = 0;
  for (const v of vendors) {
    vendorScan += 1;
    if (vendorScan === 1 || vendorScan % 200 === 0 || vendorScan === vendors.length) {
      logLine(`DB vendors: проверено ${vendorScan}/${vendors.length}…`);
    }
    let logoNext = v.logo_url;
    const logoT = v.logo_url?.trim();
    if (logoT && photoUrlMap.has(logoT)) logoNext = photoUrlMap.get(logoT)!;

    const photos = v.product_photos ?? [];
    let photosChanged = false;
    const photosNext = photos.map((p) => {
      const t = p?.trim();
      if (t && photoUrlMap.has(t)) {
        photosChanged = true;
        return photoUrlMap.get(t)!;
      }
      return p;
    });

    const vids = v.product_videos ?? [];
    let vidsChanged = false;
    const vidsNext = vids.map((p) => {
      const t = p?.trim();
      if (t && videoUrlMap.has(t)) {
        vidsChanged = true;
        return videoUrlMap.get(t)!;
      }
      return p;
    });

    if (logoNext === v.logo_url && !photosChanged && !vidsChanged) continue;

    const patch: Record<string, unknown> = {};
    if (logoNext !== v.logo_url) patch.logo_url = logoNext;
    if (photosChanged) patch.product_photos = photosNext;
    if (vidsChanged) patch.product_videos = vidsNext;

    const { error } = await admin.from("vendors").update(patch).eq("id", v.id);
    if (error) {
      logLine(`DB vendors ✖ ${v.id}: ${error.message}`);
      dbErrors += 1;
    } else {
      vendorsUpdated += 1;
    }
  }

  const batchPatches: { id: string; next: string }[] = [];
  for (const it of items) {
    const t = it.photo_url?.trim();
    if (!t || !photoUrlMap.has(t)) continue;
    const next = photoUrlMap.get(t)!;
    if (next === it.photo_url) continue;
    batchPatches.push({ id: it.id, next });
  }
  logLine(
    `DB batch_items: всего строк ${items.length}, нужна смена URL у ${batchPatches.length}.`,
  );
  const batchResult = await updateBatchItemPhotoUrlsParallel(admin, batchPatches);
  itemsUpdated += batchResult.updated;
  dbErrors += batchResult.errors;

  logLine("Перечитывание БД для сводки внешних ссылок…");
  const vendorsAfter = await fetchAllVendors(admin);
  const itemsAfter = await fetchAllBatchItems(admin);
  const after = countExternalInDataset(vendorsAfter, itemsAfter);

  logLine("=== sync-all-media итог ===");
  logLine(
    `Фото: в map ${photoUrlMap.size} (из Storage без повторной загрузки: ${photoReusedFromStorage}), ошибок: ${photoErrors}`,
  );
  logLine(
    `Видео: в map ${videoUrlMap.size} (из Storage без повторной загрузки: ${videoReusedFromStorage}), ошибок: ${videoErrors}`,
  );
  logLine(`Строк vendors обновлено: ${vendorsUpdated}`);
  logLine(`Строк vendor_photo_batch_items обновлено: ${itemsUpdated}`);
  logLine(`Ошибок БД: ${dbErrors}`);
  logLine(
    `После синка — уникальных внешних CDN (instagram/fbcdn) в данных: фото ${after.photos}, видео ${after.videos}`,
  );
  logLine(
    "Ноль — когда все внешние URL успешно смигрированы; при 403 часть ссылок останется до следующего запуска.",
  );
  logLine("=== sync-all-media завершён ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
