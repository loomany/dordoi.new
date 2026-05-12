/**
 * Конфиг режима Discovery (Google Places API New).
 * Канонический план: google_places_сборщик_e14c6ee8.plan.md
 */

/** Группы includedTypes: один Nearby-запрос = одна группа × точка сетки × радиус. */
export const DISCOVERY_NEARBY_TYPE_GROUPS: ReadonlyArray<{
  id: string;
  label: string;
  includedTypes: readonly string[];
}> = [
  {
    id: "apparel-footwear",
    label: "Одежда/обувь",
    includedTypes: [
      "clothing_store",
      "womens_clothing_store",
      "shoe_store",
      "sportswear_store",
    ],
  },
  {
    id: "trade-market",
    label: "Торговля/рынок",
    includedTypes: [
      "store",
      "general_store",
      "department_store",
      "shopping_mall",
      "market",
      "flea_market",
      "wholesaler",
      "warehouse_store",
    ],
  },
  {
    id: "home-building",
    label: "Дом/товары",
    includedTypes: [
      "home_goods_store",
      "home_improvement_store",
      "furniture_store",
      "hardware_store",
      "building_materials_store",
    ],
  },
  {
    id: "accessories-cosmetics",
    label: "Аксессуары/косметика",
    includedTypes: ["jewelry_store", "cosmetics_store", "gift_shop"],
  },
  {
    id: "toys",
    label: "Детское/игрушки",
    includedTypes: ["toy_store"],
  },
  {
    id: "electronics",
    label: "Электроника",
    includedTypes: ["electronics_store", "cell_phone_store"],
  },
];

/** Значение CLI `--discovery-group=all` — все группы Nearby. */
export const DISCOVERY_GROUP_ALL = "all" as const;

/** Допустимые значения `--discovery-group=` (кроме `all`). */
export const DISCOVERY_GROUP_IDS = DISCOVERY_NEARBY_TYPE_GROUPS.map(
  (g) => g.id,
) as readonly string[];

export type DiscoveryNearbyGroup = (typeof DISCOVERY_NEARBY_TYPE_GROUPS)[number];

/** Nearby-группы для запуска: одна группа или все. */
export function resolveDiscoveryNearbyGroups(
  discoveryGroup: string,
): readonly DiscoveryNearbyGroup[] {
  const g = discoveryGroup.trim().toLowerCase();
  if (g === DISCOVERY_GROUP_ALL || g === "") return DISCOVERY_NEARBY_TYPE_GROUPS;
  const found = DISCOVERY_NEARBY_TYPE_GROUPS.filter((x) => x.id === g);
  return found;
}

/** Список для сообщения об ошибке CLI. */
export function discoveryGroupCliHelp(): string {
  return [...DISCOVERY_GROUP_IDS, DISCOVERY_GROUP_ALL].join(", ");
}

/** Широкие Text Search запросы (locationBias Дордой в скрипте). */
export const DISCOVERY_TEXT_QUERIES: readonly string[] = [
  "магазин Дордой",
  "оптом Дордой",
  "рынок Дордой",
  "товары оптом Бишкек",
  "магазин оптом Бишкек",
  "wholesale Bishkek",
  "Dordoi market shop",
  "одежда оптом Бишкек",
  "обувь оптом Бишкек",
  "сумки оптом Бишкек",
  "ткани Бишкек",
  "фурнитура Бишкек",
  "косметика оптом Бишкек",
  "товары для дома Бишкек",
  "люстры Бишкек",
  "освещение Бишкек",
  "мебель Бишкек",
  "посуда Бишкек",
  "игрушки Бишкек",
  "электроника Бишкек",
  "аксессуары Бишкек",
];

/** Типы Places: если primaryType или любой types ∈ — в excluded. */
export const DISCOVERY_BLACKLIST_PLACE_TYPES: ReadonlySet<string> = new Set([
  "bank",
  "atm",
  "restaurant",
  "cafe",
  "bar",
  "bakery",
  "meal_delivery",
  "meal_takeaway",
  "food",
  "grocery_store",
  "supermarket",
  "pharmacy",
  "hospital",
  "doctor",
  "dentist",
  "health",
  "hotel",
  "lodging",
  "school",
  "university",
  "gas_station",
  "parking",
  "casino",
  "night_club",
  "mosque",
  "church",
  "government_office",
  "police",
  "post_office",
  "moving_company",
  "storage",
  "courier_service",
  "shipping_service",
  "warehouse",
  "finance",
]);

/** Подстроки в названии/адресе/types (нижний регистр для сравнения). */
export const DISCOVERY_BLACKLIST_KEYWORDS: readonly string[] = [
  "кафе",
  "cafe",
  "ресторан",
  "restaurant",
  "банк",
  "bank",
  "atm",
  "обмен",
  "exchange",
  "ломбард",
  "pawn",
  "pawnshop",
  "карго",
  "cargo",
  "логистика",
  "logistics",
  "доставка",
  "delivery",
  "shipping",
  "склад",
  "warehouse",
  "аптека",
  "pharmacy",
  "отель",
  "hotel",
  "школ",
  "school",
  "заправ",
  "gas_station",
  "парковк",
  "parking",
  "казино",
  "casino",
  "ночной клуб",
  "night_club",
];

/**
 * Positive classifier: proposedCategory (служебный ярлык) → подпись и ключевые слова.
 * Совпадение по title/address (без учёта регистра).
 */
export const DISCOVERY_POSITIVE_CATEGORY_DEFS: ReadonlyArray<{
  proposedCategory: string;
  proposedCategoryLabel: string;
  keywords: readonly string[];
}> = [
  {
    proposedCategory: "lighting",
    proposedCategoryLabel: "Освещение / люстры",
    keywords: [
      "люстр",
      "освещен",
      "светильник",
      "lamp",
      "lighting",
      "свет ",
    ],
  },
  {
    proposedCategory: "furniture",
    proposedCategoryLabel: "Мебель",
    keywords: [
      "мебель",
      "диван",
      "кресло",
      "стол",
      "стул",
      "шкаф",
      "furniture",
    ],
  },
  {
    proposedCategory: "cosmetics",
    proposedCategoryLabel: "Косметика / уход",
    keywords: ["косметик", "makeup", "beauty", "parfum", "парфюм"],
  },
  {
    proposedCategory: "home-goods",
    proposedCategoryLabel: "Товары для дома / хозтовары",
    keywords: [
      "хозтовар",
      "товары для дома",
      "home goods",
      "текстиль",
      "постель",
    ],
  },
  {
    proposedCategory: "kitchenware",
    proposedCategoryLabel: "Посуда / кухня",
    keywords: ["посуд", "kitchenware", "кастрюл", "сковород"],
  },
  {
    proposedCategory: "electronics",
    proposedCategoryLabel: "Электроника",
    keywords: [
      "электроник",
      "телефон",
      "смартфон",
      "electronics",
      "cell phone",
      "наушник",
    ],
  },
  {
    proposedCategory: "toys",
    proposedCategoryLabel: "Игрушки / детские товары",
    keywords: ["игрушк", "toys", "детск", "конструктор"],
  },
];

/** Ткани/фурнитура — для home_goods_store + текстиль → fabrics-notions. */
export const FABRIC_TEXTILE_KEYWORDS: readonly string[] = [
  "ткан",
  "фурнитур",
  "молн",
  "пугов",
  "нитк",
  "кружев",
  "текстиль",
  "рулон",
];
