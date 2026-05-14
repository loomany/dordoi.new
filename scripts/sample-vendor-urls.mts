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
  .select("slug,seo_slug,store_name")
  .eq("status", "approved")
  .not("seo_slug", "is", null)
  .limit(3);

if (error) throw error;

for (const row of data ?? []) {
  console.log({
    store: row.store_name,
    catalog: `/ru/catalog/${row.slug}`,
    suppliers: `/ru/suppliers/${row.seo_slug}`,
  });
}
