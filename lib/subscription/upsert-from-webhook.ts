import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type LemonSubscriptionAttributes = {
  status?: string;
  variant_id?: number | string;
  renews_at?: string | null;
};

type UpsertSubscriptionInput = {
  userId: string;
  subscriptionId: string;
  status: string;
  variantId: string | null;
  renewsAt: string | null;
};

export function resolveUserIdFromWebhookMeta(
  customData: unknown,
): string | null {
  if (!customData || typeof customData !== "object") {
    return null;
  }
  const record = customData as Record<string, unknown>;
  const userId = record.user_id ?? record.userId;
  return typeof userId === "string" && userId.trim() ? userId.trim() : null;
}

export function subscriptionUpsertFromAttributes(
  userId: string,
  subscriptionId: string,
  attributes: LemonSubscriptionAttributes,
): UpsertSubscriptionInput {
  const variantRaw = attributes.variant_id;
  const variantId =
    variantRaw === undefined || variantRaw === null
      ? null
      : String(variantRaw);

  return {
    userId,
    subscriptionId,
    status: typeof attributes.status === "string" ? attributes.status : "unknown",
    variantId,
    renewsAt:
      typeof attributes.renews_at === "string" ? attributes.renews_at : null,
  };
}

export async function upsertSubscriptionRow(
  input: UpsertSubscriptionInput,
): Promise<void> {
  const admin = createAdminClient();
  const { error } = await admin.from("subscriptions").upsert(
    {
      user_id: input.userId,
      status: input.status,
      variant_id: input.variantId,
      subscription_id: input.subscriptionId,
      renews_at: input.renewsAt,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("[upsertSubscriptionRow]", error);
    throw error;
  }
}
