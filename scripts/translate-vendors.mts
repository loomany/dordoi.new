/**
 * Translates vendor card text from Russian `parsed_ai_data.display` into
 * `parsed_ai_data.i18n.{kk|kg|uz|tj}` in Supabase.
 *
 * Usage:
 *   npx tsx scripts/translate-vendors.mts
 *   npx tsx scripts/translate-vendors.mts --locale=kg
 *   npx tsx scripts/translate-vendors.mts --locale=all --align
 *   npx tsx scripts/translate-vendors.mts --locale=all --force
 *
 * Env: OPENAI_API_KEY, OPENAI_TRANSLATION_MODEL (default gpt-4o-mini),
 *      NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Flags:
 *   --locale=kk|kg|uz|tj|all   (default all)
 *   --align                    re-translate if missing, stale fingerprint, or text still equals RU
 *   --force                    re-translate all matching vendors/locales
 *   --dry-run                  no DB writes
 *   --limit=N                  cap vendors processed
 *   --delay-ms=N               pause between OpenAI calls (default 400)
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import OpenAI from "openai";

import type { VendorCardCommerceCopy } from "@/lib/catalog/vendor-card-display";

const VENDOR_TEXT_LOCALES = ["kk", "kg", "uz", "tj"] as const;
type VendorTextLocale = (typeof VENDOR_TEXT_LOCALES)[number];
type VendorDisplayI18nEntry = {
  description: string;
  subtitle?: string | null;
  commerce?: VendorCardCommerceCopy;
};

type VendorDisplayI18nMap = Partial<
  Record<VendorTextLocale, VendorDisplayI18nEntry>
>;

type SourcePayload = {
  description: string;
  subtitle: string | null;
  commerce: VendorCardCommerceCopy;
};

function asObjectRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function fingerprintVendorDisplaySource(fields: SourcePayload): string {
  const payload = JSON.stringify({
    description: fields.description.trim(),
    subtitle: fields.subtitle?.trim() ?? "",
    commerce: fields.commerce,
  });
  return createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

function readVendorDisplayI18n(
  parsedAiData: unknown,
): VendorDisplayI18nMap | null {
  const root = asObjectRecord(parsedAiData);
  if (!root) return null;
  const i18n = root.i18n;
  if (!i18n || typeof i18n !== "object" || Array.isArray(i18n)) return null;
  return i18n as VendorDisplayI18nMap;
}

function readVendorParsedAiI18nMeta(parsedAiData: unknown): {
  sourceFingerprint: string;
  translatedAt: Partial<Record<VendorTextLocale, string>>;
} | null {
  const root = asObjectRecord(parsedAiData);
  if (!root) return null;
  const meta = root.i18nMeta;
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const o = meta as Record<string, unknown>;
  const sourceFingerprint =
    typeof o.sourceFingerprint === "string" ? o.sourceFingerprint : "";
  const translatedAt =
    o.translatedAt &&
    typeof o.translatedAt === "object" &&
    !Array.isArray(o.translatedAt)
      ? (o.translatedAt as Partial<Record<VendorTextLocale, string>>)
      : {};
  if (!sourceFingerprint) return null;
  return { sourceFingerprint, translatedAt };
}

const BUYER_ONLY_VENDOR_SLUGS = new Set(["dordoi-zakup-aiperi"]);

function isBuyerOnlyVendorSlug(slug: string | null | undefined): boolean {
  const key = typeof slug === "string" ? slug.trim() : "";
  return key.length > 0 && BUYER_ONLY_VENDOR_SLUGS.has(key);
}

type VendorRow = {
  id: string;
  slug: string;
  store_name: string | null;
  parsed_ai_data: unknown;
};

const VENDOR_SELECT = "id, slug, store_name, parsed_ai_data";
const BLOCKED_STORE_NAMES = new Set(["cosmos"]);

const LOCALE_HINTS: Record<VendorTextLocale, string> = {
  kk: "Kazakh (Cyrillic), natural B2B marketplace copy.",
  kg: "Kyrgyz (Cyrillic), natural B2B marketplace copy.",
  uz: "Uzbek in Latin script (lotin), natural B2B marketplace copy.",
  tj: "Tajik (Cyrillic), natural B2B marketplace copy.",
};

function loadEnvLocal(): void {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  const text = readFileSync(p, "utf8");
  for (const line of text.split(/\r?\n/)) {
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
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function parseArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p?.split("=", 2)[1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isBlockedStoreName(storeName: string | null | undefined): boolean {
  const key =
    typeof storeName === "string" ? storeName.trim().toLowerCase() : "";
  return key.length > 0 && BLOCKED_STORE_NAMES.has(key);
}

async function fetchAllPublishedVendors(
  admin: SupabaseClient,
  pageSize: number,
): Promise<VendorRow[]> {
  const out: VendorRow[] = [];
  let from = 0;
  for (;;) {
    const to = from + pageSize - 1;
    const { data, error } = await admin
      .from("vendors")
      .select(VENDOR_SELECT)
      .eq("status", "approved")
      .not("slug", "is", null)
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw error;
    const page = (data ?? []) as VendorRow[];
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

function buildSourcePayload(parsedAiData: unknown): SourcePayload | null {
  const root =
    parsedAiData &&
    typeof parsedAiData === "object" &&
    !Array.isArray(parsedAiData)
      ? (parsedAiData as Record<string, unknown>)
      : null;
  if (!root) return null;
  const displayRaw = root.display ?? root;
  const display =
    displayRaw &&
    typeof displayRaw === "object" &&
    !Array.isArray(displayRaw)
      ? (displayRaw as Record<string, unknown>)
      : null;
  if (!display) return null;
  const description =
    typeof display.description === "string" ? display.description.trim() : "";
  if (!description) return null;
  const sub = display.subtitle;
  const subtitle =
    typeof sub === "string" ? sub.trim() || null : null;
  const commerceRaw = display.commerce;
  const commerce: VendorCardCommerceCopy = {};
  if (commerceRaw && typeof commerceRaw === "object" && !Array.isArray(commerceRaw)) {
    const c = commerceRaw as Record<string, unknown>;
    for (const key of ["delivery", "payment", "samples", "defects"] as const) {
      const v = c[key];
      if (typeof v === "string" && v.trim()) commerce[key] = v.trim();
    }
  }
  return { description, subtitle, commerce };
}

function commerceForApi(commerce: VendorCardCommerceCopy): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of ["delivery", "payment", "samples", "defects"] as const) {
    const v = commerce[key]?.trim();
    if (v) out[key] = v;
  }
  return out;
}

function needsTranslation(opts: {
  source: SourcePayload;
  parsedAiData: unknown;
  locale: VendorTextLocale;
  force: boolean;
  align: boolean;
}): boolean {
  const { source, parsedAiData, locale, force, align } = opts;
  if (force) return true;

  const fingerprint = fingerprintVendorDisplaySource(source);
  const meta = readVendorParsedAiI18nMeta(parsedAiData);
  const existing = readVendorDisplayI18n(parsedAiData)?.[locale];
  const existingDesc = existing?.description?.trim();

  if (!existingDesc) return true;
  if (meta?.sourceFingerprint !== fingerprint) return true;
  if (!align) return false;

  if (existingDesc === source.description) return true;
  if (
    source.subtitle &&
    existing?.subtitle?.trim() === source.subtitle.trim()
  ) {
    return true;
  }
  return false;
}

async function translateVendorFields(
  client: OpenAI,
  model: string,
  locale: VendorTextLocale,
  source: SourcePayload,
  storeName: string,
): Promise<VendorDisplayI18nEntry> {
  const input: Record<string, unknown> = {
    description: source.description,
  };
  if (source.subtitle?.trim()) input.subtitle = source.subtitle.trim();
  const commerce = commerceForApi(source.commerce);
  if (Object.keys(commerce).length > 0) input.commerce = commerce;

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          `Translate B2B wholesale marketplace vendor card text from Russian into locale "${locale}". ` +
          `${LOCALE_HINTS[locale]} ` +
          `Return JSON with the same top-level keys as input. ` +
          `Field "description" is required and must be a full natural translation (not a mix of Russian and target language). ` +
          `If input has "subtitle", translate it; if null, omit the key. ` +
          `If input has "commerce", translate each non-empty string value; keep the same keys. ` +
          `Do NOT include phone numbers, emails, URLs, @handles, or calls to contact. ` +
          `Keep Latin brand names and product terms (FAQ, MOQ, ПВД, ПНД) unchanged. ` +
          `Write ONLY in the target language — no Russian words in the output except unchanged Latin brand names. ` +
          `Store context name (do not copy into description): ${storeName}`,
      },
      { role: "user", content: JSON.stringify(input) },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) throw new Error("Empty OpenAI completion");

  const parsed = JSON.parse(raw) as Record<string, unknown>;
  const description =
    typeof parsed.description === "string" ? parsed.description.trim() : "";
  if (!description) throw new Error("Missing translated description");
  if (description === source.description) {
    throw new Error("Translation identical to Russian source");
  }

  const entry: VendorDisplayI18nEntry = { description };
  if (typeof parsed.subtitle === "string") {
    const sub = parsed.subtitle.trim();
    entry.subtitle = sub.length > 0 ? sub : null;
  } else if (parsed.subtitle === null) {
    entry.subtitle = null;
  }

  if (parsed.commerce && typeof parsed.commerce === "object") {
    const c = parsed.commerce as Record<string, unknown>;
    const commerceOut: VendorCardCommerceCopy = {};
    for (const key of ["delivery", "payment", "samples", "defects"] as const) {
      const v = c[key];
      if (typeof v === "string" && v.trim()) commerceOut[key] = v.trim();
    }
    if (Object.keys(commerceOut).length > 0) entry.commerce = commerceOut;
  }

  return entry;
}

function mergeParsedAiI18n(
  parsedAiData: unknown,
  locale: VendorTextLocale,
  entry: VendorDisplayI18nEntry,
  sourceFingerprint: string,
): Record<string, unknown> {
  const root =
    parsedAiData &&
    typeof parsedAiData === "object" &&
    !Array.isArray(parsedAiData)
      ? ({ ...(parsedAiData as Record<string, unknown>) } as Record<
          string,
          unknown
        >)
      : {};

  const i18n: VendorDisplayI18nMap = {
    ...(readVendorDisplayI18n(root) ?? {}),
    [locale]: entry,
  };
  const prevMeta = readVendorParsedAiI18nMeta(root);
  const translatedAt = { ...(prevMeta?.translatedAt ?? {}) };
  translatedAt[locale] = new Date().toISOString();

  root.i18n = i18n;
  root.i18nMeta = {
    sourceFingerprint,
    translatedAt,
  };
  return root;
}

async function main(): Promise<void> {
  loadEnvLocal();

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) throw new Error("Missing OPENAI_API_KEY");

  const localeArg = parseArg("locale") ?? "all";
  const align = hasFlag("align");
  const force = hasFlag("force");
  const dryRun = hasFlag("dry-run");
  const limit = Number.parseInt(parseArg("limit") ?? "", 10);
  const delayMs = Number.parseInt(parseArg("delay-ms") ?? "400", 10);
  const model = process.env.OPENAI_TRANSLATION_MODEL?.trim() || "gpt-4o-mini";

  const locales: VendorTextLocale[] =
    localeArg === "all"
      ? [...VENDOR_TEXT_LOCALES]
      : VENDOR_TEXT_LOCALES.includes(localeArg as VendorTextLocale)
        ? [localeArg as VendorTextLocale]
        : [];

  if (locales.length === 0) {
    throw new Error(
      `Unknown --locale=${localeArg}. Use kk, kg, uz, tj, or all.`,
    );
  }

  const admin = createAdmin();
  const vendors = await fetchAllPublishedVendors(admin, 100);
  const client = new OpenAI({ apiKey });

  console.log(
    `Vendors in catalog: ${vendors.length}; locales: ${locales.join(", ")}; ` +
      `mode: ${force ? "force" : align ? "align" : "missing/stale only"}${dryRun ? "; dry-run" : ""}`,
  );

  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let processedVendors = 0;

  for (const row of vendors) {
    if (Number.isFinite(limit) && limit > 0 && processedVendors >= limit) break;

    const source = buildSourcePayload(row.parsed_ai_data);
    if (!source) {
      skipped++;
      continue;
    }

    const fingerprint = fingerprintVendorDisplaySource(source);
    const label = `${row.store_name ?? row.slug} (${row.slug})`;
    let rowDirty = false;
    let nextParsedAi = row.parsed_ai_data;

    for (const locale of locales) {
      if (
        !needsTranslation({
          source,
          parsedAiData: nextParsedAi,
          locale,
          force,
          align,
        })
      ) {
        continue;
      }

      try {
        const entry = await translateVendorFields(
          client,
          model,
          locale,
          source,
          row.store_name?.trim() || row.slug,
        );
        nextParsedAi = mergeParsedAiI18n(
          nextParsedAi,
          locale,
          entry,
          fingerprint,
        );
        rowDirty = true;
        updated++;
        console.log(
          `  [${locale}] ${label} — ${entry.description.slice(0, 64).replace(/\n/g, " ")}…`,
        );
        if (delayMs > 0) await sleep(delayMs);
      } catch (err) {
        failed++;
        console.error(
          `  [${locale}] ${label} — FAILED:`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    if (rowDirty && !dryRun) {
      const { error } = await admin
        .from("vendors")
        .update({ parsed_ai_data: nextParsedAi as Record<string, unknown> })
        .eq("id", row.id);
      if (error) throw new Error(error.message);
    }

    if (rowDirty) processedVendors++;
  }

  console.log(
    `\nDone. locale-writes: ${updated}, vendors touched: ${processedVendors}, skipped-no-ai: ${skipped}, failed: ${failed}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
