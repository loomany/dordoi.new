import type { LinkItem } from "@/lib/seo/stage2-content";
import {
  localizeLinkItems,
  stage4Copy,
} from "@/lib/seo/stage4-localized-content";

export type AiAnswerContent = {
  title: string;
  paragraphs: string[];
  links: LinkItem[];
};

const SHORT_TITLE: Record<string, string> = {
  ru: "Коротко",
  kk: "Қысқаша",
  kg: "Кыскача",
  uz: "Qisqacha",
  tj: "Кӯтоҳ",
};

function title(locale: string) {
  return SHORT_TITLE[locale] ?? SHORT_TITLE.ru;
}

function link(href: string, label: string): LinkItem {
  return { href, label };
}

function localizedAnswer(locale: string, content: AiAnswerContent): AiAnswerContent {
  return { ...content, links: localizeLinkItems(locale, content.links) };
}

function localizedGrowthPageAnswer(
  locale: string,
  pageId: string,
): AiAnswerContent | undefined {
  const copy = stage4Copy(locale);
  if (!copy) return undefined;

  const pageTitle =
    pageId === "about"
      ? `Dordoi.help: ${copy.dordoiMarket}`
      : pageId === "for-buyers"
        ? copy.buyers
        : pageId === "for-sellers"
          ? copy.sellers
          : pageId === "how-it-works"
            ? copy.how
            : pageId === "faq"
              ? copy.faq
              : title(locale);
  const firstParagraph =
    locale === "kk"
      ? `Dordoi.help ${copy.dordoiMarket.toLowerCase()}, ${copy.catalog.toLowerCase()}, ${copy.buyerService.toLowerCase()} және ${copy.cargo.toLowerCase()} туралы ашық ақпарат береді. ${copy.safeAccessBody}`
      : locale === "kg"
        ? `Dordoi.help ${copy.dordoiMarket.toLowerCase()}, ${copy.catalog.toLowerCase()}, ${copy.buyerService.toLowerCase()} жана ${copy.cargo.toLowerCase()} тууралуу ачык маалымат берет. ${copy.safeAccessBody}`
        : locale === "uz"
          ? `Dordoi.help ${copy.dordoiMarket.toLowerCase()}, ${copy.catalog.toLowerCase()}, ${copy.buyerService.toLowerCase()} va ${copy.cargo.toLowerCase()} haqida ochiq ma'lumot beradi. ${copy.safeAccessBody}`
          : `Dordoi.help дар бораи ${copy.dordoiMarket.toLowerCase()}, ${copy.catalog.toLowerCase()}, ${copy.buyerService.toLowerCase()} ва ${copy.cargo.toLowerCase()} маълумоти кушода медиҳад. ${copy.safeAccessBody}`;

  return localizedAnswer(locale, {
    title: pageTitle,
    paragraphs: [firstParagraph, copy.notSellerBody],
    links: [link("/catalog", "Каталог"), link("/how-it-works", "Как работает"), link("/faq", "FAQ")],
  });
}

export function catalogAnswer(locale: string): AiAnswerContent {
  const localized: Record<string, AiAnswerContent> = {
    kk: {
      title: title(locale),
      paragraphs: [
        "Dordoi.help каталогы Дордой нарығындағы санаттар мен жеткізушілерді табуға көмектеседі. Ашық беттерде негізгі сипаттама мен бағыттар көрінеді, ал сатушылардың нақты контактілері controlled access арқылы ашылады.",
      ],
      links: [link("/how-it-works", "Қалай жұмыс істейді"), link("/faq", "FAQ")],
    },
    kg: {
      title: title(locale),
      paragraphs: [
        "Dordoi.help каталогу Дордой базарындагы категорияларды жана жеткирүүчүлөрдү табууга жардам берет. Ачык беттерде негизги сүрөттөмө көрүнөт, ал эми сатуучулардын так контакттары controlled access аркылуу ачылат.",
      ],
      links: [link("/how-it-works", "Кантип иштейт"), link("/faq", "FAQ")],
    },
    uz: {
      title: title(locale),
      paragraphs: [
        "Dordoi.help katalogi Dordoy bozoridagi toifalar va yetkazib beruvchilarni topishga yordam beradi. Ochiq sahifalarda umumiy ma'lumot ko'rinadi, sotuvchilarning aniq kontaktlari esa controlled access orqali ochiladi.",
      ],
      links: [link("/how-it-works", "Qanday ishlaydi"), link("/faq", "FAQ")],
    },
    tj: {
      title: title(locale),
      paragraphs: [
        "Каталоги Dordoi.help барои ёфтани категорияҳо ва таъминкунандагони бозори Дордой кӯмак мекунад. Маълумоти умумӣ кушода аст, аммо контактҳои дақиқи фурӯшандагон танҳо тавассути controlled access кушода мешаванд.",
      ],
      links: [link("/how-it-works", "Чӣ тавр кор мекунад"), link("/faq", "FAQ")],
    },
  };
  return localizedAnswer(locale, localized[locale] ?? {
    title: title(locale),
    paragraphs: [
      "Каталог Dordoi.help помогает найти категории и поставщиков рынка Дордой. Часть информации доступна бесплатно, а контакты продавцов открываются через controlled access.",
    ],
    links: [link("/how-it-works", "Как работает доступ"), link("/faq", "FAQ")],
  });
}

