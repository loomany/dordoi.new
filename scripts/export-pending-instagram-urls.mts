/**
 * Список Instagram URL из очереди модерации (для copy-paste / парсинга).
 *   npx tsx scripts/export-pending-instagram-urls.mts
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const line of readFileSync(join(root, ".env.local"), "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data, error } = await sb
  .from("vendors")
  .select("store_name, instagram_url")
  .in("status", ["pending_moderation", "pending_review"])
  .not("instagram_url", "is", null)
  .order("store_name");

if (error) {
  console.error(error);
  process.exit(1);
}

const seen = new Set<string>();
const lines: string[] = [];
for (const row of data ?? []) {
  const url = row.instagram_url?.trim();
  if (!url || seen.has(url.toLowerCase())) continue;
  seen.add(url.toLowerCase());
  lines.push(url);
}

const outPath = join(root, "reports", "pending-instagram-urls.txt");
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");

console.log(lines.join("\n"));
console.error(`\n--- ${lines.length} URL (saved: reports/pending-instagram-urls.txt) ---`);
