import type {
  BlogPostContent,
  FaqItem,
  LinkItem,
  SeoContentSection,
  SeoGrowthPageContent,
} from "@/lib/seo/stage2-content";
import {
  blogPostPathForLocale,
  blogPostSlugForLocale,
  localizedBlogMeta,
} from "@/lib/seo/dordoi-blog-localized";
import type { RouteLocale } from "@/lib/seo/route-locale";
import { localizedCategoryHref } from "@/lib/seo/seo-internal-links";

type LocalizedRouteLocale = Exclude<RouteLocale, "ru">;

type LocaleCopy = {
  dordoiMarket: string;
  suppliers: string;
  catalog: string;
  buyers: string;
  sellers: string;
  buyerService: string;
  cargo: string;
  categories: string;
  countries: string;
  faq: string;
  how: string;
  blog: string;
  openCatalog: string;
  read: string;
  guide: string;
  guideEyebrow: string;
  nav: string;
  home: string;
  mainSections: string;
  usefulLinks: string;
  safeAccessTitle: string;
  safeAccessBody: string;
  notSellerBody: string;
  contactPrivacyBody: string;
};

const COPY: Record<LocalizedRouteLocale, LocaleCopy> = {
  kk: {
    dordoiMarket: "Дордой нарығы",
    suppliers: "Дордой жеткізушілері",
    catalog: "Жеткізушілер каталогы",
    buyers: "Сатып алушыларға",
    sellers: "Сатушыларға",
    buyerService: "Байер",
    cargo: "Дордой карго",
    categories: "Санаттар",
    countries: "Елдер",
    faq: "FAQ",
    how: "Қалай жұмыс істейді",
    blog: "Блог",
    openCatalog: "Каталогты ашу",
    read: "Оқу",
    guide: "Нұсқаулық",
    guideEyebrow: "Dordoi.help нұсқаулығы",
    nav: "Бағдарлау",
    home: "Басты бет",
    mainSections: "Негізгі бөлімдер",
    usefulLinks: "Пайдалы сілтемелер",
    safeAccessTitle: "Контактке қауіпсіз қолжетімділік",
    safeAccessBody:
      "Dordoi.help ашық беттерде сатушының нақты телефонын, мессенджерін, әлеуметтік сілтемесін және дәл орналасуын жарияламауы керек. Контакт әрекеттері сервис ережесі бойынша қолжетімділік ашылғаннан кейін ғана беріледі.",
    notSellerBody:
      "Dordoi.help тауарды өз атынан сатпайды және мәміленің тарапы емес. Сатып алушы баға, төлем, тексеру, партия және жеткізу шарттарын сатушымен, байермен немесе логистика серіктесімен бөлек келіседі.",
    contactPrivacyBody:
      "Бұл privacy-қағида сатушылардың деректерін қорғауға және сатып алушыға каталогтағы ашық ақпарат пен жабық контакт арасындағы айырманы түсіндіруге көмектеседі.",
  },
  kg: {
    dordoiMarket: "Дордой базары",
    suppliers: "Дордой жеткирүүчүлөрү",
    catalog: "Жеткирүүчүлөр каталогу",
    buyers: "Сатып алуучуларга",
    sellers: "Сатуучуларга",
    buyerService: "Байер",
    cargo: "Дордой карго",
    categories: "Категориялар",
    countries: "Өлкөлөр",
    faq: "FAQ",
    how: "Кантип иштейт",
    blog: "Блог",
    openCatalog: "Каталогду ачуу",
    read: "Окуу",
    guide: "Колдонмо",
    guideEyebrow: "Dordoi.help колдонмосу",
    nav: "Багыттоо",
    home: "Башкы бет",
    mainSections: "Негизги бөлүмдөр",
    usefulLinks: "Пайдалуу шилтемелер",
    safeAccessTitle: "Контактка коопсуз доступ",
    safeAccessBody:
      "Dordoi.help ачык беттерде сатуучунун так телефонун, мессенджерин, социалдык шилтемесин жана так жайгашуусун жарыялабашы керек. Контакт аракеттери сервистин эрежеси боюнча доступ ачылгандан кийин берилет.",
    notSellerBody:
      "Dordoi.help товарды өз атынан сатпайт жана келишимдин тарабы эмес. Сатып алуучу баа, төлөм, текшерүү, партия жана жеткирүү шарттарын сатуучу, байер же логистика өнөктөшү менен өзүнчө макулдашат.",
    contactPrivacyBody:
      "Бул privacy-эреже сатуучулардын маалыматтарын коргойт жана сатып алуучуга ачык маалымат менен жабык контакттын айырмасын түшүндүрөт.",
  },
  uz: {
    dordoiMarket: "Dordoy bozori",
    suppliers: "Dordoy yetkazib beruvchilari",
    catalog: "Yetkazib beruvchilar katalogi",
    buyers: "Xaridorlarga",
    sellers: "Sotuvchilarga",
    buyerService: "Xaridor-agent",
    cargo: "Dordoy kargo",
    categories: "Toifalar",
    countries: "Mamlakatlar",
    faq: "FAQ",
    how: "Qanday ishlaydi",
    blog: "Blog",
    openCatalog: "Katalogni ochish",
    read: "O'qish",
    guide: "Qo'llanma",
    guideEyebrow: "Dordoi.help qo'llanmasi",
    nav: "Navigatsiya",
    home: "Bosh sahifa",
    mainSections: "Asosiy bo'limlar",
    usefulLinks: "Foydali havolalar",
    safeAccessTitle: "Kontaktlarga xavfsiz kirish",
    safeAccessBody:
      "Dordoi.help ochiq sahifalarda sotuvchining aniq telefoni, messenjeri, ijtimoiy havolasi va aniq joylashuvini e'lon qilmasligi kerak. Kontakt amallari servis qoidalari bo'yicha kirish ochilgandan keyin beriladi.",
    notSellerBody:
      "Dordoi.help tovarni o'z nomidan sotmaydi va bitim tomoni emas. Xaridor narx, to'lov, tekshirish, partiya va yetkazish shartlarini sotuvchi, xaridor-agent yoki logistika hamkori bilan alohida kelishadi.",
    contactPrivacyBody:
      "Bu privacy qoidasi sotuvchilar ma'lumotlarini himoya qiladi va xaridorga ochiq ma'lumot bilan yopiq kontakt farqini tushuntiradi.",
  },
  tj: {
    dordoiMarket: "Бозори Дордой",
    suppliers: "Таъминкунандагони Дордой",
    catalog: "Каталоги таъминкунандагон",
    buyers: "Барои харидорон",
    sellers: "Барои фурӯшандагон",
    buyerService: "Байер",
    cargo: "Каргои Дордой",
    categories: "Категорияҳо",
    countries: "Кишварҳо",
    faq: "FAQ",
    how: "Чӣ тавр кор мекунад",
    blog: "Блог",
    openCatalog: "Кушодани каталог",
    read: "Хондан",
    guide: "Роҳнамо",
    guideEyebrow: "Роҳнамои Dordoi.help",
    nav: "Навигатсия",
    home: "Саҳифаи асосӣ",
    mainSections: "Қисмҳои асосӣ",
    usefulLinks: "Пайвандҳои муфид",
    safeAccessTitle: "Дастрасии бехатар ба контактҳо",
    safeAccessBody:
      "Dordoi.help набояд дар саҳифаҳои кушода телефони дақиқ, мессенҷер, шабакаи иҷтимоӣ ва ҷойгиршавии дақиқи фурӯшандаро нашр кунад. Амалҳои контактӣ баъд аз кушодани дастрасӣ тибқи қоидаҳои сервис дода мешаванд.",
    notSellerBody:
      "Dordoi.help молро аз номи худ намефурӯшад ва тарафи муомила нест. Харидор нарх, пардохт, санҷиш, партия ва интиқолро бо фурӯшанда, байер ё шарики логистика алоҳида мувофиқа мекунад.",
    contactPrivacyBody:
      "Ин қоидаи privacy маълумоти фурӯшандагонро муҳофизат мекунад ва ба харидор фарқи маълумоти кушода ва контакти бастаеро мефаҳмонад.",
  },
};

