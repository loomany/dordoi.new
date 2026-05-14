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

const userId = process.argv[2] ?? "2340a0de-465c-431a-9c95-438612365482";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: sub, error: subErr } = await admin
  .from("subscriptions")
  .select("*")
  .eq("user_id", userId)
  .maybeSingle();

const { data: prof } = await admin
  .from("profiles")
  .select("id, email, role")
  .eq("id", userId)
  .maybeSingle();

console.log("user_id:", userId);
console.log("profile:", prof);
console.log("subscription:", sub);
console.log("subscription lookup error:", subErr?.message ?? null);
