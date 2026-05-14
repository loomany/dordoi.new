import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export const CATALOG_SUBSCRIPTION_META_KEY = "catalog_subscription";

export type CatalogSubscriptionMeta = {
  status: string;
  subscription_id?: string | null;
  variant_id?: string | null;
  renews_at?: string | null;
  granted_at: string;
};

const ACCESS_STATUSES = new Set(["active"]);

export function isActiveCatalogSubscriptionStatus(status: string | null | undefined): boolean {
  return ACCESS_STATUSES.has((status ?? "").trim());
}

export function readCatalogSubscriptionMeta(
  appMetadata: Record<string, unknown> | null | undefined,
): CatalogSubscriptionMeta | null {
  const raw = appMetadata?.[CATALOG_SUBSCRIPTION_META_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const status = typeof o.status === "string" ? o.status : "";
  if (!status) return null;
  return {
    status,
    subscription_id:
      typeof o.subscription_id === "string" ? o.subscription_id : null,
    variant_id: typeof o.variant_id === "string" ? o.variant_id : null,
    renews_at: typeof o.renews_at === "string" ? o.renews_at : null,
    granted_at:
      typeof o.granted_at === "string" ? o.granted_at : new Date().toISOString(),
  };
}

export async function grantCatalogSubscriptionAccess(input: {
  userId: string;
  status: string;
  subscriptionId?: string | null;
  variantId?: string | null;
  renewsAt?: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  const meta: CatalogSubscriptionMeta = {
    status: input.status,
    subscription_id: input.subscriptionId ?? null,
    variant_id: input.variantId ?? null,
    renews_at: input.renewsAt ?? null,
    granted_at: new Date().toISOString(),
  };

  const { data: userData, error: userErr } = await admin.auth.admin.getUserById(
    input.userId,
  );
  if (userErr) {
    throw userErr;
  }

  const appMetadata = {
    ...(userData.user?.app_metadata ?? {}),
    [CATALOG_SUBSCRIPTION_META_KEY]: meta,
  };

  const { error: authErr } = await admin.auth.admin.updateUserById(input.userId, {
    app_metadata: appMetadata,
  });
  if (authErr) {
    throw authErr;
  }

  const { error: subErr } = await admin.from("subscriptions").upsert(
    {
      user_id: input.userId,
      status: input.status,
      variant_id: input.variantId ?? null,
      subscription_id: input.subscriptionId ?? null,
      renews_at: input.renewsAt ?? null,
    },
    { onConflict: "user_id" },
  );

  if (subErr && !subErr.message.includes("subscriptions")) {
    console.error("[grantCatalogSubscriptionAccess] subscriptions upsert", subErr);
  }
}
