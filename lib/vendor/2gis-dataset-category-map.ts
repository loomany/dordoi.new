/**
 * Сопоставление рубрик/категорий 2GIS → id основных категорий сайта
 * (как в vendors.categories, см. {@link CATALOG_CATEGORY_TREE} в lib/constants/categories.ts).
 * Константы дерева категорий не меняются — только маппинг.
 */

import { CATALOG_CATEGORY_TREE } from "@/lib/constants/categories";

/** Все допустимые id «верхних» категорий из дерева сайта. */
export const SITE_MAIN_CATEGORY_IDS = CATALOG_CATEGORY_TREE.map((m) => m.id);

const MAIN = new Set(SITE_MAIN_CATEGORY_IDS);

function isMainId(id: string): boolean {
  return MAIN.has(id);
}

/**
 * Рубрика 2GIS (рус.) → один или несколько main id с сайта.
 * Если рубрики нет в таблице — не маппится (игнорируется при разборе строки).
 */
export const TWO_GIS_RUBRIC_TO_SITE_MAIN_IDS: Record<string, readonly string[]> =
  {
    "Женская одежда": ["womens"],
    "Мужская одежда": ["mens"],
    "Детская одежда": ["kids"],
    "Верхняя одежда": ["womens", "mens"],
    "Джинсовая одежда": ["womens", "mens"],
    "Мусульманская одежда": ["womens"],
    "Нижнее бельё": ["underwear-swim"],
    "Носки и колготки": ["underwear-swim"],
    Купальники: ["underwear-swim"],
    "Школьная форма": ["kids"],
    "Спортивная одежда и обувь": ["womens", "mens", "footwear"],
    "Обувные магазины": ["footwear"],
    "Обувь - опт": ["footwear"],
    "Детская обувь": ["footwear"],
    Спецобувь: ["footwear"],
    "Одежда и обувь для силовых структур": ["mens"],
    Спецодежда: ["mens"],
    "Трикотажные изделия": ["womens"],
    "Домашний текстиль": ["home-textiles"],
    Ковры: ["home-textiles"],
    "Портьерные ткани и шторы": ["home-textiles"],
    Ткани: ["fabrics-notions"],
    Пряжа: ["fabrics-notions"],
    "Швейная фурнитура": ["fabrics-notions"],
    "Швейное оборудование": ["fabrics-notions"],
    "Швейное производство": ["fabrics-notions"],
    "Мебельные ткани": ["fabrics-notions"],
    "Сумки и кожгалантерея": ["bags-leather"],
    Бижутерия: ["accessories"],
    "Головные и шейные уборы": ["accessories"],
    "Солнцезащитные очки": ["accessories"],
    Игрушки: ["toys-children"],
    "Настольные игры": ["toys-children"],
    "Товары для новорождённых": ["kids"],
    "Косметика и парфюмерия": ["beauty"],
    "Профессиональная косметика": ["beauty"],
    "Оборудование для салонов красоты": ["beauty"],
    "Парики и накладные волосы": ["beauty"],
    "Аксессуары к телефонам": ["electronics"],
    "Мобильные телефоны": ["electronics"],
    Компьютеры: ["electronics"],
    "Аудиотехника и видеотехника": ["electronics"],
    "Бытовая техника": ["electronics"],
    "Ремонт телефонов": ["electronics"],
    "Стационарные телефоны": ["electronics"],
    "Пакеты и плёнки": ["packaging-retail"],
    "Бумажная упаковка": ["packaging-retail"],
    "Подарочная упаковка": ["packaging-retail"],
    "Торгово-выставочное оборудование": ["packaging-retail"],
    Посуда: ["household"],
    Хозтовары: ["household"],
    "Бытовая химия": ["household"],
    "Средства гигиены": ["household"],
    "Одноразовая посуда": ["household"],
    "Спортивный инвентарь": ["sports-outdoors"],
    "Товары для туризма и отдыха": ["sports-outdoors"],
    "Товары для рыбалки": ["sports-outdoors"],
    "Товары для охоты": ["sports-outdoors"],
    Велосипеды: ["sports-outdoors"],
    Канцтовары: ["toys-children"],
    "Офисная бумага": ["packaging-retail"],
    Книги: ["toys-children"],
    "Учебная литература": ["toys-children"],
    "Ювелирные изделия": ["accessories"],
    "Меха и кожа": ["womens", "mens"],
    "Свадебные товары": ["womens"],
    "Новогодние товары": ["toys-children"],
    "Национальные товары": ["household"],
    Цветы: ["household"],
    БАДы: ["beauty"],
    "Медицинские изделия": ["beauty"],
    "Ортопедические товары": ["household"],
    "Детская мебель": ["household"],
    "Корпусная мебель": ["household"],
    "Надувная мебель и бассейны": ["sports-outdoors"],
    "Садово-парковая мебель": ["sports-outdoors"],
    Семена: ["household"],
    "Товары для творчества": ["toys-children"],
    "Художественные товары": ["toys-children"],
    "Религиозные товары": ["household"],
    Сувениры: ["household"],
    "Комиссионные магазины": ["womens"],
  };

