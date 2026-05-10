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
};

export const BUYERS: BuyerDirectoryRow[] = [
  {
    id: "arman-saparov",
    category: "mens",
    experienceYears: 5,
    completedOrdersDisplay: "200+",
    whatsappDigits: "996555010101",
    telegramUrl: "https://t.me/dordoi_buyers_arman",
    instagramUrl: "https://www.instagram.com/dordoi.help/",
    photoSrc: "/buyers/portrait-arman.png",
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
