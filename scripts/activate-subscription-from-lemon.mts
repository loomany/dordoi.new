/**
 * Activate subscription from Lemon Squeezy API (manual fix after missed webhook).
 *   npx tsx scripts/activate-subscription-from-lemon.mts <user_id> <subscription_id>
 */
import { readFileSync } from "node:fs";

import { getSubscription, lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";
import { createClient } from "@supabase/supabase-js";

const CATALOG_SUBSCRIPTION_META_KEY = "catalog_subscription";

for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
}

const userId = process.argv[2]?.trim();
const subscriptionId = process.argv[3]?.trim();
if (!userId || !subscriptionId) {
  console.error(
    "Usage: npx tsx scripts/activate-subscription-from-lemon.mts <user_id> <subscription_id>",
  );
  process.exit(1);
}

const apiKey = process.env.LEMON_SQUEEZY_API_KEY?.trim();
if (!apiKey) {
  console.error("Missing LEMON_SQUEEZY_API_KEY");
  process.exit(1);
}

lemonSqueezySetup({ apiKey });

const response = await getSubscription(subscriptionId);
if (response.error) {
  console.error("getSubscription failed:", response.error);
  process.exit(1);
}

const attrs = response.data?.data.attributes;
const status = typeof attrs?.status === "string" ? attrs.status : "active";
const variantId =
  attrs?.variant_id === undefined || attrs?.variant_id === null
    ? null
    : String(attrs.variant_id);
const renewsAt =
  typeof attrs?.renews_at === "string" ? attrs.renews_at : null;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } },
);

const { data: userData, error: userErr } = await admin.auth.admin.getUserById(
  userId,
);
if (userErr) {
  console.error("getUserById failed:", userErr.message);
  process.exit(1);
}

const meta = {
  status,
  subscription_id: subscriptionId,
  variant_id: variantId,
  renews_at: renewsAt,
  granted_at: new Date().toISOString(),
};

const { error: authErr } = await admin.auth.admin.updateUserById(userId, {
  app_metadata: {
    ...(userData.user?.app_metadata ?? {}),
    [CATALOG_SUBSCRIPTION_META_KEY]: meta,
  },
});

if (authErr) {
  console.error("updateUserById failed:", authErr.message);
  process.exit(1);
}

const { error: subErr } = await admin.from("subscriptions").upsert(
  {
    user_id: userId,
    status,
    variant_id: variantId,
    subscription_id: subscriptionId,
    renews_at: renewsAt,
  },
  { onConflict: "user_id" },
);

if (subErr) {
  console.warn("subscriptions upsert skipped:", subErr.message);
}

console.log("Activated:", { userId, subscriptionId, status, variantId, renewsAt });