/** Поле category из JSON 2GIS (англ. slug) — грубый fallback, если рубрики не дали ни одной карты. */
export const TWO_GIS_TOP_CATEGORY_TO_MAIN_IDS: Record<string, readonly string[]> =
  {
    clothes: ["womens"],
    shoe_store: ["footwear"],
    cosmetics: ["beauty"],
    cellphone_sale: ["electronics"],
    cellphone_services: ["electronics"],
    computer_sale: ["electronics"],
    sport: ["sports-outdoors"],
    laundry_sale: ["household"],
    garden: ["household"],
    medical_products: ["beauty"],
    common_store: ["household"],
    green: ["fabrics-notions"],
    construction_market: ["household"],
    printer_services: ["electronics"],
    service_station: ["household"],
    pharmacy: ["beauty"],
  };

/** Нормализация ключа рубрики (trim). */
function normRubric(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/**
 * Эвристика для рубрик без точного словаря (логистика/авто/финансы → null).
 */
function inferMainIdsFromRubricText(rubric: string): readonly string[] | null {
  const t = normRubric(rubric).toLowerCase();
  if (
    /банк|банкомат|ипотек|кредит|пвз|валют|страхован|мобильные операторы|интернет-провайдер|пункты выдачи/.test(
      t,
    )
  ) {
    return null;
  }
  if (
    /грузоперевозк|грузчик|экспедир|почта|таможн|фулфилл|складское|вывоз мусора|водителя без автомобиля|маркировки товаров|фасовки и упаковки/.test(
      t,
    )
  ) {
    return null;
  }
  if (
    /авто|запчаст|легковой автосервис|развал|автозвук|сигнализац|автохим|автоаксессуар|установка и ремонт автооптики|электроустановочн|светотехник|кондиционер|холодильн|сантехник|домофон|охранн|видеонаблюд|ремонт и установка бытовой/.test(
      t,
    )
  ) {
    return null;
  }
  if (/женск/.test(t)) return ["womens"];
  if (/мужск/.test(t)) return ["mens"];
  if (/детск|школьн|новорожд|подростк/.test(t)) return ["kids"];
  if (/обувь|обувн|кроссов|сапог|туфл|мокасин/.test(t)) return ["footwear"];
  if (/ткан|швейн|пряжа|кружев|фурнитур|швейное|мебельные ткани|портьерн/.test(t))
    return ["fabrics-notions"];
  if (/текстил|постель|полотенц|штор|ковр|плед|одеял/.test(t))
    return ["home-textiles"];
  if (/космет|парфюм|красот|маникюр|салон|бад|медицинск|фармац/.test(t))
    return ["beauty"];
  if (
    /телефон|смарт|компьютер|электрон|заряд|наушн|чехол|кабель|провод|принтер|копировальн|полиграф|печать|флексо|цифровую печать|измерительн|электроинструмент|электротехник|бензоинструмент|малярн|инструмент/.test(
      t,
    )
  ) {
    return ["electronics"];
  }
  if (/игруш|канцел|книг|учебн|настольн|пазл/.test(t)) return ["toys-children"];
  if (/упаковк|пакет|короб|этикет|манекен|витрин|стеллаж|бумажн|плёнк|плёнки/.test(t))
    return ["packaging-retail"];
  if (/хоз|посуд|химия|быт|сантех|семян|средств гигиены|одноразов/.test(t))
    return ["household"];
  if (/спорт|тур|охот|рыбал|велосипед|кемпинг|палатк|спальник|тактическ/.test(t))
    return ["sports-outdoors"];
  if (/сумк|кожгалантер|клатч|рюкзак|чемодан|кошелёк|ремн/.test(t))
    return ["bags-leather"];
  if (/аксессуар|бижут|очк|украшен|час|головн|шарф|перчатк|ювелир|солнцезащитн/.test(t))
    return ["accessories"];
  if (/нижн|бель|колгот|носк|купальн|термобель|корректирующ/.test(t))
    return ["underwear-swim"];
  if (/мебель|двер|замк|скобян|мебельн фурнитур|корпусн/.test(t)) return ["household"];
  if (/сельхоз|садово|цвет|семян|удобрен|средств защиты растений/.test(t))
    return ["household"];
  return null;
}

/**
 * Возвращает уникальные main id сайта или null, если ни одна рубрика и fallback не подошли.
 */
export function mapTwoGisRubricsToSiteCategories(
  rubrics: string[] | undefined,
  topCategory: string | undefined,
): string[] | null {
  const out: string[] = [];
  const seen = new Set<string>();
  const push = (ids: readonly string[]) => {
    for (const id of ids) {
      if (!isMainId(id) || seen.has(id)) continue;
      seen.add(id);
      out.push(id);
    }
  };

  for (const r of rubrics ?? []) {
    const key = normRubric(r);
    const mapped =
      TWO_GIS_RUBRIC_TO_SITE_MAIN_IDS[key] ?? inferMainIdsFromRubricText(key);
    if (mapped) push(mapped);
  }

  if (out.length === 0 && topCategory) {
    const coarse = TWO_GIS_TOP_CATEGORY_TO_MAIN_IDS[topCategory.trim()];
    if (coarse) push(coarse);
  }

  return out.length > 0 ? out : null;
}
