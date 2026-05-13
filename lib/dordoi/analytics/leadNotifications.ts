import "server-only";

import { createHash } from "node:crypto";

import {
  rateLimitSiteRegistrationCompleted,
  rateLimitVendorModeration,
} from "@/lib/dordoi/analytics/rateLimit";
import { sendDordoiAdminTelegram } from "@/lib/dordoi/analytics/sendDordoiAdminTelegram";
import { pathToAdminLocaleDisplay } from "@/lib/dordoi/analytics/telegramFormatter";
import {
  clip,
  escapeTelegramHtml,
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
        ? "✅ Продавец одобрен на Dordoi.help"
        : "⛔ Продавец отклонён на Dordoi.help";

    const html =
      `${head}\n\n` +
      `Vendor: <code>${vid}</code>\n` +
      `Название: ${titleLine}\n` +
      `Категория: ${catLine}\n\n` +
      `Статус: ${statusLine}`;

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

function registrationLocaleDisplay(
  params: DordoiSiteRegistrationNotifyParams,
): string {
  const ref = params.referrerUrl?.trim();
  if (ref) {
    try {
      const pathname = new URL(ref).pathname || "";
      const d = pathToAdminLocaleDisplay(pathname);
      if (d !== "unknown") return d;
    } catch {
      /* ignore */
    }
  }
  const hint = params.localeLabel?.trim();
  if (hint && hint !== "unknown") {
    const d = pathToAdminLocaleDisplay(`/${hint}`);
    if (d !== "unknown") return d;
  }
  return "unknown";
}

function registrationRoleRu(role: string): string {
  if (role === "vendor") return "Продавец";
  if (role === "buyer") return "Покупатель";
  return "—";
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

    const lang = escapeTelegramHtml(registrationLocaleDisplay(params));
    const phoneMasked = escapeTelegramHtml(
      clip(maskPhoneDigitsForAdminTelegram(params.phoneDigits), 80),
    );
    const roleRu = escapeTelegramHtml(registrationRoleRu(params.role));

    const ch = params.attribution?.channel?.trim();
    const camp = params.attribution?.campaign?.trim();
    const channelLine = escapeTelegramHtml(clip(ch || "Unknown", 120));
    const campaignLine = camp
      ? `🎯 Кампания: ${escapeTelegramHtml(clip(camp, 120))}`
      : null;

    const lines = [
      `🆕 Новая регистрация на Dordoi.help`,
      ``,
      `🌐 Язык: ${lang}`,
      `👤 Тип: ${roleRu}`,
      `📞 Телефон: ${phoneMasked}`,
      `📢 Источник: ${channelLine}`,
    ];
    if (campaignLine) lines.push(campaignLine);
    lines.push(``, `Статус: completed`);

    const html = lines.join("\n");

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
