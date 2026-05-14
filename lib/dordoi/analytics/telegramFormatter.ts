import type {
  DordoiAnalyticsEventType,
  DordoiChannelClassification,
  DordoiDeviceInfo,
  DordoiLocale,
  DordoiVisitorStatus,
} from "@/lib/dordoi/analytics/types";
import { searchQueryLineForTelegram } from "@/lib/dordoi/analytics/channel";
import {
  clip,
  escapeTelegramHtml,
  formatAdminTelegramCampaignLine,
  formatAdminTelegramSourceLine,
} from "@/lib/dordoi/analytics/telegramHtml";

export type DordoiTelegramAnalyticsFormatInput = {
  eventType: DordoiAnalyticsEventType;
  visitor: DordoiVisitorStatus;
  channel: DordoiChannelClassification;
  path: string;
  pageType: string;
  locale?: string;
  country: string;
  ipMasked: string;
  device: DordoiDeviceInfo;
  uaShort: string;
  sessionId: string;
  visitorId: string;
  /** Referrer URL for organic search query extraction (body or header). */
  referrerUrl?: string;
  targetHref?: string;
  targetLabel?: string;
  storeTitle?: string;
  maskedPhone?: string;
  maskedEmail?: string;
  telegramHint?: string;
  shortNote?: string;
  vendorId?: string;
  moderationStatus?: "approved" | "rejected";
  firstPath?: string;
};

const LOCALE_DISPLAY: Record<DordoiLocale, string> = {
  ru: "RU",
  kk: "KZ",
  kg: "KG",
  uz: "UZ",
  tj: "TJ",
};

/** Map URL path prefix → admin display (kk → KZ per product). */
export function pathToAdminLocaleDisplay(path: string): string {
  const m = path.trim().match(/^\/(ru|kk|kg|uz|tj)(?:\/|$)/i);
  if (!m?.[1]) return "unknown";
  const seg = m[1].toLowerCase() as DordoiLocale;
  return LOCALE_DISPLAY[seg] ?? "unknown";
}

function langLine(path: string, locale?: string): string {
  const fromPath = pathToAdminLocaleDisplay(path);
  if (fromPath !== "unknown") {
    return `🌐 Язык: ${escapeTelegramHtml(fromPath)}`;
  }
  if (locale && LOCALE_DISPLAY[locale as DordoiLocale]) {
    return `🌐 Язык: ${escapeTelegramHtml(LOCALE_DISPLAY[locale as DordoiLocale])}`;
  }
  if (locale) {
    return `🌐 Язык: ${escapeTelegramHtml(clip(locale.toUpperCase(), 8))}`;
  }
  return `🌐 Язык: unknown`;
}

function pageLine(path: string): string {
  return `📍 Страница: ${escapeTelegramHtml(clip(path, 500))}`;
}

function countryLine(country: string): string {
  const c = country?.trim() || "unknown";
  return `🌍 Страна: ${escapeTelegramHtml(clip(c.toUpperCase(), 8))}`;
}

function deviceLine(device: DordoiDeviceInfo): string {
  const isMobile = device.device?.toLowerCase().includes("mobile");
  const icon = isMobile ? "📱" : "💻";
  const d = `${device.device} / ${device.browser}`;
  return `${icon} Устройство: ${escapeTelegramHtml(clip(d, 120))}`;
}

function sourceLine(ch: DordoiChannelClassification): string {
  return formatAdminTelegramSourceLine({
    utmSource: ch.utm.source,
    gclidPresent: ch.paidParams.gclidPresent,
    channelLabel: ch.channel,
  });
}

function campaignLine(ch: DordoiChannelClassification): string | null {
  return formatAdminTelegramCampaignLine(ch.utm.campaign);
}

function hotActionLabel(eventType: DordoiAnalyticsEventType): string {
  switch (eventType) {
    case "whatsapp_click":
      return "WhatsApp";
    case "telegram_click":
      return "Telegram";
    case "phone_click":
      return "Телефон";
    case "contact_click":
      return "Контакт";
    default:
      return eventType;
  }
}

