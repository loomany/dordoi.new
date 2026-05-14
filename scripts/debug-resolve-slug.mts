import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const slug = "luxury-yasin";
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const { data: byOpaque } = await sb
  .from("vendors")
  .select("slug")
  .eq("status", "approved")
  .eq("slug", slug)
  .maybeSingle();

const { data: bySeo } = await sb
  .from("vendors")
  .select("slug,seo_slug")
  .eq("status", "approved")
  .eq("seo_slug", slug)
  .maybeSingle();

console.log({ byOpaque, bySeo, expect: "redirect to", opaque: bySeo?.slug });
