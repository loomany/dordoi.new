import "server-only";

import { isDordoiLemonWebhookEvent } from "@/lib/lemonsqueezy/dordoi";
import { notifyDordoiSubscriptionPayment } from "@/lib/dordoi/analytics/leadNotifications";
import { grantCatalogSubscriptionAccess } from "@/lib/subscription/catalog-access-grant";
import {
  isHandledLemonWebhookEvent,
  resolveLemonWebhookSubscription,
} from "@/lib/subscription/resolve-lemon-webhook-subscription";
import {
  resolveUserIdFromWebhookMeta,
  subscriptionUpsertFromAttributes,
} from "@/lib/subscription/upsert-from-webhook";

export type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: unknown;
  };
  data?: {
    id?: string;
    type?: string;
    attributes?: Record<string, unknown>;
  };
};

export type ProcessDordoiLemonWebhookResult =
  | { ok: true; ignored?: false; project: "dordoi" }
  | { ok: true; ignored: true; reason: string }
  | { ok: false; status: number; error: string };

/**
 * Общая обработка Lemon Squeezy для Dordoi (прямой webhook или relay с ScholarshipTop).
 */
export async function processDordoiLemonWebhook(
  payload: LemonWebhookPayload,
): Promise<ProcessDordoiLemonWebhookResult> {
  const eventName = payload.meta?.event_name?.trim() ?? "";
  if (!isHandledLemonWebhookEvent(eventName)) {
    return { ok: true, ignored: true, reason: "unhandled_event" };
  }

  const customData = payload.meta?.custom_data;
  const resolved = await resolveLemonWebhookSubscription(payload);
  if (!resolved) {
    return { ok: false, status: 400, error: "invalid_payload" };
  }

  const { subscriptionId, attributes } = resolved;
  const variantId = attributes.variant_id;

  if (!isDordoiLemonWebhookEvent({ variantId, customData })) {
    return { ok: true, ignored: true, reason: "not_dordoi_variant" };
  }

  const userId = resolveUserIdFromWebhookMeta(customData);
  if (!userId) {
    console.error("[lemonsqueezy/webhook] missing user_id in custom_data", {
      eventName,
      subscriptionId,
      variantId,
    });
    return { ok: false, status: 422, error: "missing_user_id" };
  }

  const row = subscriptionUpsertFromAttributes(userId, subscriptionId, attributes);

  try {
    await grantCatalogSubscriptionAccess({
      userId,
      status: row.status,
      subscriptionId: row.subscriptionId,
      variantId: row.variantId,
      renewsAt: row.renewsAt,
    });
  } catch (e) {
    console.error("[processDordoiLemonWebhook] grant failed", e);
    return { ok: false, status: 500, error: "db_upsert_failed" };
  }

  if (
    eventName === "subscription_created" ||
    eventName === "subscription_payment_success"
  ) {
    void notifyDordoiSubscriptionPayment({
      userId,
      subscriptionId,
      status: row.status,
      variantId: row.variantId,
    }).catch((err) =>
      console.error("[lemonsqueezy/webhook] admin payment notify", err),
    );
  }

  return { ok: true, project: "dordoi" };
}
