import { NextResponse, type NextRequest } from "next/server";

import { resolveDordoiProjectFromCustomData } from "@/lib/lemonsqueezy/dordoi";
import {
  processDordoiLemonWebhook,
  type LemonWebhookPayload,
} from "@/lib/subscription/process-dordoi-lemon-webhook";

export const runtime = "nodejs";

function authorizeRelay(request: NextRequest): boolean {
  const secret = process.env.DORDOI_WEBHOOK_RELAY_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("x-dordoi-relay-secret")?.trim();
  return header === secret;
}

/**
 * Relay с ScholarshipTop (`scholarshiptop.com/api/webhooks`):
 * после проверки подписи Lemon на ST — форвард JSON сюда для `custom_data.project === dordoi`.
 */
export async function POST(request: NextRequest) {
  if (!authorizeRelay(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = (await request.json()) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (resolveDordoiProjectFromCustomData(payload.meta?.custom_data) !== "dordoi") {
    return NextResponse.json({
      received: true,
      ignored: true,
      reason: "not_dordoi_project",
    });
  }

  const result = await processDordoiLemonWebhook(payload);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  if (result.ignored) {
    return NextResponse.json({ received: true, ignored: true, reason: result.reason });
  }
  return NextResponse.json({ received: true, project: result.project, via: "relay" });
}