const LINK_LABELS: Record<LocalizedRouteLocale, Record<string, string>> = {
  kk: {
    "/catalog": "Каталог",
    "/suppliers": "Жеткізушілер",
    "/buyers": "Байерлер",
    "/buyer-service": "Байер",
    "/kargo-dordoi": "Карго",
    "/how-it-works": "Қалай жұмыс істейді",
    "/faq": "FAQ",
    "/for-buyers": "Сатып алушыларға",
    "/for-sellers": "Сатушыларға",
    "/sell": "Орналастыру",
    "/blog": "Блог",
    "/rynok-dordoi": "Дордой нарығы",
    "/dordoi-optom": "Дордой көтерме",
    "/dordoi-kazakhstan": "Қазақстан",
    "/dordoi-uzbekistan": "Өзбекстан",
    "/dordoi-tajikistan": "Тәжікстан",
    "/dordoi-russia": "Ресей",
    "/dordoi-kyrgyzstan": "Қырғызстан",
    "/categories/zhenskaya-odezhda-optom": "Әйелдер киімі",
    "/categories/muzhskaya-odezhda-optom": "Ерлер киімі",
    "/categories/detskaya-odezhda-optom": "Балалар киімі",
    "/categories/obuv-optom": "Аяқ киім",
    "/categories/tkani-shveynaya-furnitura-optom": "Маталар",
    "/categories/sumki-kozhgalantereya-optom": "Сөмкелер",
    "/categories/nizhnee-bele-kupalniki-optom": "Іш киім",
    "/categories/tekstil-dlya-doma-optom": "Үй тоқыма",
    "/categories/aksessuary-optom": "Аксессуарлар",
  },
  kg: {
    "/catalog": "Каталог",
    "/suppliers": "Жеткирүүчүлөр",
    "/buyers": "Байерлер",
    "/buyer-service": "Байер",
    "/kargo-dordoi": "Карго",
    "/how-it-works": "Кантип иштейт",
    "/faq": "FAQ",
    "/for-buyers": "Сатып алуучуларга",
    "/for-sellers": "Сатуучуларга",
    "/sell": "Жайгаштыруу",
    "/blog": "Блог",
    "/rynok-dordoi": "Дордой базары",
    "/dordoi-optom": "Дордой оптом",
    "/dordoi-kazakhstan": "Казакстан",
    "/dordoi-uzbekistan": "Өзбекстан",
    "/dordoi-tajikistan": "Тажикстан",
    "/dordoi-russia": "Россия",
    "/dordoi-kyrgyzstan": "Кыргызстан",
    "/categories/zhenskaya-odezhda-optom": "Аялдар кийими",
    "/categories/muzhskaya-odezhda-optom": "Эркектер кийими",
    "/categories/detskaya-odezhda-optom": "Балдар кийими",
    "/categories/obuv-optom": "Бут кийим",
    "/categories/tkani-shveynaya-furnitura-optom": "Кездемелер",
    "/categories/sumki-kozhgalantereya-optom": "Сумкалар",
    "/categories/nizhnee-bele-kupalniki-optom": "Ич кийим",
    "/categories/tekstil-dlya-doma-optom": "Үй текстили",
    "/categories/aksessuary-optom": "Аксессуарлар",
  },
  uz: {
    "/catalog": "Katalog",
    "/suppliers": "Yetkazib beruvchilar",
    "/buyers": "Xaridor-agentlar",
    "/buyer-service": "Xaridor-agent",
    "/kargo-dordoi": "Kargo",
    "/how-it-works": "Qanday ishlaydi",
    "/faq": "FAQ",
    "/for-buyers": "Xaridorlarga",
    "/for-sellers": "Sotuvchilarga",
    "/sell": "Joylashtirish",
    "/blog": "Blog",
    "/rynok-dordoi": "Dordoy bozori",
    "/dordoi-optom": "Dordoy ulgurji",
    "/dordoi-kazakhstan": "Qozog'iston",
    "/dordoi-uzbekistan": "O'zbekiston",
    "/dordoi-tajikistan": "Tojikiston",
    "/dordoi-russia": "Rossiya",
    "/dordoi-kyrgyzstan": "Qirg'iziston",
    "/categories/zhenskaya-odezhda-optom": "Ayollar kiyimi",
    "/categories/muzhskaya-odezhda-optom": "Erkaklar kiyimi",
    "/categories/detskaya-odezhda-optom": "Bolalar kiyimi",
    "/categories/obuv-optom": "Poyabzal",
    "/categories/tkani-shveynaya-furnitura-optom": "Mato",
    "/categories/sumki-kozhgalantereya-optom": "Sumkalar",
    "/categories/nizhnee-bele-kupalniki-optom": "Ichki kiyim",
    "/categories/tekstil-dlya-doma-optom": "Uy tekstili",
    "/categories/aksessuary-optom": "Aksessuarlar",
  },
  tj: {
    "/catalog": "Каталог",
    "/suppliers": "Таъминкунандагон",
    "/buyers": "Байерҳо",
    "/buyer-service": "Байер",
    "/kargo-dordoi": "Карго",
    "/how-it-works": "Чӣ тавр кор мекунад",
    "/faq": "FAQ",
    "/for-buyers": "Барои харидорон",
    "/for-sellers": "Барои фурӯшандагон",
    "/sell": "Ҷойгиркунӣ",
    "/blog": "Блог",
    "/rynok-dordoi": "Бозори Дордой",
    "/dordoi-optom": "Дордой опт",
    "/dordoi-kazakhstan": "Қазоқистон",
    "/dordoi-uzbekistan": "Ӯзбекистон",
    "/dordoi-tajikistan": "Тоҷикистон",
    "/dordoi-russia": "Русия",
    "/dordoi-kyrgyzstan": "Қирғизистон",
    "/categories/zhenskaya-odezhda-optom": "Либоси занона",
    "/categories/muzhskaya-odezhda-optom": "Либоси мардона",
    "/categories/detskaya-odezhda-optom": "Либоси кӯдак",
    "/categories/obuv-optom": "Пойафзал",
    "/categories/tkani-shveynaya-furnitura-optom": "Матоъ",
    "/categories/sumki-kozhgalantereya-optom": "Сумкаҳо",
    "/categories/nizhnee-bele-kupalniki-optom": "Либоси зер",
    "/categories/tekstil-dlya-doma-optom": "Матои хонагӣ",
    "/categories/aksessuary-optom": "Аксессуарҳо",
  },
};

export function stage4Copy(locale: string): LocaleCopy | undefined {
  if (locale === "ru") return undefined;
  return COPY[locale as LocalizedRouteLocale];
}

export function localizeLinkItem(locale: string, link: LinkItem): LinkItem {
  const labels = stage4Copy(locale) ? LINK_LABELS[locale as LocalizedRouteLocale] : undefined;
  const href = localizedCategoryHref(locale, link.href);
  const label = labels?.[link.href] ?? link.label;
  return href === link.href && label === link.label ? link : { href, label };
}

export function localizeLinkItems(locale: string, links: LinkItem[]): LinkItem[] {
  return links.map((link) => localizeLinkItem(locale, link));
}

export function localizeRelatedGroupTitle(locale: string, title: string): string {
  const copy = stage4Copy(locale);
  if (!copy) return title;
  if (/категор/i.test(title)) return copy.categories;
  if (/стран/i.test(title)) return copy.countries;
  return copy.mainSections;
}

function commonFaq(locale: LocalizedRouteLocale, copy: LocaleCopy): FaqItem[] {
  const questions = {
    kk: {
      seller: "Dordoi.help сатушы ма?",
      privacy: "Контакт privacy не үшін керек?",
    },
    kg: {
      seller: "Dordoi.help сатуучу болуп саналабы?",
      privacy: "Contact privacy эмне үчүн керек?",
    },
    uz: {
      seller: "Dordoi.help sotuvchimi?",
      privacy: "Kontakt privacy nima uchun kerak?",
    },
    tj: {
      seller: "Оё Dordoi.help фурӯшанда аст?",
      privacy: "Contact privacy барои чӣ лозим аст?",
    },
  }[locale];
  return [
    { question: copy.safeAccessTitle, answer: copy.safeAccessBody },
    { question: questions.seller, answer: copy.notSellerBody },
    { question: questions.privacy, answer: copy.contactPrivacyBody },
  ];
}

function primaryLinks(locale: LocalizedRouteLocale, hrefs: string[]): LinkItem[] {
  return hrefs.map((href) => localizeLinkItem(locale, { href, label: href }));
}

function coreSections(locale: LocalizedRouteLocale, copy: LocaleCopy): SeoContentSection[] {
  const stepText: Record<LocalizedRouteLocale, Array<{ title: string; body: string }>> = {
    kk: [
      { title: copy.categories, body: `Алдымен ${copy.catalog.toLowerCase()} немесе санат беттерін ашып, ассортимент пен жеткізуші профилін салыстырыңыз.` },
      { title: copy.buyerService, body: "Егер қашықтан сатып алсаңыз, байер тауарды тексеруге және партияны жинауға көмектеседі." },
      { title: copy.cargo, body: "Жеткізу бағыты, мерзім, тариф және жауапкершілік нақты серіктеспен бөлек келісіледі." },
      { title: copy.faq, body: copy.notSellerBody },
    ],
    kg: [
      { title: copy.categories, body: `Адегенде ${copy.catalog.toLowerCase()} же категория барактарын ачып, ассортиментти жана жеткирүүчүнүн профилин салыштырыңыз.` },
      { title: copy.buyerService, body: "Алыстан сатып алсаңыз, байер товарды текшерүүгө жана партияны чогултууга жардам берет." },
      { title: copy.cargo, body: "Жеткирүү багыты, мөөнөтү, тариф жана жоопкерчилик конкреттүү өнөктөш менен өзүнчө макулдашылат." },
      { title: copy.faq, body: copy.notSellerBody },
    ],
    uz: [
      { title: copy.categories, body: `Avval ${copy.catalog.toLowerCase()} yoki toifa sahifalarini ochib, assortiment va yetkazib beruvchi profilini solishtiring.` },
      { title: copy.buyerService, body: "Masofadan xarid qilsangiz, xaridor-agent tovarni tekshirish va partiyani yig'ishga yordam beradi." },
      { title: copy.cargo, body: "Yetkazish yo'nalishi, muddat, tarif va javobgarlik aniq hamkor bilan alohida kelishiladi." },
      { title: copy.faq, body: copy.notSellerBody },
    ],
    tj: [
      { title: copy.categories, body: `Аввал ${copy.catalog.toLowerCase()} ё саҳифаҳои категорияро кушоед ва ассортименту профили таъминкунандаро муқоиса кунед.` },
      { title: copy.buyerService, body: "Агар аз дур харид кунед, байер метавонад молро санҷад ва партияро ҷамъ кунад." },
      { title: copy.cargo, body: "Самт, муҳлат, тариф ва масъулияти интиқол бо шарики мушаххас алоҳида мувофиқа мешавад." },
      { title: copy.faq, body: copy.notSellerBody },
    ],
  };

  return [
    {
      title: copy.safeAccessTitle,
      body: [copy.safeAccessBody, copy.contactPrivacyBody],
    },
    {
      title: copy.how,
      items: stepText[locale],
    },
  ];
}

