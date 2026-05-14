import crypto from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

import {
  processDordoiLemonWebhook,
  type LemonWebhookPayload,
} from "@/lib/subscription/process-dordoi-lemon-webhook";

export const runtime = "nodejs";

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

function toResponse(result: Awaited<ReturnType<typeof processDordoiLemonWebhook>>) {
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  if (result.ignored) {
    return NextResponse.json({ received: true, ignored: true, reason: result.reason });
  }
  return NextResponse.json({ received: true, project: result.project });
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

  return toResponse(await processDordoiLemonWebhook(payload));
}
