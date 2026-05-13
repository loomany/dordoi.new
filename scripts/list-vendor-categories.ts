/**
 * Сводка уникальных значений vendors.categories (text[]) по всей таблице.
 *
 *   npx tsx scripts/list-vendor-categories.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { createAdminClient } from "@/lib/supabase/admin";

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

async function main() {
  loadEnvLocal();
  const admin = createAdminClient();
  const counts = new Map<string, number>();
  let vendors = 0;
  const pageSize = 1000;
  let offset = 0;
  for (;;) {
    const { data, error } = await admin
      .from("vendors")
      .select("categories")
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = data ?? [];
    for (const r of rows) {
      vendors += 1;
      const cats = Array.isArray(r.categories) ? r.categories : [];
      for (const c of cats) {
        if (typeof c !== "string") continue;
        const s = c.trim();
        if (!s) continue;
        counts.set(s, (counts.get(s) ?? 0) + 1);
      }
    }
    if (rows.length < pageSize) break;
    offset += pageSize;
  }

  const sorted = [...counts.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru"),
  );

  console.log(
    JSON.stringify(
      {
        vendors_total: vendors,
        distinct_category_labels: sorted.length,
        by_usage_desc: sorted.map(([label, count]) => ({ label, vendor_rows_with_tag: count })),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
