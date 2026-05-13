/**
 * Demo buyer profiles for `/buyers`.
 * Copy (name, specialization, description, services) lives in messages:
 * `Pages.buyers.cards.<id>.*` — replace with Supabase + same message shape when wired.
 */

export type BuyerCategoryId = "mens" | "textile" | "electronics";

export type BuyerDirectoryRow = {
  id: string;
  category: BuyerCategoryId;
  experienceYears: number;
  /** Display string, e.g. "200+" */
  completedOrdersDisplay: string;
  /** WhatsApp wa.me/{digits} — digits only */
  whatsappDigits: string;
  /** tel:+{digits} — если задан, на live-карточке показываем «Позвонить» */
  phoneDigits?: string;
  /** https://t.me/… — публичный канал или профиль */
  telegramUrl: string;
  /** Профиль или канал в Instagram */
  instagramUrl: string;
  /** Portrait under `public/buyers/` (square PNG/JPEG). */
  photoSrc?: string;
  /** Буквы на аватаре, если нет локального фото. */
  initialsLabel?: string;
  /**
   * Платное место с прямыми контактами (не модалка «слот за $400»).
   * Связанный вендор в каталоге скрыт через `buyer-only-vendor-slugs`.
   */
  liveListing?: boolean;
  /** Slug вендора в БД — для аудита / будущей синхронизации. */
  linkedVendorSlug?: string;
  /** Пустой слот в каталоге — карточка «занять место». */
  openSlot?: boolean;
};

export const BUYERS: BuyerDirectoryRow[] = [
  {
    id: "arailym",
    category: "textile",
    experienceYears: 5,
    completedOrdersDisplay: "200+",
    whatsappDigits: "77029852503",
    phoneDigits: "77029852503",
    telegramUrl: "",
    instagramUrl: "",
    photoSrc: "/buyers/portrait-arailym.png",
    liveListing: true,
  },
  {
    id: "aiperi-zakup",
    category: "textile",
    experienceYears: 6,
    completedOrdersDisplay: "150+",
    whatsappDigits: "996704403480",
    telegramUrl: "",
    instagramUrl: "https://www.instagram.com/dordoi_zakup_aiperi",
    photoSrc: "/buyers/portrait-aiperi.png",
    liveListing: true,
    linkedVendorSlug: "dordoi-zakup-aiperi",
  },
  {
    id: "open-slot-electronics",
    category: "electronics",
    experienceYears: 0,
    completedOrdersDisplay: "—",
    whatsappDigits: "0",
    telegramUrl: "",
    instagramUrl: "",
    openSlot: true,
  },
];