export function formatDordoiAdminAnalyticsHtml(
  i: DordoiTelegramAnalyticsFormatInput,
): string {
  const pathE = clip(i.path, 2000);
  const ref = i.referrerUrl?.trim() ?? "";
  const qLine = searchQueryLineForTelegram(ref || null, i.channel.channel);

  if (i.eventType === "first_visit" && i.visitor.botCategory === "search_crawler") {
    const bot = escapeTelegramHtml(clip(i.visitor.botName ?? "bot", 80));
    return (
      `🤖 Поисковый бот на Dordoi.help\n\n` +
      `🤖 Bot: ${bot}\n` +
      `${langLine(i.path, i.locale)}\n` +
      `${pageLine(pathE)}\n` +
      `📢 Тип: Search crawler\n` +
      `${countryLine(i.country)}`
    );
  }

  if (i.eventType === "first_visit") {
    const lines = [
      `👤 Новый визит на Dordoi.help`,
      ``,
      langLine(i.path, i.locale),
      pageLine(pathE),
      sourceLine(i.channel),
    ];
    const camp = campaignLine(i.channel);
    if (camp) lines.push(camp);
    if (qLine.show) {
      lines.push(`🔎 Запрос: ${escapeTelegramHtml(clip(qLine.text, 200))}`);
    }
    lines.push(countryLine(i.country), deviceLine(i.device));
    return lines.join("\n");
  }

  if (
    i.eventType === "contact_click" ||
    i.eventType === "whatsapp_click" ||
    i.eventType === "telegram_click" ||
    i.eventType === "phone_click"
  ) {
    const act = hotActionLabel(i.eventType);
    const lines = [
      `🔥 Горячее действие`,
      ``,
      langLine(i.path, i.locale),
      pageLine(pathE),
      `📲 Действие: ${escapeTelegramHtml(act)}`,
      sourceLine(i.channel),
    ];
    const camp = campaignLine(i.channel);
    if (camp) lines.push(camp);
    if (qLine.show) {
      lines.push(`🔎 Запрос: ${escapeTelegramHtml(clip(qLine.text, 200))}`);
    }
    lines.push(countryLine(i.country), deviceLine(i.device));
    return lines.join("\n");
  }

  if (i.eventType === "seller_registration_submitted") {
    const title = i.storeTitle
      ? escapeTelegramHtml(clip(i.storeTitle, 120))
      : "—";
    const phone = i.maskedPhone
      ? escapeTelegramHtml(clip(i.maskedPhone, 40))
      : "—";
    const tg = i.telegramHint
      ? escapeTelegramHtml(clip(i.telegramHint, 80))
      : "—";
    const lines = [
      `📋 Заявка продавца`,
      ``,
      langLine(i.path, i.locale),
      `🏪 ${title}`,
      `📞 ${phone}`,
      `✈️ ${tg}`,
      sourceLine(i.channel),
    ];
    const camp = campaignLine(i.channel);
    if (camp) lines.push(camp);
    lines.push(`Статус: сохранено`);
    return lines.join("\n");
  }

  if (i.eventType === "buyer_request_submitted") {
    const lines = [
      `🛒 Заявка покупателя`,
      ``,
      langLine(i.path, i.locale),
      `📞 ${i.maskedPhone ? escapeTelegramHtml(clip(i.maskedPhone, 40)) : "—"}`,
      sourceLine(i.channel),
    ];
    const camp = campaignLine(i.channel);
    if (camp) lines.push(camp);
    return lines.join("\n");
  }

  if (i.eventType === "vendor_application_saved") {
    return (
      `📎 Анкета продавца (сайт)\n\n` +
      langLine(i.path, i.locale) +
      `\n` +
      (i.vendorId
        ? `ID: <code>${escapeTelegramHtml(clip(i.vendorId, 80))}</code>\n`
        : "") +
      (i.storeTitle
        ? `🏪 ${escapeTelegramHtml(clip(i.storeTitle, 120))}\n`
        : "") +
      sourceLine(i.channel)
    );
  }

  if (i.eventType === "vendor_approved" || i.eventType === "vendor_rejected") {
    const st = i.moderationStatus ?? "unknown";
    const head =
      st === "approved" ? `✅ Продавец одобрен` : `⛔ Продавец отклонён`;
    return (
      `${head}\n\n` +
      langLine(i.path, i.locale) +
      `\n` +
      (i.vendorId
        ? `ID: <code>${escapeTelegramHtml(clip(i.vendorId, 80))}</code>\n`
        : "") +
      (i.storeTitle
        ? `🏪 ${escapeTelegramHtml(clip(i.storeTitle, 120))}\n`
        : "") +
      `Статус: ${escapeTelegramHtml(st)}`
    );
  }

  return (
    `ℹ️ ${escapeTelegramHtml(i.eventType)}\n` +
    pageLine(pathE) +
    `\n` +
    sourceLine(i.channel)
  );
}
