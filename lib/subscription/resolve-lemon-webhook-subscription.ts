import "server-only";

import { getSubscription } from "@lemonsqueezy/lemonsqueezy.js";

import { ensureLemonSqueezyConfigured } from "@/lib/lemonsqueezy/config";

type LemonWebhookPayload = {
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

export type ResolvedLemonSubscription = {
  subscriptionId: string;
  attributes: {
    status?: string;
    variant_id?: number | string;
    renews_at?: string | null;
  };
};

const SUBSCRIPTION_OBJECT_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
]);

const INVOICE_PAYMENT_EVENTS = new Set(["subscription_payment_success"]);

function subscriptionIdFromInvoiceAttributes(
  attributes: Record<string, unknown>,
): string | null {
  const raw = attributes.subscription_id;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return null;
}

async function fetchSubscriptionAttributes(
  subscriptionId: string,
): Promise<ResolvedLemonSubscription["attributes"]> {
  ensureLemonSqueezyConfigured();
  const response = await getSubscription(subscriptionId);
  if (response.error) {
    throw new Error(response.error.message ?? "getSubscription failed");
  }
  const attrs = response.data?.data.attributes;
  return {
    status: typeof attrs?.status === "string" ? attrs.status : "active",
    variant_id: attrs?.variant_id,
    renews_at:
      typeof attrs?.renews_at === "string" ? attrs.renews_at : null,
  };
}

/**
 * Нормализует payload Lemon Squeezy к subscription id + атрибутам для upsert.
 * `subscription_payment_success` несёт invoice в `data`, а не subscription.
 */
export async function resolveLemonWebhookSubscription(
  payload: LemonWebhookPayload,
): Promise<ResolvedLemonSubscription | null> {
  const eventName = payload.meta?.event_name?.trim() ?? "";
  const data = payload.data;
  const attributes = data?.attributes;
  if (!attributes) return null;

  if (SUBSCRIPTION_OBJECT_EVENTS.has(eventName)) {
    const subscriptionId =
      typeof data?.id === "string" ? data.id.trim() : "";
    if (!subscriptionId) return null;
    return { subscriptionId, attributes };
  }

  if (INVOICE_PAYMENT_EVENTS.has(eventName)) {
    const invoiceStatus =
      typeof attributes.status === "string" ? attributes.status : "";
    if (invoiceStatus !== "paid") {
      return null;
    }
    const subscriptionId = subscriptionIdFromInvoiceAttributes(attributes);
    if (!subscriptionId) return null;
    const subAttributes = await fetchSubscriptionAttributes(subscriptionId);
    return { subscriptionId, attributes: subAttributes };
  }

  return null;
}

export function isHandledLemonWebhookEvent(eventName: string): boolean {
  return (
    SUBSCRIPTION_OBJECT_EVENTS.has(eventName) ||
    INVOICE_PAYMENT_EVENTS.has(eventName)
  );
}
