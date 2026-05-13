import "server-only";

import { createHash } from "node:crypto";

import {
  rateLimitSiteRegistrationCompleted,
  rateLimitVendorModeration,
} from "@/lib/dordoi/analytics/rateLimit";
import { sendDordoiAdminTelegram } from "@/lib/dordoi/analytics/sendDordoiAdminTelegram";
import {
  clip,
  escapeTelegramHtml,
  maskEmailForAdminTelegram,
  maskPhoneDigitsForAdminTelegram,
} from "@/lib/dordoi/analytics/telegramHtml";
import type {
  DordoiLeadNotifyResult,
  DordoiSiteRegistrationNotifyParams,
  DordoiVendorModerationNotifyParams,
} from "@/lib/dordoi/analytics/types";

function siteRegistrationDedupeToken(
  params: DordoiSiteRegistrationNotifyParams,
): string {
  const uid = params.userId?.trim();
  if (uid) return uid;
  return `fb:${createHash("sha256").update(`reg|${params.phoneDigits}`).digest("hex").slice(0, 24)}`;
}

function formatCategoryLabel(categories: unknown): string {
  if (categories == null) return "unknown";
  if (Array.isArray(categories)) {
    const s = categories
      .map((x) => String(x).trim())
      .filter(Boolean)
      .join(", ");
    return s.length > 0 ? clip(s, 200) : "unknown";
  }
  if (typeof categories === "string") {
    const s = categories.trim();
    return s.length > 0 ? clip(s, 200) : "unknown";
  }
  try {
    const s = JSON.stringify(categories).trim();
    return s.length > 0 && s !== "null" ? clip(s, 200) : "unknown";
  } catch {
    return "unknown";
  }
}

/**
 * Dordoi admin Telegram: vendor moderation outcome (isolated bot / env).
 * Does not throw; failures are logged and swallowed for callers.
 */
export async function notifyDordoiVendorModerationStatusChanged(
  params: DordoiVendorModerationNotifyParams,
): Promise<DordoiLeadNotifyResult> {
  try {
    if (!rateLimitVendorModeration(params.vendorId, params.status)) {
      return { ok: true, sent: false, skippedReason: "rate_limited" };
    }

    const titleRaw = params.storeTitle?.trim();
    const titleLine = titleRaw
      ? escapeTelegramHtml(clip(titleRaw, 120))
      : escapeTelegramHtml("unknown");

    const catRaw = formatCategoryLabel(params.categories);
    const catLine =
      catRaw === "unknown"
        ? escapeTelegramHtml("unknown")
        : escapeTelegramHtml(catRaw);

    const vid = escapeTelegramHtml(clip(params.vendorId, 80));
    const statusLine = escapeTelegramHtml(params.status);

    const head =
      params.status === "approved"
        ? "<b>Продавец одобрен на Dordoi.help</b>"
        : "<b>Продавец отклонён на Dordoi.help</b>";

    const html =
      `${head}\n\n` +
      `<b>Продавец</b>\n` +
      `Vendor ID: <code>${vid}</code>\n` +
      `Название: ${titleLine}\n` +
      `Категория: ${catLine}\n\n` +
      `<b>Статус</b>\n` +
      statusLine;

    const tg = await sendDordoiAdminTelegram(html);
    if (!tg.sent) {
      return {
        ok: true,
        sent: false,
        skippedReason: tg.skippedReason ?? "telegram_not_sent",
      };
    }
    return { ok: true, sent: true };
  } catch (e) {
    console.error("[notifyDordoiVendorModerationStatusChanged]", e);
    return { ok: true, sent: false, skippedReason: "notify_error" };
  }
}

export async function notifyDordoiVendorApproved(
  args: Omit<DordoiVendorModerationNotifyParams, "status">,
): Promise<DordoiLeadNotifyResult> {
  return notifyDordoiVendorModerationStatusChanged({ ...args, status: "approved" });
}

export async function notifyDordoiVendorRejected(
  args: Omit<DordoiVendorModerationNotifyParams, "status">,
): Promise<DordoiLeadNotifyResult> {
  return notifyDordoiVendorModerationStatusChanged({ ...args, status: "rejected" });
}

/**
 * Dordoi admin Telegram: buyer/site registration completed (DORDOI_ADMIN_TELEGRAM_* only).
 * Does not throw; failures are logged and swallowed.
 */
export async function notifyDordoiSiteRegistrationCompleted(
  params: DordoiSiteRegistrationNotifyParams,
): Promise<DordoiLeadNotifyResult> {
  try {
    const dedupe = siteRegistrationDedupeToken(params);
    if (!rateLimitSiteRegistrationCompleted(dedupe)) {
      return { ok: true, sent: false, skippedReason: "rate_limited" };
    }

    const uid = escapeTelegramHtml(clip(params.userId, 80));
    const emailMasked = escapeTelegramHtml(
      clip(maskEmailForAdminTelegram(params.email), 120),
    );
    const phoneMasked = escapeTelegramHtml(
      clip(maskPhoneDigitsForAdminTelegram(params.phoneDigits), 80),
    );
    const roleLine = escapeTelegramHtml(clip(params.role, 32));
    const localeLine = escapeTelegramHtml(clip(params.localeLabel, 16));

    const ch = params.attribution?.channel?.trim();
    const fp = params.attribution?.firstPage?.trim();
    const camp = params.attribution?.campaign?.trim();
    const channelLine = escapeTelegramHtml(clip(ch || "unknown", 120));
    const firstPageLine = escapeTelegramHtml(clip(fp || "unknown", 300));
    const campaignLine = escapeTelegramHtml(clip(camp || "unknown", 120));

    const html =
      `<b>Новая регистрация на Dordoi.help</b>\n\n` +
      `<b>Пользователь</b>\n` +
      `User ID: <code>${uid}</code>\n` +
      `Email: ${emailMasked}\n` +
      `Phone: ${phoneMasked}\n` +
      `Role/type: ${roleLine}\n\n` +
      `<b>Регистрация</b>\n` +
      `Status: completed\n` +
      `Locale: ${localeLine}\n\n` +
      `<b>Источник</b>\n` +
      `Channel: ${channelLine}\n` +
      `First page: ${firstPageLine}\n` +
      `Campaign: ${campaignLine}`;

    const tg = await sendDordoiAdminTelegram(html);
    if (!tg.sent) {
      return {
        ok: true,
        sent: false,
        skippedReason: tg.skippedReason ?? "telegram_not_sent",
      };
    }
    return { ok: true, sent: true };
  } catch (e) {
    console.error("[notifyDordoiSiteRegistrationCompleted]", e);
    return { ok: true, sent: false, skippedReason: "notify_error" };
  }
}