type CorePageText = Pick<
  SeoGrowthPageContent,
  "title" | "description" | "eyebrow" | "h1" | "intro"
>;

function corePageText(
  locale: LocalizedRouteLocale,
  id: string,
  copy: LocaleCopy,
): (CorePageText & { primaryLinks?: LinkItem[]; schemaType?: SeoGrowthPageContent["schemaType"] }) | undefined {
  const texts: Record<LocalizedRouteLocale, Record<string, CorePageText>> = {
    kk: {
      about: {
        title: `Dordoi.help - ${copy.suppliers}, ${copy.buyerService} және ${copy.cargo}`,
        description: `Dordoi.help ${copy.dordoiMarket.toLowerCase()} бойынша жеткізушілерді, санаттарды, байерлерді және карго бағыттарын табуға көмектеседі.`,
        eyebrow: copy.dordoiMarket,
        h1: `Dordoi.help - ${copy.dordoiMarket} бойынша каталог және нұсқаулық`,
        intro: `${copy.dordoiMarket} бойынша оптовиктерге арналған Dordoi.help каталогы жеткізушілерді, санаттарды, байерлерді, каргоны және елдер бойынша пайдалы беттерді бір құрылымға жинайды.`,
      },
      "how-it-works": {
        title: `Dordoi.help қалай жұмыс істейді - ${copy.catalog}, ${copy.buyerService}, ${copy.cargo}`,
        description: `${copy.catalog} арқылы санатты таңдау, жеткізушіні салыстыру, қолжетімділік ашу, байер немесе каргоны пайдалану қадамдары.`,
        eyebrow: copy.how,
        h1: "Dordoi.help қалай жұмыс істейді",
        intro: "Алдымен санатты таңдаңыз, жеткізушілерді салыстырыңыз, қажет болса контактке қолжетімділік ашыңыз, содан кейін сатушымен, байермен немесе карго серіктесімен шарттарды нақтылаңыз.",
      },
      "for-buyers": {
        title: `${copy.dordoiMarket}: сатып алушыларға арналған жеткізушілер, байер және карго`,
        description: `${copy.buyers}: Dordoi.help арқылы жеткізушілерді табу, контактіге қолжетімділік, байер және карго сценарийлері.`,
        eyebrow: copy.buyers,
        h1: `${copy.dordoiMarket} сатып алушыларына арналған Dordoi.help`,
        intro: `Бұл бет сатып алушыға ${copy.catalog.toLowerCase()} арқылы жеткізушілерді табуды, тегін көрінетін ақпаратты, қолжетімділіктен кейінгі қадамды, байер мен каргоны түсіндіреді.`,
      },
      "for-sellers": {
        title: `${copy.sellers}: Dordoi.help каталогына жеткізуші карточкасы`,
        description: `${copy.sellers}: карточка, санат, ашық сипаттама және contact privacy ережелері.`,
        eyebrow: copy.sellers,
        h1: `${copy.sellers}: Dordoi.help каталогында көріну`,
        intro: "Dordoi.help сатушыға ассортиментін түсінікті түрде көрсетуге және СНГ елдерінен келген сатып алушыларға табылуға көмектеседі. Жабық контакт деректері ашық бетке шығарылмауы керек.",
      },
      faq: {
        title: `Dordoi.help FAQ - ${copy.suppliers}, ${copy.buyerService}, ${copy.cargo}`,
        description: "Dordoi.help туралы жиі сұрақтар: жеткізушілер, контактке қолжетімділік, байер, карго және елдер бойынша сатып алу.",
        eyebrow: copy.faq,
        h1: "Dordoi.help FAQ",
        intro: "Бұл бөлім Dordoi.help қалай көмектесетінін, контакттер неге жабық екенін, байер мен карго қалай қолданылатынын және сатып алушы не күте алатынын түсіндіреді.",
      },
    },
    kg: {
      about: {
        title: `Dordoi.help - ${copy.suppliers}, ${copy.buyerService} жана ${copy.cargo}`,
        description: `Dordoi.help ${copy.dordoiMarket.toLowerCase()} боюнча жеткирүүчүлөрдү, категорияларды, байерлерди жана карго багыттарын табууга жардам берет.`,
        eyebrow: copy.dordoiMarket,
        h1: `Dordoi.help - ${copy.dordoiMarket} боюнча каталог жана жол көрсөткүч`,
        intro: `${copy.dordoiMarket} боюнча оптом сатып алуучулар үчүн Dordoi.help жеткирүүчүлөрдү, категорияларды, байерлерди, каргону жана өлкөлөр боюнча пайдалуу беттерди бир жерге топтойт.`,
      },
      "how-it-works": {
        title: `Dordoi.help кантип иштейт - ${copy.catalog}, ${copy.buyerService}, ${copy.cargo}`,
        description: `${copy.catalog} аркылуу категория тандоо, жеткирүүчүнү салыштыруу, доступ ачуу, байер же карго колдонуу кадамдары.`,
        eyebrow: copy.how,
        h1: "Dordoi.help кантип иштейт",
        intro: "Адегенде категорияны тандаңыз, жеткирүүчүлөрдү салыштырыңыз, керек болсо контактка доступ ачыңыз, андан кийин сатуучу, байер же карго өнөктөшү менен шарттарды тактаңыз.",
      },
      "for-buyers": {
        title: `${copy.dordoiMarket}: сатып алуучулар үчүн жеткирүүчүлөр, байер жана карго`,
        description: `${copy.buyers}: Dordoi.help аркылуу жеткирүүчүлөрдү табуу, контактка доступ, байер жана карго сценарийлери.`,
        eyebrow: copy.buyers,
        h1: `${copy.dordoiMarket} сатып алуучулары үчүн Dordoi.help`,
        intro: `Бул бет сатып алуучуга ${copy.catalog.toLowerCase()} аркылуу жеткирүүчүлөрдү табууну, акысыз көрүнгөн маалыматты, доступтан кийинки кадамды, байер жана каргону түшүндүрөт.`,
      },
      "for-sellers": {
        title: `${copy.sellers}: Dordoi.help каталогунда жеткирүүчү карточкасы`,
        description: `${copy.sellers}: карточка, категория, ачык сүрөттөмө жана contact privacy эрежелери.`,
        eyebrow: copy.sellers,
        h1: `${copy.sellers}: Dordoi.help каталогунда көрүнүү`,
        intro: "Dordoi.help сатуучуга ассортиментин түшүнүктүү көрсөтүүгө жана СНГ өлкөлөрүнөн келген сатып алуучуларга табылууга жардам берет. Жабык контакт маалыматтары ачык бетке чыгарылбашы керек.",
      },
      faq: {
        title: `Dordoi.help FAQ - ${copy.suppliers}, ${copy.buyerService}, ${copy.cargo}`,
        description: "Dordoi.help боюнча көп берилген суроолор: жеткирүүчүлөр, контактка доступ, байер, карго жана өлкөлөр боюнча сатып алуу.",
        eyebrow: copy.faq,
        h1: "Dordoi.help FAQ",
        intro: "Бул бөлүм Dordoi.help кантип жардам берерин, контакттар эмне үчүн жабык экенин, байер жана карго кантип колдонуларын түшүндүрөт.",
      },
    },
    uz: {
      about: {
        title: `Dordoi.help - ${copy.suppliers}, ${copy.buyerService} va ${copy.cargo}`,
        description: `Dordoi.help ${copy.dordoiMarket.toLowerCase()} bo'yicha yetkazib beruvchilar, toifalar, xaridor-agentlar va kargo yo'nalishlarini topishga yordam beradi.`,
        eyebrow: copy.dordoiMarket,
        h1: `Dordoi.help - ${copy.dordoiMarket} bo'yicha katalog va qo'llanma`,
        intro: `${copy.dordoiMarket} bo'yicha ulgurji xaridorlar uchun Dordoi.help yetkazib beruvchilar, toifalar, xaridor-agentlar, kargo va mamlakat sahifalarini bir tuzilmaga jamlaydi.`,
      },
      "how-it-works": {
        title: `Dordoi.help qanday ishlaydi - ${copy.catalog}, ${copy.buyerService}, ${copy.cargo}`,
        description: `${copy.catalog} orqali toifa tanlash, yetkazib beruvchini solishtirish, kontaktga kirish, xaridor-agent yoki kargo ishlatish qadamlari.`,
        eyebrow: copy.how,
        h1: "Dordoi.help qanday ishlaydi",
        intro: "Avval toifani tanlang, yetkazib beruvchilarni solishtiring, kerak bo'lsa kontaktga kirishni oching, keyin sotuvchi, xaridor-agent yoki kargo hamkori bilan shartlarni aniqlang.",
      },
      "for-buyers": {
        title: `${copy.dordoiMarket}: xaridorlar uchun yetkazib beruvchilar, agent va kargo`,
        description: `${copy.buyers}: Dordoi.help orqali yetkazib beruvchilarni topish, kontaktga kirish, xaridor-agent va kargo ssenariylari.`,
        eyebrow: copy.buyers,
        h1: `${copy.dordoiMarket} xaridorlari uchun Dordoi.help`,
        intro: `Bu sahifa xaridorga ${copy.catalog.toLowerCase()} orqali yetkazib beruvchilarni topish, bepul ko'rinadigan ma'lumot, kirishdan keyingi qadam, xaridor-agent va kargoni tushuntiradi.`,
      },
      "for-sellers": {
        title: `${copy.sellers}: Dordoi.help katalogida yetkazib beruvchi kartasi`,
        description: `${copy.sellers}: karta, toifa, ochiq tavsif va contact privacy qoidalari.`,
        eyebrow: copy.sellers,
        h1: `${copy.sellers}: Dordoi.help katalogida ko'rinish`,
        intro: "Dordoi.help sotuvchiga assortimentini tushunarli ko'rsatish va MDH mamlakatlaridan xaridorlar topishiga yordam beradi. Yopiq kontakt ma'lumotlari ochiq sahifaga chiqarilmasligi kerak.",
      },
      faq: {
        title: `Dordoi.help FAQ - ${copy.suppliers}, ${copy.buyerService}, ${copy.cargo}`,
        description: "Dordoi.help bo'yicha savollar: yetkazib beruvchilar, kontaktga kirish, xaridor-agent, kargo va mamlakatlar bo'yicha xarid.",
        eyebrow: copy.faq,
        h1: "Dordoi.help FAQ",
        intro: "Bu bo'lim Dordoi.help qanday yordam berishini, kontaktlar nima uchun yopiq ekanini, xaridor-agent va kargo qanday ishlatilishini tushuntiradi.",
      },
    },
    tj: {
      about: {
        title: `Dordoi.help - ${copy.suppliers}, ${copy.buyerService} ва ${copy.cargo}`,
        description: `Dordoi.help барои ${copy.dordoiMarket.toLowerCase()} таъминкунандагон, категорияҳо, байерҳо ва самтҳои каргоро ёфтан кӯмак мекунад.`,
        eyebrow: copy.dordoiMarket,
        h1: `Dordoi.help - каталог ва роҳнамо барои ${copy.dordoiMarket}`,
        intro: `Барои харидорони оптӣ Dordoi.help таъминкунандагон, категорияҳо, байерҳо, карго ва саҳифаҳои кишварҳоро дар як сохтор ҷамъ мекунад.`,
      },
      "how-it-works": {
        title: `Dordoi.help чӣ тавр кор мекунад - ${copy.catalog}, ${copy.buyerService}, ${copy.cargo}`,
        description: `Қадамҳо: интихоб кардани категория, муқоисаи таъминкунанда, кушодани дастрасӣ, истифодаи байер ё карго.`,
        eyebrow: copy.how,
        h1: "Dordoi.help чӣ тавр кор мекунад",
        intro: "Аввал категорияро интихоб кунед, таъминкунандагонро муқоиса кунед, агар лозим бошад дастрасӣ ба контактро кушоед, баъд шартҳоро бо фурӯшанда, байер ё шарики карго аниқ кунед.",
      },
      "for-buyers": {
        title: `${copy.dordoiMarket}: таъминкунандагон, байер ва карго барои харидорон`,
        description: `${copy.buyers}: ёфтани таъминкунандагон тавассути Dordoi.help, дастрасӣ ба контакт, байер ва карго.`,
        eyebrow: copy.buyers,
        h1: `Dordoi.help барои харидорони ${copy.dordoiMarket}`,
        intro: `Ин саҳифа ба харидор мефаҳмонад, ки чӣ тавр тавассути ${copy.catalog.toLowerCase()} таъминкунанда ёфта, маълумоти кушодаро бинад ва баъд аз дастрасӣ ба қадами нав гузарад.`,
      },
      "for-sellers": {
        title: `${copy.sellers}: корти таъминкунанда дар каталоги Dordoi.help`,
        description: `${copy.sellers}: корт, категория, тавсифи кушода ва қоидаҳои contact privacy.`,
        eyebrow: copy.sellers,
        h1: `${copy.sellers}: намоён шудан дар каталоги Dordoi.help`,
        intro: "Dordoi.help ба фурӯшанда кӯмак мекунад, ки ассортиментро фаҳмо нишон диҳад ва барои харидорони кишварҳои СНГ ёфт шавад. Контактҳои баста набояд дар саҳифаи кушода нишон дода шаванд.",
      },
      faq: {
        title: `Dordoi.help FAQ - ${copy.suppliers}, ${copy.buyerService}, ${copy.cargo}`,
        description: "Саволҳо дар бораи Dordoi.help: таъминкунандагон, дастрасӣ ба контакт, байер, карго ва харид аз кишварҳо.",
        eyebrow: copy.faq,
        h1: "Dordoi.help FAQ",
        intro: "Ин бахш мефаҳмонад, ки Dordoi.help чӣ тавр кӯмак мекунад, чаро контактҳо бастаанд ва байер ё карго чӣ гуна истифода мешавад.",
      },
    },
  };

  return texts[locale][id];
}

