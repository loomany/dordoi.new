/**
 * Translates messages from Russian (ru.json) into overlay locale files.
 *
 * Default: only keys missing in the target file (--locale, default kk).
 * With --align: also re-translates keys where the locale string still exactly
 * matches ru (typical "Russian left in kg.json" leak).
 *
 * Usage:
 *   npx tsx scripts/translate-messages.mts
 *   npx tsx scripts/translate-messages.mts --locale=kg
 *   npx tsx scripts/translate-messages.mts --locale=kg --align
 *   npx tsx scripts/translate-messages.mts --locale=all --align
 *
 * Requires OPENAI_API_KEY and OPENAI_TRANSLATION_MODEL (default gpt-4o-mini).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const OVERLAY_LOCALES = ["kk", "kg", "uz", "tj"] as const;

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

loadEnvLocal();

function parseArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p?.split("=", 2)[1];
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function flattenLeaves(obj: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (isObject(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "string") {
        out[p] = v;
      } else if (isObject(v)) {
        Object.assign(out, flattenLeaves(v, p));
      }
    }
  }
  return out;
}

function setLeafAtPath(
  root: Record<string, unknown>,
  parts: string[],
  value: string,
): void {
  let cur: Record<string, unknown> = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    const next = cur[k];
    if (!isObject(next)) {
      cur[k] = {};
    }
    cur = cur[k] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
}

/** Skip API: nothing to translate or must stay verbatim. */
function skipSourceString(key: string, ru: string): boolean {
  const t = ru.trim();
  if (t === "") return true;
  if (t === "Dordoi.help") return true;
  if (key === "brand.name") return true;
  if (/^https?:\/\/\S+$/i.test(t)) return true;
  if (/^[\w.+-]+@[\w.-]+\.\w{2,}$/i.test(t)) return true;
  if (/^https?:\/\//i.test(t) && t.length < 500) return true;
  if (t.includes("@") && /^[^\s]+$/.test(t) && t.length < 120) return true;
  return false;
}

const LOCALE_HINTS: Record<string, string> = {
  kk: "Kazakh (Cyrillic), natural UI wording.",
  kg: "Kyrgyz (Cyrillic), natural UI wording.",
  uz: "Uzbek in Latin script (lotin), natural UI wording.",
  tj: "Tajik (Cyrillic), natural UI wording.",
};

function collectKeys(
  ruFlat: Record<string, string>,
  locFlat: Record<string, string>,
  align: boolean,
): string[] {
  const keys: string[] = [];
  for (const key of Object.keys(ruFlat)) {
    const ru = ruFlat[key];
    if (skipSourceString(key, ru)) continue;
    const locVal = locFlat[key];
    if (locVal === undefined) {
      keys.push(key);
      continue;
    }
    if (align && locVal === ru) {
      keys.push(key);
    }
  }
  return keys;
}

async function translateAndWrite(
  locale: string,
  align: boolean,
): Promise<number> {
  const ruFlat = flattenLeaves(
    JSON.parse(readFileSync(join(root, "messages", "ru.json"), "utf8")),
  );
  const locPath = join(root, "messages", `${locale}.json`);
  const loc = JSON.parse(readFileSync(locPath, "utf8")) as Record<
    string,
    unknown
  >;
  const locFlat = flattenLeaves(loc);

  const toTranslate = collectKeys(ruFlat, locFlat, align);
  if (toTranslate.length === 0) {
    console.log(
      `${locale}: nothing to do${align ? " (no missing / no ru-identical strings)" : " (no missing keys)"}.`,
    );
    return 0;
  }

  const mode = align ? "missing + identical-to-ru" : "missing only";
  console.log(`${locale}: translating ${toTranslate.length} keys (${mode}).`);

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini";
  if (!apiKey) {
    console.error("Missing OPENAI_API_KEY");
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  const batchSize = 40;
  const out = structuredClone(loc) as Record<string, unknown>;
  const langHint =
    LOCALE_HINTS[locale] ??
    `Locale "${locale}", natural UI wording for that language.`;

  for (let i = 0; i < toTranslate.length; i += batchSize) {
    const slice = toTranslate.slice(i, i + batchSize);
    const payload: Record<string, string> = {};
    for (const k of slice) payload[k] = ruFlat[k];

    const alignNote = align
      ? " Some strings may still be Russian in the file: translate them fully."
      : "";

    const completion = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            `Translate UI strings from Russian (source) for locale "${locale}". ` +
            `${langHint}${alignNote} ` +
            `Return JSON { [dotKey: string]: string } with the same keys as input. ` +
            `Preserve exactly inside strings: "Dordoi.help", email addresses, full URLs, ` +
            `Telegram/WhatsApp handles like @name, Latin product names (FAQ, IQ, Zip-lock, Lemon Squeezy, ПВД, ПНД). ` +
            `Keep placeholders {from}, {to}, {count}, {date}, {relative}, {title}, {phone}, {n} unchanged.`,
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      console.error("Empty completion");
      process.exit(1);
    }
    const translated = JSON.parse(raw) as Record<string, string>;
    for (const key of slice) {
      const v = translated[key];
      if (typeof v !== "string") {
        console.error("Missing translation for", key);
        process.exit(1);
      }
      setLeafAtPath(out, key.split("."), v);
    }
    console.log(
      `  batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toTranslate.length / batchSize)} (${slice.length} keys)`,
    );
  }

  writeFileSync(locPath, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Wrote ${locPath}`);
  return toTranslate.length;
}

const localeArg = parseArg("locale") ?? "kk";
const align = hasFlag("align");
const locales =
  localeArg === "all" ? [...OVERLAY_LOCALES] : [localeArg];

for (const loc of locales) {
  if (!OVERLAY_LOCALES.includes(loc as (typeof OVERLAY_LOCALES)[number])) {
    console.error(
      `Unknown locale "${loc}". Use one of: ${OVERLAY_LOCALES.join(", ")}, all`,
    );
    process.exit(1);
  }
}

let total = 0;
for (const loc of locales) {
  total += await translateAndWrite(loc, align);
}

if (total === 0 && !align && locales.length === 1) {
  console.log(
    '\nTip: if Russian text still appears in this locale file, run with --align, e.g. npx tsx scripts/translate-messages.mts --locale=all --align',
  );
}
