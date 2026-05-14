import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const SAFE =
  /^(?:postavshik(?:-(?:zhenskoy-odezhdy|muzhskoy-odezhdy|detskoy-odezhdy|obuvi|sumok|tkani|aksessuarov|tekstilya|sporta|belya))?|vendor)-[a-z0-9]{4,6}$/;

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data, error } = await sb
  .from("vendors")
  .select("slug,seo_slug")
  .eq("status", "approved");

if (error) throw error;

let opaque = 0;
let legacy = 0;
let missingSeo = 0;

for (const r of data ?? []) {
  const s = r.slug?.trim() ?? "";
  if (SAFE.test(s.toLowerCase())) {
    opaque++;
    if (!r.seo_slug?.trim()) missingSeo++;
  } else {
    legacy++;
  }
}

console.log({ total: data?.length ?? 0, opaque, legacy, missingSeo });
