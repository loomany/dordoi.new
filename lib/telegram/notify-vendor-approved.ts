import "server-only";

import { routing } from "@/i18n/routing";
import { buildVendorReplyKeyboard } from "@/lib/telegram/vendor-keyboard";

/** Экранирование для Telegram HTML (название магазина и т.п.). */
function escapeTelegramHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function localeForCatalog(vendorLang: string | null): string {
  const raw = (vendorLang ?? "ru").toLowerCase();
  const locales = routing.locales as readonly string[];
  if (locales.includes(raw)) {
    return raw;
  }
  return routing.defaultLocale;
}

/**
 * Уведомление продавцу в Telegram после одобрения анкеты (тот же бот, что онбординг).
 * Не бросает ошибку наружу — только лог при сбое API или отсутствии env.
 *
 * Текст устроен как «онбординг-шаг»: сообщает о публикации, объясняет
 * как именно бот будет работать дальше (контакты покупателей, обращения,
 * обновления модерации) и даёт прямую ссылку на карточку в каталоге.
 */
export async function notifyVendorApplicationApproved(params: {
  telegramChatId: number;
  storeName: string | null;
  language: string | null;
  /** SEO-slug карточки в каталоге, если уже сгенерирован (рекомендуется). */
  slug?: string | null;
}): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, "") ?? "";

  if (!token) {
    console.warn(
      "[notifyVendorApplicationApproved] TELEGRAM_BOT_TOKEN не задан — уведомление не отправлено",
    );
    return;
  }
  if (!base) {
    console.warn(
      "[notifyVendorApplicationApproved] NEXT_PUBLIC_APP_URL не задан — уведомление не отправлено",
    );
    return;
  }

  const locale = localeForCatalog(params.language);
  const slug = params.slug?.trim() ?? "";
  const cardUrl = slug
    ? `${base}/${locale}/catalog/${slug}`
    : `${base}/${locale}/catalog`;
  const title = params.storeName?.trim() || "Ваш магазин";

  const text =
    `✅ <b>«${escapeTelegramHtml(title)}» опубликован в каталоге Dordoi.help</b>\n\n` +
    `Карточка магазина теперь доступна покупателям рынка Дордой и оптовикам из СНГ — ` +
    `они могут открыть ваш профиль из поиска и связаться с вами напрямую, без посредников и комиссий.\n\n` +
    `🔔 <b>В этот же чат мы будем присылать:</b>\n` +
    `• контакты покупателей, которые откроют ваш магазин и оставят заявку;\n` +
    `• сообщения и обращения с карточки (WhatsApp / Telegram / Instagram);\n` +
    `• важные обновления по модерации и статусу магазина.\n\n` +
    `➡️ <a href="${cardUrl}">Посмотреть свою карточку</a>`;

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: params.telegramChatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: false,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(
      "[notifyVendorApplicationApproved] Telegram API",
      res.status,
      body,
    );
  }

  // Второе сообщение — короткое + persistent reply-клавиатура
  // с кнопкой «📸 Добавить фото товаров». Покажется под полем ввода
  // в чате продавца и останется там до сброса.
  const followUpRes = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: params.telegramChatId,
        text:
          "🛠 Готовы показать новые товары?\n\n" +
          "Когда появятся свежие позиции, нажмите кнопку ниже — фото отправятся " +
          "на проверку и появятся в карточке. Покупатели любят свежие подборки 👇",
        reply_markup: buildVendorReplyKeyboard(),
      }),
    },
  );

  if (!followUpRes.ok) {
    const body = await followUpRes.text();
    console.error(
      "[notifyVendorApplicationApproved] follow-up keyboard",
      followUpRes.status,
      body,
    );
  }
}
