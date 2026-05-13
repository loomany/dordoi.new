export type VendorFaqItem = {
  question: string;
  answer: string;
};

export type VendorFaqInput = {
  name: string;
  category?: string | null;
  categoryLabel?: string | null;
  description?: string | null;
  salesType?: "wholesale" | "retail" | "hybrid" | null;
  minOrder?: string | null;
  locationRow?: string | null;
  city?: string | null;
  country?: string | null;
  hasWhatsapp?: boolean;
  hasPhone?: boolean;
  hasInstagram?: boolean;
  hasTelegram?: boolean;
  hasRecommendedSellers?: boolean;
  deliveryHelp?: boolean;
  samplesAvailable?: boolean;
};

type FaqBucket =
  | "women_clothing"
  | "men_clothing"
  | "kids_clothing"
  | "shoes"
  | "bags"
  | "accessories"
  | "fabric"
  | "cargo"
  | "buyer_service"
  | "general";

function mapCategoryToBucket(category: string | null | undefined): FaqBucket {
  switch (category) {
    case "womens":
      return "women_clothing";
    case "mens":
      return "men_clothing";
    case "kids":
      return "kids_clothing";
    case "footwear":
      return "shoes";
    case "bags-leather":
      return "bags";
    case "accessories":
      return "accessories";
    case "fabrics-notions":
      return "fabric";
    case "cargo":
      return "cargo";
    case "buyer-service":
    case "buyer_service":
      return "buyer_service";
    default:
      return "general";
  }
}

function trimOrNull(value: string | null | undefined): string | null {
  const t = value?.trim();
  return t || null;
}

function formatContactList(input: VendorFaqInput): string | null {
  const channels: string[] = [];
  if (input.hasWhatsapp) channels.push("WhatsApp");
  if (input.hasInstagram) channels.push("Instagram");
  if (input.hasTelegram) channels.push("Telegram");
  if (input.hasPhone) channels.push("телефон");
  if (channels.length === 0) return null;
  if (channels.length === 1) return channels[0]!;
  if (channels.length === 2) return `${channels[0]} и ${channels[1]}`;
  return `${channels.slice(0, -1).join(", ")} и ${channels[channels.length - 1]}`;
}

function salesTypeLabel(salesType: VendorFaqInput["salesType"]): string | null {
  switch (salesType) {
    case "wholesale":
      return "опт";
    case "retail":
      return "розница";
    case "hybrid":
      return "розница/опт";
    default:
      return null;
  }
}

function buildWhatToOrder(input: VendorFaqInput, bucket: FaqBucket): VendorFaqItem {
  const { name } = input;
  const categoryLabel = trimOrNull(input.categoryLabel);
  const description = trimOrNull(input.description);
  const sales = salesTypeLabel(input.salesType);
  const locationRow = trimOrNull(input.locationRow);

  let answer = `${name}`;
  if (categoryLabel) {
    answer += ` предлагает товары в категории «${categoryLabel}»`;
  } else {
    answer += ` — профиль поставщика на Dordoi.help`;
  }
  if (sales === "опт") {
    answer += " для закупки оптом";
  } else if (sales === "розница/опт") {
    answer += " с возможностью оптовых и розничных заказов";
  }
  answer += ".";
  if (description) {
    const snippet =
      description.length > 120 ? `${description.slice(0, 117).trimEnd()}…` : description;
    answer += ` ${snippet}`;
  } else {
    answer +=
      " Ассортимент, наличие, размеры и условия заказа лучше уточнять напрямую у продавца.";
  }
  if (locationRow) {
    answer += ` На странице указан ряд на рынке Дордой: ${locationRow}.`;
  }

  const question =
    bucket === "buyer_service"
      ? `Чем может помочь ${name}?`
      : `Что можно заказать у ${name}?`;

  return { question, answer };
}

function buildWholesaleQuestion(input: VendorFaqInput): VendorFaqItem {
  const { name } = input;
  const sales = salesTypeLabel(input.salesType);
  const minOrder = trimOrNull(input.minOrder);
  const contacts = formatContactList(input);

  let answer: string;
  if (sales === "опт" || sales === "розница/опт") {
    answer = `Профиль ${name} ориентирован на ${sales === "опт" ? "оптовых" : "оптовых и розничных"} покупателей.`;
    if (minOrder) {
      answer += ` В профиле указан минимальный заказ: ${minOrder}.`;
    }
    if (contacts) {
      answer += ` Уточнить цены, наличие и условия поставки можно через ${contacts}.`;
    } else {
      answer += " Условия заказа лучше уточнять напрямую у продавца.";
    }
  } else if (sales === "розница") {
    answer = `${name} указан как розничный продавец. Оптовые условия, если они доступны, нужно уточнять у продавца напрямую`;
    if (contacts) {
      answer += ` через ${contacts}`;
    }
    answer += ".";
  } else {
    answer = `Условия оптовой закупки у ${name} не указаны в профиле.`;
    if (contacts) {
      answer += ` Свяжитесь с продавцом через ${contacts}, чтобы уточнить формат работы и минимальный заказ.`;
    } else {
      answer += " Свяжитесь с продавцом, чтобы уточнить формат работы и условия заказа.";
    }
  }

  return {
    question: `Работает ли ${name} с оптовыми покупателями?`,
    answer,
  };
}

