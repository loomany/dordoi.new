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

type VendorFaqT = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string;

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

function formatContactList(input: VendorFaqInput, t: VendorFaqT): string | null {
  const channels: string[] = [];
  if (input.hasWhatsapp) channels.push("WhatsApp");
  if (input.hasInstagram) channels.push("Instagram");
  if (input.hasTelegram) channels.push("Telegram");
  if (input.hasPhone) channels.push(t("contactPhone"));
  if (channels.length === 0) return null;
  if (channels.length === 1) return channels[0]!;
  if (channels.length === 2) {
    return t("contactListTwo", { a: channels[0]!, b: channels[1]! });
  }
  return t("contactListMany", {
    head: channels.slice(0, -1).join(", "),
    last: channels[channels.length - 1]!,
  });
}

function categoryContactSuffix(
  input: VendorFaqInput,
  t: VendorFaqT,
): string {
  const contacts = formatContactList(input, t);
  return contacts
    ? ` ${t("category.contactSuffix", { contacts })}`
    : ` ${t("category.contactFallback")}`;
}

function buildWhatToOrder(
  input: VendorFaqInput,
  bucket: FaqBucket,
  t: VendorFaqT,
): VendorFaqItem {
  const { name } = input;
  const categoryLabel = trimOrNull(input.categoryLabel);
  const description = trimOrNull(input.description);
  const locationRow = trimOrNull(input.locationRow);

  let answer = categoryLabel
    ? t("whatToOrder.introWithCategory", { name, categoryLabel })
    : t("whatToOrder.introNoCategory", { name });

  if (input.salesType === "wholesale") {
    answer += t("whatToOrder.salesWholesale");
  } else if (input.salesType === "hybrid") {
    answer += t("whatToOrder.salesHybrid");
  }
  answer += ".";

  if (description) {
    const snippet =
      description.length > 120 ? `${description.slice(0, 117).trimEnd()}…` : description;
    answer += ` ${snippet}`;
  } else {
    answer += ` ${t("fallbackNoDescription")}`;
  }

  if (locationRow) {
    answer += ` ${t("whatToOrder.locationSuffix", { locationRow })}`;
  }

  const question =
    bucket === "buyer_service"
      ? t("whatToOrder.questionBuyer", { name })
      : t("whatToOrder.question", { name });

  return { question, answer };
}

function buildWholesaleQuestion(
  input: VendorFaqInput,
  t: VendorFaqT,
): VendorFaqItem {
  const { name } = input;
  const salesType = input.salesType;
  const minOrder = trimOrNull(input.minOrder);
  const contacts = formatContactList(input, t);

  let answer: string;
  if (salesType === "wholesale") {
    answer = t("wholesale.answerWholesale", { name });
    if (minOrder) {
      answer += ` ${t("wholesale.minOrderSuffix", { minOrder })}`;
    }
    answer += contacts
      ? ` ${t("wholesale.contactsSuffix", { contacts })}`
      : ` ${t("wholesale.noContactsSuffix")}`;
  } else if (salesType === "hybrid") {
    answer = t("wholesale.answerHybrid", { name });
    if (minOrder) {
      answer += ` ${t("wholesale.minOrderSuffix", { minOrder })}`;
    }
    answer += contacts
      ? ` ${t("wholesale.contactsSuffix", { contacts })}`
      : ` ${t("wholesale.noContactsSuffix")}`;
  } else if (salesType === "retail") {
    answer = t("wholesale.answerRetail", { name });
    if (contacts) {
      answer += t("wholesale.retailContactsSuffix", { contacts });
    }
    answer += ".";
  } else {
    answer = t("wholesale.answerUnknown", { name });
    if (contacts) {
      answer += t("wholesale.unknownContactsSuffix", { contacts });
    } else {
      answer += ` ${t("wholesale.unknownNoContactsSuffix")}`;
    }
  }

  return {
    question: t("wholesale.question", { name }),
    answer,
  };
}

function buildContactQuestion(
  input: VendorFaqInput,
  t: VendorFaqT,
): VendorFaqItem {
  const { name } = input;
  const contacts = formatContactList(input, t);

  const answer = contacts
    ? t("contact.answerWithChannels", { contacts })
    : t("contact.answerNoChannels", { name });

  return {
    question: t("contact.question", { name }),
    answer,
  };
}

function buildDeliveryQuestion(
  input: VendorFaqInput,
  t: VendorFaqT,
): VendorFaqItem {
  const city = trimOrNull(input.city);
  const country = trimOrNull(input.country);

  let answer = t("delivery.answerBase");
  if (input.deliveryHelp === true) {
    answer += ` ${t("delivery.answerDeliveryHelp")}`;
  }
  if (city || country) {
    const geo = [city, country].filter(Boolean).join(", ");
    answer += ` ${t("delivery.answerGeo", { geo })}`;
  }

  return {
    question: t("delivery.question"),
    answer,
  };
}

function buildPricesQuestion(
  input: VendorFaqInput,
  t: VendorFaqT,
): VendorFaqItem {
  const contacts = formatContactList(input, t);
  let answer = t("prices.answerBase");
  if (input.samplesAvailable === true) {
    answer += ` ${t("prices.answerSamples")}`;
  }
  if (contacts) {
    answer += ` ${t("prices.contactsSuffix", { contacts })}`;
  }

  return {
    question: t("prices.question"),
    answer,
  };
}