function buildCorePage(
  content: SeoGrowthPageContent,
  locale: LocalizedRouteLocale,
): SeoGrowthPageContent | undefined {
  const copy = COPY[locale];
  const text = corePageText(locale, content.id, copy);
  if (!text) return undefined;
  const base = {
    ...content,
    primaryLinks: primaryLinks(locale, ["/catalog", "/how-it-works", "/for-buyers"]),
    sections: coreSections(locale, copy),
    faq: commonFaq(locale, copy),
  };

  switch (content.id) {
    case "about":
      return {
        ...base,
        ...text,
        schemaType: "AboutPage",
      };
    case "how-it-works":
      return {
        ...base,
        ...text,
        primaryLinks: primaryLinks(locale, ["/catalog", "/buyer-service", "/kargo-dordoi"]),
      };
    case "for-buyers":
      return {
        ...base,
        ...text,
        primaryLinks: primaryLinks(locale, ["/catalog", "/buyer-service", "/kargo-dordoi"]),
      };
    case "for-sellers":
      return {
        ...base,
        ...text,
        primaryLinks: primaryLinks(locale, ["/sell", "/catalog", "/faq"]),
      };
    case "faq":
      return {
        ...base,
        ...text,
        primaryLinks: primaryLinks(locale, ["/catalog", "/how-it-works", "/for-buyers"]),
      };
    default:
      return undefined;
  }
}

const COUNTRY_NAMES: Record<LocalizedRouteLocale, Record<string, string>> = {
  kk: {
    "dordoi-kazakhstan": "Қазақстан",
    "dordoi-uzbekistan": "Өзбекстан",
    "dordoi-tajikistan": "Тәжікстан",
    "dordoi-russia": "Ресей",
    "dordoi-kyrgyzstan": "Қырғызстан",
  },
  kg: {
    "dordoi-kazakhstan": "Казакстан",
    "dordoi-uzbekistan": "Өзбекстан",
    "dordoi-tajikistan": "Тажикстан",
    "dordoi-russia": "Россия",
    "dordoi-kyrgyzstan": "Кыргызстан",
  },
  uz: {
    "dordoi-kazakhstan": "Qozog'iston",
    "dordoi-uzbekistan": "O'zbekiston",
    "dordoi-tajikistan": "Tojikiston",
    "dordoi-russia": "Rossiya",
    "dordoi-kyrgyzstan": "Qirg'iziston",
  },
  tj: {
    "dordoi-kazakhstan": "Қазоқистон",
    "dordoi-uzbekistan": "Ӯзбекистон",
    "dordoi-tajikistan": "Тоҷикистон",
    "dordoi-russia": "Русия",
    "dordoi-kyrgyzstan": "Қирғизистон",
  },
};

