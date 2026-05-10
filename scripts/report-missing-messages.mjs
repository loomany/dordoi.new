/**
 * Lists string leaf keys present in messages/ru.json but absent from each overlay locale.
 * Runtime still falls back to RU (see i18n/request.ts mergeMessages).
 * Usage: node scripts/report-missing-messages.mjs
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function flattenLeaves(obj, prefix = "") {
  const out = {};
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "string") out[p] = v;
      else Object.assign(out, flattenLeaves(v, p));
    }
  }
  return out;
}

const ruFlat = flattenLeaves(
  JSON.parse(readFileSync(join(root, "messages", "ru.json"), "utf8")),
);
const ruCount = Object.keys(ruFlat).length;
const locales = ["kk", "kg", "uz", "tj"];

console.log(`ru.json leaf strings: ${ruCount}\n`);

for (const loc of locales) {
  const p = join(root, "messages", `${loc}.json`);
  if (!existsSync(p)) {
    console.log(`${loc}: file missing`);
    continue;
  }
  const locFlat = flattenLeaves(JSON.parse(readFileSync(p, "utf8")));
  const missing = Object.keys(ruFlat).filter((k) => locFlat[k] === undefined);
  const pct = ((1 - missing.length / ruCount) * 100).toFixed(1);
  console.log(
    `${loc}: ${missing.length} missing (${pct}% of RU keys present in file; rest use RU at runtime)`,
  );
  if (missing.length > 0 && missing.length <= 25) {
    console.log("  " + missing.slice(0, 25).join("\n  "));
    if (missing.length > 25) console.log(`  … +${missing.length - 25} more`);
  } else if (missing.length > 25) {
    console.log("  e.g. " + missing.slice(0, 12).join(", ") + ` … (+${missing.length - 12})`);
  }
  console.log("");
}
