/**
 * Offline: adds missing leaf keys to messages/<locale>.json (paths present in ru.json).
 * Usage: npx tsx scripts/translate-messages.mts --locale=kk
 * Requires OPENAI_API_KEY and OPENAI_TRANSLATION_MODEL (default gpt-4o-mini).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import OpenAI from "openai";

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

loadEnvLocal();

function parseArg(name: string): string | undefined {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  return p?.split("=", 2)[1];
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

const locale = parseArg("locale") ?? "kk";
const apiKey = process.env.OPENAI_API_KEY;
const model = process.env.OPENAI_TRANSLATION_MODEL ?? "gpt-4o-mini";

if (!apiKey) {
  console.error("Missing OPENAI_API_KEY");
  process.exit(1);
}

const ruFlat = flattenLeaves(
  JSON.parse(readFileSync(join(root, "messages", "ru.json"), "utf8")),
);
const locPath = join(root, "messages", `${locale}.json`);
const loc = JSON.parse(readFileSync(locPath, "utf8")) as Record<string, unknown>;
const locFlat = flattenLeaves(loc);

const missing = Object.keys(ruFlat).filter((k) => locFlat[k] === undefined);

if (missing.length === 0) {
  console.log(`No missing keys in ${locale}.json relative to ru.json.`);
  process.exit(0);
}

const client = new OpenAI({ apiKey });
const batchSize = 40;
const out = structuredClone(loc) as Record<string, unknown>;

for (let i = 0; i < missing.length; i += batchSize) {
  const slice = missing.slice(i, i + batchSize);
  const payload: Record<string, string> = {};
  for (const k of slice) payload[k] = ruFlat[k];

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          `Translate UI strings from Russian to locale "${locale}". ` +
          `Return JSON { [dotKey: string]: string } with the same keys as input. ` +
          `Preserve "Dordoi.help", email addresses, and URLs exactly.`,
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
}

writeFileSync(locPath, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`Wrote ${locPath} (added ${missing.length} keys).`);
