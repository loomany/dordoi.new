import {
  buildCategoryFaq,
  buildCategoryIntro,
  buildCategorySeoText,
} from "@/lib/catalog/seo-category-content";
import type { RouteLocale } from "@/lib/seo/route-locale";
import { ROUTE_LOCALES } from "@/lib/seo/route-locale";

export type SeoCategoryRoute = {
  id: string;
  priority: "P0" | "P1" | "P2";
  sourceCategoryIds: string[];
  slugsByLocale: Record<RouteLocale, string>;
  titleByLocale: Record<RouteLocale, string>;
  descriptionByLocale: Record<RouteLocale, string>;
  h1ByLocale: Record<RouteLocale, string>;
  introByLocale: Record<RouteLocale, string>;
  categoryNameByLocale: Record<RouteLocale, string>;
  seoTextByLocale: Record<RouteLocale, string[]>;
  faqByLocale: Record<RouteLocale, Array<{ question: string; answer: string }>>;
  relatedCategoryIds: string[];
  indexPolicy: "index" | "noindex_if_empty" | "noindex";
  minVendorsToIndex: number;
  sitemapEnabled: boolean;
};

type LocaleMeta = {
  h1: string;
  title: string;
  description: string;
  categoryName: string;
  categoryNameAcc: string;
};

type CategorySeed = {
  id: string;
  priority: "P0" | "P1" | "P2";
  sourceCategoryIds: string[];
  slugsByLocale: Record<RouteLocale, string>;
  metaByLocale: Record<RouteLocale, LocaleMeta>;
  relatedCategoryIds: string[];
  indexPolicy: "index" | "noindex_if_empty" | "noindex";
  minVendorsToIndex: number;
  sitemapEnabled: boolean;
};

function buildRouteFromSeed(seed: CategorySeed): SeoCategoryRoute {
  const introByLocale = {} as Record<RouteLocale, string>;
  const categoryNameByLocale = {} as Record<RouteLocale, string>;
  const seoTextByLocale = {} as Record<RouteLocale, string[]>;
  const faqByLocale = {} as SeoCategoryRoute["faqByLocale"];
  const titleByLocale = {} as Record<RouteLocale, string>;
  const descriptionByLocale = {} as Record<RouteLocale, string>;
  const h1ByLocale = {} as Record<RouteLocale, string>;

  for (const locale of ROUTE_LOCALES) {
    const meta = seed.metaByLocale[locale];
    h1ByLocale[locale] = meta.h1;
    titleByLocale[locale] = meta.title;
    descriptionByLocale[locale] = meta.description;
    categoryNameByLocale[locale] = meta.categoryName;
    introByLocale[locale] = buildCategoryIntro(
      locale,
      meta.categoryName,
      meta.categoryNameAcc,
    );
    seoTextByLocale[locale] = buildCategorySeoText(
      locale,
      meta.categoryName,
      meta.categoryNameAcc,
    );
    faqByLocale[locale] = buildCategoryFaq(
      locale,
      meta.categoryName,
      meta.categoryNameAcc,
    );
  }

  return {
    id: seed.id,
    priority: seed.priority,
    sourceCategoryIds: seed.sourceCategoryIds,
    slugsByLocale: seed.slugsByLocale,
    titleByLocale,
    descriptionByLocale,
    h1ByLocale,
    introByLocale,
    categoryNameByLocale,
    seoTextByLocale,
    faqByLocale,
    relatedCategoryIds: seed.relatedCategoryIds,
    indexPolicy: seed.indexPolicy,
    minVendorsToIndex: seed.minVendorsToIndex,
    sitemapEnabled: seed.sitemapEnabled,
  };
}

