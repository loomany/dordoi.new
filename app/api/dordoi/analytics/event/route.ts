import { NextResponse } from "next/server";
import { z } from "zod";

import { classifyDordoiTrafficChannel } from "@/lib/dordoi/analytics/channel";
import { detectDordoiVisitorStatus } from "@/lib/dordoi/analytics/botDetection";
import { parseDordoiDevice } from "@/lib/dordoi/analytics/device";
import { loadDordoiAdminTelegramEnv } from "@/lib/dordoi/analytics/env";
import { parseDordoiFirstTouch } from "@/lib/dordoi/analytics/firstTouch";
import { getCfCountry, getClientIpFromHeaders, maskIp } from "@/lib/dordoi/analytics/ip";
import { detectDordoiPageType } from "@/lib/dordoi/analytics/pageType";
import {
  buildBuyerRequestDedupeKey,
  buildSellerRegistrationDedupeKey,
  buildVendorApplicationDedupeKey,
  rateLimitBuyerRequestSubmitted,
  rateLimitCta,
  rateLimitFirstVisit,
  rateLimitFirstVisitByVisitor,
  rateLimitSellerRegistrationSubmitted,
  rateLimitVendorApplicationSaved,
  rateLimitVendorModeration,
} from "@/lib/dordoi/analytics/rateLimit";
import { sendDordoiAdminTelegram } from "@/lib/dordoi/analytics/sendDordoiAdminTelegram";
import { formatDordoiAdminAnalyticsHtml } from "@/lib/dordoi/analytics/telegramFormatter";
import { clip } from "@/lib/dordoi/analytics/telegramHtml";
import type { DordoiAnalyticsEventType } from "@/lib/dordoi/analytics/types";

const eventTypeSchema = z.enum([
  "first_visit",
  "catalog_open",
  "seller_profile_view",
  "contact_click",
  "whatsapp_click",
  "telegram_click",
  "phone_click",
  "seller_registration_started",
  "seller_registration_submitted",
  "buyer_request_submitted",
  "vendor_application_saved",
  "vendor_approved",
  "vendor_rejected",
]);

const bodySchema = z
  .object({
    eventType: eventTypeSchema,
    path: z.string().min(1).max(2000),
    search: z.string().max(4000).optional().default(""),
    referrer: z.string().max(2000).optional(),
    locale: z.enum(["ru", "kk", "kg", "uz", "tj"]).optional(),
    sessionId: z.string().min(4).max(200),
    visitorId: z.string().min(4).max(200),
    firstTouch: z.unknown().optional(),
    targetHref: z.string().max(600).optional(),
    targetLabel: z.string().max(200).optional(),
    timestamp: z.string().max(80),
    vendorId: z.string().uuid().optional(),
    applicationId: z.string().uuid().optional(),
    requestId: z.string().max(120).optional(),
    phoneFingerprint: z.string().max(120).optional(),
    storeTitle: z.string().max(200).optional(),
    maskedPhone: z.string().max(40).optional(),
    maskedEmail: z.string().max(80).optional(),
    telegramHint: z.string().max(80).optional(),
    shortNote: z.string().max(200).optional(),
  })
  .strict();

const NO_TELEGRAM_EVENTS: DordoiAnalyticsEventType[] = [
  "catalog_open",
  "seller_profile_view",
  "seller_registration_started",
];

function shouldSendTelegramForEvent(
  eventType: DordoiAnalyticsEventType,
  visitor: ReturnType<typeof detectDordoiVisitorStatus>,
): { send: boolean; skippedReason?: string } {
  if (NO_TELEGRAM_EVENTS.includes(eventType)) {
    return { send: false, skippedReason: "event_not_broadcast_stage1" };
  }
  if (eventType === "first_visit") {
    if (visitor.botCategory === "seo_crawler") {
      return { send: false, skippedReason: "bot_seo_skipped" };
    }
    if (visitor.botCategory === "unknown_bot") {
      return { send: false, skippedReason: "bot_unknown_skipped" };
    }
    if (visitor.botCategory === "suspicious") {
      return { send: false, skippedReason: "bot_suspicious_skipped" };
    }
    if (visitor.isBot && visitor.botCategory !== "search_crawler") {
      return { send: false, skippedReason: "bot_skipped" };
    }
  }
  return { send: true };
}

