/**
 * Карта поиска Google Places для MVP-каталога (слаги как в CATALOG_CATEGORY_TREE).
 * Подписи синхронизированы с messages/ru.json → catalogCategoryTree.
 */

export type DordoiSubcategorySearchEntry = {
  catalogSubId: string;
  label: string;
  queries: string[];
  allowedPlaceTypes?: string[];
  negativeKeywords?: string[];
};

export type DordoiCategorySearchEntry = {
  catalogMainId: string;
  label: string;
  allowedPlaceTypes: string[];
  negativeKeywords: string[];
  subcategories: Record<string, DordoiSubcategorySearchEntry>;
};

export type DordoiCategorySearchMap = Record<string, DordoiCategorySearchEntry>;

/** Запрещённые типы Places для каталога (фильтр после ответа API). */
export const CATALOG_FORBIDDEN_PLACE_TYPES: ReadonlySet<string> = new Set([
  "moving_company",
  "storage",
  "logistics",
  "courier_service",
  "shipping_service",
  "warehouse",
  "bank",
  "atm",
  "restaurant",
  "cafe",
  "pharmacy",
  "hotel",
  "school",
  "gas_station",
]);

const GLOBAL_NEGATIVE: readonly string[] = [
  "карго",
  "cargo",
  "логистика",
  "logistics",
  "доставка",
  "delivery",
  "shipping",
  "склад",
  "warehouse",
  "банк",
  "bank",
  "atm",
  "кафе",
  "cafe",
  "ресторан",
  "restaurant",
  "pharmacy",
  "hotel",
  "school",
];

const CLOTHING_TYPES = [
  "clothing_store",
  "store",
  "shopping_mall",
  "department_store",
] as const;

const SHOE_TYPES = [
  "shoe_store",
  "store",
  "shopping_mall",
  "department_store",
] as const;

const BAG_ACC_TYPES = [
  "store",
  "clothing_store",
  "shopping_mall",
  "department_store",
] as const;

const FABRIC_TYPES = [
  "store",
  "home_goods_store",
  "clothing_store",
  "shopping_mall",
] as const;

function expandQueries(seeds: readonly string[]): string[] {
  const out: string[] = [];
  for (const s of seeds) {
    out.push(`${s} Бишкек`, `${s} оптом Бишкек`, `${s} Bishkek`, `${s} Дордой`);
  }
  return out;
}

function sub(
  catalogSubId: string,
  label: string,
  seeds: readonly string[],
  extra?: Partial<DordoiSubcategorySearchEntry>,
): DordoiSubcategorySearchEntry {
  return {
    catalogSubId,
    label,
    queries: expandQueries(seeds),
    ...extra,
  };
}