const CATEGORY_SEEDS: CategorySeed[] = [
  {
    id: "womens",
    priority: "P0",
    sourceCategoryIds: ["womens"],
    slugsByLocale: {
      ru: "zhenskaya-odezhda-optom",
      kk: "ayelder-kiimi-koterme",
      kg: "ayaldar-kiyimi-dung",
      uz: "ayollar-kiyimi-ulgurji",
      tj: "libosi-zanona-yaklukht",
    },
    relatedCategoryIds: ["mens", "kids", "underwear-swim", "accessories", "footwear"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Женская одежда оптом на рынке Дордой",
        title: "Женская одежда оптом Дордой — поставщики и продавцы",
        description:
          "Поставщики женской одежды на рынке Дордой: оптовые продавцы, шоурумы и точки продаж. Найдите подходящего поставщика через каталог Dordoi.help.",
        categoryName: "женская одежда",
        categoryNameAcc: "женской одежды",
      },
      kk: {
        h1: "Дордой нарығында әйелдер киімі көтерме",
        title: "Әйелдер киімі көтерме Дордой — жеткізушілер мен сатушылар",
        description:
          "Дордой нарығындағы әйелдер киімі жеткізушілері: көтерме сатушылар мен сату нүктелері. Dordoi.help каталогы арқылы жеткізуші табыңыз.",
        categoryName: "әйелдер киімі",
        categoryNameAcc: "әйелдер киімі",
      },
      kg: {
        h1: "Дордой базарында аялдар кийими оптом",
        title: "Аялдар кийими оптом Дордой — жеткирүүчүлөр жана сатуучулар",
        description:
          "Дордой базарындагы аялдар кийими жеткирүүчүлөрү: опт сатуучулар жана сатуучу чекиттер. Dordoi.help каталогу аркылуу жеткирүүчүнү табыңыз.",
        categoryName: "аялдар кийими",
        categoryNameAcc: "аялдар кийими",
      },
      uz: {
        h1: "Dordoy bozorida ayollar kiyimi ulgurji",
        title: "Ayollar kiyimi ulgurji Dordoy — yetkazib beruvchilar va sotuvchilar",
        description:
          "Dordoy bozoridagi ayollar kiyimi yetkazib beruvchilari: ulgurji sotuvchilar va savdo nuqtalari. Dordoi.help katalogi orqali yetkazib beruvchini toping.",
        categoryName: "ayollar kiyimi",
        categoryNameAcc: "ayollar kiyimi",
      },
      tj: {
        h1: "Либоси занона опт дар бозори Дордой",
        title: "Либоси занона опт Дордой — таъминкунандагон ва фурӯшандагон",
        description:
          "Таъминкунандагони либоси занона дар бозори Дордой: фурӯшандагони оптӣ ва нуқтаҳои фурӯш. Тавассути каталоги Dordoi.help таъминкунандаро пайдо кунед.",
        categoryName: "либоси занона",
        categoryNameAcc: "либоси занона",
      },
    },
  },
  {
    id: "mens",
    priority: "P0",
    sourceCategoryIds: ["mens"],
    slugsByLocale: {
      ru: "muzhskaya-odezhda-optom",
      kk: "erler-kiimi-koterme",
      kg: "erkek-kiyimi-dung",
      uz: "erkaklar-kiyimi-ulgurji",
      tj: "libosi-mardona-opt",
    },
    relatedCategoryIds: ["womens", "footwear", "accessories", "sports-outdoors"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Мужская одежда оптом на рынке Дордой",
        title: "Мужская одежда оптом Дордой — поставщики рынка Дордой",
        description:
          "Каталог поставщиков мужской одежды на рынке Дордой: оптовые продавцы, магазины и точки продаж для закупки товаров в Бишкеке.",
        categoryName: "мужская одежда",
        categoryNameAcc: "мужской одежды",
      },
      kk: {
        h1: "Дордой нарығында ерлер киімі көтерме",
        title: "Ерлер киімі көтерме Дордой — нарық жеткізушілері",
        description:
          "Дордой нарығындағы ерлер киімі жеткізушілері: көтерме сатушылар мен дүкендер.",
        categoryName: "ерлер киімі",
        categoryNameAcc: "ерлер киімі",
      },
      kg: {
        h1: "Дордой базарында эркек кийими оптом",
        title: "Эркек кийими оптом Дордой — базар жеткирүүчүлөрү",
        description:
          "Дордой базарындагы эркек кийими жеткирүүчүлөрү: опт сатуучулар жана дүкөндөр.",
        categoryName: "эркек кийими",
        categoryNameAcc: "эркек кийими",
      },
      uz: {
        h1: "Dordoy bozorida erkaklar kiyimi ulgurji",
        title: "Erkaklar kiyimi ulgurji Dordoy — bozor yetkazib beruvchilari",
        description:
          "Dordoy bozoridagi erkaklar kiyimi yetkazib beruvchilari: ulgurji sotuvchilar va do'konlar.",
        categoryName: "erkaklar kiyimi",
        categoryNameAcc: "erkaklar kiyimi",
      },
      tj: {
        h1: "Либоси мардона опт дар бозори Дордой",
        title: "Либоси мардона опт Дордой — таъминкунандагони бозор",
        description:
          "Таъминкунандагони либоси мардона дар бозори Дордой: фурӯшандагони оптӣ ва мағозаҳо.",
        categoryName: "либоси мардона",
        categoryNameAcc: "либоси мардона",
      },
    },
  },
  {
    id: "kids",
    priority: "P0",
    sourceCategoryIds: ["kids"],
    slugsByLocale: {
      ru: "detskaya-odezhda-optom",
      kk: "balalar-kiimi-koterme",
      kg: "baldar-kiyimi-dung",
      uz: "bolalar-kiyimi-ulgurji",
      tj: "libosi-atfol-opt",
    },
    relatedCategoryIds: ["womens", "mens", "toys-children", "footwear"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Детская одежда оптом на рынке Дордой",
        title: "Детская одежда оптом Дордой — поставщики и продавцы",
        description:
          "Поставщики детской одежды на рынке Дордой: оптовые продавцы, магазины и точки продаж. Подберите поставщика через каталог Dordoi.help.",
        categoryName: "детская одежда",
        categoryNameAcc: "детской одежды",
      },
      kk: {
        h1: "Дордой нарығында балалар киімі көтерме",
        title: "Балалар киімі көтерме Дордой — жеткізушілер мен сатушылар",
        description: "Дордой нарығындағы балалар киімі жеткізушілері.",
        categoryName: "балалар киімі",
        categoryNameAcc: "балалар киімі",
      },
      kg: {
        h1: "Дордой базарында балдар кийими оптом",
        title: "Балдар кийими оптом Дордой — жеткирүүчүлөр жана сатуучулар",
        description: "Дордой базарындагы балдар кийими жеткирүүчүлөрү.",
        categoryName: "балдар кийими",
        categoryNameAcc: "балдар кийими",
      },
      uz: {
        h1: "Dordoy bozorida bolalar kiyimi ulgurji",
        title: "Bolalar kiyimi ulgurji Dordoy — yetkazib beruvchilar va sotuvchilar",
        description: "Dordoy bozoridagi bolalar kiyimi yetkazib beruvchilari.",
        categoryName: "bolalar kiyimi",
        categoryNameAcc: "bolalar kiyimi",
      },
      tj: {
        h1: "Либоси атфол опт дар бозори Дордой",
        title: "Либоси атфол опт Дордой — таъминкунандагон ва фурӯшандагон",
        description: "Таъминкунандагони либоси атфол дар бозори Дордой.",
        categoryName: "либоси атфол",
        categoryNameAcc: "либоси атфол",
      },
    },
  },
  {
    id: "underwear-swim",
    priority: "P0",
    sourceCategoryIds: ["underwear-swim"],
    slugsByLocale: {
      ru: "nizhnee-bele-kupalniki-optom",
      kk: "astyk-kiim-kupalnik-koterme",
      kg: "astyk-kiyim-kupalnik-dung",
      uz: "ichki-kiyim-kupalnik-ulgurji",
      tj: "libosi-zirak-kupalnik-opt",
    },
    relatedCategoryIds: ["womens", "mens", "kids", "home-textiles"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Нижнее бельё и купальники оптом на рынке Дордой",
        title: "Нижнее бельё и купальники оптом Дордой — поставщики",
        description:
          "Оптовые поставщики нижнего белья, купальников и сопутствующих товаров на рынке Дордой. Каталог продавцов для закупки в Бишкеке.",
        categoryName: "нижнее бельё и купальники",
        categoryNameAcc: "нижнего белья и купальников",
      },
      kk: {
        h1: "Дордой нарығында астынғы киім мен купальник көтерме",
        title: "Астынғы киім мен купальник көтерме Дордой — жеткізушілер",
        description: "Дордой нарығындағы астынғы киім мен купальник жеткізушілері.",
        categoryName: "астынғы киім мен купальник",
        categoryNameAcc: "астынғы киім мен купальник",
      },
      kg: {
        h1: "Дордой базарында астык кийим жана купальник оптом",
        title: "Астык кийим жана купальник оптом Дордой — жеткирүүчүлөр",
        description: "Дордой базарындагы астык кийим жана купальник жеткирүүчүлөрү.",
        categoryName: "астык кийим жана купальник",
        categoryNameAcc: "астык кийим жана купальник",
      },
      uz: {
        h1: "Dordoy bozorida ichki kiyim va kupalnik ulgurji",
        title: "Ichki kiyim va kupalnik ulgurji Dordoy — yetkazib beruvchilar",
        description: "Dordoy bozoridagi ichki kiyim va kupalnik yetkazib beruvchilari.",
        categoryName: "ichki kiyim va kupalnik",
        categoryNameAcc: "ichki kiyim va kupalnik",
      },
      tj: {
        h1: "Либоси зирак ва купальник опт дар бозори Дордой",
        title: "Либоси зирак ва купальник опт Дордой — таъминкунандагон",
        description: "Таъминкунандагони либоси зирак ва купальник дар бозори Дордой.",
        categoryName: "либоси зирак ва купальник",
        categoryNameAcc: "либоси зирак ва купальник",
      },
    },
  },
  {
    id: "footwear",
    priority: "P0",
    sourceCategoryIds: ["footwear"],
    slugsByLocale: {
      ru: "obuv-optom",
      kk: "ayak-kiim-koterme",
      kg: "but-kiim-dung",
      uz: "poyabzal-ulgurji",
      tj: "poyafzal-opt",
    },
    relatedCategoryIds: ["womens", "mens", "kids", "bags-leather", "accessories"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Обувь оптом на рынке Дордой",
        title: "Обувь оптом Дордой — поставщики обуви на рынке Дордой",
        description:
          "Поставщики обуви на рынке Дордой: женская, мужская и детская обувь оптом. Найдите продавца через каталог Dordoi.help.",
        categoryName: "обувь",
        categoryNameAcc: "обуви",
      },
      kk: {
        h1: "Дордой нарығында аяқ киім көтерме",
        title: "Аяқ киім көтерме Дордой — аяқ киім жеткізушілері",
        description: "Дордой нарығындағы аяқ киім жеткізушілері.",
        categoryName: "аяқ киім",
        categoryNameAcc: "аяқ киім",
      },
      kg: {
        h1: "Дордой базарында бут кийим оптом",
        title: "Бут кийим оптом Дордой — бут кийим жеткирүүчүлөрү",
        description: "Дордой базарындагы бут кийим жеткирүүчүлөрү.",
        categoryName: "бут кийим",
        categoryNameAcc: "бут кийим",
      },
      uz: {
        h1: "Dordoy bozorida poyabzal ulgurji",
        title: "Poyabzal ulgurji Dordoy — poyabzal yetkazib beruvchilari",
        description: "Dordoy bozoridagi poyabzal yetkazib beruvchilari.",
        categoryName: "poyabzal",
        categoryNameAcc: "poyabzal",
      },
      tj: {
        h1: "Пойафзал опт дар бозори Дордой",
        title: "Пойафзал опт Дордой — таъминкунандагони пойафзал",
        description: "Таъминкунандагони пойафзал дар бозори Дордой.",
        categoryName: "пойафзал",
        categoryNameAcc: "пойафзал",
      },
    },
  },
  {
    id: "bags-leather",
    priority: "P0",
    sourceCategoryIds: ["bags-leather"],
    slugsByLocale: {
      ru: "sumki-kozhgalantereya-optom",
      kk: "sumka-teriden-koterme",
      kg: "sumka-teri-dung",
      uz: "sumka-charm-ulgurji",
      tj: "sumka-charm-opt",
    },
    relatedCategoryIds: ["accessories", "womens", "footwear", "fabrics-notions"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Сумки и кожгалантерея оптом на рынке Дордой",
        title: "Сумки оптом Дордой — поставщики сумок и кожгалантереи",
        description:
          "Каталог поставщиков сумок и кожгалантереи на рынке Дордой: оптовые продавцы, магазины и точки продаж для закупки в Бишкеке.",
        categoryName: "сумки и кожгалантерея",
        categoryNameAcc: "сумок и кожгалантереи",
      },
      kk: {
        h1: "Дордой нарығында сөмке мен тері бұйымдары көтерме",
        title: "Сөмке көтерме Дордой — сөмке жеткізушілері",
        description: "Дордой нарығындағы сөмке мен тері бұйымдары жеткізушілері.",
        categoryName: "сөмке мен тері бұйымдары",
        categoryNameAcc: "сөмке мен тері бұйымдары",
      },
      kg: {
        h1: "Дордой базарында сумка жана тери буюмдары оптом",
        title: "Сумка оптом Дордой — сумка жеткирүүчүлөрү",
        description: "Дордой базарындагы сумка жана тери буюмдары жеткирүүчүлөрү.",
        categoryName: "сумка жана тери буюмдары",
        categoryNameAcc: "сумка жана тери буюмдары",
      },
      uz: {
        h1: "Dordoy bozorida sumka va charm buyumlari ulgurji",
        title: "Sumka ulgurji Dordoy — sumka yetkazib beruvchilari",
        description: "Dordoy bozoridagi sumka va charm buyumlari yetkazib beruvchilari.",
        categoryName: "sumka va charm buyumlari",
        categoryNameAcc: "sumka va charm buyumlari",
      },
      tj: {
        h1: "Сумка ва чарм опт дар бозори Дордой",
        title: "Сумка опт Дордой — таъминкунандагони сумка",
        description: "Таъминкунандагони сумка ва чарм дар бозори Дордой.",
        categoryName: "сумка ва чарм",
        categoryNameAcc: "сумка ва чарм",
      },
    },
  },
  {
    id: "accessories",
    priority: "P0",
    sourceCategoryIds: ["accessories"],
    slugsByLocale: {
      ru: "aksessuary-optom",
      kk: "aksessuar-koterme",
      kg: "aksessuar-dung",
      uz: "aksessuar-ulgurji",
      tj: "aksessuar-opt",
    },
    relatedCategoryIds: ["bags-leather", "womens", "mens", "electronics"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Аксессуары оптом на рынке Дордой",
        title: "Аксессуары оптом Дордой — поставщики рынка Дордой",
        description:
          "Поставщики аксессуаров на рынке Дордой: оптовые продавцы, магазины и точки продаж. Найдите подходящего поставщика через Dordoi.help.",
        categoryName: "аксессуары",
        categoryNameAcc: "аксессуаров",
      },
      kk: {
        h1: "Дордой нарығында аксессуарлар көтерме",
        title: "Аксессуарлар көтерме Дордой — нарық жеткізушілері",
        description: "Дордой нарығындағы аксессуарлар жеткізушілері.",
        categoryName: "аксессуарлар",
        categoryNameAcc: "аксессуарлар",
      },
      kg: {
        h1: "Дордой базарында аксессуарлар оптом",
        title: "Аксессуарлар оптом Дордой — базар жеткирүүчүлөрү",
        description: "Дордой базарындагы аксессуарлар жеткирүүчүлөрү.",
        categoryName: "аксессуарлар",
        categoryNameAcc: "аксессуарлар",
      },
      uz: {
        h1: "Dordoy bozorida aksessuarlar ulgurji",
        title: "Aksessuarlar ulgurji Dordoy — bozor yetkazib beruvchilari",
        description: "Dordoy bozoridagi aksessuarlar yetkazib beruvchilari.",
        categoryName: "aksessuarlar",
        categoryNameAcc: "aksessuarlar",
      },
      tj: {
        h1: "Аксессуарҳо опт дар бозори Дордой",
        title: "Аксессуарҳо опт Дордой — таъминкунандагони бозор",
        description: "Таъминкунандагони аксессуарҳо дар бозори Дордой.",
        categoryName: "аксессуарҳо",
        categoryNameAcc: "аксессуарҳо",
      },
    },
  },
  {
    id: "fabrics-notions",
    priority: "P0",
    sourceCategoryIds: ["fabrics-notions"],
    slugsByLocale: {
      ru: "tkani-shveynaya-furnitura-optom",
      kk: "matamen-shyru-furnitura-koterme",
      kg: "matamen-shyru-furnitura-dung",
      uz: "mato-tikuv-furnitura-ulgurji",
      tj: "matou-furnitura-opt",
    },
    relatedCategoryIds: ["womens", "mens", "home-textiles", "accessories"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Ткани и швейная фурнитура оптом на рынке Дордой",
        title: "Ткани и швейная фурнитура оптом Дордой — поставщики",
        description:
          "Поставщики тканей и швейной фурнитуры на рынке Дордой. Каталог оптовых продавцов для закупки материалов и сопутствующих товаров.",
        categoryName: "ткани и швейная фурнитура",
        categoryNameAcc: "тканей и швейной фурнитуры",
      },
      kk: {
        h1: "Дордой нарығында мата мен тігін фурнитурасы көтерме",
        title: "Мата көтерме Дордой — мата жеткізушілері",
        description: "Дордой нарығындағы мата мен тігін фурнитурасы жеткізушілері.",
        categoryName: "мата мен тігін фурнитурасы",
        categoryNameAcc: "мата мен тігін фурнитурасы",
      },
      kg: {
        h1: "Дордой базарында маталар жана тигүү фурнитурасы оптом",
        title: "Маталар оптом Дордой — мата жеткирүүчүлөрү",
        description: "Дордой базарындагы маталар жана тигүү фурнитурасы жеткирүүчүлөрү.",
        categoryName: "маталар жана тигүү фурнитурасы",
        categoryNameAcc: "маталар жана тигүү фурнитурасы",
      },
      uz: {
        h1: "Dordoy bozorida mato va tikuv furniturasi ulgurji",
        title: "Mato ulgurji Dordoy — mato yetkazib beruvchilari",
        description: "Dordoy bozoridagi mato va tikuv furniturasi yetkazib beruvchilari.",
        categoryName: "mato va tikuv furniturasi",
        categoryNameAcc: "mato va tikuv furniturasi",
      },
      tj: {
        h1: "Матои ва фурнитураи дӯзандагӣ опт дар бозори Дордой",
        title: "Матои опт Дордой — таъминкунандагони мато",
        description: "Таъминкунандагони мато ва фурнитура дар бозори Дордой.",
        categoryName: "матои ва фурнитураи дӯзандагӣ",
        categoryNameAcc: "матои ва фурнитураи дӯзандагӣ",
      },
    },
  },
  {
    id: "home-textiles",
    priority: "P0",
    sourceCategoryIds: ["home-textiles"],
    slugsByLocale: {
      ru: "tekstil-dlya-doma-optom",
      kk: "ui-textili-koterme",
      kg: "ui-textili-dung",
      uz: "uy-tekstili-ulgurji",
      tj: "matoui-hona-opt",
    },
    relatedCategoryIds: ["household", "fabrics-notions", "underwear-swim", "beauty"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Текстиль для дома оптом на рынке Дордой",
        title: "Текстиль для дома оптом Дордой — поставщики",
        description:
          "Поставщики домашнего текстиля на рынке Дордой: постельное бельё, полотенца, текстильные товары и другие позиции оптом.",
        categoryName: "текстиль для дома",
        categoryNameAcc: "текстиля для дома",
      },
      kk: {
        h1: "Дордой нарығында үй текстилі көтерме",
        title: "Үй текстилі көтерме Дордой — жеткізушілер",
        description: "Дордой нарығындағы үй текстилі жеткізушілері.",
        categoryName: "үй текстилі",
        categoryNameAcc: "үй текстилі",
      },
      kg: {
        h1: "Дордой базарында үй текстили оптом",
        title: "Үй текстили оптом Дордой — жеткирүүчүлөр",
        description: "Дордой базарындагы үй текстили жеткирүүчүлөрү.",
        categoryName: "үй текстили",
        categoryNameAcc: "үй текстили",
      },
      uz: {
        h1: "Dordoy bozorida uy tekstili ulgurji",
        title: "Uy tekstili ulgurji Dordoy — yetkazib beruvchilar",
        description: "Dordoy bozoridagi uy tekstili yetkazib beruvchilari.",
        categoryName: "uy tekstili",
        categoryNameAcc: "uy tekstili",
      },
      tj: {
        h1: "Матои хона опт дар бозори Дордой",
        title: "Матои хона опт Дордой — таъминкунандагон",
        description: "Таъминкунандагони матои хона дар бозори Дордой.",
        categoryName: "матои хона",
        categoryNameAcc: "матои хона",
      },
    },
  },
  {
    id: "beauty",
    priority: "P0",
    sourceCategoryIds: ["beauty"],
    slugsByLocale: {
      ru: "kosmetika-parfyumeriya-uhod-optom",
      kk: "kosmetika-parfumeriya-koterme",
      kg: "kosmetika-parfumeriya-dung",
      uz: "kosmetika-parfyumeriya-ulgurji",
      tj: "kosmetika-atir-opt",
    },
    relatedCategoryIds: ["accessories", "home-textiles", "household", "electronics"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Косметика, парфюмерия и уход оптом на рынке Дордой",
        title: "Косметика и парфюмерия оптом Дордой — поставщики",
        description:
          "Поставщики косметики, парфюмерии и товаров для ухода на рынке Дордой. Каталог оптовых продавцов для закупки в Бишкеке.",
        categoryName: "косметика и парфюмерия",
        categoryNameAcc: "косметики и парфюмерии",
      },
      kk: {
        h1: "Дордой нарығында косметика мен парфюмерия көтерме",
        title: "Косметика көтерме Дордой — жеткізушілер",
        description: "Дордой нарығындағы косметика мен парфюмерия жеткізушілері.",
        categoryName: "косметика мен парфюмерия",
        categoryNameAcc: "косметика мен парфюмерия",
      },
      kg: {
        h1: "Дордой базарында косметика жана парфюмерия оптом",
        title: "Косметика оптом Дордой — жеткирүүчүлөр",
        description: "Дордой базарындагы косметика жана парфюмерия жеткирүүчүлөрү.",
        categoryName: "косметика жана парфюмерия",
        categoryNameAcc: "косметика жана парфюмерия",
      },
      uz: {
        h1: "Dordoy bozorida kosmetika va parfyumeriya ulgurji",
        title: "Kosmetika ulgurji Dordoy — yetkazib beruvchilar",
        description: "Dordoy bozoridagi kosmetika va parfyumeriya yetkazib beruvchilari.",
        categoryName: "kosmetika va parfyumeriya",
        categoryNameAcc: "kosmetika va parfyumeriya",
      },
      tj: {
        h1: "Косметика ва атир опт дар бозори Дордой",
        title: "Косметика опт Дордой — таъминкунандагон",
        description: "Таъминкунандагони косметика ва атир дар бозори Дордой.",
        categoryName: "косметика ва атир",
        categoryNameAcc: "косметика ва атир",
      },
    },
  },
  {
    id: "toys-children",
    priority: "P0",
    sourceCategoryIds: ["toys-children"],
    slugsByLocale: {
      ru: "igrushki-tovary-dlya-detey-optom",
      kk: "oyyinshyk-balalar-koterme",
      kg: "oynoochuk-baldar-dung",
      uz: "oyinchoq-bolalar-ulgurji",
      tj: "bozichaho-atfol-opt",
    },
    relatedCategoryIds: ["kids", "household", "sports-outdoors", "electronics"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Игрушки и товары для детей оптом на рынке Дордой",
        title: "Игрушки и товары для детей оптом Дордой — поставщики",
        description:
          "Каталог поставщиков игрушек и детских товаров на рынке Дордой. Найдите оптовых продавцов и точки продаж через Dordoi.help.",
        categoryName: "игрушки и товары для детей",
        categoryNameAcc: "игрушек и товаров для детей",
      },
      kk: {
        h1: "Дордой нарығында ойыншықтар мен балалар тауарлары көтерме",
        title: "Ойыншықтар көтерме Дордой — жеткізушілер",
        description: "Дордой нарығындағы ойыншықтар мен балалар тауарлары жеткізушілері.",
        categoryName: "ойыншықтар мен балалар тауарлары",
        categoryNameAcc: "ойыншықтар мен балалар тауарлары",
      },
      kg: {
        h1: "Дордой базарында оюнчуктар жана балдар товарлары оптом",
        title: "Оюнчуктар оптом Дордой — жеткирүүчүлөр",
        description: "Дордой базарындагы оюнчуктар жана балдар товарлары жеткирүүчүлөрү.",
        categoryName: "оюнчуктар жана балдар товарлары",
        categoryNameAcc: "оюнчуктар жана балдар товарлары",
      },
      uz: {
        h1: "Dordoy bozorida o'yinchoqlar va bolalar tovarlari ulgurji",
        title: "O'yinchoqlar ulgurji Dordoy — yetkazib beruvchilar",
        description: "Dordoy bozoridagi o'yinchoqlar va bolalar tovarlari yetkazib beruvchilari.",
        categoryName: "o'yinchoqlar va bolalar tovarlari",
        categoryNameAcc: "o'yinchoqlar va bolalar tovarlari",
      },
      tj: {
        h1: "Бозичаҳо ва молҳои атфол опт дар бозори Дордой",
        title: "Бозичаҳо опт Дордой — таъминкунандагон",
        description: "Таъминкунандагони бозичаҳо ва молҳои атфол дар бозори Дордой.",
        categoryName: "бозичаҳо ва молҳои атфол",
        categoryNameAcc: "бозичаҳо ва молҳои атфол",
      },
    },
  },
  {
    id: "electronics",
    priority: "P0",
    sourceCategoryIds: ["electronics"],
    slugsByLocale: {
      ru: "elektronika-mobilnye-aksessuary-optom",
      kk: "elektronika-mobil-aksessuar-koterme",
      kg: "elektronika-mobil-aksessuar-dung",
      uz: "elektronika-mobil-aksessuar-ulgurji",
      tj: "elektronika-mobil-aksessuar-opt",
    },
    relatedCategoryIds: ["accessories", "household", "packaging-retail", "sports-outdoors"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Электроника и мобильные аксессуары оптом на рынке Дордой",
        title: "Электроника и мобильные аксессуары оптом Дордой",
        description:
          "Поставщики электроники и мобильных аксессуаров на рынке Дордой: оптовые продавцы, магазины и точки продаж для закупки товаров.",
        categoryName: "электроника и мобильные аксессуары",
        categoryNameAcc: "электроники и мобильных аксессуаров",
      },
      kk: {
        h1: "Дордой нарығында электроника мен мобильді аксессуарлар көтерме",
        title: "Электроника көтерме Дордой — жеткізушілер",
        description: "Дордой нарығындағы электроника мен мобильді аксессуарлар жеткізушілері.",
        categoryName: "электроника мен мобильді аксессуарлар",
        categoryNameAcc: "электроника мен мобильді аксессуарлар",
      },
      kg: {
        h1: "Дордой базарында электроника жана мобилдик аксессуарлар оптом",
        title: "Электроника оптом Дордой — жеткирүүчүлөр",
        description: "Дордой базарындагы электроника жана мобилдик аксессуарлар жеткирүүчүлөрү.",
        categoryName: "электроника жана мобилдик аксессуарлар",
        categoryNameAcc: "электроника жана мобилдик аксессуарлар",
      },
      uz: {
        h1: "Dordoy bozorida elektronika va mobil aksessuarlar ulgurji",
        title: "Elektronika ulgurji Dordoy — yetkazib beruvchilar",
        description: "Dordoy bozoridagi elektronika va mobil aksessuarlar yetkazib beruvchilari.",
        categoryName: "elektronika va mobil aksessuarlar",
        categoryNameAcc: "elektronika va mobil aksessuarlar",
      },
      tj: {
        h1: "Электроника ва аксессуарҳои мобилӣ опт дар бозори Дордой",
        title: "Электроника опт Дордой — таъминкунандагон",
        description: "Таъминкунандагони электроника ва аксессуарҳои мобилӣ дар бозори Дордой.",
        categoryName: "электроника ва аксессуарҳои мобилӣ",
        categoryNameAcc: "электроника ва аксессуарҳои мобилӣ",
      },
    },
  },
  {
    id: "packaging-retail",
    priority: "P0",
    sourceCategoryIds: ["packaging-retail"],
    slugsByLocale: {
      ru: "upakovka-torgovoe-oborudovanie",
      kk: "orau-sauda-zhuymesi-koterme",
      kg: "oroo-sauda-zhuymosu-dung",
      uz: "qadoqlash-savdo-jihozlari",
      tj: "bastebandi-asbob-opt",
    },
    relatedCategoryIds: ["household", "electronics", "fabrics-notions", "beauty"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Упаковка и торговое оборудование для продавцов Дордой",
        title: "Упаковка и торговое оборудование Дордой — поставщики",
        description:
          "Поставщики упаковки и торгового оборудования для продавцов и оптовых покупателей на рынке Дордой в Бишкеке.",
        categoryName: "упаковка и торговое оборудование",
        categoryNameAcc: "упаковки и торгового оборудования",
      },
      kk: {
        h1: "Дордой сатушыларына орау және сауда жабдығы",
        title: "Орау мен сауда жабдығы Дордой — жеткізушілер",
        description: "Дордой нарығындағы орау және сауда жабдығы жеткізушілері.",
        categoryName: "орау және сауда жабдығы",
        categoryNameAcc: "орау және сауда жабдығы",
      },
      kg: {
        h1: "Дордой сатуучулары үчүн ооруу жана соода жабдуусу",
        title: "Ооруу жана соода жабдуусу Дордой — жеткирүүчүлөр",
        description: "Дордой базарындагы ооруу жана соода жабдуусу жеткирүүчүлөрү.",
        categoryName: "ооруу жана соода жабдуусу",
        categoryNameAcc: "ооруу жана соода жабдуусу",
      },
      uz: {
        h1: "Dordoy sotuvchilari uchun qadoqlash va savdo jihozlari",
        title: "Qadoqlash va savdo jihozlari Dordoy — yetkazib beruvchilar",
        description: "Dordoy bozoridagi qadoqlash va savdo jihozlari yetkazib beruvchilari.",
        categoryName: "qadoqlash va savdo jihozlari",
        categoryNameAcc: "qadoqlash va savdo jihozlari",
      },
      tj: {
        h1: "Бастабандӣ ва таҷҳизоти савдо барои фурӯшандагони Дордой",
        title: "Бастабандӣ ва таҷҳизоти савдо Дордой — таъминкунандагон",
        description: "Таъминкунандагони бастабандӣ ва таҷҳизоти савдо дар бозори Дордой.",
        categoryName: "бастабандӣ ва таҷҳизоти савдо",
        categoryNameAcc: "бастабандӣ ва таҷҳизоти савдо",
      },
    },
  },
  {
    id: "household",
    priority: "P0",
    sourceCategoryIds: ["household"],
    slugsByLocale: {
      ru: "tovary-dlya-doma-hoztovary-optom",
      kk: "ui-tauar-turak-koterme",
      kg: "ui-tovar-turak-dung",
      uz: "uy-tovar-xo-jihozlari-ulgurji",
      tj: "mol-hona-opt",
    },
    relatedCategoryIds: ["home-textiles", "packaging-retail", "beauty", "automotive"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Товары для дома и хозтовары оптом на рынке Дордой",
        title: "Товары для дома и хозтовары оптом Дордой — поставщики",
        description:
          "Поставщики товаров для дома и хозтоваров на рынке Дордой. Каталог оптовых продавцов для закупки бытовых товаров в Бишкеке.",
        categoryName: "товары для дома и хозтовары",
        categoryNameAcc: "товаров для дома и хозтоваров",
      },
      kk: {
        h1: "Дордой нарығында үй тауарлары мен тұрмыстық тауарлар көтерме",
        title: "Үй тауарлары көтерме Дордой — жеткізушілер",
        description: "Дордой нарығындағы үй тауарлары мен тұрмыстық тауарлар жеткізушілері.",
        categoryName: "үй тауарлары мен тұрмыстық тауарлар",
        categoryNameAcc: "үй тауарлары мен тұрмыстық тауарлар",
      },
      kg: {
        h1: "Дордой базарында үй товарлары жана турмуштук товарлар оптом",
        title: "Үй товарлары оптом Дордой — жеткирүүчүлөр",
        description: "Дордой базарындагы үй товарлары жана турмуштук товарлар жеткирүүчүлөрү.",
        categoryName: "үй товарлары жана турмуштук товарлар",
        categoryNameAcc: "үй товарлары жана турмуштук товарлар",
      },
      uz: {
        h1: "Dordoy bozorida uy tovarlari va xo'jalik tovarlari ulgurji",
        title: "Uy tovarlari ulgurji Dordoy — yetkazib beruvchilar",
        description: "Dordoy bozoridagi uy tovarlari va xo'jalik tovarlari yetkazib beruvchilari.",
        categoryName: "uy tovarlari va xo'jalik tovarlari",
        categoryNameAcc: "uy tovarlari va xo'jalik tovarlari",
      },
      tj: {
        h1: "Молҳои хона ва хоҷагӣ опт дар бозори Дордой",
        title: "Молҳои хона опт Дордой — таъминкунандагон",
        description: "Таъминкунандагони молҳои хона ва хоҷагӣ дар бозори Дордой.",
        categoryName: "молҳои хона ва хоҷагӣ",
        categoryNameAcc: "молҳои хона ва хоҷагӣ",
      },
    },
  },
  {
    id: "automotive",
    priority: "P0",
    sourceCategoryIds: ["automotive"],
    slugsByLocale: {
      ru: "avtotovary-aksessuary-optom",
      kk: "avto-tauar-aksesuar-koterme",
      kg: "avto-tovar-aksessuar-dung",
      uz: "avtotovar-aksessuar-ulgurji",
      tj: "mol-automobil-opt",
    },
    relatedCategoryIds: ["electronics", "household", "sports-outdoors", "packaging-retail"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Автотовары и аксессуары оптом на рынке Дордой",
        title: "Автотовары и аксессуары оптом Дордой — поставщики",
        description:
          "Поставщики автотоваров и аксессуаров на рынке Дордой: запчасти, автохимия, автозвук. Каталог оптовых продавцов в Бишкеке.",
        categoryName: "автотовары и аксессуары",
        categoryNameAcc: "автотоваров и аксессуаров",
      },
      kk: {
        h1: "Дордой нарығында авто тауарлар мен аксессуарлар көтерме",
        title: "Авто тауарлар көтерме Дордой — жеткізушілер",
        description: "Дордой нарығындағы авто тауарлар мен аксессуарлар жеткізушілері.",
        categoryName: "авто тауарлар мен аксессуарлар",
        categoryNameAcc: "авто тауарлар мен аксессуарлар",
      },
      kg: {
        h1: "Дордой базарында авто товарлар жана аксессуарлар оптом",
        title: "Авто товарлар оптом Дордой — жеткирүүчүлөр",
        description: "Дордой базарындагы авто товарлар жана аксессуарлар жеткирүүчүлөрү.",
        categoryName: "авто товарлар жана аксессуарлар",
        categoryNameAcc: "авто товарлар жана аксессуарлар",
      },
      uz: {
        h1: "Dordoy bozorida avtotovarlar va aksessuarlar ulgurji",
        title: "Avtotovarlar ulgurji Dordoy — yetkazib beruvchilar",
        description: "Dordoy bozoridagi avtotovarlar va aksessuarlar yetkazib beruvchilari.",
        categoryName: "avtotovarlar va aksessuarlar",
        categoryNameAcc: "avtotovarlar va aksessuarlar",
      },
      tj: {
        h1: "Молҳои автомобилӣ ва аксессуарҳо опт дар бозори Дордой",
        title: "Молҳои автомобилӣ опт Дордой — таъминкунандагон",
        description: "Таъминкунандагони молҳои автомобилӣ ва аксессуарҳо дар бозори Дордой.",
        categoryName: "молҳои автомобилӣ ва аксессуарҳо",
        categoryNameAcc: "молҳои автомобилӣ ва аксессуарҳо",
      },
    },
  },
  {
    id: "sports-outdoors",
    priority: "P0",
    sourceCategoryIds: ["sports-outdoors"],
    slugsByLocale: {
      ru: "sport-turizm-otdyh-optom",
      kk: "sport-turizm-demal-koterme",
      kg: "sport-turizm-dem-al-dung",
      uz: "sport-turizm-dam-olish-ulgurji",
      tj: "varzish-sayohat-opt",
    },
    relatedCategoryIds: ["mens", "footwear", "household", "toys-children"],
    indexPolicy: "noindex_if_empty",
    minVendorsToIndex: 1,
    sitemapEnabled: true,
    metaByLocale: {
      ru: {
        h1: "Товары для спорта, туризма и отдыха оптом на рынке Дордой",
        title: "Спорт, туризм и отдых оптом Дордой — поставщики",
        description:
          "Поставщики товаров для спорта, туризма и отдыха на рынке Дордой. Найдите оптовых продавцов через каталог Dordoi.help.",
        categoryName: "спорт, туризм и отдых",
        categoryNameAcc: "товаров для спорта, туризма и отдыха",
      },
      kk: {
        h1: "Дордой нарығында спорт, туризм және демалыс тауарлары көтерме",
        title: "Спорт және туризм көтерме Дордой — жеткізушілер",
        description: "Дордой нарығындағы спорт, туризм және демалыс тауарлары жеткізушілері.",
        categoryName: "спорт, туризм және демалыс",
        categoryNameAcc: "спорт, туризм және демалыс",
      },
      kg: {
        h1: "Дордой базарында спорт, туризм жана эс алуу товарлары оптом",
        title: "Спорт жана туризм оптом Дордой — жеткирүүчүлөр",
        description: "Дордой базарындагы спорт, туризм жана эс алуу товарлары жеткирүүчүлөрү.",
        categoryName: "спорт, туризм жана эс алуу",
        categoryNameAcc: "спорт, туризм жана эс алуу",
      },
      uz: {
        h1: "Dordoy bozorida sport, turizm va dam olish tovarlari ulgurji",
        title: "Sport va turizm ulgurji Dordoy — yetkazib beruvchilar",
        description: "Dordoy bozoridagi sport, turizm va dam olish tovarlari yetkazib beruvchilari.",
        categoryName: "sport, turizm va dam olish",
        categoryNameAcc: "sport, turizm va dam olish",
      },
      tj: {
        h1: "Варзиш, сайёҳат ва истироҳат опт дар бозори Дордой",
        title: "Варзиш ва сайёҳат опт Дордой — таъминкунандагон",
        description: "Таъминкунандагони варзиш, сайёҳат ва истироҳат дар бозори Дордой.",
        categoryName: "варзиш, сайёҳат ва истироҳат",
        categoryNameAcc: "варзиш, сайёҳат ва истироҳат",
      },
    },
  },
];

export const SEO_CATEGORY_ROUTES: SeoCategoryRoute[] =
  CATEGORY_SEEDS.map(buildRouteFromSeed);
