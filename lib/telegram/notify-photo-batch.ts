import "server-only";

import { routing } from "@/i18n/routing";
import { buildVendorReplyKeyboard } from "@/lib/telegram/vendor-keyboard";

function escapeTelegramHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function localeForCatalog(vendorLang: string | null): string {
  const raw = (vendorLang ?? "ru").toLowerCase();
  const locales = routing.locales as readonly string[];
  if (locales.includes(raw)) return raw;
  return routing.defaultLocale;
}

type Common = {
  telegramChatId: number;
  storeName: string | null;
  language: string | null;
  slug: string | null;
};

/** Партия фото одобрена админом — пишем продавцу и снова показываем кнопку загрузки. */
export async function notifyVendorPhotoBatchApproved(
  params: Common & { photoCount: number },
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ?? "";
  if (!token) return;

  const locale = localeForCatalog(params.language);
  const slug = params.slug?.trim() ?? "";
  const cardUrl =
    base && slug
      ? `${base}/${locale}/catalog/${slug}`
      : base
        ? `${base}/${locale}/catalog`
        : null;
  const title = params.storeName?.trim() || "ваш магазин";
  const link = cardUrl
    ? `\n\n➡️ <a href="${cardUrl}">Открыть карточку магазина</a>`
    : "";

  const text =
    `✅ <b>Новая партия фото опубликована</b>\n\n` +
    `${escapeTelegramHtml(String(params.photoCount))} фото добавлены в карточку ` +
    `<b>«${escapeTelegramHtml(title)}»</b> и уже видны покупателям.${link}`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.telegramChatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
      reply_markup: buildVendorReplyKeyboard(),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(
      "[notifyVendorPhotoBatchApproved] Telegram API",
      res.status,
      body,
    );
  }
}

/** Партия фото отклонена админом — мягко объясняем продавцу и оставляем кнопку. */
export async function notifyVendorPhotoBatchRejected(
  params: Common & { reason?: string | null },
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return;

  const reason = params.reason?.trim();
  const reasonBlock = reason
    ? `\n\n<b>Комментарий модератора:</b>\n${escapeTelegramHtml(reason)}`
    : "";

  const text =
    `⚠️ <b>Партия фото отклонена</b>\n\n` +
    `Мы пока не опубликовали загруженные фото. Чаще всего причина — неподходящие или повторяющиеся ` +
    `снимки, плохое освещение или защищённые правами материалы. ` +
    `Подберите другие фото и пришлите новой партией с помощью кнопки ниже.${reasonBlock}`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.telegramChatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_markup: buildVendorReplyKeyboard(),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(
      "[notifyVendorPhotoBatchRejected] Telegram API",
      res.status,
      body,
    );
  }
}
