import { readFileSync } from "node:fs";

import { getSubscription, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { createClient } from "@supabase/supabase-js";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const base =
  process.argv[2]?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  "https://dordoi.help";
const secret =
  process.env.ADMIN_BOOTSTRAP_SECRET?.trim() ||
  process.env.AUTH_REGISTRATION_SECRET?.trim();

if (!secret) {
  console.error("Missing AUTH_REGISTRATION_SECRET");
  process.exit(1);
}

const res = await fetch(`${base.replace(/\/$/, "")}/api/admin/bootstrap-subscriptions`, {
  method: "POST",
  headers: { "x-bootstrap-secret": secret },
});
const body = await res.json().catch(() => ({}));
console.log("bootstrap status:", res.status, body);

if (!res.ok && body.sql) {
  console.log("\n--- Run in Supabase SQL editor if bootstrap failed ---\n");
  console.log(body.sql);
}

const userId = process.argv[3]?.trim() ?? "2340a0de-465c-431a-9c95-438612365482";
const subscriptionId = process.argv[4]?.trim() ?? "2154264";

const apiKey = process.env.LEMON_SQUEEZY_API_KEY?.trim();
if (!apiKey) {
  process.exit(res.ok ? 0 : 1);
}

lemonSqueezySetup({ apiKey });
const response = await getSubscription(subscriptionId);
if (response.error) {
  console.error("getSubscription failed:", response.error);
  process.exit(1);
}

const attrs = response.data?.data.attributes;
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { error } = await admin.from("subscriptions").upsert(
  {
    user_id: userId,
    status: typeof attrs?.status === "string" ? attrs.status : "active",
    variant_id:
      attrs?.variant_id === undefined || attrs?.variant_id === null
        ? null
        : String(attrs.variant_id),
    subscription_id: subscriptionId,
    renews_at: typeof attrs?.renews_at === "string" ? attrs.renews_at : null,
  },
  { onConflict: "user_id" },
);

if (error) {
  console.error("upsert failed:", error.message);
  process.exit(1);
}

console.log("subscription activated for", userId);