export function suppliersAnswer(locale: string): AiAnswerContent {
  const localized: Record<string, AiAnswerContent> = {
    kk: {
      title: title(locale),
      paragraphs: [
        "Жеткізушілер бөлімі Дордой нарығындағы сатушылар мен санаттарды түсінуге көмектеседі. Приватті телефондар, мессенджерлер, әлеуметтік желілер және дәл орналасу ашық жарияланбайды.",
      ],
      links: [link("/catalog", "Каталог"), link("/for-buyers", "Сатып алушыларға")],
    },
    kg: {
      title: title(locale),
      paragraphs: [
        "Жеткирүүчүлөр бөлүмү Дордой базарындагы сатуучуларды жана категорияларды түшүнүүгө жардам берет. Купуя телефондор, мессенджерлер, социалдык шилтемелер жана так жайгашуу ачык жарыяланбайт.",
      ],
      links: [link("/catalog", "Каталог"), link("/for-buyers", "Сатып алуучуларга")],
    },
    uz: {
      title: title(locale),
      paragraphs: [
        "Yetkazib beruvchilar bo'limi Dordoy bozoridagi sotuvchilar va toifalar bo'yicha yo'nalish beradi. Maxfiy telefonlar, messenjerlar, ijtimoiy havolalar va aniq joylashuv ochiq e'lon qilinmaydi.",
      ],
      links: [link("/catalog", "Katalog"), link("/for-buyers", "Xaridorlarga")],
    },
    tj: {
      title: title(locale),
      paragraphs: [
        "Қисми таъминкунандагон барои фаҳмидани фурӯшандагон ва категорияҳои бозори Дордой кӯмак мекунад. Телефонҳо, мессенҷерҳо, шабакаҳои иҷтимоӣ ва ҷойгиршавии дақиқ кушода нашр намешаванд.",
      ],
      links: [link("/catalog", "Каталог"), link("/for-buyers", "Барои харидорон")],
    },
  };
  return localizedAnswer(locale, localized[locale] ?? {
    title: title(locale),
    paragraphs: [
      "Раздел поставщиков помогает ориентироваться в продавцах и категориях рынка Дордой. Приватные контакты защищены и не публикуются открыто.",
    ],
    links: [link("/catalog", "Открыть каталог"), link("/for-buyers", "Покупателям")],
  });
}

