/**
 * Список approved-вендоров, у которых заголовок карточки меняется после stripGenericShopSuffixFromStoreTitle.
 * Запуск: npx tsx scripts/audit-catalog-store-titles.ts
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createClient } from "@supabase/supabase-js";

import { stripGenericShopSuffixFromStoreTitle } from "@/lib/catalog/catalog-card-title";

function loadEnvLocal(): void {
  const p = join(process.cwd(), ".env.local");
  if (!existsSync(p)) return;
  for (const line of readFileSync(p, "utf8").split("\n")) {
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

async function main(): Promise<void> {
  loadEnvLocal();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) {
    console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const admin = createClient(url, key);
  const { data, error } = await admin
    .from("vendors")
    .select("slug, store_name")
    .eq("status", "approved")
    .not("slug", "is", null)
    .order("store_name");

  if (error) throw error;

  const rows = (data ?? []) as { slug: string; store_name: string | null }[];
  const changed = rows
    .map((r) => {
      const raw = r.store_name?.trim() ?? "";
      const stripped = stripGenericShopSuffixFromStoreTitle(raw);
      return { slug: r.slug, raw, stripped };
    })
    .filter((r) => r.raw && r.stripped !== r.raw);

  console.error(`Approved с slug: ${rows.length}`);
  console.error(`Заголовок карточки изменится (strip): ${changed.length}`);
  for (const r of changed.slice(0, 40)) {
    console.log(`${r.slug}\n  было: ${r.raw}\n  станет: ${r.stripped}\n`);
  }
  if (changed.length > 40) {
    console.error(`… и ещё ${changed.length - 40}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