function buildPlatformQuestion(t: VendorFaqT): VendorFaqItem {
  return {
    question: t("platform.question"),
    answer: t("platform.answer"),
  };
}

function buildSimilarSellersQuestion(
  input: VendorFaqInput,
  t: VendorFaqT,
): VendorFaqItem {
  if (input.hasRecommendedSellers) {
    return {
      question: t("similar.questionWithBlock"),
      answer: t("similar.answerWithBlock"),
    };
  }
  return {
    question: t("similar.questionFind"),
    answer: t("similar.answerFind"),
  };
}

function categoryQuestions(
  input: VendorFaqInput,
  bucket: FaqBucket,
  t: VendorFaqT,
): VendorFaqItem[] {
  const { name } = input;
  const categoryLabel =
    trimOrNull(input.categoryLabel) ?? t("categoryDefaultLabel");
  const suffix = categoryContactSuffix(input, t);

  switch (bucket) {
    case "women_clothing":
      return [
        {
          question: t("category.women.q1", { name }),
          answer: `${t("category.women.a1", { name, categoryLabel })}${suffix}`,
        },
        {
          question: t("category.women.q2", { name }),
          answer: `${
            input.salesType === "wholesale" || input.salesType === "hybrid"
              ? t("category.women.a2Wholesale")
              : t("category.women.a2Other")
          }${suffix}`,
        },
        {
          question: t("category.women.q3"),
          answer: `${t("category.women.a3", { name })}${suffix}`,
        },
      ];
    case "men_clothing":
      return [
        {
          question: t("category.men.q1", { name }),
          answer: `${t("category.men.a1", { name, categoryLabel })}${suffix}`,
        },
        {
          question: t("category.men.q2", { name }),
          answer: `${t("category.men.a2")}${suffix}`,
        },
      ];
    case "kids_clothing":
      return [
        {
          question: t("category.kids.q1", { name }),
          answer: `${t("category.kids.a1", { name, categoryLabel })}${suffix}`,
        },
        {
          question: t("category.kids.q2", { name }),
          answer: `${t("category.kids.a2")}${suffix}`,
        },
      ];
    case "shoes":
      return [
        {
          question: t("category.shoes.q1", { name }),
          answer: `${t("category.shoes.a1", { name })}${suffix}`,
        },
        {
          question: t("category.shoes.q2"),
          answer: `${t("category.shoes.a2", { name })}${suffix}`,
        },
        {
          question: t("category.shoes.q3", { name }),
          answer: `${t("category.shoes.a3", { name })}${suffix}`,
        },
      ];
    case "bags":
      return [
        {
          question: t("category.bags.q1", { name }),
          answer: `${t("category.bags.a1", { name })}${suffix}`,
        },
        {
          question: t("category.bags.q2"),
          answer: `${t("category.bags.a2", { name })}${suffix}`,
        },
      ];
    case "accessories":
      return [
        {
          question: t("category.accessories.q1", { name }),
          answer: `${t("category.accessories.a1", { name, categoryLabel })}${suffix}`,
        },
        {
          question: t("category.accessories.q2", { name }),
          answer: `${t("category.accessories.a2")}${suffix}`,
        },
      ];
    case "fabric":
      return [
        {
          question: t("category.fabric.q1", { name }),
          answer: `${t("category.fabric.a1", { name })}${suffix}`,
        },
        {
          question: t("category.fabric.q2", { name }),
          answer: `${t("category.fabric.a2")}${suffix}`,
        },
      ];
    case "cargo":
      return [
        {
          question: t("category.cargo.q1", { name }),
          answer: `${t("category.cargo.a1", { name })}${suffix}`,
        },
        {
          question: t("category.cargo.q2"),
          answer: `${t("category.cargo.a2", { name })}${suffix}`,
        },
      ];
    case "buyer_service":
      return [
        {
          question: t("category.buyer.q1"),
          answer: `${t("category.buyer.a1", { name })}${suffix}`,
        },
        {
          question: t("category.buyer.q2"),
          answer: `${t("category.buyer.a2", { name })}${suffix}`,
        },
        {
          question: t("category.buyer.q3"),
          answer: `${t("category.buyer.a3", { name })}${suffix}`,
        },
      ];
    default:
      return [
        {
          question: t("category.general.q1", { name }),
          answer: `${t("category.general.a1", { name })}${suffix}`,
        },
        {
          question: t("category.general.q2", { name }),
          answer: `${t("category.general.a2")}${suffix}`,
        },
      ];
  }
}

export function buildVendorFaq(
  input: VendorFaqInput,
  t: VendorFaqT,
): VendorFaqItem[] {
  const bucket = mapCategoryToBucket(input.category);

  const core: VendorFaqItem[] = [
    buildWhatToOrder(input, bucket, t),
    buildWholesaleQuestion(input, t),
    buildContactQuestion(input, t),
    buildDeliveryQuestion(input, t),
    buildPricesQuestion(input, t),
  ];

  const categorySpecific = categoryQuestions(input, bucket, t);

  const tail: VendorFaqItem[] = [
    buildPlatformQuestion(t),
    buildSimilarSellersQuestion(input, t),
  ];

  const combined = [...core, ...categorySpecific.slice(0, 3), ...tail];

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