function buildCountryPage(
  content: SeoGrowthPageContent,
  locale: LocalizedRouteLocale,
): SeoGrowthPageContent | undefined {
  const copy = COPY[locale];
  const country = COUNTRY_NAMES[locale][content.id];
  if (!country) return undefined;
  const countryText = {
    kk: {
      title: `Дордой ${country} үшін: ${copy.suppliers}, ${copy.buyerService} және ${copy.cargo}`,
      description: `${country} сатып алушылары үшін Дордой нарығынан жеткізушілерді, санаттарды, байерді және жеткізу сценарийін табу.`,
      h1: `Дордой ${country} сатып алушылары үшін`,
      intro: `${country} бағыты бойынша сатып алушылар Dordoi.help арқылы Дордойдағы санаттарды, жеткізушілерді, байер көмегін және карго сценарийлерін алдын ала түсіне алады.`,
      findTitle: `${country} сатып алушылары не таба алады`,
      goods: "Киім, аяқ киім, мата, сөмке, аксессуар және басқа коммерциялық санаттар.",
      buyer: "Қашықтан сатып алғанда тауарды көру, фото алу және партияны тексеру.",
      cargo: `${country} бағыты бойынша жеткізу шарттарын бөлек нақтылау.`,
      privacy: "Жабық контакттер ашық бетте жарияланбайды.",
      startTitle: "Сатып алуды қалай бастау керек",
      startBody: `Алдымен ${copy.catalog.toLowerCase()} немесе санат бетін ашыңыз, бірнеше жеткізушіні салыстырыңыз, содан кейін контактке қолжетімділік, байер немесе карго керек пе екенін шешіңіз.`,
      q1: `${country} үшін Дордойдан жеткізуші табуға бола ма?`,
      a1: "Иә. Dordoi.help санаттар мен каталог арқылы бастапқы іздеуді жеңілдетеді.",
      q2: "Қашықтан сатып алуға бола ма?",
      a2: "Иә, бірақ тексеру, төлем, партия және жеткізу шарттары бөлек келісіліп, қажет болса байер қосылады.",
      q3: "Карго шарттары дайын ба?",
      a3: "Жоқ, нақты мерзім мен тариф бағытқа, салмаққа, көлемге және серіктеске байланысты.",
    },
    kg: {
      title: `Дордой ${country} үчүн: ${copy.suppliers}, ${copy.buyerService} жана ${copy.cargo}`,
      description: `${country} сатып алуучулары үчүн Дордой базарынан жеткирүүчүлөрдү, категорияларды, байерди жана жеткирүү сценарийин табуу.`,
      h1: `Дордой ${country} сатып алуучулары үчүн`,
      intro: `${country} багыты боюнча сатып алуучулар Dordoi.help аркылуу Дордойдогу категорияларды, жеткирүүчүлөрдү, байер жардамын жана карго сценарийлерин алдын ала түшүнө алышат.`,
      findTitle: `${country} сатып алуучулары эмнени таба алат`,
      goods: "Кийим, бут кийим, кездеме, сумка, аксессуар жана башка коммерциялык категориялар.",
      buyer: "Алыстан сатып алганда товарды көрүү, фото алуу жана партияны текшерүү.",
      cargo: `${country} багыты боюнча жеткирүү шарттарын өзүнчө тактоо.`,
      privacy: "Жабык контакттар ачык бетте жарыяланбайт.",
      startTitle: "Сатып алууну кантип баштоо керек",
      startBody: `Адегенде ${copy.catalog.toLowerCase()} же категория барагын ачыңыз, бир нече жеткирүүчүнү салыштырыңыз, андан кийин контактка доступ, байер же карго керекпи чечиңиз.`,
      q1: `${country} үчүн Дордойдон жеткирүүчү табууга болобу?`,
      a1: "Ооба. Dordoi.help категориялар жана каталог аркылуу баштапкы издөөңүздү жеңилдетет.",
      q2: "Алыстан сатып алууга болобу?",
      a2: "Ооба, бирок текшерүү, төлөм, партия жана жеткирүү шарттары өзүнчө макулдашылат.",
      q3: "Карго шарттары даярбы?",
      a3: "Жок, так мөөнөт жана тариф багытка, салмакка, көлөмгө жана өнөктөшкө байланыштуу.",
    },
    uz: {
      title: `Dordoy ${country} uchun: ${copy.suppliers}, ${copy.buyerService} va ${copy.cargo}`,
      description: `${country} xaridorlari uchun Dordoy bozoridan yetkazib beruvchilar, toifalar, xaridor-agent va yetkazish ssenariysi.`,
      h1: `Dordoy ${country} xaridorlari uchun`,
      intro: `${country} yo'nalishidagi xaridorlar Dordoi.help orqali Dordoydagi toifalar, yetkazib beruvchilar, xaridor-agent yordami va kargo ssenariylarini oldindan tushunishi mumkin.`,
      findTitle: `${country} xaridorlari nimalarni topishi mumkin`,
      goods: "Kiyim, poyabzal, mato, sumka, aksessuar va boshqa tijoriy toifalar.",
      buyer: "Masofadan xaridda tovarni ko'rish, foto olish va partiyani tekshirish.",
      cargo: `${country} yo'nalishi bo'yicha yetkazish shartlarini alohida aniqlash.`,
      privacy: "Yopiq kontaktlar ochiq sahifada e'lon qilinmaydi.",
      startTitle: "Xaridni qanday boshlash kerak",
      startBody: `Avval ${copy.catalog.toLowerCase()} yoki toifa sahifasini oching, bir nechta yetkazib beruvchini solishtiring, keyin kontaktga kirish, xaridor-agent yoki kargo kerakligini hal qiling.`,
      q1: `${country} uchun Dordoydan yetkazib beruvchi topish mumkinmi?`,
      a1: "Ha. Dordoi.help toifalar va katalog orqali dastlabki qidiruvni osonlashtiradi.",
      q2: "Masofadan xarid qilish mumkinmi?",
      a2: "Ha, lekin tekshirish, to'lov, partiya va yetkazish shartlari alohida kelishiladi.",
      q3: "Kargo shartlari tayyormi?",
      a3: "Yo'q, aniq muddat va tarif yo'nalish, vazn, hajm va hamkorga bog'liq.",
    },
    tj: {
      title: `Дордой барои ${country}: ${copy.suppliers}, ${copy.buyerService} ва ${copy.cargo}`,
      description: `Барои харидорони ${country}: таъминкунандагон, категорияҳо, байер ва сенарияи интиқол аз бозори Дордой.`,
      h1: `Дордой барои харидорони ${country}`,
      intro: `Харидорони самти ${country} метавонанд тавассути Dordoi.help категорияҳо, таъминкунандагон, кӯмаки байер ва сенарияҳои каргоро пешакӣ фаҳманд.`,
      findTitle: `Харидорони ${country} чӣ ёфта метавонанд`,
      goods: "Либос, пойафзал, матоъ, сумка, аксессуарҳо ва дигар категорияҳои тиҷоратӣ.",
      buyer: "Ҳангоми хариди дурдаст дидани мол, гирифтани акс ва санҷиши партия.",
      cargo: `Аниқ кардани шартҳои интиқол барои самти ${country}.`,
      privacy: "Контактҳои баста дар саҳифаи кушода нашр намешаванд.",
      startTitle: "Харидро чӣ тавр оғоз кардан лозим",
      startBody: `Аввал ${copy.catalog.toLowerCase()} ё саҳифаи категорияро кушоед, чанд таъминкунандаро муқоиса кунед, баъд дастрасӣ ба контакт, байер ё каргоро интихоб кунед.`,
      q1: `Оё барои ${country} аз Дордой таъминкунанда ёфтан мумкин аст?`,
      a1: "Бале. Dordoi.help тавассути категорияҳо ва каталог ҷустуҷӯи аввалияро осон мекунад.",
      q2: "Оё аз дур харидан мумкин аст?",
      a2: "Бале, аммо санҷиш, пардохт, партия ва интиқол бояд алоҳида мувофиқа шавад.",
      q3: "Оё шартҳои карго тайёранд?",
      a3: "Не, муҳлат ва тариф ба самт, вазн, ҳаҷм ва шарик вобаста аст.",
    },
  }[locale];

  return {
    ...content,
    title: countryText.title,
    description: countryText.description,
    eyebrow: country,
    h1: countryText.h1,
    intro: countryText.intro,
    primaryLinks: primaryLinks(locale, ["/catalog", "/buyer-service", "/kargo-dordoi"]),
    sections: [
      {
        title: countryText.findTitle,
        items: [
          { title: copy.catalog, body: countryText.goods },
          { title: copy.buyerService, body: countryText.buyer },
          { title: copy.cargo, body: countryText.cargo },
          { title: copy.safeAccessTitle, body: countryText.privacy },
        ],
      },
      {
        title: countryText.startTitle,
        body: [
          countryText.startBody,
          copy.notSellerBody,
        ],
      },
    ],
    faq: [
      { question: countryText.q1, answer: countryText.a1 },
      { question: countryText.q2, answer: countryText.a2 },
      { question: countryText.q3, answer: countryText.a3 },
    ],
    keywords: [country, copy.dordoiMarket, copy.catalog, copy.cargo],
  };
}

export function localizeSeoGrowthPageContent(
  content: SeoGrowthPageContent,
  locale: RouteLocale,
): SeoGrowthPageContent {
  if (locale === "ru") return content;
  const routeLocale = locale as LocalizedRouteLocale;
  return (
    buildCorePage(content, routeLocale) ??
    buildCountryPage(content, routeLocale) ??
    content
  );
}

