/**
 * Lists message leaf keys where an overlay locale string exactly equals ru.json
 * (often means the string was never translated for that locale).
 * Usage: node scripts/list-overlay-identical-to-ru.mjs [kg]
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

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

const arg = process.argv[2];
const locales = arg ? [arg] : ["kk", "kg", "uz", "tj"];

for (const loc of locales) {
  const p = join(root, "messages", `${loc}.json`);
  if (!existsSync(p)) {
    console.log(`${loc}: missing file\n`);
    continue;
  }
  const locFlat = flattenLeaves(JSON.parse(readFileSync(p, "utf8")));
  const identical = Object.keys(locFlat).filter(
    (k) => ruFlat[k] !== undefined && locFlat[k] === ruFlat[k],
  );
  console.log(
    `${loc}: ${identical.length} leaf keys identical to ru (review for untranslated UI)\n`,
  );
  identical.slice(0, 40).forEach((k) => console.log(`  ${k}`));
  if (identical.length > 40) {
    console.log(`  … +${identical.length - 40} more`);
  }
  console.log("");
}
