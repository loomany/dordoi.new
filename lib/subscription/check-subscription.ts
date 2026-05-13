import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const ACCESS_STATUSES = new Set(["active"]);

type SubscriptionAccessRow = {
  status: string;
  renews_at: string | null;
};

function hasAccessFromRow(row: SubscriptionAccessRow): boolean {
  return ACCESS_STATUSES.has(row.status);
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

  if (error) {
    console.error("[checkSubscriptionStatus]", error);
    return false;
  }

  if (!data) {
    return false;
  }

  return hasAccessFromRow(data as SubscriptionAccessRow);
}
