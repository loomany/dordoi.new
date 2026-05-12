import type {
  DordoiAnalyticsEventType,
  DordoiChannelClassification,
  DordoiDeviceInfo,
  DordoiVisitorStatus,
} from "@/lib/dordoi/analytics/types";
import { clip, escapeTelegramHtml } from "@/lib/dordoi/analytics/telegramHtml";

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
  targetHref?: string;
  targetLabel?: string;
  storeTitle?: string;
  maskedPhone?: string;
  maskedEmail?: string;
  telegramHint?: string;
  shortNote?: string;
  vendorId?: string;
  moderationStatus?: "approved" | "rejected";
  /** Landing path from first-touch (optional). */
  firstPath?: string;
};

function utmLine(ch: DordoiChannelClassification): string {
  const u = ch.utm;
  const parts = [u.source, u.medium, u.campaign, u.content, u.term].map((x) =>
    x ? escapeTelegramHtml(clip(x, 80)) : "—",
  );
  return parts.join(" / ");
}

function clientBlock(i: DordoiTelegramAnalyticsFormatInput): string {
  return (
    `<b>Клиент</b>\n` +
    `Country: ${escapeTelegramHtml(i.country)}\n` +
    `IP: ${escapeTelegramHtml(i.ipMasked)}\n` +
    `Device: ${escapeTelegramHtml(i.device.device)} / ${escapeTelegramHtml(i.device.os)}\n` +
    `Browser: ${escapeTelegramHtml(i.device.browser)}\n` +
    `Bot: ${i.visitor.isBot ? "yes" : "no"}` +
    (i.visitor.botName
      ? ` (${escapeTelegramHtml(clip(i.visitor.botName, 80))})`
      : "")
  );
}

function channelBlock(i: DordoiTelegramAnalyticsFormatInput): string {
  const ch = i.channel;
  return (
    `<b>Канал</b>\n` +
    `${escapeTelegramHtml(ch.channel)}\n` +
    `Reason: ${escapeTelegramHtml(clip(ch.reason, 200))}\n` +
    `UTM: ${utmLine(ch)}\n` +
    `Paid flags: gclid=${ch.paidParams.gclidPresent} gbraid=${ch.paidParams.gbraidPresent} wbraid=${ch.paidParams.wbraidPresent}`
  );
}

