/** Полные поля заявки для модерации в админке (общий тип для сервера и клиента). */
export type VendorApplicationRecord = {
  id: string;
  store_name: string | null;
  phone_number: string;
  status: string;
  language: string;
  location_row: string | null;
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
  created_at: string;
  telegram_chat_id: number;
};
