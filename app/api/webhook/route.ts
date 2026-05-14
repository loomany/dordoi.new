import { type NextRequest } from "next/server";

import { handleLemonWebhookPost } from "@/lib/subscription/lemon-webhook-http";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  return handleLemonWebhookPost(request);
}
