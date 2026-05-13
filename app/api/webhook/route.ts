import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import { isDordoiLemonWebhookEvent } from "@/lib/lemonsqueezy/dordoi";
import { notifyDordoiSubscriptionPayment } from "@/lib/dordoi/analytics/leadNotifications";
import {
  resolveUserIdFromWebhookMeta,
  subscriptionUpsertFromAttributes,
  upsertSubscriptionRow,
} from "@/lib/subscription/upsert-from-webhook";

export const runtime = "nodejs";

type LemonWebhookPayload = {
  meta?: {
    event_name?: string;
    custom_data?: unknown;
  };
  data?: {
    id?: string;
    attributes?: {
      status?: string;
      variant_id?: number | string;
      renews_at?: string | null;
    };
  };
};

const HANDLED_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
]);

function verifyWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET?.trim();
  if (!secret || !signatureHeader) {
    return false;
  }

  const digest = Buffer.from(
    crypto.createHmac("sha256", secret).update(rawBody).digest("hex"),
    "hex",
  );
  const signature = Buffer.from(signatureHeader, "hex");

  if (digest.length !== signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(digest, signature);
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const eventName = payload.meta?.event_name?.trim() ?? "";
  if (!HANDLED_EVENTS.has(eventName)) {
    return NextResponse.json({ received: true, ignored: true });
  }

  const subscriptionId =
    typeof payload.data?.id === "string" ? payload.data.id.trim() : "";
  const attributes = payload.data?.attributes;
  if (!subscriptionId || !attributes) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const customData = payload.meta?.custom_data;
  const variantId = attributes.variant_id;

  // ScholarshipTop и другие продукты того же магазина — не трогаем subscriptions Dordoi.
  if (!isDordoiLemonWebhookEvent({ variantId, customData })) {
    return NextResponse.json({
      received: true,
      ignored: true,
      reason: "not_dordoi_variant",
    });
  }

  const userId = resolveUserIdFromWebhookMeta(customData);
  if (!userId) {
    console.error("[lemonsqueezy/webhook] missing user_id in custom_data", {
      eventName,
      subscriptionId,
      variantId,
    });
    return NextResponse.json({ error: "missing_user_id" }, { status: 422 });
  }

  const row = subscriptionUpsertFromAttributes(userId, subscriptionId, attributes);

  try {
    await upsertSubscriptionRow(row);
  } catch {
    return NextResponse.json({ error: "db_upsert_failed" }, { status: 500 });
  }

  if (eventName === "subscription_created") {
    void notifyDordoiSubscriptionPayment({
      userId,
      subscriptionId,
      status: row.status,
      variantId: row.variantId,
    }).catch((e) =>
      console.error("[lemonsqueezy/webhook] admin payment notify", e),
    );
  }

  return NextResponse.json({ received: true, project: "dordoi" });
}
