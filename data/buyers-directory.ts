/**
 * Demo buyer profiles for `/buyers`.
 * Replace with Supabase queries — keep shape stable for drop-in mapping.
 */

export type BuyerCategoryId = "mens" | "textile" | "electronics";

export type BuyerProfile = {
  id: string;
  category: BuyerCategoryId;
  name: string;
  specialization: string;
  description: string;
  services: string[];
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

export const BUYERS: BuyerProfile[] = [
  {
    id: "arman-saparov",
    category: "mens",
    name: "Арман Сапаров",
    specialization: "Мужская одежда и Карго в Казахстан",
    description:
      "Специализируюсь на мужском ассортименте и быстрой доставке в Алматы и Астану. Знаю все точки с качественным пошивом.",
    services: [
      "Фотоотчёт по рядам и контейнерам",
      "Выкуп и резерв партии",
      "Консолидация перед отправкой",
      "Карго в Казахстан (Алматы, Астана)",
    ],
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
    name: "Айсулу Бакытова",
    specialization: "Женский текстиль и Проверка брака",
    description:
      "Эксперт по тканям и лекалам. Провожу детальный осмотр каждой партии перед отправкой. Работаю с крупными швейными цехами.",
    services: [
      "Осмотр тканей и фурнитуры",
      "Фото и видео отчёт с размерными листами",
      "Выкуп и сопровождение партии",
      "Контроль брака до отгрузки",
    ],
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
    name: "Данияр Исаков",
    specialization: "Электроника и Опт из Китая",
    description:
      "Поиск гаджетов, аксессуаров и электроники на Джунхае. Прямые контакты с поставщиками из Гуанчжоу через Дордой.",
    services: [
      "Подбор поставщиков под запрос",
      "Переговоры и выкуп мелким/крупным оптом",
      "Инспекция партии на рынке",
      "Консолидация и карго из Бишкека",
    ],
    experienceYears: 4,
    completedOrdersDisplay: "120+",
    whatsappDigits: "996555030303",
    telegramUrl: "https://t.me/dordoi_buyers_daniyar",
    instagramUrl: "https://www.instagram.com/dordoi.help/",
    photoSrc: "/buyers/portrait-daniyar.png",
  },
];
