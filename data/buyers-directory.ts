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
  rating: number;
  /** WhatsApp wa.me/{digits} — digits only */
  whatsappDigits: string;
  /** Portrait under `public/` — `/buyers/…` */
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
    rating: 5.0,
    whatsappDigits: "996555010101",
    photoSrc: "/buyers/arman.jpg",
  },
  {
    id: "aisuluu-bakytova",
    category: "textile",
    name: "Айсулuu Бакытова",
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
    rating: 5.0,
    whatsappDigits: "996555020202",
    photoSrc: "/buyers/aisuluu.jpg",
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
    rating: 5.0,
    whatsappDigits: "996555030303",
    photoSrc: "/buyers/daniyar.jpg",
  },
];