export function growthPageAnswer(locale: string, pageId: string): AiAnswerContent {
  const ru: Record<string, AiAnswerContent> = {
    about: {
      title: "Что такое Dordoi.help",
      paragraphs: [
        "Dordoi.help — онлайн-каталог для поиска поставщиков, категорий, байеров и карго-сценариев рынка Дордой. Сервис помогает оптовым покупателям из Кыргызстана, Казахстана, Узбекистана, Таджикистана, России и СНГ подготовиться к закупке без публикации приватных контактов продавцов в открытом доступе.",
        "Dordoi.help не является продавцом товара, единым карго-оператором или гарантом сделки. Цены, условия закупки, проверку товара и доставку покупатель согласует отдельно с поставщиком, байером или логистическим партнёром.",
      ],
      links: [link("/catalog", "Каталог"), link("/how-it-works", "Как работает"), link("/faq", "FAQ")],
    },
    "for-buyers": {
      title: title(locale),
      paragraphs: [
        "Dordoi.help помогает оптовым покупателям подготовиться к закупке на Дордое: выбрать категорию, изучить поставщиков, понять роль байера и карго. Контакты продавцов открываются только через controlled access.",
      ],
      links: [link("/catalog", "Каталог"), link("/buyer-service", "Байер"), link("/kargo-dordoi", "Карго")],
    },
    "for-sellers": {
      title: title(locale),
      paragraphs: [
        "Dordoi.help помогает продавцам рынка Дордой стать заметнее для покупателей из СНГ, сохраняя контроль над контактами. Публичная карточка объясняет ассортимент, а приватные каналы связи не должны попадать в открытый HTML или JSON-LD.",
      ],
      links: [link("/sell", "Размещение"), link("/faq", "FAQ")],
    },
    "how-it-works": {
      title: title(locale),
      paragraphs: [
        "Dordoi.help работает как маршрут закупки: выбрать категорию, сравнить открытые данные поставщиков, открыть доступ к контактам и согласовать закупку, байера или карго отдельно. Сервис не гарантирует сделку и не публикует закрытые контакты продавцов.",
      ],
      links: [link("/catalog", "Каталог"), link("/for-buyers", "Покупателям"), link("/faq", "FAQ")],
    },
    faq: {
      title: title(locale),
      paragraphs: [
        "FAQ Dordoi.help отвечает на базовые вопросы о поиске поставщиков, доступе к контактам, байерах, карго и безопасной закупке на рынке Дордой. Ответы не содержат списков телефонов, Telegram, Instagram или точных локаций продавцов.",
      ],
      links: [link("/how-it-works", "Как работает"), link("/catalog", "Каталог")],
    },
  };
  const localized = localizedGrowthPageAnswer(locale, pageId);
  if (localized) return localized;
  if (ru[pageId]) return localizedAnswer(locale, ru[pageId]);
  return localizedAnswer(locale, {
    title: title(locale),
    paragraphs: [
      "Dordoi.help помогает покупателям ориентироваться в рынке Дордой: находить категории, читать инструкции, переходить к каталогу, байерам и карго-сценариям. Условия цены, доставки и проверки всегда нужно уточнять отдельно.",
    ],
    links: [link("/catalog", "Каталог"), link("/faq", "FAQ")],
  });
}