type BlogLocalizedSeed = {
  title: string;
  description: string;
  h1: string;
  excerpt: string;
  sections: SeoContentSection[];
  faq: FaqItem[];
  keywords: string[];
};

function buildBlogSeed(slug: string, locale: LocalizedRouteLocale): BlogLocalizedSeed | undefined {
  const copy = COPY[locale];
  const localized: Record<LocalizedRouteLocale, Record<string, Omit<BlogLocalizedSeed, "faq" | "keywords">>> = {
    kk: {
      "kak-nayti-postavshchika-dordoi": {
        title: `${copy.dordoiMarket}: жеткізушіні қалай табуға болады`,
        description: "Dordoi.help арқылы санатты таңдау, жеткізушілерді салыстыру, контактке қолжетімділік және қауіпсіз алғашқы тексеру.",
        h1: `${copy.dordoiMarket} жеткізушісін қалай табуға болады`,
        excerpt: "Санаттан бастап жеткізуші профиліне дейінгі практикалық жол: не салыстыру керек, нені сұрау керек және контакттер неге жабық.",
        sections: [
          { title: copy.categories, body: ["Алдымен нақты тауар санатын таңдаңыз: киім, аяқ киім, мата, сөмке, аксессуар немесе басқа бағыт. Санат беті жеткізушілерді салыстыруға көмектеседі."] },
          { title: "Жеткізушіні салыстыру", body: ["Карточкадағы сипаттама, фото, ассортимент бағыты, опт форматы және сатып алушыға түсінікті ақпарат маңызды. Бір ғана нұсқамен шектелмей, бірнеше профильді салыстырыңыз."] },
          { title: copy.safeAccessTitle, body: [copy.safeAccessBody, copy.notSellerBody] },
        ],
      },
      "kargo-dordoi-kak-rabotaet-dostavka": {
        title: `${copy.cargo}: Дордойдан жеткізу қалай жұмыс істейді`,
        description: "Дордойдан жеткізуге дайындалу: жеткізуші, байер, партияны тексеру, карго бағыты және қауіпсіз келісу.",
        h1: `${copy.cargo}: жеткізу қалай жұмыс істейді`,
        excerpt: "Дордойдан тауар жібермес бұрын партия, қаптама, бағыт, мерзім және жауапкершілікті нақтылау керек.",
        sections: [
          { title: "Партияны нақтылау", body: ["Каргоға дейін тауардың нақты тізімі, саны, өлшемі, түсі және қаптамасы келісілгені дұрыс. Қашықтан сатып алғанда байер тексеруге көмектесе алады."] },
          { title: copy.cargo, body: ["Жеткізу мерзімі мен тарифі елге, қалаға, салмаққа, көлемге және таңдалған серіктеске байланысты."] },
          { title: "Қауіпсіздік", body: [copy.notSellerBody, "Фото, тізім, қаптама және қабылдау нүктесі туралы келісімді жазбаша сақтаңыз."] },
        ],
      },
      "kak-kupit-optom-na-dordoe": {
        title: `${copy.dordoiMarket}: оптом қалай сатып алуға болады`,
        description: "Дордойдан оптом сатып алу: санат, жеткізуші, партия, байер, тексеру және жеткізу қадамдары.",
        h1: `${copy.dordoiMarket} оптом қалай сатып алуға болады`,
        excerpt: "Бірінші оптом сатып алуға дайындалу: сұранысты жазу, жеткізушілерді салыстыру, партияны тексеру және жеткізуді жоспарлау.",
        sections: [
          { title: "Сұранысты дайындау", body: ["Қандай тауар, қандай өлшем, қандай бюджет, қандай мерзім және қандай елге жеткізу керегін алдын ала жазыңыз."] },
          { title: copy.catalog, body: ["Каталог пен санат беттері арқылы бірнеше жеткізушіні салыстырып, фото, ассортимент, минималды партия және қолда бар тауарды нақтылаңыз."] },
          { title: "Тексеру және жеткізу", body: ["Бірінші партияда байер арқылы тексеру және карго шарттарын алдын ала келісу пайдалы."] },
        ],
      },
    },
    kg: {
      "kak-nayti-postavshchika-dordoi": {
        title: `${copy.dordoiMarket}: жеткирүүчүнү кантип табуу керек`,
        description: "Dordoi.help аркылуу категория тандоо, жеткирүүчүлөрдү салыштыруу, контактка доступ жана коопсуз биринчи текшерүү.",
        h1: `${copy.dordoiMarket} жеткирүүчүсүн кантип табуу керек`,
        excerpt: "Категориядан жеткирүүчү профилине чейинки практикалык жол: эмнени салыштыруу жана эмнени суроо керек.",
        sections: [
          { title: copy.categories, body: ["Алдымен так товар категориясын тандаңыз: кийим, бут кийим, кездеме, сумка, аксессуар же башка багыт."] },
          { title: "Жеткирүүчүнү салыштыруу", body: ["Карточкадагы сүрөттөмө, фото, ассортимент багыты, опт форматы жана сатып алуучуга түшүнүктүү маалымат маанилүү."] },
          { title: copy.safeAccessTitle, body: [copy.safeAccessBody, copy.notSellerBody] },
        ],
      },
      "kargo-dordoi-kak-rabotaet-dostavka": {
        title: `${copy.cargo}: Дордойдон жеткирүү кантип иштейт`,
        description: "Дордойдон жеткирүүгө даярдануу: жеткирүүчү, байер, партияны текшерүү, карго багыты жана коопсуз макулдашуу.",
        h1: `${copy.cargo}: жеткирүү кантип иштейт`,
        excerpt: "Дордойдон товар жөнөтүүдөн мурун партия, таңгак, багыт, мөөнөт жана жоопкерчиликти тактаңыз.",
        sections: [
          { title: "Партияны тактоо", body: ["Каргого чейин товар тизмеси, саны, өлчөмү, түсү жана таңгактары макулдашылганы жакшы."] },
          { title: copy.cargo, body: ["Жеткирүү мөөнөтү жана тарифи өлкөгө, шаарга, салмакка, көлөмгө жана өнөктөшкө байланыштуу."] },
          { title: "Коопсуздук", body: [copy.notSellerBody, "Фото, тизме, таңгак жана кабыл алуу пункту боюнча макулдашууну жазуу түрүндө сактаңыз."] },
        ],
      },
      "kak-kupit-optom-na-dordoe": {
        title: `${copy.dordoiMarket}: оптом кантип сатып алуу керек`,
        description: "Дордойдон оптом сатып алуу: категория, жеткирүүчү, партия, байер, текшерүү жана жеткирүү кадамдары.",
        h1: `${copy.dordoiMarket} оптом кантип сатып алуу керек`,
        excerpt: "Биринчи оптом сатып алууга даярдануу: суроо-талап жазуу, жеткирүүчүлөрдү салыштыруу жана жеткирүүнү пландоо.",
        sections: [
          { title: "Суроо-талапты даярдоо", body: ["Кайсы товар, кайсы өлчөм, бюджет, мөөнөт жана кайсы өлкөгө жеткирүү керек экенин алдын ала жазыңыз."] },
          { title: copy.catalog, body: ["Каталог жана категория барактары аркылуу бир нече жеткирүүчүнү салыштырып, фото, ассортимент жана минималдуу партияны тактаңыз."] },
          { title: "Текшерүү жана жеткирүү", body: ["Биринчи партияда байер аркылуу текшерүү жана карго шарттарын алдын ала макулдашуу пайдалуу."] },
        ],
      },
    },
    uz: {
      "kak-nayti-postavshchika-dordoi": {
        title: `${copy.dordoiMarket}: yetkazib beruvchini qanday topish kerak`,
        description: "Dordoi.help orqali toifa tanlash, yetkazib beruvchilarni solishtirish, kontaktga kirish va xavfsiz birinchi tekshiruv.",
        h1: `${copy.dordoiMarket} yetkazib beruvchisini qanday topish kerak`,
        excerpt: "Toifadan yetkazib beruvchi profiliga qadar amaliy yo'l: nimani solishtirish, nimani so'rash va kontaktlar nima uchun yopiq.",
        sections: [
          { title: copy.categories, body: ["Avval aniq tovar toifasini tanlang: kiyim, poyabzal, mato, sumka, aksessuar yoki boshqa yo'nalish."] },
          { title: "Yetkazib beruvchini solishtirish", body: ["Karta tavsifi, foto, assortiment yo'nalishi, ulgurji format va xaridor uchun tushunarli ma'lumot muhim."] },
          { title: copy.safeAccessTitle, body: [copy.safeAccessBody, copy.notSellerBody] },
        ],
      },
      "kargo-dordoi-kak-rabotaet-dostavka": {
        title: `${copy.cargo}: Dordoydan yetkazish qanday ishlaydi`,
        description: "Dordoydan yetkazishga tayyorgarlik: yetkazib beruvchi, xaridor-agent, partiyani tekshirish, kargo yo'nalishi va xavfsiz kelishuv.",
        h1: `${copy.cargo}: yetkazish qanday ishlaydi`,
        excerpt: "Dordoydan tovar yuborishdan oldin partiya, qadoq, yo'nalish, muddat va javobgarlikni aniqlang.",
        sections: [
          { title: "Partiyani aniqlash", body: ["Kargodan oldin tovar ro'yxati, soni, o'lchami, rangi va qadoqlari kelishilgani yaxshi."] },
          { title: copy.cargo, body: ["Yetkazish muddati va tarifi mamlakat, shahar, vazn, hajm va tanlangan hamkorga bog'liq."] },
          { title: "Xavfsizlik", body: [copy.notSellerBody, "Foto, ro'yxat, qadoq va qabul qilish nuqtasi haqidagi kelishuvni yozma saqlang."] },
        ],
      },
      "kak-kupit-optom-na-dordoe": {
        title: `${copy.dordoiMarket}: ulgurji qanday xarid qilish kerak`,
        description: "Dordoydan ulgurji xarid: toifa, yetkazib beruvchi, partiya, xaridor-agent, tekshiruv va yetkazish qadamlari.",
        h1: `${copy.dordoiMarket} ulgurji qanday xarid qilish kerak`,
        excerpt: "Birinchi ulgurji xaridga tayyorgarlik: so'rov yozish, yetkazib beruvchilarni solishtirish va yetkazishni rejalash.",
        sections: [
          { title: "So'rovni tayyorlash", body: ["Qanday tovar, o'lcham, budjet, muddat va qaysi mamlakatga yetkazish kerakligini oldindan yozing."] },
          { title: copy.catalog, body: ["Katalog va toifa sahifalari orqali bir nechta yetkazib beruvchini solishtirib, foto, assortiment va minimal partiyani aniqlang."] },
          { title: "Tekshirish va yetkazish", body: ["Birinchi partiyada xaridor-agent orqali tekshirish va kargo shartlarini oldindan kelishish foydali."] },
        ],
      },
    },
    tj: {
      "kak-nayti-postavshchika-dordoi": {
        title: `${copy.dordoiMarket}: чӣ тавр таъминкунанда ёфтан мумкин`,
        description: "Интихоби категория, муқоисаи таъминкунандагон, дастрасӣ ба контакт ва санҷиши аввал тавассути Dordoi.help.",
        h1: `Чӣ тавр таъминкунандаи ${copy.dordoiMarket}-ро ёфтан мумкин`,
        excerpt: "Роҳи амалӣ аз категория то профили таъминкунанда: чиро муқоиса кардан ва чиро пурсидан лозим.",
        sections: [
          { title: copy.categories, body: ["Аввал категорияи дақиқро интихоб кунед: либос, пойафзал, матоъ, сумка, аксессуар ё самти дигар."] },
          { title: "Муқоисаи таъминкунанда", body: ["Тавсиф, акс, самти ассортимент, формати опт ва маълумоти фаҳмо барои харидор муҳим аст."] },
          { title: copy.safeAccessTitle, body: [copy.safeAccessBody, copy.notSellerBody] },
        ],
      },
      "kargo-dordoi-kak-rabotaet-dostavka": {
        title: `${copy.cargo}: интиқол аз Дордой чӣ тавр кор мекунад`,
        description: "Омодагӣ ба интиқол аз Дордой: таъминкунанда, байер, санҷиши партия, самти карго ва мувофиқаи бехатар.",
        h1: `${copy.cargo}: интиқол чӣ тавр кор мекунад`,
        excerpt: "Пеш аз фиристодани мол аз Дордой партия, бастабандӣ, самт, муҳлат ва масъулиятро аниқ кунед.",
        sections: [
          { title: "Аниқ кардани партия", body: ["Пеш аз карго рӯйхат, шумора, андоза, ранг ва бастабандии мол бояд мувофиқа шавад."] },
          { title: copy.cargo, body: ["Муҳлат ва тариф ба кишвар, шаҳр, вазн, ҳаҷм ва шарики интихобшуда вобаста аст."] },
          { title: "Бехатарӣ", body: [copy.notSellerBody, "Аксҳо, рӯйхат, бастабандӣ ва нуқтаи қабулро хаттӣ нигоҳ доред."] },
        ],
      },
      "kak-kupit-optom-na-dordoe": {
        title: `${copy.dordoiMarket}: чӣ тавр опт харидан мумкин`,
        description: "Хариди оптӣ аз Дордой: категория, таъминкунанда, партия, байер, санҷиш ва интиқол.",
        h1: `Чӣ тавр аз ${copy.dordoiMarket} опт харидан мумкин`,
        excerpt: "Омодагӣ ба хариди аввал: навиштани дархост, муқоисаи таъминкунандагон ва банақшагирии интиқол.",
        sections: [
          { title: "Омода кардани дархост", body: ["Пешакӣ нависед: кадом мол, андоза, буҷет, муҳлат ва ба кадом кишвар интиқол лозим аст."] },
          { title: copy.catalog, body: ["Тавассути каталог ва категорияҳо чанд таъминкунандаро муқоиса карда, акс, ассортимент ва партияи минималиро аниқ кунед."] },
          { title: "Санҷиш ва интиқол", body: ["Барои партия аввал санҷиш тавассути байер ва мувофиқаи шартҳои карго фоидаовар аст."] },
        ],
      },
    },
  };

  const seed = localized[locale][slug];
  if (!seed) return undefined;
  return {
    ...seed,
    faq: commonFaq(locale, copy),
    keywords: [copy.dordoiMarket, copy.catalog, copy.cargo],
  };
}