export async function POST(req: Request) {
  const env = loadDordoiAdminTelegramEnv();
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({
      ok: true,
      sent: false,
      skippedReason: "invalid_json",
    });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({
      ok: true,
      sent: false,
      skippedReason: "validation_error",
    });
  }

  const body = parsed.data;
  const headers = req.headers;
  const ua = headers.get("user-agent") ?? "";
  const visitor = detectDordoiVisitorStatus(ua);
  const firstTouch = parseDordoiFirstTouch(body.firstTouch);
  const headerReferrer = headers.get("referer") ?? headers.get("referrer");

  const channel = classifyDordoiTrafficChannel({
    firstTouch,
    search: body.search,
    referrer: body.referrer ?? null,
    headerReferrer,
  });

  const referrerForTelegram =
    body.referrer?.trim() ||
    headerReferrer?.trim() ||
    firstTouch?.firstReferrer?.trim() ||
    "";

  if (env.debug) {
    console.info("[dordoi-analytics]", body.eventType, body.path, {
      sourceBucket: channel.sourceBucket,
      visitor: visitor.status,
    });
  }

  const decision = shouldSendTelegramForEvent(body.eventType, visitor);
  if (!decision.send) {
    return NextResponse.json({
      ok: true,
      sent: false,
      skippedReason: decision.skippedReason,
    });
  }

  const ipRaw = getClientIpFromHeaders(headers);
  const ipMasked = maskIp(ipRaw);
  const country = getCfCountry(headers);
  const device = parseDordoiDevice(ua);
  const uaShort = clip(ua, 250);
  const pageType = detectDordoiPageType(body.path);

  /* Rate limits */
  if (body.eventType === "first_visit") {
    const vid = body.visitorId?.trim() ?? "";
    const fvOk =
      vid.length >= 8
        ? rateLimitFirstVisitByVisitor(vid)
        : rateLimitFirstVisit(body.sessionId);
    if (!fvOk) {
      return NextResponse.json({
        ok: true,
        sent: false,
        skippedReason: "rate_limited",
      });
    }
  }

  if (
    body.eventType === "contact_click" ||
    body.eventType === "whatsapp_click" ||
    body.eventType === "telegram_click" ||
    body.eventType === "phone_click"
  ) {
    if (!rateLimitCta(body.sessionId, body.eventType, body.targetHref ?? "")) {
      return NextResponse.json({
        ok: true,
        sent: false,
        skippedReason: "rate_limited",
      });
    }
  }

  if (body.eventType === "seller_registration_submitted") {
    const dk = buildSellerRegistrationDedupeKey({
      vendorId: body.vendorId,
      applicationId: body.applicationId,
      sessionId: body.sessionId,
      phoneFingerprint: body.phoneFingerprint,
    });
    if (!rateLimitSellerRegistrationSubmitted(dk)) {
      return NextResponse.json({
        ok: true,
        sent: false,
        skippedReason: "rate_limited",
      });
    }
  }

  if (body.eventType === "buyer_request_submitted") {
    const dk = buildBuyerRequestDedupeKey({
      requestId: body.requestId,
      sessionId: body.sessionId,
    });
    if (!rateLimitBuyerRequestSubmitted(dk)) {
      return NextResponse.json({
        ok: true,
        sent: false,
        skippedReason: "rate_limited",
      });
    }
  }

  if (body.eventType === "vendor_application_saved") {
    let dk = buildVendorApplicationDedupeKey({
      vendorId: body.vendorId,
      applicationId: body.applicationId,
    });
    if (dk === "none") dk = `s:${body.sessionId}`;
    if (!rateLimitVendorApplicationSaved(dk)) {
      return NextResponse.json({
        ok: true,
        sent: false,
        skippedReason: "rate_limited",
      });
    }
  }

  if (body.eventType === "vendor_approved" || body.eventType === "vendor_rejected") {
    if (!body.vendorId) {
      return NextResponse.json({
        ok: true,
        sent: false,
        skippedReason: "missing_vendor_id",
      });
    }
    const st = body.eventType === "vendor_approved" ? "approved" : "rejected";
    if (!rateLimitVendorModeration(body.vendorId, st)) {
      return NextResponse.json({
        ok: true,
        sent: false,
        skippedReason: "rate_limited",
      });
    }
  }

  const html = formatDordoiAdminAnalyticsHtml({
    eventType: body.eventType,
    visitor,
    channel,
    path: body.path,
    pageType,
    locale: body.locale,
    country,
    ipMasked,
    device,
    uaShort,
    sessionId: body.sessionId,
    visitorId: body.visitorId,
    referrerUrl: referrerForTelegram || undefined,
    targetHref: body.targetHref,
    targetLabel: body.targetLabel,
    storeTitle: body.storeTitle,
    maskedPhone: body.maskedPhone,
    maskedEmail: body.maskedEmail,
    telegramHint: body.telegramHint,
    shortNote: body.shortNote,
    vendorId: body.vendorId,
    moderationStatus:
      body.eventType === "vendor_approved"
        ? "approved"
        : body.eventType === "vendor_rejected"
          ? "rejected"
          : undefined,
    firstPath: firstTouch?.firstPath,
  });

  const telegramSendOpts =
    body.eventType === "first_visit"
      ? { reason: "traffic" as const }
      : body.eventType === "vendor_approved" ||
          body.eventType === "vendor_rejected"
        ? { bypassChatMinInterval: true as const, reason: "moderation" as const }
        : { bypassChatMinInterval: true as const, reason: "lead" as const };

  const tg = await sendDordoiAdminTelegram(html, telegramSendOpts);
  if (!tg.sent) {
    return NextResponse.json({
      ok: true,
      sent: false,
      skippedReason: tg.skippedReason ?? "telegram_not_sent",
    });
  }

  return NextResponse.json({ ok: true, sent: true });
}

export function GET() {
  return NextResponse.json({ ok: false, error: "method_not_allowed" }, { status: 405 });
}
