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
  /** https://t.me/… — публичный канал или профиль */
  telegramUrl: string;
  /** Профиль или канал в Instagram */
  instagramUrl: string;
  /** Portrait under `public/buyers/` (square PNG/JPEG). */
  photoSrc: string;
  /** Буквы на аватаре, если нет локального фото. */
  initialsLabel?: string;
  /**
   * Платное место с прямыми контактами (не модалка «слот за $400»).
   * Связанный вендор в каталоге скрыт через `buyer-only-vendor-slugs`.
   */
  liveListing?: boolean;
  /** Slug вендора в БД — для аудита / будущей синхронизации. */
  linkedVendorSlug?: string;
};

export const BUYERS: BuyerDirectoryRow[] = [
  {
    id: "aiperi-zakup",
    category: "textile",
    experienceYears: 6,
    completedOrdersDisplay: "150+",
    whatsappDigits: "996704403480",
    telegramUrl: "",
    instagramUrl: "https://www.instagram.com/dordoi_zakup_aiperi",
    photoSrc: "/buyers/portrait-aiperi.png",
    initialsLabel: "A",
    liveListing: true,
    linkedVendorSlug: "dordoi-zakup-aiperi",
  },
  {
    id: "aisuluu-bakytova",
    category: "textile",
    experienceYears: 7,
    completedOrdersDisplay: "350+",
    whatsappDigits: "996555020202",
    telegramUrl: "https://t.me/dordoi_buyers_aisulu",
    instagramUrl: "https://www.instagram.com/dordoi.help/",
    photoSrc: "/buyers/portrait-aisuluu.png",
  },
  {
    id: "daniyar-isakov",
    category: "electronics",
    experienceYears: 4,
    completedOrdersDisplay: "120+",
    whatsappDigits: "996555030303",
    telegramUrl: "https://t.me/dordoi_buyers_daniyar",
    instagramUrl: "https://www.instagram.com/dordoi.help/",
    photoSrc: "/buyers/portrait-daniyar.png",
  },
];