export function formatDordoiAdminAnalyticsHtml(
  i: DordoiTelegramAnalyticsFormatInput,
): string {
  const loc = i.locale ? escapeTelegramHtml(i.locale) : "—";
  const pathE = escapeTelegramHtml(clip(i.path, 300));
  const pt = escapeTelegramHtml(clip(i.pageType, 80));
  const sess = escapeTelegramHtml(clip(i.sessionId, 120));
  const vis = escapeTelegramHtml(clip(i.visitorId, 120));
  const ua = escapeTelegramHtml(clip(i.uaShort, 250));

  if (i.eventType === "first_visit") {
    return (
      `<b>Новый визит на Dordoi.help</b>\n` +
      `Статус: ${escapeTelegramHtml(i.visitor.status)}\n\n` +
      `${channelBlock(i)}\n\n` +
      `<b>Страница</b>\n` +
      `Entry: ${pathE}\n` +
      `Page type: ${pt}\n` +
      `Locale: ${loc}\n\n` +
      `${clientBlock(i)}\n\n` +
      `<b>Событие</b>\n` +
      `first_visit\n` +
      `Session: <code>${sess}</code>\n` +
      `Visitor: <code>${vis}</code>\n` +
      `UA: <code>${ua}</code>`
    );
  }

  if (
    i.eventType === "contact_click" ||
    i.eventType === "whatsapp_click" ||
    i.eventType === "telegram_click" ||
    i.eventType === "phone_click"
  ) {
    const th = i.targetHref
      ? escapeTelegramHtml(clip(i.targetHref, 300))
      : "—";
    const tl = i.targetLabel
      ? escapeTelegramHtml(clip(i.targetLabel, 120))
      : "—";
    return (
      `<b>Горячее действие на Dordoi.help</b>\n` +
      `Event: ${escapeTelegramHtml(i.eventType)}\n\n` +
      `<b>Страница</b>\n` +
      `Page: ${pathE}\n` +
      `Page type: ${pt}\n` +
      `Target label: ${tl}\n` +
      `Target: ${th}\n\n` +
      `${channelBlock(i)}\n\n` +
      `${clientBlock(i)}\n\n` +
      `Session: <code>${sess}</code>`
    );
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
    const fp = i.firstPath
      ? escapeTelegramHtml(clip(i.firstPath, 300))
      : "—";
    return (
      `<b>Новая заявка продавца на Dordoi.help</b>\n\n` +
      `<b>Продавец</b>\n` +
      `Название: ${title}\n` +
      `Телефон: ${phone}\n` +
      `Telegram: ${tg}\n` +
      `Заметка: ${i.shortNote ? escapeTelegramHtml(clip(i.shortNote, 120)) : "—"}\n\n` +
      `<b>Источник</b>\n` +
      `${escapeTelegramHtml(i.channel.channel)}\n` +
      `Reason: ${escapeTelegramHtml(clip(i.channel.reason, 200))}\n` +
      `UTM: ${utmLine(i.channel)}\n` +
      `First page: ${fp}\n` +
      `Submit page: ${pathE}\n\n` +
      `${clientBlock(i)}\n\n` +
      `<b>Статус</b>\n` +
      `Заявка сохранена (сервер)\n` +
      `Session: <code>${sess}</code>`
    );
  }

  if (i.eventType === "buyer_request_submitted") {
    const fp = i.firstPath
      ? escapeTelegramHtml(clip(i.firstPath, 300))
      : "—";
    return (
      `<b>Новая заявка покупателя на Dordoi.help</b>\n\n` +
      `<b>Покупатель</b>\n` +
      `Телефон: ${i.maskedPhone ? escapeTelegramHtml(clip(i.maskedPhone, 40)) : "—"}\n` +
      `Telegram: ${i.telegramHint ? escapeTelegramHtml(clip(i.telegramHint, 80)) : "—"}\n` +
      `Запрос: ${i.shortNote ? escapeTelegramHtml(clip(i.shortNote, 120)) : "—"}\n\n` +
      `<b>Источник</b>\n` +
      `${channelBlock(i)}\n` +
      `First page: ${fp}\n` +
      `Submit page: ${pathE}\n\n` +
      `${clientBlock(i)}\n\n` +
      `Session: <code>${sess}</code>`
    );
  }

  if (i.eventType === "vendor_application_saved") {
    return (
      `<b>Анкета продавца сохранена на Dordoi.help</b>\n\n` +
      `Vendor: ${i.vendorId ? `<code>${escapeTelegramHtml(clip(i.vendorId, 80))}</code>` : "—"}\n` +
      `Название: ${i.storeTitle ? escapeTelegramHtml(clip(i.storeTitle, 120)) : "—"}\n\n` +
      `${channelBlock(i)}\n\n` +
      `${clientBlock(i)}`
    );
  }

  if (i.eventType === "vendor_approved" || i.eventType === "vendor_rejected") {
    const st = i.moderationStatus ?? "unknown";
    const head =
      st === "approved"
        ? `<b>Продавец одобрен на Dordoi.help</b>`
        : `<b>Продавец отклонён на Dordoi.help</b>`;
    return (
      `${head}\n\n` +
      `Vendor ID: ${i.vendorId ? `<code>${escapeTelegramHtml(clip(i.vendorId, 80))}</code>` : "—"}\n` +
      `Название: ${i.storeTitle ? escapeTelegramHtml(clip(i.storeTitle, 120)) : "—"}\n` +
      `Статус: ${escapeTelegramHtml(st)}\n\n` +
      `${clientBlock(i)}`
    );
  }

  /* catalog_open, seller_profile_view, seller_registration_started — no Telegram in Stage 1 */
  return (
    `<b>Событие Dordoi.help</b>\n` +
    `${escapeTelegramHtml(i.eventType)}\n` +
    `Path: ${pathE}`
  );
}
