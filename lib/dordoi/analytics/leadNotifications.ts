import "server-only";

import { rateLimitVendorModeration } from "@/lib/dordoi/analytics/rateLimit";
import { sendDordoiAdminTelegram } from "@/lib/dordoi/analytics/sendDordoiAdminTelegram";
import { clip, escapeTelegramHtml } from "@/lib/dordoi/analytics/telegramHtml";
import type {
  DordoiLeadNotifyResult,
  DordoiVendorModerationNotifyParams,
  DordoiVendorModerationNotifyStatus,
} from "@/lib/dordoi/analytics/types";

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
