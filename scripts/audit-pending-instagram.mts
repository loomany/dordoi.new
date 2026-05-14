/**
 * Сколько заявок в очереди модерации имеют Instagram.
 *   npx tsx scripts/audit-pending-instagram.mts
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data, error } = await sb
  .from("vendors")
  .select("id, store_name, status, application_source, instagram_url, logo_url")
  .in("status", ["pending_moderation", "pending_review"]);

if (error) {
  console.error(error);
  process.exit(1);
}

const rows = data ?? [];
const withIg = rows.filter((r) => r.instagram_url?.trim());
const withoutIg = rows.filter((r) => !r.instagram_url?.trim());

console.log("=== Instagram в очереди модерации ===\n");
console.log("Всего в очереди:", rows.length);
console.log("С Instagram:", withIg.length, `(${rows.length ? Math.round((withIg.length / rows.length) * 100) : 0}%)`);
console.log("Без Instagram:", withoutIg.length, `(${rows.length ? Math.round((withoutIg.length / rows.length) * 100) : 0}%)`);
console.log("");

const byStatus = new Map<string, { total: number; withIg: number }>();
for (const r of rows) {
  const s = r.status ?? "?";
  const cur = byStatus.get(s) ?? { total: 0, withIg: 0 };
  cur.total++;
  if (r.instagram_url?.trim()) cur.withIg++;
  byStatus.set(s, cur);
}
console.log("По статусу:");
for (const [s, { total, withIg: n }] of byStatus) {
  console.log(`  ${s}: ${n}/${total} с Instagram`);
}
console.log("");

const bySource = new Map<string, { total: number; withIg: number }>();
for (const r of rows) {
  const src = r.application_source ?? "(null)";
  const cur = bySource.get(src) ?? { total: 0, withIg: 0 };
  cur.total++;
  if (r.instagram_url?.trim()) cur.withIg++;
  bySource.set(src, cur);
}
console.log("По источнику:");
for (const [src, { total, withIg: n }] of [...bySource.entries()].sort((a, b) => b[1].total - a[1].total)) {
  console.log(`  ${src}: ${n}/${total} с Instagram`);
}
console.log("");

const withIgAndLogo = withIg.filter((r) => r.logo_url?.trim());
console.log("С Instagram и логотипом:", withIgAndLogo.length);
console.log("С Instagram, но без логотипа:", withIg.length - withIgAndLogo.length);
console.log("");

if (withIg.length > 0) {
  console.log("--- Примеры с Instagram (первые 15) ---");
  for (const r of withIg.slice(0, 15)) {
    console.log(`  ${r.store_name ?? "—"} | ${r.instagram_url?.trim()}`);
  }
}

if (withoutIg.length > 0) {
  console.log("");
  console.log("--- Примеры без Instagram (первые 10) ---");
  for (const r of withoutIg.slice(0, 10)) {
    console.log(`  ${r.store_name ?? "—"}`);
  }
}
