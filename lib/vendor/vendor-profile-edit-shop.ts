/** Поля анкеты для формы редактирования (клиент + сервер). */
export type VendorProfileEditShop = {
  id: string;
  store_name: string | null;
  location_row: string | null;
  description: string | null;
  description_detail: string | null;
  categories: string[];
  min_batch: string | null;
  payment_methods: string | null;
  delivery_help: boolean;
  whatsapp_1: string | null;
  whatsapp_2: string | null;
  instagram_url: string | null;
  telegram_url: string | null;
  samples_available: boolean;
  samples_note: string | null;
  returns_policy: string | null;
  phone_number: string | null;
  /** Для ослабления валидации WhatsApp при сохранении кандидатов Google Places. */
  application_source?: "telegram" | "google_places";
};
