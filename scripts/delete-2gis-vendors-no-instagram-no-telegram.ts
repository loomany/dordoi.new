/**
 * Удаляет из `vendors` строки, импортированные из 2GIS, чьи исходные записи в JSON
 * без Instagram (как в 2gis-dataset-transform) и без поля socials.telegram.
 *
 * Идентификатор в БД: google_place_id = `2gis:{firmId}` из URL фирмы.
 *
 * Прогон без удаления (по умолчанию):
 *   npx tsx scripts/delete-2gis-vendors-no-instagram-no-telegram.ts --file=1dataset_2gis-places-scraper_2026-05-12_20-11-43-587.json
 *
 * Реальное удаление:
 *   npx tsx scripts/delete-2gis-vendors-no-instagram-no-telegram.ts --file=...json --dry-run=false
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  extractFirmIdFromTwoGisUrl,
  type TwoGisDatasetRow,
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

function trimOrNull(s: string | null | undefined): string | null {
  const t = typeof s === "string" ? s.trim() : "";
  return t.length > 0 ? t : null;
}

function firstSocialScalar(
  v: string | string[] | number | null | undefined,
): string | null {
  if (v == null) return null;
  if (Array.isArray(v)) {
    for (const item of v) {
      const t =
        typeof item === "string"
          ? trimOrNull(item)
          : typeof item === "number" && Number.isFinite(item)
            ? trimOrNull(String(item))
            : null;
      if (t) return t;
    }
    return null;
  }
  if (typeof v === "number") return trimOrNull(String(v));
  if (typeof v === "string") return trimOrNull(v);
  return null;
}

function extractInstagramFromOther(other: string[] | null | undefined): string | null {
  if (!other?.length) return null;
  for (const u of other) {
    const t = trimOrNull(u);
    if (t && /instagram\.com/i.test(t)) return t;
  }
  return null;
}

function normalizeInstagram(raw: string | null | undefined): string | null {
  const t = trimOrNull(raw);
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const h = t.replace(/^@/, "");
  return `https://instagram.com/${h}`;
}

function normalizeTelegram(raw: string | null | undefined): string | null {
  const t = trimOrNull(raw);
  if (!t) return null;
  if (t.startsWith("http://") || t.startsWith("https://")) return t;
  const h = t.replace(/^@/, "").replace(/^t\.me\//i, "");
  return `https://t.me/${h}`;
}

function rowMatchesCohort(row: TwoGisDatasetRow): boolean {
  const igRaw =
    firstSocialScalar(row.socials?.instagram ?? null) ??
    extractInstagramFromOther(row.socials?.other);
  const hasIg = Boolean(normalizeInstagram(igRaw));
  const hasTg = Boolean(
    normalizeTelegram(firstSocialScalar(row.socials?.telegram ?? null)),
  );
  return !hasIg && !hasTg;
}

function googlePlaceIdForRow(row: TwoGisDatasetRow): string | null {
  const firmId = extractFirmIdFromTwoGisUrl(row.url);
  return firmId ? `2gis:${firmId}` : null;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
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
    "1dataset_2gis-places-scraper_2026-05-12_20-11-43-587.json";
  const dryRun = (raw["dry-run"] ?? "true").trim().toLowerCase() !== "false";
  return { file, dryRun };
}

async function main() {
  loadEnvLocal();
  const { file, dryRun } = parseArgs();
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

  const placeIds: string[] = [];
  for (const row of rows) {
    if (!rowMatchesCohort(row)) continue;
    const gid = googlePlaceIdForRow(row);
    if (gid) placeIds.push(gid);
  }
  const unique = [...new Set(placeIds)];

  console.log("\n=== delete-2gis-vendors (no IG, no TG in JSON) ===\n");
  console.log(`Файл: ${path}`);
  console.log(`dry-run: ${dryRun}`);
  console.log(`Когорта (google_place_id): ${unique.length} уникальных\n`);

  const admin = createAdminClient();

  let foundInDb = 0;
  const foundSamples: { google_place_id: string; store_name: string | null }[] = [];

  for (const batch of chunk(unique, 40)) {
    const { data, error } = await admin
      .from("vendors")
      .select("google_place_id, store_name")
      .in("google_place_id", batch);
    if (error) {
      console.error("Select error:", error.message);
      process.exit(1);
    }
    for (const r of data ?? []) {
      foundInDb += 1;
      if (foundSamples.length < 10) {
        foundSamples.push({
          google_place_id: (r as { google_place_id: string }).google_place_id,
          store_name: (r as { store_name?: string | null }).store_name ?? null,
        });
      }
    }
  }

  console.log(`Найдено в БД по этим google_place_id: ${foundInDb}`);
  if (foundSamples.length) {
    console.log("Примеры:", JSON.stringify(foundSamples, null, 2));
  }

  if (dryRun) {
    console.log("\n(dry-run: удаление не выполняли. Повторите с --dry-run=false)\n");
    return;
  }

  let deleted = 0;
  for (const batch of chunk(unique, 40)) {
    const { data, error } = await admin
      .from("vendors")
      .delete()
      .in("google_place_id", batch)
      .select("id");
    if (error) {
      console.error("Delete error:", error.message);
      process.exit(1);
    }
    deleted += data?.length ?? 0;
  }

  console.log(`\nУдалено строк vendors: ${deleted}\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