function buildContactQuestion(input: VendorFaqInput): VendorFaqItem {
  const { name } = input;
  const contacts = formatContactList(input);

  const answer = contacts
    ? `На странице продавца доступны кнопки связи: ${contacts}. Напишите или позвоните, чтобы уточнить ассортимент и условия заказа.`
    : `Контакты ${name} указаны на этой странице. Если кнопок связи нет, проверьте описание профиля или вернитесь позже — продавец может обновить данные.`;

  return {
    question: `Как связаться с ${name}?`,
    answer,
  };
}

function buildDeliveryQuestion(input: VendorFaqInput): VendorFaqItem {
  const city = trimOrNull(input.city);
  const country = trimOrNull(input.country);

  let answer =
    "Dordoi.help показывает контакты и информацию о продавце. Условия доставки и отправки нужно уточнять напрямую у магазина.";
  if (input.deliveryHelp === true) {
    answer = `${answer} В профиле отмечено, что продавец может помочь с доставкой — детали стоит обсудить при обращении.`;
  }
  if (city || country) {
    const geo = [city, country].filter(Boolean).join(", ");
    answer += ` Многие поставщики на рынке Дордой работают из ${geo}, но это не означает автоматическую доставку — условия зависят от продавца.`;
  }

  return {
    question: "Можно ли заказать товар с доставкой?",
    answer,
  };
}

function buildPricesQuestion(input: VendorFaqInput): VendorFaqItem {
  const contacts = formatContactList(input);
  let answer =
    "Цены, размеры и наличие товара могут меняться. Перед заказом рекомендуется написать продавцу и уточнить актуальную информацию.";
  if (input.samplesAvailable === true) {
    answer +=
      " В профиле отмечена возможность образцов — уточните у продавца, как их получить.";
  }
  if (contacts) {
    answer += ` Связаться можно через ${contacts}.`;
  }

  return {
    question: "Как проверить актуальность цен и наличия?",
    answer,
  };
}

function buildPlatformQuestion(): VendorFaqItem {
  return {
    question: "Чем Dordoi.help помогает покупателю?",
    answer:
      "Dordoi.help собирает поставщиков, магазины и байеров в одном каталоге, чтобы покупателю было проще найти продавца на рынке Дордой и быстро перейти к контакту.",
  };
}

function buildSimilarSellersQuestion(input: VendorFaqInput): VendorFaqItem {
  if (input.hasRecommendedSellers) {
    return {
      question: "Есть ли похожие поставщики?",
      answer:
        "Да, на этой странице в блоке «Похожие поставщики» показаны другие магазины и поставщики из каталога — они могут предлагать товары из похожей категории.",
    };
  }
  return {
    question: "Как найти похожих поставщиков?",
    answer:
      "Используйте каталог Dordoi.help: фильтры по категориям и поиск помогут найти других продавцов с похожим ассортиментом.",
  };
}