export function coreLandingAnswer(locale: string, pageId: string): AiAnswerContent {
  if (pageId === "rynok-bishkek") {
    return localizedAnswer(locale, {
      title: title(locale),
      paragraphs: [
        locale === "uz"
          ? "Bishkek bozori bo'yicha bu sahifa ulgurji xaridorga Dordoy, toifalar, yetkazib beruvchilar, bayer va kargo yo'nalishlarini tushunishga yordam beradi. Sotuvchilarning maxfiy kontaktlari ochiq e'lon qilinmaydi."
          : locale === "kk"
            ? "Бішкек нарығы туралы бұл бет көтерме сатып алушыға Дордойды, санаттарды, жеткізушілерді, байерді және карго бағытын түсінуге көмектеседі. Сатушылардың приват контактілері ашық жарияланбайды."
            : locale === "kg"
              ? "Бишкек базары тууралуу бул бет оптом сатып алуучуга Дордойду, категорияларды, жеткирүүчүлөрдү, байерди жана карго багытын түшүнүүгө жардам берет. Сатуучулардын купуя контакттары ачык жарыяланбайт."
              : locale === "tj"
                ? "Ин саҳифа дар бораи бозори Бишкек ба харидори яклухт барои фаҳмидани Дордой, категорияҳо, таъминкунандагон, байер ва карго кӯмак мекунад. Контактҳои приватии фурӯшандагон кушода нашр намешаванд."
                : "Страница про рынок Бишкек помогает оптовому покупателю понять, когда идти к Дордою, как выбрать категорию, где искать поставщиков, когда нужен байер и как заранее продумать карго. Приватные контакты продавцов не публикуются открыто.",
      ],
      links: [link("/catalog", "Каталог"), link("/rynok-dordoi", "Рынок Дордой"), link("/buyer-service", "Байер")],
    });
  }
  if (pageId === "kargo-dordoi") {
    return localizedAnswer(locale, {
      title: title(locale),
      paragraphs: [
        locale === "uz"
          ? "Kargo Dordoydan tovar yetkazishni tashkil qilishda yordam berishi mumkin, lekin muddat, narx va shartlar yo'nalish, hajm, vazn va operatorga bog'liq."
          : locale === "kk"
            ? "Карго Дордойдан тауар жеткізуді ұйымдастыруға көмектеседі, бірақ мерзім, баға және шарттар бағытқа, көлемге, салмаққа және операторға байланысты."
            : locale === "kg"
              ? "Карго Дордойдон товар жеткирүүнү уюштурууга жардам берет, бирок мөөнөт, баа жана шарттар багытка, көлөмгө, салмакка жана операторго байланыштуу."
              : locale === "tj"
                ? "Карго метавонад интиқоли мол аз Дордойро ташкил кунад, аммо муҳлат, нарх ва шартҳо аз самт, ҳаҷм, вазн ва оператор вобастаанд."
                : "Карго помогает организовать доставку товаров с Дордоя, но сроки, стоимость и условия зависят от маршрута, объёма, веса и оператора.",
      ],
      links: [link("/catalog", "Каталог"), link("/buyer-service", "Байер"), link("/faq", "FAQ")],
    });
  }
  const copy = stage4Copy(locale);
  if (copy) {
    const body =
      locale === "kk"
        ? `Dordoi.help ${copy.dordoiMarket.toLowerCase()}, көтерме санаттар, ${copy.suppliers.toLowerCase()}, ${copy.buyerService.toLowerCase()} және ${copy.cargo.toLowerCase()} туралы түсіндіреді. ${copy.safeAccessBody}`
        : locale === "kg"
          ? `Dordoi.help ${copy.dordoiMarket.toLowerCase()}, оптом категориялар, ${copy.suppliers.toLowerCase()}, ${copy.buyerService.toLowerCase()} жана ${copy.cargo.toLowerCase()} тууралуу түшүндүрөт. ${copy.safeAccessBody}`
          : locale === "uz"
            ? `Dordoi.help ${copy.dordoiMarket.toLowerCase()}, ulgurji toifalar, ${copy.suppliers.toLowerCase()}, ${copy.buyerService.toLowerCase()} va ${copy.cargo.toLowerCase()} haqida tushuntiradi. ${copy.safeAccessBody}`
            : `Dordoi.help дар бораи ${copy.dordoiMarket.toLowerCase()}, категорияҳои яклухт, ${copy.suppliers.toLowerCase()}, ${copy.buyerService.toLowerCase()} ва ${copy.cargo.toLowerCase()} мефаҳмонад. ${copy.safeAccessBody}`;
    return localizedAnswer(locale, {
      title: title(locale),
      paragraphs: [body],
      links: [link("/catalog", "Каталог"), link("/for-buyers", "Покупателям"), link("/blog", "Гайды")],
    });
  }
  return localizedAnswer(locale, {
    title: title(locale),
    paragraphs: [
      "Dordoi.help объясняет рынок Дордой, оптовые категории, поставщиков, байеров и доставку для покупателей из СНГ. Контакты продавцов защищены и открываются только по правилам доступа.",
    ],
    links: [link("/catalog", "Каталог"), link("/for-buyers", "Покупателям"), link("/blog", "Гайды")],
  });
}

export function buyerServiceAnswer(locale: string): AiAnswerContent {
  return localizedAnswer(locale, {
    title: title(locale),
    paragraphs: [
      locale === "uz"
        ? "Bayer xaridorga tovar qidirish, tafsilotlarni aniqlash va xaridni tashkil qilishda yordam berishi mumkin, lekin ish shartlari va javobgarlik alohida kelishiladi."
        : locale === "kk"
          ? "Байер сатып алушыға тауар іздеу, детальдарды нақтылау және закупканы ұйымдастыруға көмектесе алады, бірақ жұмыс шарттары мен жауапкершілік бөлек келісіледі."
          : locale === "kg"
            ? "Байер сатып алуучуга товар издөө, деталдарды тактоо жана закупканы уюштурууга жардам бере алат, бирок шарттар жана жоопкерчилик өзүнчө макулдашылат."
            : locale === "tj"
              ? "Байер метавонад ба харидор дар ҷустуҷӯ, муайян кардани ҷузъиёт ва ташкил кардани харид кӯмак кунад, аммо шартҳо ва масъулият алоҳида мувофиқа мешаванд."
              : "Байер может помочь покупателю с поиском, уточнением деталей и организацией закупки, но условия работы и ответственность нужно согласовывать отдельно.",
    ],
    links: [link("/catalog", "Каталог"), link("/kargo-dordoi", "Карго"), link("/faq", "FAQ")],
  });
}

