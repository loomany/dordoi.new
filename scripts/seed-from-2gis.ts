/**
 * Импорт продавцов из выгрузки 2GIS (JSON) в таблицу vendors.
 *
 * Безопасный прогон:
 *   npx tsx scripts/seed-from-2gis.ts --dry-run=true --file=dataset_2gis-places-scraper_2026-05-12_20-11-43-587.json
 *
 * В текущем файле нет socials/phone — импорт с контакт-фильтром даст 0 строк. Для проверки пайплайна:
 *   --relax-contact-filter=true
 *
 * Против staging / копии БД: задайте SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY (или .env.local как у других скриптов).
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  rowHasSocialContact,
  transformTwoGisRowToVendorInsert,
  type TwoGisDatasetRow,
  type TwoGisVendorInsert,
} from "@/lib/vendor/2gis-dataset-transform";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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
  const raw: Record<string, string> = {};
  for (const a of process.argv.slice(2)) {
    if (!a.startsWith("--")) continue;
    const eq = a.indexOf("=");
    if (eq > 0) raw[a.slice(2, eq)] = a.slice(eq + 1);
  }
  const file =
    raw.file?.trim() ||
    "dataset_2gis-places-scraper_2026-05-12_20-11-43-587.json";
  const dryRun = (raw["dry-run"] ?? "true").trim().toLowerCase() !== "false";
  const relaxContact =
    (raw["relax-contact-filter"] ?? "false").trim().toLowerCase() === "true";
  const limitRaw = raw.limit?.trim();
  const limit =
    limitRaw && /^\d+$/.test(limitRaw) ? Math.min(5000, parseInt(limitRaw, 10)) : null;
  return { file, dryRun, relaxContact, limit };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function main() {
  loadEnvLocal();
  const { file, dryRun, relaxContact, limit } = parseArgs();
  const path = join(root, file);
  if (!existsSync(path)) {
    console.error("Файл не найден:", path);
    process.exit(1);
  }

  const rows = JSON.parse(readFileSync(path, "utf8")) as TwoGisDatasetRow[];
  if (!Array.isArray(rows)) {
    console.error("Ожидался JSON-массив.");
    process.exit(1);
  }

  const sliced = limit != null ? rows.slice(0, limit) : rows;

  let skippedNoCategory = 0;
  let skippedNoContact = 0;
  const payloads: TwoGisVendorInsert[] = [];

  for (const row of sliced) {
    if (!relaxContact && !rowHasSocialContact(row)) {
      skippedNoContact += 1;
      continue;
    }
    const p = transformTwoGisRowToVendorInsert(row);
    if (!p) {
      skippedNoCategory += 1;
      continue;
    }
    payloads.push(p);
  }

  const placeIds = [
    ...new Set(
      payloads
        .map((p) => p.google_place_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  let duplicateCount = 0;
  const existing = new Set<string>();
  if (placeIds.length > 0 && !dryRun) {
    const admin = createAdminClient();
    const batchSize = 40;
    for (const batch of chunk(placeIds, batchSize)) {
      const { data, error } = await admin
        .from("vendors")
        .select("google_place_id")
        .in("google_place_id", batch);
      if (error) {
        console.error("[seed-from-2gis] dedupe:", error.message);
        process.exit(1);
      }
      for (const r of data ?? []) {
        const id = (r as { google_place_id?: string }).google_place_id;
        if (id) existing.add(id);
      }
    }
  }

  const toInsert = payloads.filter((p) => {
    if (existing.has(p.google_place_id)) {
      duplicateCount += 1;
      return false;
    }
    return true;
  });

  console.log("\n=== seed-from-2gis ===\n");
  console.log(`Файл: ${path}`);
  console.log(`dry-run: ${dryRun}`);
  console.log(`relax-contact-filter: ${relaxContact}`);
  console.log(`Строк в JSON: ${rows.length}`);
  console.log(`Без маппинга категории / firm id: ${skippedNoCategory}`);
  console.log(`Отфильтровано (нет контактов): ${skippedNoContact}`);
  console.log(`Дублей по google_place_id в БД: ${duplicateCount}`);
  console.log(`К вставке: ${toInsert.length}\n`);

  const preview = toInsert.slice(0, 15).map((p) => ({
    google_place_id: p.google_place_id,
    store_name: p.store_name,
    categories: p.categories,
  }));
  console.log("Примеры (до 15):", JSON.stringify(preview, null, 2));

  if (dryRun) {
    console.log("\n(dry-run: в БД не писали)\n");
    return;
  }

  const admin = createAdminClient();
  let ok = 0;
  for (const row of toInsert) {
    const { error } = await admin.from("vendors").insert(row);
    if (error) {
      console.error("Insert error:", error.message, row.google_place_id);
      process.exit(1);
    }
    ok += 1;
  }
  console.log(`\nВставлено: ${ok}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
