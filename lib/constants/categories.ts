export type CatalogSubcategory = {
  /** Стабильный slug для query cat=. Подписи: messages … catalogCategoryTree. */
  id: string;
};

export type CatalogMainCategory = {
  id: string;
  emoji: string;
  subcategories: CatalogSubcategory[];
};

export const CATALOG_CATEGORY_TREE: CatalogMainCategory[] = [
  {
    id: "womens",
    emoji: "👗",
    subcategories: [
      { id: "women-outerwear" },
      { id: "women-dresses" },
      { id: "women-blouses" },
      { id: "women-sweaters" },
      { id: "women-pants-shorts" },
      { id: "women-skirts" },
      { id: "women-tracksuits" },
      { id: "women-loungewear" },
      { id: "women-plus-size" },
      { id: "women-muslim" },
    ],
  },
  {
    id: "mens",
    emoji: "👔",
    subcategories: [
      { id: "men-outerwear" },
      { id: "men-suits" },
      { id: "men-shirts" },
      { id: "men-hoodies" },
      { id: "men-pants-jeans" },
      { id: "men-sportswear" },
      { id: "men-tshirts-polo" },
    ],
  },
  {
    id: "kids",
    emoji: "🧸",
    subcategories: [
      { id: "kids-newborn" },
      { id: "kids-girls" },
      { id: "kids-boys" },
      { id: "kids-school-uniform" },
      { id: "kids-teens" },
      { id: "kids-outerwear" },
    ],
  },
  {
    id: "underwear-swim",
    emoji: "👙",
    subcategories: [
      { id: "uw-women" },
      { id: "uw-men" },
      { id: "uw-kids" },
      { id: "uw-swimwear" },
      { id: "uw-hosiery" },
      { id: "uw-shape-thermal" },
    ],
  },
  {
    id: "footwear",
    emoji: "👟",
    subcategories: [
      { id: "shoes-women" },
      { id: "shoes-men" },
      { id: "shoes-kids" },
      { id: "shoes-sports" },
      { id: "shoes-home-beach" },
      { id: "shoes-special" },
    ],
  },
  {
    id: "bags-leather",
    emoji: "👜",
    subcategories: [
      { id: "bags-women" },
      { id: "bags-men" },
      { id: "bags-backpacks" },
      { id: "bags-wallets" },
      { id: "bags-belts" },
      { id: "bags-travel" },
    ],
  },
  {
    id: "accessories",
    emoji: "🕶",
    subcategories: [
      { id: "acc-headwear" },
      { id: "acc-scarves" },
      { id: "acc-gloves" },
      { id: "acc-sunglasses" },
      { id: "acc-hair-jewelry" },
      { id: "acc-watches" },
    ],
  },
  {
    id: "fabrics-notions",
    emoji: "🧵",
    subcategories: [
      { id: "fab-fabrics" },
      { id: "fab-yarn-thread" },
      { id: "fab-notions" },
      { id: "fab-patches" },
      { id: "fab-workshop-equipment" },
    ],
  },
  {
    id: "home-textiles",
    emoji: "🛏",
    subcategories: [
      { id: "ht-bedding" },
      { id: "ht-towels" },
      { id: "ht-blankets" },
      { id: "ht-curtains" },
      { id: "ht-pillows-mattresses" },
      { id: "ht-rugs" },
    ],
  },
  {
    id: "beauty",
    emoji: "🧴",
    subcategories: [
      { id: "beauty-skincare" },
      { id: "beauty-makeup" },
      { id: "beauty-fragrance" },
      { id: "beauty-nails" },
      { id: "beauty-salon-equipment" },
      { id: "beauty-soap" },
    ],
  },
  {
    id: "toys-children",
    emoji: "🎮",
    subcategories: [
      { id: "toys-soft" },
      { id: "toys-educational" },
      { id: "toys-rc" },
      { id: "toys-board-games" },
      { id: "toys-strollers-seats" },
      { id: "toys-stationery-school" },
    ],
  },
  {
    id: "electronics",
    emoji: "📱",
    subcategories: [
      { id: "elec-phone-cases" },
      { id: "elec-chargers" },
      { id: "elec-audio" },
      { id: "elec-wearables" },
      { id: "elec-small-appliances" },
    ],
  },
  {
    id: "packaging-retail",
    emoji: "📦",
    subcategories: [
      { id: "pack-bags" },
      { id: "pack-zip-marketplace" },
      { id: "pack-boxes" },
      { id: "pack-mannequins-hangers" },
      { id: "pack-shelving" },
      { id: "pack-tags-labels" },
    ],
  },
  {
    id: "household",
    emoji: "🍳",
    subcategories: [
      { id: "hh-kitchenware" },
      { id: "hh-cleaning-tools" },
      { id: "hh-chemicals" },
      { id: "hh-bathroom" },
      { id: "hh-plasticware" },
    ],
  },
  {
    id: "sports-outdoors",
    emoji: "⛺️",
    subcategories: [
      { id: "spo-sports-gear" },
      { id: "spo-camping" },
      { id: "spo-fishing-hunting" },
      { id: "spo-tactical" },
    ],
  },
];

export const CATALOG_MAIN_CATEGORY_IDS: readonly string[] = CATALOG_CATEGORY_TREE.map((m) => m.id);
export const CATALOG_MAIN_CATEGORY_ID_SET: ReadonlySet<string> = new Set(CATALOG_MAIN_CATEGORY_IDS);

const _slugSet = new Set<string>();
for (const main of CATALOG_CATEGORY_TREE) {
  for (const sub of main.subcategories) {
    _slugSet.add(sub.id);
  }
}

export const CATALOG_SUBCATEGORY_SLUGS: ReadonlySet<string> = _slugSet;

export function getAllSubcategories(): CatalogSubcategory[] {
  return CATALOG_CATEGORY_TREE.flatMap((m) => m.subcategories);
}

export function findSubcategoryById(id: string): CatalogSubcategory | undefined {
  for (const main of CATALOG_CATEGORY_TREE) {
    const hit = main.subcategories.find((s) => s.id === id);
    if (hit) {
      return hit;
    }
  }
  return undefined;
}

/** Slug подкатегории или id основной категории → id основной; иначе `null`. */
export function resolveCatalogSlugToMainId(slug: string): string | null {
  const t = slug.trim();
  if (!t) return null;
  if (CATALOG_MAIN_CATEGORY_ID_SET.has(t)) return t;
  for (const main of CATALOG_CATEGORY_TREE) {
    if (main.subcategories.some((s) => s.id === t)) {
      return main.id;
    }
  }
  return null;
}

export type SubcategoryWithMain = {
  main: CatalogMainCategory;
  sub: CatalogSubcategory;
};

export function getSubcategoriesWithMain(): SubcategoryWithMain[] {
  return CATALOG_CATEGORY_TREE.flatMap((main) =>
    main.subcategories.map((sub) => ({ main, sub })),
  );
}

/** Для UI: подписи из next-intl (catalogCategoryTree.main.* и sub.*). */
export type LocalizedCatalogMainCategory = Omit<CatalogMainCategory, "subcategories"> & {
  title: string;
  subcategories: Array<CatalogSubcategory & { label: string }>;
};

export function localizeCategoryTree(
  tree: CatalogMainCategory[],
  t: (key: string) => string,
): LocalizedCatalogMainCategory[] {
  return tree.map((main) => ({
    ...main,
    title: t(`main.${main.id}`),
    subcategories: main.subcategories.map((sub) => ({
      ...sub,
      label: t(`sub.${sub.id}`),
    })),
  }));
}
