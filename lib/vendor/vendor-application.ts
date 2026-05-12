/** Источник строки в vendors: бот или импорт Google Places. */
export type VendorApplicationSource = "telegram" | "google_places";

/** Полные поля заявки для модерации в админке (общий тип для сервера и клиента). */
export type VendorApplicationRecord = {
  id: string;
  store_name: string | null;
  /** Для заявок из Telegram; для google_places может быть null. */
  phone_number: string | null;
  status: string;
  language: string;
  location_row: string | null;
  /** Текст «о магазине» из анкеты (карточка каталога). */
  description: string | null;
  /** Продолжение описания — только внутри профиля / кабинета. */
  description_detail: string | null;
  /** Категории товаров (массив из формы). */
  categories: string[];
  logo_url: string | null;
  container_photo_url: string | null;
  product_photos: string[] | null;
  min_batch: string | null;
  payment_methods: string | null;
  delivery_help: boolean;
  returns_policy: string | null;
  whatsapp_1: string | null;
  whatsapp_2: string | null;
  instagram_url: string | null;
  telegram_url: string | null;
  samples_available: boolean;
  samples_note: string | null;
  created_at: string;
  /** Для заявок из Telegram; для google_places null. */
  telegram_chat_id: number | null;
  application_source: VendorApplicationSource;
  google_place_id: string | null;
  /** Ссылка из Places Search (googleMapsUri). */
  google_maps_uri: string | null;
  moderation_note: string | null;
  quality_flags: string[] | null;
  quality_note: string | null;
  /** Подписчики Instagram (скрипт sync-instagram-profiles). */
  followers_count?: number | null;
  /** URL видео постов (до 15). */
  product_videos?: string[] | null;
};
