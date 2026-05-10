import "server-only";

/**
 * Единая reply-клавиатура продавца в Telegram-боте.
 *
 * Содержит persistent reply-кнопку «📸 Добавить фото товаров»: она остаётся
 * под полем ввода после approve анкеты, чтобы продавец мог в любой момент
 * запустить FSM `add_photo_batch` (см. `bot/vendor_handlers.py`).
 *
 * ВАЖНО: текст кнопки используется и здесь (Next.js → Bot API), и в боте
 * (распознавание нажатия). При изменении правьте в обоих местах.
 */
export const VENDOR_ADD_PHOTOS_BUTTON_TEXT = "📸 Добавить фото товаров";

export type TelegramReplyKeyboardMarkup = {
  keyboard: Array<Array<{ text: string }>>;
  resize_keyboard: boolean;
  is_persistent: boolean;
  input_field_placeholder?: string;
};

export function buildVendorReplyKeyboard(): TelegramReplyKeyboardMarkup {
  return {
    keyboard: [[{ text: VENDOR_ADD_PHOTOS_BUTTON_TEXT }]],
    resize_keyboard: true,
    is_persistent: true,
    input_field_placeholder: "Нажмите «Добавить фото товаров» или /start",
  };
}
