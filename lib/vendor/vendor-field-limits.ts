/**
 * Лимиты полей анкеты (согласованы с `bot/vendor_limits.py`, `CatalogCard`, кабинетом).
 *
 * Карточка каталога (макет):
 *  - заголовок — `store_name`;
 *  - под ним первая строка категории — `categories[0]`;
 *  - блок «Описание поставщика» — `description` (в свёрнутом виде UI режет сильнее).
 */

/** Название магазина в шапке карточки (~1–2 строки на типичном desktop). */
export const STORE_NAME_MAX_CHARS = 48;

/**
 * Краткое описание: жёсткий лимит поля в БД / бот / кабинет.
 * В развёрнутой карточке каталога превью обрезается не длиннее этого значения.
 */
export const DESCRIPTION_CARD_MAX_CHARS = 480;

/**
 * Рекомендуемая длина описания под макет без заметной обрезки в развёрнутой карточке.
 * Жёсткий потолок по-прежнему `DESCRIPTION_CARD_MAX_CHARS`.
 */
export const DESCRIPTION_CARD_RECOMMENDED_CHARS = 300;

/** Одна категория (в т.ч. первая под названием на карточке каталога). */
export const CATEGORY_LABEL_MAX_CHARS = 40;

/** Максимум строк в списке категорий (бот и кабинет). */
export const VENDOR_CATEGORY_LIST_MAX = 10;

/** Свёрнутая карточка каталога — обрезка описания в UI (компактный режим). */
export const CATALOG_CARD_COLLAPSED_DESCRIPTION_MAX_CHARS = 170;

export const DESCRIPTION_DETAIL_MAX_CHARS = 2000;
export const LOCATION_ROW_MAX_CHARS = 512;
export const MIN_BATCH_MAX_CHARS = 256;
export const PAYMENT_MAX_CHARS = 512;
export const CONTACT_FIELD_MAX_CHARS = 512;
export const RETURNS_POLICY_MAX_CHARS = 4000;
export const SAMPLES_NOTE_MAX_CHARS = 2000;
