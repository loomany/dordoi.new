import type { RouteLocale } from "@/lib/seo/route-locale";

const CATEGORY_LABELS: Record<
  RouteLocale,
  {
    breadcrumbNav: string;
    breadcrumbHome: string;
    breadcrumbCatalog: string;
    vendorPreviewTitle: string;
    vendorPreviewBody: string;
    vendorPreviewBodyEmpty: string;
    vendorPreviewBodyWithVendors: (count: number) => string;
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
    vendorPreviewTitle: "Поставщики категории",
    vendorPreviewBody: "",
    vendorPreviewBodyEmpty:
      "Пока в этой категории нет опубликованных поставщиков в каталоге. Откройте полный каталог или найдите байера для помощи с закупкой.",
    vendorPreviewBodyWithVendors: (count) =>
      `В каталоге найдено поставщиков: ${count}. Ниже — до 12 карточек для быстрого просмотра.`,
    ctaCatalog: "Открыть каталог",
    ctaBuyers: "Найти байера",
    relatedTitle: "Смежные категории",
    seoTextTitle: "О закупке в этой категории",
    faqTitle: "Частые вопросы",
  },
  kk: {
    breadcrumbNav: "Навигация",
    breadcrumbHome: "Басты бет",
    breadcrumbCatalog: "Каталог",
    vendorPreviewTitle: "Санат жеткізушілері",
    vendorPreviewBody: "",
    vendorPreviewBodyEmpty:
      "Бұл санатта әлі жарияланған жеткізушілер жоқ. Толық каталогты ашыңыз немесе байер табыңыз.",
    vendorPreviewBodyWithVendors: (count) =>
      `Каталогта жеткізушілер: ${count}. Төменде 12 карточкаға дейін.`,
    ctaCatalog: "Каталогты ашу",
    ctaBuyers: "Байер табу",
    relatedTitle: "Қатысты санаттар",
    seoTextTitle: "Осы санатта сатып алу туралы",
    faqTitle: "Жиі қойылатын сұрақтар",
  },
  kg: {
    breadcrumbNav: "Навигация",
    breadcrumbHome: "Башкы бет",
    breadcrumbCatalog: "Каталог",
    vendorPreviewTitle: "Категория жеткирүүчүлөрү",
    vendorPreviewBody: "",
    vendorPreviewBodyEmpty:
      "Бул категорияда азырынча жарыяланган жеткирүүчүлөр жок. Толук каталогду ачыңыз же байер табыңыз.",
    vendorPreviewBodyWithVendors: (count) =>
      `Каталогдо жеткирүүчүлөр: ${count}. Төмөндө 12 карточкага чейин.`,
    ctaCatalog: "Каталогду ачуу",
    ctaBuyers: "Байер табуу",
    relatedTitle: "Текшел категориялар",
    seoTextTitle: "Бул категорияда сатып алуу жөнүндө",
    faqTitle: "Көп берилген суроолор",
  },
  uz: {
    breadcrumbNav: "Navigatsiya",
    breadcrumbHome: "Bosh sahifa",
    breadcrumbCatalog: "Katalog",
    vendorPreviewTitle: "Toifa yetkazib beruvchilari",
    vendorPreviewBody: "",
    vendorPreviewBodyEmpty:
      "Ushbu toifada hali e'lon qilingan yetkazib beruvchilar yo'q. To'liq katalogni oching yoki xaridor toping.",
    vendorPreviewBodyWithVendors: (count) =>
      `Katalogda yetkazib beruvchilar: ${count}. Quyida 12 tagacha karta.`,
    ctaCatalog: "Katalogni ochish",
    ctaBuyers: "Xaridor topish",
    relatedTitle: "Bog'liq toifalar",
    seoTextTitle: "Ushbu toifada xarid haqida",
    faqTitle: "Tez-tez beriladigan savollar",
  },
  tj: {
    breadcrumbNav: "Навигатсия",
    breadcrumbHome: "Саҳифаи асосӣ",
    breadcrumbCatalog: "Каталог",
    vendorPreviewTitle: "Таъминкунандагони категория",
    vendorPreviewBody: "",
    vendorPreviewBodyEmpty:
      "Дар ин категория ҳоло таъминкунандагони нашршуда нестанд. Каталоги пурраро кушоед ё харидор ёбед.",
    vendorPreviewBodyWithVendors: (count) =>
      `Дар каталог таъминкунандагон: ${count}. Дар поён то 12 корт.`,
    ctaCatalog: "Каталогро кушодан",
    ctaBuyers: "Харидор ёфтан",
    relatedTitle: "Категорияҳои марбут",
    seoTextTitle: "Дар бораи харид дар ин категория",
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
    faqTitle: string;
  }
> = {
  ru: {
    breadcrumbNav: "Навигация",
    breadcrumbHome: "Главная",
    ctaCatalog: "Открыть каталог",
    ctaBuyers: "Найти байера",
    ctaCargo: "Карго Дордой",
    faqTitle: "Частые вопросы",
  },
  kk: {
    breadcrumbNav: "Навигация",
    breadcrumbHome: "Басты бет",
    ctaCatalog: "Каталогты ашу",
    ctaBuyers: "Байер табу",
    ctaCargo: "Дордой карго",
    faqTitle: "Жиі қойылатын сұрақтар",
  },
  kg: {
    breadcrumbNav: "Навигация",
    breadcrumbHome: "Башкы бет",
    ctaCatalog: "Каталогду ачуу",
    ctaBuyers: "Байер табуу",
    ctaCargo: "Дордой карго",
    faqTitle: "Көп берилген суроолор",
  },
  uz: {
    breadcrumbNav: "Navigatsiya",
    breadcrumbHome: "Bosh sahifa",
    ctaCatalog: "Katalogni ochish",
    ctaBuyers: "Xaridor topish",
    ctaCargo: "Dordoy kargo",
    faqTitle: "Tez-tez beriladigan savollar",
  },
  tj: {
    breadcrumbNav: "Навигатсия",
    breadcrumbHome: "Саҳифаи асосӣ",
    ctaCatalog: "Каталогро кушодан",
    ctaBuyers: "Харидор ёфтан",
    ctaCargo: "Каргои Дордой",
    faqTitle: "Саволҳои маъмул",
  },
};

export function seoCategoryPageLabels(locale: RouteLocale) {
  return CATEGORY_LABELS[locale];
}

export function seoCorePageLabels(locale: RouteLocale) {
  return CORE_LABELS[locale];
}
