import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const ACCESS_STATUSES = new Set(["active", "on_trial", "past_due"]);

type SubscriptionAccessRow = {
  status: string;
  renews_at: string | null;
};

function hasAccessFromRow(row: SubscriptionAccessRow): boolean {
  if (ACCESS_STATUSES.has(row.status)) {
    return true;
  }
  if (row.status === "cancelled" && row.renews_at) {
    return new Date(row.renews_at).getTime() > Date.now();
  }
  return false;
}

/** Returns true when the user has an active paid catalog subscription. */
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

  if (error) {
    console.error("[checkSubscriptionStatus]", error);
    return false;
  }

  if (!data) {
    return false;
  }

  return hasAccessFromRow(data as SubscriptionAccessRow);
}
