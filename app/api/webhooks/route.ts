import { type NextRequest } from "next/server";

import { handleLemonWebhookPost } from "@/lib/subscription/lemon-webhook-http";

export const runtime = "nodejs";

/** Lemon Squeezy callback URL: `/api/webhooks` */
export async function POST(request: NextRequest) {
  return handleLemonWebhookPost(request);
}