export const DORDOI_CATEGORY_SEARCH_MAP: DordoiCategorySearchMap = {
  womens: {
    catalogMainId: "womens",
    label: "Женская одежда",
    allowedPlaceTypes: [...CLOTHING_TYPES],
    negativeKeywords: [...GLOBAL_NEGATIVE],
    subcategories: {
      "women-outerwear": sub("women-outerwear", "Верхняя одежда (куртки, пальто, пуховики, плащи)", [
        "куртки",
        "пальто",
        "пуховики",
        "верхняя одежда",
        "women outerwear",
      ]),
      "women-dresses": sub("women-dresses", "Платья и сарафаны", [
        "платья",
        "сарафаны",
        "женские платья",
        "women dresses",
        "dresses",
      ]),
      "women-blouses": sub("women-blouses", "Блузки, рубашки, туники", [
        "блузки",
        "рубашки женские",
        "туники",
        "blouses",
      ]),
      "women-sweaters": sub("women-sweaters", "Свитера, кардиганы, водолазки", [
        "свитера",
        "кардиганы",
        "водолазки",
        "sweaters",
      ]),
      "women-pants-shorts": sub("women-pants-shorts", "Брюки, джинсы, шорты", [
        "брюки женские",
        "джинсы женские",
        "шорты женские",
        "pants women",
      ]),
      "women-skirts": sub("women-skirts", "Юбки", ["юбки", "skirts", "women skirts"]),
      "women-tracksuits": sub("women-tracksuits", "Спортивные костюмы", [
        "спортивные костюмы женские",
        "tracksuit women",
      ]),
      "women-loungewear": sub("women-loungewear", "Домашняя одежда (пижамы, халаты)", [
        "пижамы",
        "халаты",
        "домашняя одежда",
        "loungewear",
      ]),
      "women-plus-size": sub("women-plus-size", "Одежда больших размеров (Plus Size)", [
        "plus size",
        "большие размеры",
        "женская одежда больших размеров",
      ]),
      "women-muslim": sub("women-muslim", "Мусульманская одежда (абаи, хиджабы)", [
        "хиджаб",
        "абайя",
        "мусульманская одежда",
        "islamic clothing",
      ]),
    },
  },
  mens: {
    catalogMainId: "mens",
    label: "Мужская одежда",
    allowedPlaceTypes: [...CLOTHING_TYPES],
    negativeKeywords: [...GLOBAL_NEGATIVE],
    subcategories: {
      "men-outerwear": sub("men-outerwear", "Верхняя одежда (куртки, ветровки, пальто)", [
        "куртки мужские",
        "ветровки",
        "пальто мужское",
        "mens outerwear",
      ]),
      "men-suits": sub("men-suits", "Классические костюмы и пиджаки", [
        "костюмы мужские",
        "пиджаки",
        "suits men",
      ]),
      "men-shirts": sub("men-shirts", "Рубашки (классика и casual)", [
        "рубашки мужские",
        "mens shirts",
      ]),
      "men-hoodies": sub("men-hoodies", "Толстовки, худи, свитшоты", [
        "худи",
        "толстовки",
        "свитшоты",
        "hoodies",
      ]),
      "men-pants-jeans": sub("men-pants-jeans", "Джинсы и брюки", [
        "джинсы мужские",
        "брюки мужские",
        "mens jeans",
      ]),
      "men-sportswear": sub("men-sportswear", "Спортивная одежда", [
        "спортивная одежда мужская",
        "mens sportswear",
      ]),
      "men-tshirts-polo": sub("men-tshirts-polo", "Футболки и поло", [
        "футболки мужские",
        "поло",
        "tshirt men",
      ]),
    },
  },
  kids: {
    catalogMainId: "kids",
    label: "Детская одежда",
    allowedPlaceTypes: [...CLOTHING_TYPES],
    negativeKeywords: [...GLOBAL_NEGATIVE],
    subcategories: {
      "kids-newborn": sub("kids-newborn", "Одежда для новорожденных (до 1 года)", [
        "одежда новорожденным",
        "baby clothes",
      ]),
      "kids-girls": sub("kids-girls", "Одежда для девочек", [
        "одежда для девочек",
        "girls clothing",
      ]),
      "kids-boys": sub("kids-boys", "Одежда для мальчиков", [
        "одежда для мальчиков",
        "boys clothing",
      ]),
      "kids-school-uniform": sub("kids-school-uniform", "Школьная форма", [
        "школьная форма",
        "school uniform",
      ]),
      "kids-teens": sub("kids-teens", "Подростковая одежда", [
        "подростковая одежда",
        "teen clothing",
      ]),
      "kids-outerwear": sub("kids-outerwear", "Детская верхняя одежда", [
        "детские куртки",
        "kids outerwear",
      ]),
    },
  },
  "underwear-swim": {
    catalogMainId: "underwear-swim",
    label: "Нижнее белье и купальники",
    allowedPlaceTypes: [...CLOTHING_TYPES],
    negativeKeywords: [...GLOBAL_NEGATIVE],
    subcategories: {
      "uw-women": sub("uw-women", "Женское нижнее белье (комплекты, бюстгальтеры, трусы)", [
        "нижнее белье женское",
        "women underwear",
      ]),
      "uw-men": sub("uw-men", "Мужское нижнее белье", [
        "нижнее белье мужское",
        "men underwear",
      ]),
      "uw-kids": sub("uw-kids", "Детское нижнее белье", ["детское нижнее белье"]),
      "uw-swimwear": sub("uw-swimwear", "Купальники и плавки", [
        "купальники",
        "плавки",
        "swimwear",
      ]),
      "uw-hosiery": sub("uw-hosiery", "Чулочно-носочные изделия (носки, колготки, следки)", [
        "носки",
        "колготки",
        "hosiery",
      ]),
      "uw-shape-thermal": sub("uw-shape-thermal", "Корректирующее и термобелье", [
        "термобелье",
        "shapewear",
      ]),
    },
  },
  footwear: {
    catalogMainId: "footwear",
    label: "Обувь",
    allowedPlaceTypes: [...SHOE_TYPES],
    negativeKeywords: [...GLOBAL_NEGATIVE],
    subcategories: {
      "shoes-women": sub("shoes-women", "Женская обувь (туфли, сапоги, босоножки)", [
        "женская обувь",
        "туфли",
        "сапоги",
        "womens shoes",
      ]),
      "shoes-men": sub("shoes-men", "Мужская обувь (ботинки, туфли, мокасины)", [
        "мужская обувь",
        "ботинки",
        "mens shoes",
      ]),
      "shoes-kids": sub("shoes-kids", "Детская обувь", ["детская обувь", "kids shoes"]),
      "shoes-sports": sub("shoes-sports", "Спортивная обувь (кроссовки, кеды)", [
        "кроссовки",
        "кеды",
        "sneakers",
      ]),
      "shoes-home-beach": sub("shoes-home-beach", "Домашняя и пляжная обувь (тапочки, сланцы)", [
        "тапочки",
        "сланцы",
        "flip flops",
      ]),
      "shoes-special": sub("shoes-special", "Спецобувь и тактическая обувь", [
        "спецобувь",
        "тактическая обувь",
      ]),
    },
  },
  "bags-leather": {
    catalogMainId: "bags-leather",
    label: "Сумки и кожгалантерея",
    allowedPlaceTypes: [...BAG_ACC_TYPES],
    negativeKeywords: [...GLOBAL_NEGATIVE],
    subcategories: {
      "bags-women": sub("bags-women", "Женские сумки и клатчи", [
        "сумки женские",
        "клатч",
        "womens bags",
      ]),
      "bags-men": sub("bags-men", "Мужские сумки и портфели", [
        "сумки мужские",
        "портфель",
        "mens bags",
      ]),
      "bags-backpacks": sub("bags-backpacks", "Рюкзаки (городские, школьные, спортивные)", [
        "рюкзак",
        "backpack",
      ]),
      "bags-wallets": sub("bags-wallets", "Кошельки, портмоне, визитницы", [
        "кошелек",
        "wallet",
      ]),
      "bags-belts": sub("bags-belts", "Ремни и пояса", ["ремень", "belt", "кожаный ремень"]),
      "bags-travel": sub("bags-travel", "Дорожные сумки и чемоданы", [
        "чемодан",
        "дорожная сумка",
        "luggage",
      ]),
    },
  },
  accessories: {
    catalogMainId: "accessories",
    label: "Аксессуары",
    allowedPlaceTypes: [...BAG_ACC_TYPES],
    negativeKeywords: [...GLOBAL_NEGATIVE],
    subcategories: {
      "acc-headwear": sub("acc-headwear", "Головные уборы (шапки, кепки, панамы)", [
        "шапки",
        "кепки",
        "hat",
      ]),
      "acc-scarves": sub("acc-scarves", "Шарфы, платки, палантины", ["шарф", "платок", "scarf"]),
      "acc-gloves": sub("acc-gloves", "Перчатки и варежки", ["перчатки", "варежки", "gloves"]),
      "acc-sunglasses": sub("acc-sunglasses", "Солнцезащитные и имиджевые очки", [
        "очки",
        "sunglasses",
      ]),
      "acc-hair-jewelry": sub("acc-hair-jewelry", "Бижутерия и украшения для волос", [
        "бижутерия",
        "jewelry fashion",
      ]),
      "acc-watches": sub("acc-watches", "Часы", ["часы наручные", "watches"]),
    },
  },
  "fabrics-notions": {
    catalogMainId: "fabrics-notions",
    label: "Ткани и швейная фурнитура",
    allowedPlaceTypes: [...FABRIC_TYPES],
    negativeKeywords: [...GLOBAL_NEGATIVE],
    subcategories: {
      "fab-fabrics": sub("fab-fabrics", "Ткани (рулонами и на отрез)", [
        "ткани",
        "ткань оптом",
        "fabrics",
      ]),
      "fab-yarn-thread": sub("fab-yarn-thread", "Пряжа и нитки", ["пряжа", "нитки швейные", "yarn"]),
      "fab-notions": sub("fab-notions", "Швейная фурнитура (пуговицы, молнии, резинки, кружево)", [
        "фурнитура швейная",
        "молнии",
        "пуговицы",
        "sewing notions",
      ]),
      "fab-patches": sub("fab-patches", "Термоаппликации и нашивки", ["нашивки", "аппликации"]),
      "fab-workshop-equipment": sub("fab-workshop-equipment", "Оборудование для швейных цехов", [
        "швейное оборудование",
        "sewing machine industrial",
      ]),
    },
  },
};

export const DORDOI_MVP_CATALOG_MAIN_IDS = Object.keys(
  DORDOI_CATEGORY_SEARCH_MAP,
) as (keyof typeof DORDOI_CATEGORY_SEARCH_MAP)[];
