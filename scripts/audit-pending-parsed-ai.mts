import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !key) throw new Error("Missing Supabase env");

const admin = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await admin
  .from("vendors")
  .select("id, store_name, parsed_ai_data, description")
  .in("status", ["pending_moderation", "pending_review"]);

if (error) throw error;

let withAi = 0;
let boilerplateOnly = 0;
let hasUsefulRaw = 0;

for (const r of data ?? []) {
  const pad = r.parsed_ai_data as { display?: { description?: string } } | null;
  if (pad?.display?.description?.trim()) withAi++;

  const raw = (r.description ?? "").trim().toLowerCase();
  const isBoilerplate =
    raw.includes("импорт из выгрузки") ||
    raw.includes("проверьте контакты") ||
    raw.includes("проверьте название");
  if (raw && !isBoilerplate) hasUsefulRaw++;
  else if (raw && isBoilerplate) boilerplateOnly++;
}

console.log("pending total:", data?.length ?? 0);
console.log("with parsed_ai_data.description:", withAi);
console.log("useful raw description (not 2GIS boilerplate):", hasUsefulRaw);
console.log("boilerplate-only raw:", boilerplateOnly);
