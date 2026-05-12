import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const base = join(
  root,
  "data",
  "generated",
  "dordoi-google-places.discovery-apparel-footwear-compact-500-700",
);

const matched = JSON.parse(readFileSync(`${base}.catalog-matched.json`, "utf8"));
const unmapped = JSON.parse(readFileSync(`${base}.discovery-unmapped.json`, "utf8"));
const excluded = JSON.parse(readFileSync(`${base}.excluded.json`, "utf8"));
const raw = JSON.parse(readFileSync(`${base}.raw.json`, "utf8"));

let md = "# Discovery extract (apparel-footwear compact 500-700)\n\n";

md += `## 1. catalog_matched (${matched.length})\n\n`;
for (let i = 0; i < matched.length; i++) {
  const r = matched[i];
  md += `### ${i + 1}. ${r.title || "(no title)"}\n`;
  md += `- **catalogMainId:** ${r.catalogMainId ?? ""} | **catalogMainLabel:** ${r.catalogMainLabel ?? ""}\n`;
  md += `- **guessedCategory:** ${r.guessedCategory ?? ""} | **proposedCategory:** ${r.proposedCategory ?? "—"}\n`;
  md += `- **address:** ${r.address ?? ""}\n`;
  md += `- **googleMapsUri:** ${r.googleMapsUri ?? ""}\n`;
  md += `- **primaryType:** ${r.primaryType ?? ""}\n`;
  md += `- **types:** \`${Array.isArray(r.types) ? r.types.join(", ") : ""}\`\n`;
  md += `- **matchedQueries:** \`${Array.isArray(r.matchedQueries) ? r.matchedQueries.join(" | ") : ""}\`\n`;
  md += `- **sourceModes:** \`${Array.isArray(r.sourceModes) ? r.sourceModes.join(" | ") : ""}\`\n`;
  md += `- **distanceFromDordoiMeters:** ${r.distanceFromDordoiMeters ?? ""}\n\n`;
}

md += `## 2. discovery_unmapped (${unmapped.length})\n\n`;
for (let i = 0; i < unmapped.length; i++) {
  const r = unmapped[i];
  md += `### ${i + 1}. ${r.title || "(no title)"}\n`;
  md += `- **proposedCategory:** ${r.proposedCategory ?? ""} (${r.proposedCategoryLabel ?? ""})\n`;
  md += `- **reason:** ${r.reason ?? ""}\n`;
  md += `- **address:** ${r.address ?? ""}\n`;
  md += `- **googleMapsUri:** ${r.googleMapsUri ?? ""}\n`;
  md += `- **primaryType:** ${r.primaryType ?? ""}\n`;
  md += `- **types:** \`${Array.isArray(r.types) ? r.types.join(", ") : ""}\`\n`;
  md += `- **confidence:** ${r.confidence ?? ""}\n`;
  md += `- **distanceFromDordoiMeters:** ${r.distanceFromDordoiMeters ?? ""}\n\n`;
}

md += `## 3. excluded (первые 30 из ${excluded.length})\n\n`;
for (let i = 0; i < 30; i++) {
  const r = excluded[i];
  md += `### ${i + 1}. ${r.title || "(no title)"}\n`;
  md += `- **exclusionReason:** ${r.exclusionReason ?? ""}\n`;
  md += `- **primaryType:** ${r.primaryType ?? ""}\n`;
  md += `- **types:** \`${Array.isArray(r.types) ? r.types.join(", ") : ""}\`\n`;
  md += `- **address:** ${r.address ?? ""}\n\n`;
}

const errs = raw.apiErrors || [];
let textN = 0;
let nearN = 0;
const textQueries = new Set();
const nearLabels = [];
let sampleCode = "";
let sampleMsg = "";
let sampleStatus = "";

for (const e of errs) {
  const s = String(e);
  if (s.startsWith("text:")) {
    textN++;
    const m = s.match(/^text:"([^"]+)"/);
    if (m) textQueries.add(m[1]);
  } else if (s.startsWith("nearby:")) {
    nearN++;
    const before403 = s.split("403")[0]?.trim().replace(/\n/g, " ") ?? s.slice(0, 160);
    nearLabels.push(before403);
  }
  if (!sampleCode && s.includes('"code"')) {
    const jc = s.match(/"code":\s*(\d+)/);
    const jm = s.match(/"message":\s*"([^"]+)"/);
    const js = s.match(/"status":\s*"([^"]+)"/);
    if (jc) sampleCode = jc[1];
    if (jm) sampleMsg = jm[1];
    if (js) sampleStatus = js[1];
  }
}

md += "## 4. apiErrors\n\n";
md += `- **Всего записей в apiErrors:** ${errs.length}\n`;
md += `- **SearchText (префикс \`text:\`):** ${textN}\n`;
md += `- **SearchNearby (префикс \`nearby:\`):** ${nearN}\n\n`;
md += "### Endpoints / methods (из message)\n\n";
md +=
  "- **SearchText:** `places.googleapis.com` → `google.maps.places.v1.Places.SearchText`\n";
md +=
  "- **SearchNearby:** `places.googleapis.com` → `google.maps.places.v1.Places.SearchNearby`\n\n";
md += "### Упавшие Text Search (строка запроса)\n\n";
for (const q of [...textQueries].sort()) {
  md += `- \`${q}\`\n`;
}
md += "\n### Упавшие Nearby (префикс до 403 в логе)\n\n";
for (const line of nearLabels) {
  md += `- \`${line}\`\n`;
}
md += "\n### Пример code / message / status (без ключа API)\n\n";
md += `- **code:** ${sampleCode}\n`;
md += `- **message:** ${sampleMsg}\n`;
md += `- **status:** ${sampleStatus}\n`;
md += "- **ErrorInfo.reason (типично):** `API_KEY_SERVICE_BLOCKED`\n";

const outPath = join(root, "reports", "discovery-extract-apparel-footwear-last.md");
writeFileSync(outPath, md, "utf8");
console.log(outPath);
