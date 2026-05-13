import type { RouteLocale } from "@/lib/seo/route-locale";

const CATEGORY_LABELS: Record<
  RouteLocale,
  {
    breadcrumbNav: string;
    breadcrumbHome: string;
    breadcrumbCatalog: string;
    statVendors: (count: number) => string;
    statCategory: string;
    statContact: string;
    vendorPreviewTitle: string;
    vendorPreviewBody: string;
    vendorPreviewBodyEmpty: string;
    vendorPreviewBodyWithVendors: string;
    ctaCatalog: string;
    ctaBuyers: string;
    relatedTitle: string;
    seoTextTitle: string;
    faqTitle: string;
  }
> = {
  ru: {
    breadcrumbNav: "Навигация",
    breadcrumbHome: "Главная",
    breadcrumbCatalog: "Каталог",
    statVendors: (count) => `Найдено поставщиков: ${count}`,
    statCategory: "Категория",
    statContact: "Контакт через сервис",
    vendorPreviewTitle: "Поставщики категории",
    vendorPreviewBody: "",
    vendorPreviewBodyEmpty:
      "Пока в этой категории нет опубликованных поставщиков. Откройте полный каталог или найдите байера.",
    vendorPreviewBodyWithVendors: "До 12 карточек для быстрого просмотра.",
    ctaCatalog: "Открыть каталог",
    ctaBuyers: "Найти байера",
    relatedTitle: "Смежные категории",
    seoTextTitle: "Как выбрать поставщика",
    faqTitle: "Частые вопросы",
  },
  kk: {
    breadcrumbNav: "Навигация",
    breadcrumbHome: "Басты бет",
    breadcrumbCatalog: "Каталог",
    statVendors: (count) => `Табылған жеткізушілер: ${count}`,
    statCategory: "Санат",
    statContact: "Қызмет арқылы байланыс",
    vendorPreviewTitle: "Санат жеткізушілері",
    vendorPreviewBody: "",
    vendorPreviewBodyEmpty:
      "Бұл санатта әлі жарияланған жеткізушілер жоқ. Толық каталогты ашыңыз немесе байер табыңыз.",
    vendorPreviewBodyWithVendors: "Жылдам қарау үшін 12 карточкаға дейін.",
    ctaCatalog: "Каталогты ашу",
    ctaBuyers: "Байер табу",
    relatedTitle: "Қатысты санаттар",
    seoTextTitle: "Жеткізушіні қалай таңдауға болады",
    faqTitle: "Жиі қойылатын сұрақтар",
  },
  kg: {
    breadcrumbNav: "Навигация",
    breadcrumbHome: "Башкы бет",
    breadcrumbCatalog: "Каталог",
    statVendors: (count) => `Табылган жеткирүүчүлөр: ${count}`,
    statCategory: "Категория",
    statContact: "Кызмат аркылуу байланыш",
    vendorPreviewTitle: "Категория жеткирүүчүлөрү",
    vendorPreviewBody: "",
    vendorPreviewBodyEmpty:
      "Бул категорияда азырынча жарыяланган жеткирүүчүлөр жок. Толук каталогду ачыңыз же байер табыңыз.",
    vendorPreviewBodyWithVendors: "Тез көрүү үчүн 12 карточкага чейин.",
    ctaCatalog: "Каталогду ачуу",
    ctaBuyers: "Байер табуу",
    relatedTitle: "Текшел категориялар",
    seoTextTitle: "Жеткирүүчүнү кантип тандоо керек",
    faqTitle: "Көп берилген суроолор",
  },
  uz: {
    breadcrumbNav: "Navigatsiya",
    breadcrumbHome: "Bosh sahifa",
    breadcrumbCatalog: "Katalog",
    statVendors: (count) => `Topilgan yetkazib beruvchilar: ${count}`,
    statCategory: "Toifa",
    statContact: "Xizmat orqali aloqa",
    vendorPreviewTitle: "Toifa yetkazib beruvchilari",
    vendorPreviewBody: "",
    vendorPreviewBodyEmpty:
      "Ushbu toifada hali e'lon qilingan yetkazib beruvchilar yo'q. To'liq katalogni oching yoki xaridor toping.",
    vendorPreviewBodyWithVendors: "Tez ko'rish uchun 12 tagacha karta.",
    ctaCatalog: "Katalogni ochish",
    ctaBuyers: "Xaridor topish",
    relatedTitle: "Bog'liq toifalar",
    seoTextTitle: "Yetkazib beruvchini qanday tanlash mumkin",
    faqTitle: "Tez-tez beriladigan savollar",
  },
  tj: {
    breadcrumbNav: "Навигатсия",
    breadcrumbHome: "Саҳифаи асосӣ",
    breadcrumbCatalog: "Каталог",
    statVendors: (count) => `Таъминкунандагони ёфтшуда: ${count}`,
    statCategory: "Категория",
    statContact: "Тамос тавассути хизмат",
    vendorPreviewTitle: "Таъминкунандагони категория",
    vendorPreviewBody: "",
    vendorPreviewBodyEmpty:
      "Дар ин категория ҳоло таъминкунандагони нашршуда нестанд. Каталоги пурраро кушоед ё харидор ёбед.",
    vendorPreviewBodyWithVendors: "Барои дидани зуд то 12 корт.",
    ctaCatalog: "Каталогро кушодан",
    ctaBuyers: "Харидор ёфтан",
    relatedTitle: "Категорияҳои марбут",
    seoTextTitle: "Чӣ тавр таъминкунандаро интихоб кардан мумкин аст",
    faqTitle: "Саволҳои маъмул",
  },
};