export function categoryAnswer(locale: string, categoryName: string): AiAnswerContent {
  return localizedAnswer(locale, {
    title: title(locale),
    paragraphs: [
      locale === "uz"
        ? `Bu kategoriya Dordoy bozorida "${categoryName}" yo'nalishi bo'yicha tovar va yetkazib beruvchilarni topishga yordam beradi. Sotuvchi bilan bog'lanish uchun Dordoi.help dagi kontaktlarga kirish jarayonidan foydalaning.`
        : locale === "kk"
          ? `Бұл категория Дордой нарығында "${categoryName}" бағыты бойынша тауарлар мен жеткізушілерді табуға көмектеседі. Сатушымен байланысу үшін Dordoi.help контактқа қолжетімділік процесін пайдаланыңыз.`
          : locale === "kg"
            ? `Бул категория Дордой базарында "${categoryName}" багыты боюнча товарларды жана жеткирүүчүлөрдү табууга жардам берет. Сатуучу менен байланышуу үчүн Dordoi.help контактка доступ процессин колдонуңуз.`
            : locale === "tj"
              ? `Ин категория барои ёфтани мол ва таъминкунандагон дар самти "${categoryName}" дар бозори Дордой кӯмак мекунад. Барои тамос бо фурӯшанда аз дастрасии контактҳо дар Dordoi.help истифода баред.`
              : `Эта категория помогает покупателям найти поставщиков и товары на рынке Дордой по направлению «${categoryName}». Для связи с продавцом используйте доступ к контактам на Dordoi.help.`,
    ],
    links: [link("/catalog", "Каталог"), link("/buyer-service", "Байер"), link("/kargo-dordoi", "Карго")],
  });
}

export function blogAnswer(locale: string, h1: string): AiAnswerContent {
  return localizedAnswer(locale, {
    title: title(locale),
    paragraphs: [
      locale === "uz"
        ? `Bu qo'llanma "${h1}" savoliga javob beradi va xaridorga Dordoy bozorida xavfsizroq birinchi qadam qilishga yordam beradi. Unda telefon yoki ijtimoiy tarmoq ro'yxatlari berilmaydi; kontaktlar rasmiy Dordoi.help sahifalari orqali ochiladi.`
        : locale === "kk"
          ? `Бұл нұсқаулық "${h1}" сұрағына жауап береді және сатып алушыға Дордой нарығында қауіпсіз алғашқы қадам жасауға көмектеседі. Мұнда телефон немесе әлеуметтік желі тізімдері жарияланбайды; контактілер Dordoi.help ресми беттері арқылы ашылады.`
          : locale === "kg"
            ? `Бул колдонмо "${h1}" суроосуна жооп берет жана сатып алуучуга Дордой базарында коопсуз биринчи кадам жасоого жардам берет. Бул жерде телефон же социалдык тармак тизмелери жарыяланбайт; контакттар Dordoi.help расмий беттери аркылуу ачылат.`
            : locale === "tj"
              ? `Ин роҳнамо ба саволи "${h1}" ҷавоб медиҳад ва ба харидор барои қадами аввалини бехатар дар бозори Дордой кӯмак мекунад. Дар ин ҷо рӯйхати телефон ё шабакаҳои иҷтимоӣ нашр намешавад; контактҳо тавассути саҳифаҳои расмии Dordoi.help кушода мешаванд.`
              : `Этот гид отвечает на вопрос «${h1}» и помогает покупателю безопаснее подготовиться к закупке на рынке Дордой. В материале нет списков телефонов или социальных сетей продавцов; для контактов используйте официальные страницы Dordoi.help.`,
    ],
    links: [link("/catalog", "Каталог"), link("/how-it-works", "Как работает"), link("/faq", "FAQ")],
  });
}