function categoryQuestions(
  input: VendorFaqInput,
  bucket: FaqBucket,
): VendorFaqItem[] {
  const { name } = input;
  const categoryLabel = trimOrNull(input.categoryLabel) ?? "товары";
  const contacts = formatContactList(input);
  const contactSuffix = contacts
    ? ` Связаться можно через ${contacts}.`
    : " Уточните у продавца напрямую.";

  switch (bucket) {
    case "women_clothing":
      return [
        {
          question: `Какие женские товары можно найти у ${name}?`,
          answer: `${name} работает в категории «${categoryLabel}». Конкретный ассортимент, модели и наличие лучше уточнять у продавца перед заказом.${contactSuffix}`,
        },
        {
          question: `Подходит ли ${name} для закупки женской одежды оптом?`,
          answer:
            input.salesType === "wholesale" || input.salesType === "hybrid"
              ? `Если вы ищете поставщика женской одежды для закупки оптом, этот профиль может быть полезен для первичного контакта и обсуждения условий.${contactSuffix}`
              : `Профиль может быть полезен для первичного контакта, но оптовые условия нужно уточнять у продавца.${contactSuffix}`,
        },
        {
          question: "Можно ли уточнить размеры, модели и наличие перед заказом?",
          answer: `Да, перед заказом рекомендуется написать ${name} и уточнить размерный ряд, модели и наличие.${contactSuffix}`,
        },
      ];
    case "men_clothing":
      return [
        {
          question: `Какую мужскую одежду предлагает ${name}?`,
          answer: `${name} — поставщик в категории «${categoryLabel}». Ассортимент и наличие уточняйте у продавца.${contactSuffix}`,
        },
        {
          question: `Подходит ли ${name} для оптовой закупки мужской одежды?`,
          answer: `Профиль подойдёт для первичного контакта с продавцом мужской одежды. Оптовые условия обсуждаются напрямую.${contactSuffix}`,
        },
      ];
    case "kids_clothing":
      return [
        {
          question: `Какую детскую одежду можно заказать у ${name}?`,
          answer: `${name} работает с детской одеждой («${categoryLabel}»). Размеры, модели и наличие уточняйте у продавца.${contactSuffix}`,
        },
        {
          question: `Можно ли закупать детскую одежду оптом у ${name}?`,
          answer: `Условия оптовой закупки детской одежды уточняйте у продавца — в профиле указана категория, но детали заказа обсуждаются напрямую.${contactSuffix}`,
        },
      ];
    case "shoes":
      return [
        {
          question: `Можно ли заказать обувь оптом у ${name}?`,
          answer: `${name} — поставщик обуви. Условия опта и минимальный заказ уточняйте у продавца.${contactSuffix}`,
        },
        {
          question: "Как уточнить размерный ряд и наличие?",
          answer: `Напишите ${name} и уточните размерный ряд, модели и наличие перед заказом.${contactSuffix}`,
        },
        {
          question: `Подходит ли ${name} для закупки обуви для магазина?`,
          answer: `Профиль может быть полезен для первичного контакта с поставщиком обуви на рынке Дордой.${contactSuffix}`,
        },
      ];
    case "bags":
      return [
        {
          question: `Можно ли заказать сумки оптом у ${name}?`,
          answer: `${name} работает с сумками и кожгалантереей. Условия опта уточняйте у продавца.${contactSuffix}`,
        },
        {
          question: "Как уточнить модели, цвета и наличие?",
          answer: `Свяжитесь с ${name}, чтобы уточнить модели, цвета и наличие перед заказом.${contactSuffix}`,
        },
      ];
    case "accessories":
      return [
        {
          question: `Можно ли заказать аксессуары оптом у ${name}?`,
          answer: `${name} предлагает аксессуары («${categoryLabel}»). Условия опта обсуждаются с продавцом.${contactSuffix}`,
        },
        {
          question: `Подходит ли ${name} для закупки небольшими партиями?`,
          answer: `Минимальный заказ и условия партий уточняйте у продавца — в профиле есть контакты для связи.${contactSuffix}`,
        },
      ];
    case "fabric":
      return [
        {
          question: `Какие ткани и швейные материалы предлагает ${name}?`,
          answer: `${name} работает с тканями и швейной фурнитурой. Ассортимент уточняйте у продавца.${contactSuffix}`,
        },
        {
          question: `Можно ли закупать ткани оптом у ${name}?`,
          answer: `Условия оптовой закупки тканей обсуждаются напрямую с продавцом.${contactSuffix}`,
        },
      ];
    case "cargo":
      return [
        {
          question: `Чем занимается ${name} в сегменте карго и логистики?`,
          answer: `${name} — профиль в категории карго/логистики на Dordoi.help. Условия перевозки и сопровождения уточняйте у продавца.${contactSuffix}`,
        },
        {
          question: "Как обсудить условия доставки грузов?",
          answer: `Свяжитесь с ${name} через контакты на странице, чтобы обсудить маршруты, сроки и стоимость.${contactSuffix}`,
        },
      ];
    case "buyer_service":
      return [
        {
          question: "Чем помогает байер на Дордое?",
          answer: `${name} — профиль байера или услуги закупа. Байер может помочь найти товар на рынке и согласовать условия с продавцами — детали обсуждаются при обращении.${contactSuffix}`,
        },
        {
          question: "Может ли байер найти нужный товар на рынке?",
          answer: `Обратитесь к ${name}, опишите нужный товар и условия — байер подскажет, как организовать поиск и закупку на рынке Дордой.${contactSuffix}`,
        },
        {
          question: "Как обсудить условия закупа и сопровождения?",
          answer: `Напишите ${name} через доступные контакты на странице, чтобы обсудить формат работы, комиссию и сопровождение закупки.${contactSuffix}`,
        },
      ];
    default:
      return [
        {
          question: `Подходит ли ${name} для оптовой закупки?`,
          answer: `Профиль ${name} может быть полезен для первичного контакта с поставщиком на рынке Дордой. Условия опта уточняйте у продавца.${contactSuffix}`,
        },
        {
          question: `Что уточнить у ${name} перед заказом?`,
          answer: `Перед заказом рекомендуется уточнить ассортимент, цены, наличие и условия поставки.${contactSuffix}`,
        },
      ];
  }
}

export function buildVendorFaq(input: VendorFaqInput): VendorFaqItem[] {
  const bucket = mapCategoryToBucket(input.category);

  const core: VendorFaqItem[] = [
    buildWhatToOrder(input, bucket),
    buildWholesaleQuestion(input),
    buildContactQuestion(input),
    buildDeliveryQuestion(input),
    buildPricesQuestion(input),
  ];

  const categorySpecific = categoryQuestions(input, bucket);

  const tail: VendorFaqItem[] = [
    buildPlatformQuestion(),
    buildSimilarSellersQuestion(input),
  ];

  const combined = [...core, ...categorySpecific.slice(0, 3), ...tail];

  // Deduplicate by question text and cap at 8
  const seen = new Set<string>();
  const result: VendorFaqItem[] = [];
  for (const item of combined) {
    if (seen.has(item.question)) continue;
    seen.add(item.question);
    result.push(item);
    if (result.length >= 8) break;
  }

  return result;
}