const CORE_LABELS: Record<
  RouteLocale,
  {
    breadcrumbNav: string;
    breadcrumbHome: string;
    ctaCatalog: string;
    ctaBuyers: string;
    ctaCargo: string;
    quickLinksTitle: string;
    quickLinkCatalog: string;
    quickLinkCategories: string;
    quickLinkBuyers: string;
    quickLinkCargo: string;
    faqTitle: string;
  }
> = {
  ru: {
    breadcrumbNav: "Навигация",
    breadcrumbHome: "Главная",
    ctaCatalog: "Открыть каталог",
    ctaBuyers: "Найти байера",
    ctaCargo: "Карго Дордой",
    quickLinksTitle: "Полезные разделы",
    quickLinkCatalog: "Каталог поставщиков",
    quickLinkCategories: "Категории",
    quickLinkBuyers: "Байеры",
    quickLinkCargo: "Карго",
    faqTitle: "Частые вопросы",
  },
  kk: {
    breadcrumbNav: "Навигация",
    breadcrumbHome: "Басты бет",
    ctaCatalog: "Каталогты ашу",
    ctaBuyers: "Байер табу",
    ctaCargo: "Дордой карго",
    quickLinksTitle: "Пайдалы бөлімдер",
    quickLinkCatalog: "Жеткізушілер каталогы",
    quickLinkCategories: "Санаттар",
    quickLinkBuyers: "Байерлер",
    quickLinkCargo: "Карго",
    faqTitle: "Жиі қойылатын сұрақтар",
  },
  kg: {
    breadcrumbNav: "Навигация",
    breadcrumbHome: "Башкы бет",
    ctaCatalog: "Каталогду ачуу",
    ctaBuyers: "Байер табуу",
    ctaCargo: "Дордой карго",
    quickLinksTitle: "Пайдалуу бөлүмдөр",
    quickLinkCatalog: "Жеткирүүчүлөр каталогу",
    quickLinkCategories: "Категориялар",
    quickLinkBuyers: "Байерлер",
    quickLinkCargo: "Карго",
    faqTitle: "Көп берилген суроолор",
  },
  uz: {
    breadcrumbNav: "Navigatsiya",
    breadcrumbHome: "Bosh sahifa",
    ctaCatalog: "Katalogni ochish",
    ctaBuyers: "Xaridor topish",
    ctaCargo: "Dordoy kargo",
    quickLinksTitle: "Foydali bo'limlar",
    quickLinkCatalog: "Yetkazib beruvchilar katalogi",
    quickLinkCategories: "Toifalar",
    quickLinkBuyers: "Xaridorlar",
    quickLinkCargo: "Kargo",
    faqTitle: "Tez-tez beriladigan savollar",
  },
  tj: {
    breadcrumbNav: "Навигатсия",
    breadcrumbHome: "Саҳифаи асосӣ",
    ctaCatalog: "Каталогро кушодан",
    ctaBuyers: "Харидор ёфтан",
    ctaCargo: "Каргои Дордой",
    quickLinksTitle: "Қисмҳои муфид",
    quickLinkCatalog: "Каталоги таъминкунандагон",
    quickLinkCategories: "Категорияҳо",
    quickLinkBuyers: "Харидорҳо",
    quickLinkCargo: "Карго",
    faqTitle: "Саволҳои маъмул",
  },
};

export function seoCategoryPageLabels(locale: RouteLocale) {
  return CATEGORY_LABELS[locale];
}

export function seoCorePageLabels(locale: RouteLocale) {
  return CORE_LABELS[locale];
}
