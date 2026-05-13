/**
 * Прогон ИИ по вендорам по `store_name` и запись `parsed_ai_data` (JSONB).
 * Обновляет **все** совпадения по каждому шаблону (до лимита), не одну строку —
 * иначе скрипт мог писать в «другой» дубликат имени, а в каталоге показывается другой `id`.
 *
 * Условия:
 *   - Миграция `20260515130000_vendors_parsed_ai_data.sql` применена к проекту.
 *   - `.env.local` или окружение: `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL` или `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
 *
 * Переменные:
 *   AI_SCRIPT_MAX_VENDOR_MATCHES — макс. строк на один шаблон (по умолчанию 5).
 *
 * Запуск:
 *   npx tsx scripts/test-ai-two-vendors.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  parseVendorTextWithOpenAI,
  type VendorTextModerationOutput,
} from "@/lib/ai/vendor-text-openai-parse";
import type { ParsedVendorCardData } from "@/lib/catalog/vendor-card-display";

type VendorRow = {
  id: string;
  store_name: string | null;
  description: string | null;
  description_detail: string | null;
  categories: string[];
  logo_url: string | null;
  instagram_url: string | null;
};

/** Версионированная обёртка для колонки `parsed_ai_data`. */
export type VendorsParsedAiPayloadV1 = {
  schemaVersion: 1;
  generatedAt: string;
  source: "script:test-ai-two-vendors";
  /** Снимок для UI (`ParsedVendorCardData`). */
  display: ParsedVendorCardData;
  /** Текст, который реально ушёл в ИИ (для аудита). */
  rawDescriptionUsed: string;
};

function loadEnvLocal(): void {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) {
    return;
  }
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

function rawTextForAi(row: VendorRow): string {
  return [row.description?.trim(), row.description_detail?.trim()]
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function buildDisplay(
  row: VendorRow,
  ai: VendorTextModerationOutput,
): ParsedVendorCardData {
  const cats = Array.isArray(row.categories) ? row.categories : [];
  return {
    storeTitle: row.store_name?.trim() || "Магазин",
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

function maxMatchesPerPattern(): number {
  const raw = process.env.AI_SCRIPT_MAX_VENDOR_MATCHES?.trim();
  const n = raw ? Number.parseInt(raw, 10) : 5;
  return Number.isFinite(n) && n > 0 ? Math.min(n, 50) : 5;
}

async function findVendors(
  admin: SupabaseClient,
  pattern: string,
  limit: number,
): Promise<VendorRow[]> {
  const { data, error } = await admin
    .from("vendors")
    .select(
      "id, store_name, description, description_detail, categories, logo_url, instagram_url",
    )
    .ilike("store_name", `%${pattern}%`)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    throw error;
  }
  return (data ?? []) as VendorRow[];
}

async function main(): Promise<void> {
  loadEnvLocal();

  const admin = createAdmin();
  const limit = maxMatchesPerPattern();

  const patterns = [
    { label: "Asso", pattern: "Asso" },
    { label: "Магазин Женской Одежды", pattern: "Магазин Женской Одежды" },
  ];

  const seenIds = new Set<string>();
  const targets: { label: string; row: VendorRow }[] = [];

  for (const { label, pattern } of patterns) {
    const rows = await findVendors(admin, pattern, limit);
    if (rows.length === 0) {
      console.warn(`[warn] Ни одной строки по шаблону «${pattern}»`);
      continue;
    }
    for (const row of rows) {
      if (seenIds.has(row.id)) continue;
      seenIds.add(row.id);
      targets.push({
        label: `${label} — ${row.store_name ?? row.id}`,
        row,
      });
    }
  }

  if (targets.length === 0) {
    throw new Error("Не найдено ни одного вендора по заданным шаблонам.");
  }

  console.log(
    `К обработке: ${targets.length} уникальных строк (лимит ${limit} на шаблон).\n`,
  );

  for (const { label, row } of targets) {
    const raw = rawTextForAi(row);
    if (!raw) {
      console.warn(
        `\n[skip] «${label}» (${row.id}): пустой description + description_detail — нечего парсить.\n`,
      );
      continue;
    }

    console.log("\n════════════════════════════════════════════════════════════");
    console.log(`Магазин: ${label}`);
    console.log(`id:      ${row.id}`);
    console.log(`name:    ${row.store_name}`);
    console.log("──────── Сырой текст (description + description_detail) ────────");
    console.log(raw);
    console.log("────────────────────────────────────────────────────────────");

    const ai = await parseVendorTextWithOpenAI({
      storeTitle: row.store_name?.trim() || "Магазин",
      rawDescription: raw,
      instagramProfileUrl: row.instagram_url?.trim() || null,
    });

    console.log("──────── Ответ ИИ (VendorTextModerationOutput) ──────────────");
    console.log(JSON.stringify(ai, null, 2));

    const display = buildDisplay(row, ai);
    const payload: VendorsParsedAiPayloadV1 = {
      schemaVersion: 1,
      generatedAt: new Date().toISOString(),
      source: "script:test-ai-two-vendors",
      display,
      rawDescriptionUsed: raw,
    };

    const { error: upErr } = await admin
      .from("vendors")
      .update({ parsed_ai_data: payload as unknown as Record<string, unknown> })
      .eq("id", row.id);

    if (upErr) {
      throw new Error(`Update failed for ${row.id}: ${upErr.message}`);
    }

    console.log("──────── Сохранено в vendors.parsed_ai_data ───────────────────");
    console.log(JSON.stringify(payload, null, 2));
    console.log("════════════════════════════════════════════════════════════\n");
  }

  console.log("Готово.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
