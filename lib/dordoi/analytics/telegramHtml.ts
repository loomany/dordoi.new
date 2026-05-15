/**
 * Escape for Telegram HTML parse_mode.
 * Per product spec: &, <, >, ", '
 */
export function escapeTelegramHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function clip(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, max) + "…";
}

import { isYandexPaidUtmSource } from "@/lib/dordoi/analytics/channel";

function isPaidUtmMedium(medium: string | null | undefined): boolean {
  const m = medium?.trim().toLowerCase() ?? "";
  return (
    m === "cpc" ||
    m === "ppc" ||
    m === "paid" ||
    m === "paid_search" ||
    m === "paid_social" ||
    m === "ads"
  );
}

export function isYandexDirectAttribution(input: {
  utmSource?: string | null;
  utmMedium?: string | null;
  yclid?: string | null;
  yclidPresent?: boolean;
  channelLabel?: string | null;
}): boolean {
  if (input.channelLabel === "Yandex Ads") return true;
  if (Boolean(input.yclidPresent) || Boolean(input.yclid?.trim())) return true;
  const src = input.utmSource?.trim().toLowerCase() ?? "";
  return isYandexPaidUtmSource(src) && isPaidUtmMedium(input.utmMedium);
}

/** Admin Telegram source line: bold Google Ads / Яндекс Директ when paid attribution matches. */
export function formatAdminTelegramSourceLine(input: {
  utmSource?: string | null;
  utmMedium?: string | null;
  gclid?: string | null;
  gclidPresent?: boolean;
  yclid?: string | null;
  yclidPresent?: boolean;
  channelLabel?: string | null;
}): string {
  const src = input.utmSource?.trim().toLowerCase();
  const hasGclid =
    Boolean(input.gclidPresent) || Boolean(input.gclid?.trim());
  if (src === "google" || hasGclid) {
    return "<b>Источник: Google Ads 🎯</b>";
  }
  if (isYandexDirectAttribution(input)) {
    return "<b>Источник: Яндекс Директ 🎯</b>";
  }
  const label = input.channelLabel?.trim() || "Unknown";
  return `📢 Источник: ${escapeTelegramHtml(clip(label, 120))}`;
}

export function formatAdminTelegramCampaignLine(
  campaign?: string | null,
): string | null {
  const c = campaign?.trim();
  if (!c) return null;
  return `🎯 Кампания: ${escapeTelegramHtml(clip(c, 120))}`;
}

/** Mask email for admin Telegram (plain text; escape when embedding in HTML). */
export function maskEmailForAdminTelegram(raw: string | null | undefined): string {
  const e = raw?.trim() ?? "";
  if (!e) return "—";
  const at = e.lastIndexOf("@");
  if (at <= 0 || at >= e.length - 1) {
    return e.length <= 2 ? "***" : `${e.slice(0, 1)}***`;
  }
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  const head = local.length > 0 ? local.slice(0, 1) : "?";
  return `${head}***@${domain}`;
}

/** Mask stored phone digits (no «+») for admin Telegram; returns e.g. «+7 705 *** ** 64». */
export function maskPhoneDigitsForAdminTelegram(digits: string): string {
  const d = digits.replace(/\D/g, "");
  if (d.length < 8) return "—";
  let cc = "";
  let rest = "";
  if (
    (d.startsWith("996") || d.startsWith("998") || d.startsWith("992")) &&
    d.length >= 12
  ) {
    cc = d.slice(0, 3);
    rest = d.slice(3);
  } else if (d.startsWith("7") && d.length === 11) {
    cc = "7";
    rest = d.slice(1);
  } else {
    return `+${d.slice(0, 2)} ***… ${d.slice(-2)}`;
  }
  if (rest.length < 5) return `+${cc} ***`;
  const head = rest.slice(0, 3);
  const tail = rest.slice(-2);
  return `+${cc} ${head} *** ** ${tail}`;
}