export function localizeBlogPostContent(
  post: BlogPostContent,
  locale: RouteLocale,
): BlogPostContent {
  const sourceSlug = post.sourceSlug ?? post.slug;
  const localizedPath = blogPostPathForLocale(sourceSlug, locale);
  const localizedSlug = blogPostSlugForLocale(sourceSlug, locale);

  if (locale === "ru") {
    return {
      ...post,
      sourceSlug,
      slug: localizedSlug,
      path: localizedPath,
    };
  }

  const localizedLocale = locale as LocalizedRouteLocale;
  const seed = buildBlogSeed(sourceSlug, localizedLocale);
  const meta = localizedBlogMeta(sourceSlug, locale);

  if (!seed && !meta) {
    return {
      ...post,
      sourceSlug,
      slug: localizedSlug,
      path: localizedPath,
    };
  }

  if (!seed && meta) {
    const copy = COPY[localizedLocale];
    return {
      ...post,
      sourceSlug,
      slug: localizedSlug,
      path: localizedPath,
      title: meta.title,
      description: meta.description,
      h1: meta.h1,
      excerpt: meta.excerpt,
      keywords: [meta.keyword, copy.dordoiMarket, copy.catalog, copy.cargo],
      sections: buildGenericLocalizedBlogSections(localizedLocale, meta.topic, copy),
      faq: commonFaq(localizedLocale, copy),
    };
  }

  return {
    ...post,
    ...seed,
    sourceSlug,
    slug: localizedSlug,
    path: localizedPath,
  };
}

