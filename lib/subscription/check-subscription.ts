import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import {
  isActiveCatalogSubscriptionStatus,
  readCatalogSubscriptionMeta,
} from "@/lib/subscription/catalog-access-grant";

type SubscriptionAccessRow = {
  status: string;
  renews_at: string | null;
};

function hasAccessFromRow(row: SubscriptionAccessRow): boolean {
  return isActiveCatalogSubscriptionStatus(row.status);
}

export async function checkSubscriptionStatus(userId: string): Promise<boolean> {
  if (!userId) {
    return false;
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("subscriptions")
    .select("status, renews_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (!error && data) {
    return hasAccessFromRow(data as SubscriptionAccessRow);
  }

  if (error && !error.message.includes("subscriptions")) {
    console.error("[checkSubscriptionStatus]", error);
  }

  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(
    userId,
  );
  if (userErr) {
    console.error("[checkSubscriptionStatus] getUserById", userErr);
    return false;
  }

  const meta = readCatalogSubscriptionMeta(
    (userData.user?.app_metadata ?? null) as Record<string, unknown> | null,
  );
  return isActiveCatalogSubscriptionStatus(meta?.status);
}
