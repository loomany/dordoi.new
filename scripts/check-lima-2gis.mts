import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
function parseTwoGisId(pid: string | null | undefined): string | null {
  const m = pid?.trim().match(/^2gis:(\d+)$/i);
  return m?.[1] ?? null;
}

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

loadEnvLocal();

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data, error } = await admin
  .from("vendors")
  .select("slug, seo_slug, store_name, google_place_id, google_maps_uri")
  .or("slug.eq.lima-brand-kg,seo_slug.eq.lima-brand-kg")
  .limit(1);

if (error) throw error;
const row = data?.[0];
console.log("DB row:", row);
if (row) {
  console.log("parsed 2gis id:", parseTwoGisId(row.google_place_id));
  const id = parseTwoGisId(row.google_place_id);
  console.log("built url:", id ? `https://2gis.kg/bishkek/firm/${id}` : null);
}