function buildGenericLocalizedBlogSections(
  locale: LocalizedRouteLocale,
  topic: string,
  copy: LocaleCopy,
): SeoContentSection[] {
  const localized: Record<LocalizedRouteLocale, SeoContentSection[]> = {
    kk: [
      {
        title: "Бұл материал кімге пайдалы",
        body: [
          `${topic} тақырыбы Дордой нарығынан тауар, жеткізуші, байер немесе карго іздейтін сатып алушыларға керек. Материал бірінші қадамды жүйелеуге көмектеседі: санатты таңдау, бірнеше ұсынысты салыстыру, сұрақтарды дайындау және жеткізу бағытын алдын ала түсіну.`,
          "Dordoi.help ашық каталог пен SEO беттер арқылы бастапқы ақпарат береді. Нақты телефондар, мессенджерлер, әлеуметтік желілер және дәл орналасу ашық HTML, JSON-LD немесе sitemap ішінде жарияланбайды.",
        ],
      },
      {
        title: "Қалай әрекет ету керек",
        items: [
          { title: "Санатты нақтылаңыз", body: "Тауар түрін, өлшемді, маусымды, партия көлемін және жеткізу елін алдын ала жазыңыз." },
          { title: "Бірнеше жеткізушіні салыстырыңыз", body: "Бір карточкамен шектелмей, сипаттама, фото, ассортимент және жұмыс форматын салыстырыңыз." },
          { title: "Сұрақтарды дайындаңыз", body: "Қолда бар тауар, минималды партия, төлем, қаптама және каргоға тапсыру шарттарын сұраңыз." },
          { title: "Қашықтан сатып алсаңыз", body: "Байер немесе өкіл арқылы фотоесеп пен тауарды тексеру шарттарын алдын ала келісіңіз." },
        ],
      },
      {
        title: "Dordoi.help қалай көмектеседі",
        body: [
          `${copy.catalog}, ${copy.categories}, ${copy.buyerService} және ${copy.cargo} бөлімдері сатып алушыға іздеуді қысқартуға көмектеседі. Пайдаланушы алдымен ашық ақпаратты көреді, содан кейін ережелерге сай контактқа қолжетімділік аша алады.`,
          copy.notSellerBody,
        ],
      },
      {
        title: "Қауіпсіздік чек-парағы",
        items: [
          { title: "Бағаны бекітіңіз", body: "Баға маусымға, партияға, сапаға, валютаға және нақты жеткізушінің шарттарына байланысты өзгеруі мүмкін." },
          { title: "Фото мен тізім сұраңыз", body: "Позициялар тізімі, өлшемдер, түстер, қаптама және фотоесепті жазбаша сақтаңыз." },
          { title: "Кепілдік ретінде қабылдамаңыз", body: "Каталог ақпарат береді, бірақ мәміле, жеткізу және тексеру шарттарын тараптар бөлек келіседі." },
          { title: "Контакт privacy сақталады", body: copy.safeAccessBody },
        ],
      },
    ],
    kg: [
      {
        title: "Бул материал кимге пайдалуу",
        body: [
          `${topic} темасы Дордой базарынан товар, жеткирүүчү, байер же карго издеген сатып алуучуларга керек. Максат - биринчи кадамды иретке келтирүү: категория тандоо, бир нече вариантты салыштыруу, суроолорду даярдоо жана жеткирүү багытын түшүнүү.`,
          "Dordoi.help ачык каталог жана SEO барактар аркылуу баштапкы маалымат берет. Так телефон, мессенджер, социалдык шилтеме жана так жайгашуу ачык HTML, JSON-LD же sitemap ичинде жарыяланбайт.",
        ],
      },
      {
        title: "Кантип иш кылуу керек",
        items: [
          { title: "Категорияны тактаңыз", body: "Товар түрүн, өлчөмдү, сезонду, партия көлөмүн жана жеткирүү өлкөсүн алдын ала жазыңыз." },
          { title: "Бир нече жеткирүүчүнү салыштырыңыз", body: "Бир карточка менен токтоп калбай, сүрөттөмө, фото, ассортимент жана иш форматын салыштырыңыз." },
          { title: "Суроолорду даярдаңыз", body: "Наличие, минималдуу партия, төлөм, таңгак жана каргого өткөрүү шарттарын сураңыз." },
          { title: "Аралыктан сатып алсаңыз", body: "Байер же өкүл аркылуу фотоотчет жана товарды текшерүү шарттарын алдын ала макулдашыңыз." },
        ],
      },
      {
        title: "Dordoi.help кантип жардам берет",
        body: [
          `${copy.catalog}, ${copy.categories}, ${copy.buyerService} жана ${copy.cargo} бөлүмдөрү сатып алуучуга издөө жолун кыскартууга жардам берет. Колдонуучу адегенде ачык маалыматты көрөт, андан кийин эрежеге ылайык контактка доступ ача алат.`,
          copy.notSellerBody,
        ],
      },
      {
        title: "Коопсуздук чек-барагы",
        items: [
          { title: "Бааны тактаңыз", body: "Баалар сезонго, партияга, сапатка, валютага жана конкреттүү жеткирүүчүнүн шартына жараша өзгөрүшү мүмкүн." },
          { title: "Фото жана тизме сураңыз", body: "Позициялар тизмесин, өлчөмдөрдү, түстөрдү, таңгакты жана фотоотчетту жазуу түрүндө сактаңыз." },
          { title: "Кепилдик деп эсептебеңиз", body: "Каталог маалымат берет, бирок келишим, жеткирүү жана текшерүү шарттарын тараптар өзүнчө макулдашат." },
          { title: "Contact privacy сакталат", body: copy.safeAccessBody },
        ],
      },
    ],
    uz: [
      {
        title: "Bu qo'llanma kimga kerak",
        body: [
          `${topic} mavzusi Dordoy bozoridan tovar, yetkazib beruvchi, bayer yoki kargo izlayotgan xaridorlar uchun foydali. Maqsad - birinchi qadamni tartibga solish: toifani tanlash, bir nechta variantni solishtirish, savollar tayyorlash va yetkazish yo'nalishini tushunish.`,
          "Dordoi.help ochiq katalog va SEO sahifalar orqali boshlang'ich ma'lumot beradi. Aniq telefon, messenjer, ijtimoiy havola va aniq joylashuv ochiq HTML, JSON-LD yoki sitemap ichida e'lon qilinmaydi.",
        ],
      },
      {
        title: "Qanday harakat qilish kerak",
        items: [
          { title: "Toifani aniqlang", body: "Tovar turi, o'lcham, mavsum, partiya hajmi va yetkazish mamlakatini oldindan yozing." },
          { title: "Bir nechta yetkazib beruvchini solishtiring", body: "Bitta karta bilan cheklanmay, tavsif, foto, assortiment va ish formatini solishtiring." },
          { title: "Savollar tayyorlang", body: "Mavjud tovar, minimal partiya, to'lov, qadoq va kargoga topshirish shartlarini so'rang." },
          { title: "Masofadan xarid qilsangiz", body: "Bayer yoki vakil orqali foto hisobot va tovarni tekshirish shartlarini oldindan kelishing." },
        ],
      },
      {
        title: "Dordoi.help qanday yordam beradi",
        body: [
          `${copy.catalog}, ${copy.categories}, ${copy.buyerService} va ${copy.cargo} bo'limlari xaridorga qidiruvni qisqartirishga yordam beradi. Avval ochiq ma'lumot ko'riladi, keyin servis qoidalari bo'yicha kontaktga kirish ochilishi mumkin.`,
          copy.notSellerBody,
        ],
      },
      {
        title: "Xavfsizlik chek-ro'yxati",
        items: [
          { title: "Narxni aniqlang", body: "Narx mavsum, partiya, sifat, valyuta va aniq yetkazib beruvchi shartlariga bog'liq o'zgarishi mumkin." },
          { title: "Foto va ro'yxat so'rang", body: "Pozitsiyalar ro'yxati, o'lchamlar, ranglar, qadoq va foto hisobotni yozma saqlang." },
          { title: "Kafolat deb qabul qilmang", body: "Katalog ma'lumot beradi, lekin bitim, yetkazish va tekshirish shartlarini tomonlar alohida kelishadi." },
          { title: "Kontakt privacy saqlanadi", body: copy.safeAccessBody },
        ],
      },
    ],
    tj: [
      {
        title: "Ин роҳнамо барои кист",
        body: [
          `${topic} барои харидороне муфид аст, ки аз бозори Дордой мол, таъминкунанда, байер ё карго меҷӯянд. Ҳадаф - қадами аввалро ба тартиб даровардан: интихоб кардани категория, муқоисаи чанд вариант, омода кардани саволҳо ва фаҳмидани самти интиқол.`,
          "Dordoi.help тавассути каталог ва саҳифаҳои SEO маълумоти аввалия медиҳад. Телефон, мессенҷер, шабакаи иҷтимоӣ ва ҷойгиршавии дақиқ дар HTML, JSON-LD ё sitemap-и кушода нашр намешавад.",
        ],
      },
      {
        title: "Чӣ тавр амал кардан лозим",
        items: [
          { title: "Категорияро муайян кунед", body: "Навъи мол, андоза, мавсим, ҳаҷми партия ва кишвари интиқолро пешакӣ нависед." },
          { title: "Чанд таъминкунандаро муқоиса кунед", body: "Бо як карточка маҳдуд нашавед: тавсиф, акс, ассортимент ва формати корро муқоиса кунед." },
          { title: "Саволҳоро омода кунед", body: "Мавҷудият, партия минималӣ, пардохт, бастабандӣ ва супоридан ба каргоро пурсед." },
          { title: "Агар фосилавӣ мехаред", body: "Шартҳои фотоҳисобот ва санҷиши молро тавассути байер ё намоянда пешакӣ мувофиқа кунед." },
        ],
      },
      {
        title: "Dordoi.help чӣ гуна кӯмак мекунад",
        body: [
          `${copy.catalog}, ${copy.categories}, ${copy.buyerService} ва ${copy.cargo} ба харидор барои кӯтоҳ кардани ҷустуҷӯ кӯмак мекунанд. Корбар аввал маълумоти кушодаро мебинад, баъд тибқи қоидаҳои сервис дастрасӣ ба контактро кушода метавонад.`,
          copy.notSellerBody,
        ],
      },
      {
        title: "Чек-листи бехатарӣ",
        items: [
          { title: "Нархро аниқ кунед", body: "Нарх аз мавсим, партия, сифат, асъор ва шартҳои таъминкунандаи мушаххас вобаста буда метавонад." },
          { title: "Акс ва рӯйхат пурсед", body: "Рӯйхати позицияҳо, андозаҳо, рангҳо, бастабандӣ ва фотоҳисоботро хаттӣ нигоҳ доред." },
          { title: "Инро кафолат ҳисоб накунед", body: "Каталог маълумот медиҳад, аммо шартҳои муомила, интиқол ва санҷишро тарафҳо алоҳида мувофиқа мекунанд." },
          { title: "Contact privacy нигоҳ дошта мешавад", body: copy.safeAccessBody },
        ],
      },
    ],
  };

  return localized[locale].map((section) => ({
    ...section,
    body: section.body?.map((paragraph) =>
      paragraph.replace(/Dordoi\.help/g, "Dordoi.help"),
    ),
  }));
}
