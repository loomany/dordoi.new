/**
 * Импорт кандидатов Google Places в таблицу vendors (админ-модерация).
 * Реальный insert только при --dry-run=false (требует отдельного разрешения).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createAdminClient } from "@/lib/supabase/admin";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

const SOURCE_TO_TAG: Record<string, string> = {
  "apparel-footwear": "discovery-apparel-footwear-compact-500-700",
};

const BUCKET_SUFFIX: Record<string, string> = {
  "catalog-matched": "catalog-matched.json",
};

const MODERATION_NOTE_DEFAULT =
  "Найдено автоматически через Google Places. Проверьте название, категорию и адрес перед публикацией.";

type CatalogMatchedRow = {
  googlePlaceId?: string;
  title?: string;
  address?: string | null;
  location?: { latitude?: number; longitude?: number } | null;
  googleMapsUri?: string | null;
  primaryType?: string | null;
  types?: string[];
  matchedQueries?: string[];
  sourceModes?: string[];
  distanceFromDordoiMeters?: number | null;
  catalogMainId?: string | null;
  catalogMainLabel?: string | null;
  guessedCategory?: string | null;
  classificationReason?: string | null;
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

function parseCli() {
  const raw: Record<string, string> = {};
  for (const a of process.argv.slice(2)) {
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq > 0) raw[a.slice(2, eq)] = a.slice(eq + 1);
  }
  const source = (raw.source ?? "").trim();
  const bucket = (raw.bucket ?? "").trim();
  const dryRun = (raw["dry-run"] ?? "true").trim().toLowerCase() !== "false";
  return { source, bucket, dryRun };
}

function buildDescription(row: CatalogMatchedRow): string {
  const meta = {
    catalogMainId: row.catalogMainId ?? null,
    catalogMainLabel: row.catalogMainLabel ?? null,
    guessedCategory: row.guessedCategory ?? null,
    primaryType: row.primaryType ?? null,
    types: row.types ?? [],
    matchedQueries: row.matchedQueries ?? [],
    sourceModes: row.sourceModes ?? [],
    distanceFromDordoiMeters: row.distanceFromDordoiMeters ?? null,
    classificationReason: row.classificationReason ?? null,
    location: row.location ?? null,
  };
  return `${MODERATION_NOTE_DEFAULT}\n\n${JSON.stringify(meta, null, 2)}`;
}

function rowInsertPayload(row: CatalogMatchedRow) {
  const gid = row.googlePlaceId?.trim();
  if (!gid) return null;
  const title = row.title?.trim() || "Без названия";
  const address = row.address?.trim() || "";
  const cat = row.catalogMainId?.trim() || row.guessedCategory?.trim() || "unknown";
  return {
    store_name: title,
    location_row: address.length > 0 ? address : "—",
    description: buildDescription(row),
    description_detail: null as string | null,
    categories: [cat],
    min_batch: "Не указано",
    payment_methods: "Не указано",
    delivery_help: false,
    returns_policy: "Не указано",
    whatsapp_1: null as string | null,
    whatsapp_2: null as string | null,
    instagram_url: null as string | null,
    telegram_url: null as string | null,
    samples_available: false,
    samples_note: null as string | null,
    language: "ru" as const,
    status: "pending_review" as const,
    application_source: "google_places" as const,
    google_place_id: gid,
    google_maps_uri: row.googleMapsUri?.trim() || null,
    moderation_note: MODERATION_NOTE_DEFAULT,
    quality_flags: null as string[] | null,
    quality_note: null as string | null,
    telegram_chat_id: null as number | null,
    phone_number: null as string | null,
    product_photos: [] as string[],
    logo_url: null as string | null,
    container_photo_url: null as string | null,
    user_id: null as string | null,
  };
}

async function main() {
  loadEnvLocal();
  const { source, bucket, dryRun } = parseCli();
  if (!SOURCE_TO_TAG[source]) {
    console.error(
      "Неизвестный --source=. Доступно:",
      Object.keys(SOURCE_TO_TAG).join(", "),
    );
    process.exit(1);
  }
  if (!BUCKET_SUFFIX[bucket]) {
    console.error(
      "Неизвестный --bucket=. Доступно:",
      Object.keys(BUCKET_SUFFIX).join(", "),
    );
    process.exit(1);
  }

  const tag = SOURCE_TO_TAG[source];
  const fileName = `dordoi-google-places.${tag}.${BUCKET_SUFFIX[bucket]}`;
  const path = join(root, "data", "generated", fileName);
  if (!existsSync(path)) {
    console.error("Файл не найден:", path);
    process.exit(1);
  }

  const rows = JSON.parse(readFileSync(path, "utf8")) as CatalogMatchedRow[];
  if (!Array.isArray(rows)) {
    console.error("JSON должен быть массивом.");
    process.exit(1);
  }

  const withIds = rows.filter((r) => rowInsertPayload(r) != null);
  const skippedNoId = rows.length - withIds.length;
  const placeIds = [
    ...new Set(
      withIds
        .map((r) => r.googlePlaceId?.trim())
        .filter((x): x is string => Boolean(x)),
    ),
  ];

  let duplicateCount = 0;
  const existing = new Set<string>();
  let dedupeSkippedNoMigration = false;

  if (placeIds.length > 0) {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("vendors")
      .select("google_place_id")
      .in("google_place_id", placeIds);
    if (error) {
      const msg = error.message ?? "";
      const code = (error as { code?: string }).code;
      const missingGooglePlaceColumn =
        msg.includes("google_place_id") || code === "42703";
      if (missingGooglePlaceColumn) {
        dedupeSkippedNoMigration = true;
        console.log(
          "[import-google-places] Колонка google_place_id в БД не найдена — дедуп по БД пропущен. Примените миграцию 20260512120000_vendors_google_places_candidates.sql перед реальным импортом.",
        );
      } else {
        console.error("[import-google-places] dedupe select:", msg);
        process.exit(1);
      }
    } else {
      for (const r of data ?? []) {
        const id = (r as { google_place_id?: string }).google_place_id;
        if (id) existing.add(id);
      }
    }
  }

  const toImport = withIds.filter((r) => {
    const id = r.googlePlaceId!.trim();
    if (existing.has(id)) {
      duplicateCount += 1;
      return false;
    }
    return true;
  });

  console.log("\n=== import-google-places-to-admin ===\n");
  console.log(`Файл: ${path}`);
  console.log(`dry-run: ${dryRun}`);
  console.log(`Всего в JSON: ${rows.length}`);
  console.log(`С googlePlaceId: ${withIds.length}`);
  console.log(`Пропущено (нет id): ${skippedNoId}`);
  console.log(
    `Дублей по google_place_id в БД: ${dedupeSkippedNoMigration ? "не проверялись" : String(duplicateCount)}`,
  );
  console.log(`Будет импортировано: ${toImport.length}\n`);

  const examples = toImport.slice(0, 20).map((r) => ({
    googlePlaceId: r.googlePlaceId,
    title: r.title,
    catalogMainId: r.catalogMainId,
    address: r.address?.slice(0, 80),
  }));
  console.log("Примеры (до 20):");
  console.log(JSON.stringify(examples, null, 2));

  if (dryRun) {
    console.log("\n(dry-run: записи в БД не создавались)\n");
    return;
  }

  if (dedupeSkippedNoMigration) {
    console.error(
      "\nРеальный импорт отменён: в БД нет колонки google_place_id. Сначала примените миграцию.\n",
    );
    process.exit(1);
  }

  const admin = createAdminClient();
  let ok = 0;
  for (const r of toImport) {
    const payload = rowInsertPayload(r);
    if (!payload) continue;
    const { error } = await admin.from("vendors").insert(payload);
    if (error) {
      console.error("Insert error:", error.message, r.googlePlaceId);
      process.exit(1);
    }
    ok += 1;
  }
  console.log(`\nИмпортировано: ${ok}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
