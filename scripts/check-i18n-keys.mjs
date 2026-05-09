import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const locales = ["ru", "kk", "kg", "uz", "tj"];

function flatten(obj, prefix = "") {
  const keys = [];
  if (obj && typeof obj === "object" && !Array.isArray(obj)) {
    for (const k of Object.keys(obj)) {
      const p = prefix ? `${prefix}.${k}` : k;
      if (typeof obj[k] === "object" && obj[k] !== null && !Array.isArray(obj[k])) {
        keys.push(...flatten(obj[k], p));
      } else {
        keys.push(p);
      }
    }
  }
  return keys;
}

function loadJson(locale) {
  const p = join(root, "messages", `${locale}.json`);
  if (!existsSync(p)) {
    throw new Error(`Missing messages file: ${p}`);
  }
  return JSON.parse(readFileSync(p, "utf8"));
}

const ru = loadJson("ru");
const ruKeys = new Set(flatten(ru));

let exit = 0;
for (const loc of locales) {
  if (loc === "ru") continue;
  const data = loadJson(loc);
  const keys = flatten(data);
  for (const k of keys) {
    if (!ruKeys.has(k)) {
      console.error(`[i18n] Orphan key in ${loc}.json (not in ru): ${k}`);
      exit = 1;
    }
  }
}

if (exit === 0) {
  console.log("[i18n] No orphan overlay keys (all overlay leaves exist in ru).");
}
process.exit(exit);
