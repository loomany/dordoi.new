/**
 * Прогон ИИ по **всем** опубликованным вендорам каталога (`status = approved`, есть `slug`).
 * Те же правила, что в `parseVendorTextWithOpenAI` и админском playground.
 *
 * Требования:
 *   - Миграция `20260515130000_vendors_parsed_ai_data.sql`
 *   - `.env.local`: `OPENAI_API_KEY`, Supabase URL + `SUPABASE_SERVICE_ROLE_KEY`
 *
 * Переменные:
 *   AI_SCRIPT_FORCE=1        — перезаписать уже заполненный `parsed_ai_data`
 *   AI_SCRIPT_DRY_RUN=1      — только лог, без UPDATE
 *   AI_SCRIPT_LIMIT=N        — обработать не больше N строк (для теста)
 *   AI_SCRIPT_DELAY_MS=600   — пауза между вызовами OpenAI (мс)
 *   AI_SCRIPT_PAGE_SIZE=100  — размер страницы SELECT
 *
 * Запуск:
 *   npm run ai:published-catalog
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  parseVendorTextWithOpenAI,
  type VendorTextModerationOutput,
} from "@/lib/ai/vendor-text-openai-parse";
import { resolveCatalogStoreTitleForCard } from "@/lib/catalog/catalog-card-title";
import type { ParsedVendorCardData } from "@/lib/catalog/vendor-card-display";

type VendorRow = {
  id: string;
  slug: string;
  store_name: string | null;
  description: string | null;
  description_detail: string | null;
  categories: string[];
  logo_url: string | null;
  instagram_url: string | null;
  parsed_ai_data: unknown;
};

export type VendorsParsedAiPayloadV1 = {
  schemaVersion: 1;
  generatedAt: string;
  source: "script:run-ai-published-catalog";
  display: ParsedVendorCardData;
  rawDescriptionUsed: string;
};

const VENDOR_SELECT =
  "id, slug, store_name, description, description_detail, categories, logo_url, instagram_url, parsed_ai_data";

const BLOCKED_STORE_NAMES = new Set(["cosmos"]);

import { isBuyerOnlyVendorSlug } from "@/lib/catalog/buyer-only-vendor-slugs";

function loadEnvLocal(): void {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const key = t.slice(0, eq).trim();
    let val = t.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = val;
    }
  }
}

function createAdmin(): SupabaseClient {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function envFlag(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

function envPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBlockedStoreName(storeName: string | null | undefined): boolean {
  const key =
    typeof storeName === "string" ? storeName.trim().toLowerCase() : "";
  return key.length > 0 && BLOCKED_STORE_NAMES.has(key);
}

function rawTextForAi(row: VendorRow): string {
  return [row.description?.trim(), row.description_detail?.trim()]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function hasParsedAiData(row: VendorRow): boolean {
  const p = row.parsed_ai_data;
  if (p === null || p === undefined) return false;
  if (typeof p === "object" && !Array.isArray(p)) {
    const d = (p as { display?: unknown }).display;
    return d !== null && d !== undefined && typeof d === "object";
  }
  return false;
}

function buildDisplay(
  row: VendorRow,
  ai: VendorTextModerationOutput,
): ParsedVendorCardData {
  const cats = Array.isArray(row.categories) ? row.categories : [];
  const { storeTitle } = resolveCatalogStoreTitleForCard({
    dbStoreName: row.store_name?.trim() ?? "",
    fallbackTitle: "Магазин",
    catalogBrandNameFromAi: ai.catalogBrandName,
    instagramProfileUrl: row.instagram_url,
  });
  return {
    storeTitle,
    catalogBrandName: ai.catalogBrandName,
    subtitle: ai.subtitle,
    description: ai.description,
    tradeType: ai.tradeType,
    commerce: ai.commerce,
    logoUrl: row.logo_url,
    categories: cats,
    instagramUrl: row.instagram_url?.trim() || null,
  };
}

async function fetchPublishedVendorPage(
  admin: SupabaseClient,
  from: number,
  to: number,
): Promise<VendorRow[]> {
  const { data, error } = await admin
    .from("vendors")
    .select(VENDOR_SELECT)
    .eq("status", "approved")
    .not("slug", "is", null)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return (data ?? []) as VendorRow[];
}

async function fetchAllPublishedVendors(
  admin: SupabaseClient,
  pageSize: number,
): Promise<VendorRow[]> {
  const out: VendorRow[] = [];
  let from = 0;

  for (;;) {
    const to = from + pageSize - 1;
    const page = await fetchPublishedVendorPage(admin, from, to);
    for (const row of page) {
      const slug = row.slug?.trim();
      if (!slug || isBuyerOnlyVendorSlug(slug)) continue;
      if (isBlockedStoreName(row.store_name)) continue;
      out.push(row);
    }
    if (page.length < pageSize) break;
    from += pageSize;
  }

  return out;
}

async function main(): Promise<void> {
  loadEnvLocal();

  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const force = envFlag("AI_SCRIPT_FORCE");
  const dryRun = envFlag("AI_SCRIPT_DRY_RUN");
  const limit = envPositiveInt("AI_SCRIPT_LIMIT", Number.POSITIVE_INFINITY);
  const delayMs = envPositiveInt("AI_SCRIPT_DELAY_MS", 600);
  const pageSize = envPositiveInt("AI_SCRIPT_PAGE_SIZE", 100);

  const admin = createAdmin();
  const all = await fetchAllPublishedVendors(admin, pageSize);

  console.log(
    `Опубликовано в каталоге (approved + slug, без блок-листа): ${all.length}`,
  );
  if (dryRun) console.log("[dry-run] UPDATE в БД не выполняется.\n");

  let ok = 0;
  let skippedEmpty = 0;
  let skippedExisting = 0;
  let failed = 0;
  let processed = 0;

  for (const row of all) {
    if (processed >= limit) break;

    const label = `${row.store_name ?? row.slug} (${row.slug})`;

    if (!force && hasParsedAiData(row)) {
      skippedExisting++;
      console.log(`[skip existing] ${label}`);
      continue;
    }

    const raw = rawTextForAi(row);
    if (!raw) {
      skippedEmpty++;
      console.warn(`[skip empty] ${label} — нет description / description_detail`);
      continue;
    }

    processed++;
    console.log(
      `\n[${processed}/${Math.min(all.length, limit)}] ${label}\nid: ${row.id}`,
    );

    try {
      const ai = await parseVendorTextWithOpenAI({
        storeTitle: row.store_name?.trim() || "Магазин",
        rawDescription: raw,
        instagramProfileUrl: row.instagram_url?.trim() || null,
      });

      const display = buildDisplay(row, ai);
      const payload: VendorsParsedAiPayloadV1 = {
        schemaVersion: 1,
        generatedAt: new Date().toISOString(),
        source: "script:run-ai-published-catalog",
        display,
        rawDescriptionUsed: raw,
      };

      if (!dryRun) {
        const { error: upErr } = await admin
          .from("vendors")
          .update({
            parsed_ai_data: payload as unknown as Record<string, unknown>,
          })
          .eq("id", row.id);

        if (upErr) {
          throw new Error(upErr.message);
        }
      }

      console.log(
        `  → title: ${display.storeTitle.slice(0, 48)} | brand: ${display.catalogBrandName ?? "—"} | trade: ${display.tradeType}`,
      );
      console.log(
        `  → desc: ${display.description.slice(0, 72).replace(/\n/g, " ")}…`,
      );
      ok++;

      if (processed < limit && delayMs > 0) {
        await sleep(delayMs);
      }
    } catch (e) {
      failed++;
      console.error(`  ✗ ${label}:`, e instanceof Error ? e.message : e);
    }
  }

  console.log("\n──────── Итог ────────");
  console.log(`Всего в каталоге:     ${all.length}`);
  console.log(`Успешно:              ${ok}`);
  console.log(`Пропуск (уже есть):   ${skippedExisting}`);
  console.log(`Пропуск (пусто):      ${skippedEmpty}`);
  console.log(`Ошибки:               ${failed}`);
  console.log("Готово.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
