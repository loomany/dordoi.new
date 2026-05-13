import type { RouteLocale } from "@/lib/seo/route-locale";

export type CategoryFaqItem = { question: string; answer: string };

type CategoryCopyLabels = {
  categoryName: string;
  categoryNameAcc: string;
};

const COPY_LABELS: Record<RouteLocale, (name: string, acc: string) => CategoryCopyLabels> = {
  ru: (categoryName, categoryNameAcc) => ({ categoryName, categoryNameAcc }),
  kk: (categoryName, categoryNameAcc) => ({ categoryName, categoryNameAcc }),
  kg: (categoryName, categoryNameAcc) => ({ categoryName, categoryNameAcc }),
  uz: (categoryName, categoryNameAcc) => ({ categoryName, categoryNameAcc }),
  tj: (categoryName, categoryNameAcc) => ({ categoryName, categoryNameAcc }),
};

function labels(locale: RouteLocale, categoryName: string, categoryNameAcc: string) {
  return COPY_LABELS[locale](categoryName, categoryNameAcc);
}

export function buildCategoryIntro(
  locale: RouteLocale,
  categoryName: string,
  categoryNameAcc: string,
): string {
  const { categoryName: n } = labels(locale, categoryName, categoryNameAcc);
  switch (locale) {
    case "ru":
      return `Поставщики категории «${n}» на рынке Дордой. Сравните ассортимент, условия работы и откройте профиль продавца через Dordoi.help.`;
    case "kk":
      return `Дордой нарығындағы «${n}» санаты жеткізушілері. Ассортимент пен шарттарды салыстырып, Dordoi.help арқылы сатушы профилін ашыңыз.`;
    case "kg":
      return `Дордой базарындагы «${n}» категориясындагы жеткирүүчүлөр. Ассортиментти жана шарттарды салыштырып, Dordoi.help аркылуу сатуучунун профилин ачыңыз.`;
    case "uz":
      return `Dordoy bozoridagi «${n}» toifasi yetkazib beruvchilari. Assortiment va shartlarni solishtiring, Dordoi.help orqali sotuvchi profilini oching.`;
    case "tj":
      return `Таъминкунандагони категорияи «${n}» дар бозори Дордой. Асортимент ва шартҳоро муқоиса кунед ва тавассути Dordoi.help профили фурӯшандаро кушоед.`;
  }
}

export function buildCategorySeoText(
  locale: RouteLocale,
  categoryName: string,
  _categoryNameAcc: string,
): string[] {
  const { categoryName: n } = labels(locale, categoryName, _categoryNameAcc);
  switch (locale) {
    case "ru":
      return [
        `Перед закупкой сравните ассортимент, формат работы, минимальную партию и условия отгрузки. Карточки Dordoi.help помогают быстро отобрать подходящих поставщиков категории «${n}» и перейти к профилю продавца.`,
        "Если вы не можете приехать на рынок лично, можно работать через байера: он помогает уточнить наличие, проверить товар и согласовать дальнейшие шаги. Условия выкупа и доставки зависят от направления и обсуждаются отдельно.",
      ];
    case "kk":
      return [
        `Сатып алмас бұрын ассортиментті, жұмыс форматын, минималды партияны және жөнелту шарттарын салыстырыңыз. Dordoi.help «${n}» санаты бойынша жеткізушілерді тез іріктеуге көмектеседі.`,
        "Нарыққа жеке бара алмасаңыз, байер арқылы жұмыс істеуге болады: ол тауарды тексеруге және келесі қадамдарды келісуге көмектеседі.",
      ];
    case "kg":
      return [
        `Сатып алуудан мурун ассортиментти, иш форматын, минималдуу партияны жана жөнөтүү шарттарын салыштырыңыз. Dordoi.help «${n}» категориясындагы жеткирүүчүлөрдү тез тандоого жардам берет.`,
        "Базарга жеке бара албасаңыз, байер аркылуу иштөөгө болот: ал товарды текшерүүгө жана кийинки кадамдарды макулдашууга жардам берет.",
      ];
    case "uz":
      return [
        `Xariddan oldin assortiment, ish formati, minimal partiya va jo'natish shartlarini solishtiring. Dordoi.help «${n}» toifasidagi yetkazib beruvchilarni tez tanlashga yordam beradi.`,
        "Bozorga shaxsan bora olmasangiz, xaridor orqali ishlash mumkin: u mavjudlikni aniqlash va keyingi qadamlarni kelishishga yordam beradi.",
      ];
    case "tj":
      return [
        `Пеш аз харид асортимент, формати кор, партияи минималӣ ва шартҳои интиқолро муқоиса кунед. Dordoi.help дар категорияи «${n}» таъминкунандаро зуд интихоб кардан кӯмак мекунад.`,
        "Агар ба бозор шахсан наравед, тавассути харидор кор кардан мумкин аст: ӯ мавҷудиятро санҷида, қадамҳои ояндаро мувофиқ мекунад.",
      ];
  }
}

export function buildCategoryFaq(
  locale: RouteLocale,
  categoryName: string,
  categoryNameAcc: string,
): CategoryFaqItem[] {
  const { categoryName: n, categoryNameAcc: acc } = labels(locale, categoryName, categoryNameAcc);
  switch (locale) {
    case "ru":
      return [
        {
          question: `Где найти поставщиков ${acc} на рынке Дордой?`,
          answer:
            "Используйте каталог Dordoi.help: откройте профили продавцов этой категории, сравните ассортимент и условия опта, затем запросите контакт через сервис.",
        },
        {
          question: `Можно ли закупать ${acc} оптом через Dordoi.help?`,
          answer:
            "Да. Каталог помогает найти оптовых продавцов на Дордое. Условия партии и отгрузки уточняются в профиле поставщика и при обращении через сервис.",
        },
        {
          question: `Что обычно есть в каталоге по категории «${n}»?`,
          answer:
            "Профили с описанием ассортимента, типом сделки и ориентирами по рынку. Контакт открывается через Dordoi.help — без публикации прямых контактов на странице.",
        },
        {
          question: "Как получить контакт поставщика?",
          answer:
            "Откройте профиль продавца в каталоге и воспользуйтесь кнопкой запроса контакта. Контакт открывается через сервис.",
        },
        {
          question: "Можно ли работать с байером на рынке Дордой?",
          answer:
            "Да. Раздел байеров и сервис Dordoi.help помогают подключить специалиста для проверки товара, подбора партии и согласования логистики.",
        },
      ];
    case "kk":
      return [
        {
          question: `Дордой нарығында ${acc} жеткізушілерін қайдан табуға болады?`,
          answer:
            "Dordoi.help каталогын пайдаланыңыз: осы санаттағы сатушы профильдерін ашып, салыстырыңыз, содан кейін қызмет арқылы байланыс сұраңыз.",
        },
        {
          question: `Dordoi.help арқылы ${acc} оптпен сатып алуға бола ма?`,
          answer:
            "Иә. Каталог Дордойдағы көтерме сатушыларды табуға көмектеседі. Партия мен жөнелту шарттары профильде нақтыланады.",
        },
        {
          question: `«${n}» санаты бойынша каталогта не болады?`,
          answer:
            "Ассортимент сипаттамасы, мәміле түрі және нарық бойынша бағдарлар бар профильдер. Байланыс қызмет арқылы ашылады.",
        },
        {
          question: "Жеткізуші контактісін қалай алуға болады?",
          answer: "Каталогтағы сатушы профилін ашып, байланыс сұрау батырмасын пайдаланыңыз.",
        },
        {
          question: "Дордой нарығында байермен жұмыс істеуге бола ма?",
          answer: "Иә. Байерлер бөлімі және Dordoi.help маманды қосуға көмектеседі.",
        },
      ];
    case "kg":
      return [
        {
          question: `Дордой базарында ${acc} жеткирүүчүлөрүн кайдан табууга болот?`,
          answer:
            "Dordoi.help каталогун колдонуңуз: профилдерди ачып, салыштырыңыз, кызмат аркылуу байланыш сураңыз.",
        },
        {
          question: `Dordoi.help аркылуу ${acc} опт менен сатып алууга болобу?`,
          answer: "Ооба. Каталог Дордойдогу опт сатуучуларды табууга жардам берет.",
        },
        {
          question: `«${n}» категориясында каталогдо эмне болот?`,
          answer: "Ассортимент сүрөттөмөсү жана рынок боюнча баскычтар бар профилдер. Байланыш кызмат аркылуу ачылат.",
        },
        {
          question: "Жеткирүүчүнүн байланышын кантип алса болот?",
          answer: "Сатуучунун профилин ачып, байланыш суроо баскычын колдонуңуз.",
        },
        {
          question: "Дордой базарында байер менен иштөөгө болобу?",
          answer: "Ооба. Байерлер бөлүмү жана Dordoi.help адисти кошууга жардам берет.",
        },
      ];
    case "uz":
      return [
        {
          question: `Dordoy bozorida ${acc} yetkazib beruvchilarini qayerdan topish mumkin?`,
          answer:
            "Dordoi.help katalogidan foydalaning: profillarni oching, solishtiring va xizmat orqali aloqa so'rang.",
        },
        {
          question: `Dordoi.help orqali ${acc} ulgurji xarid qilish mumkinmi?`,
          answer: "Ha. Katalog Dordoydagi ulgurji sotuvchilarni topishga yordam beradi.",
        },
        {
          question: `«${n}» toifasi bo'yicha katalogda nima bor?`,
          answer:
            "Assortiment tavsifi va bozor bo'yicha yo'riqnomalar bo'lgan profillar. Aloqa xizmat orqali ochiladi.",
        },
        {
          question: "Yetkazib beruvchi kontaktini qanday olish mumkin?",
          answer: "Sotuvchi profilini ochib, aloqa so'rash tugmasidan foydalaning.",
        },
        {
          question: "Dordoy bozorida xaridor bilan ishlash mumkinmi?",
          answer: "Ha. Xaridorlar bo'limi va Dordoi.help mutaxassisni jalb qilishga yordam beradi.",
        },
      ];
    case "tj":
      return [
        {
          question: `Дар бозори Дордой ${acc}-ро аз куҷо пайдо кардан мумкин аст?`,
          answer:
            "Аз каталоги Dordoi.help истифода баред: профилҳоро кушоед, муқоиса кунед ва тавассути хизмат тамос дархост кунед.",
        },
        {
          question: `Оё тавассути Dordoi.help ${acc} оптӣ харид кардан мумкин аст?`,
          answer: "Бале. Каталог ёри мерасад, ки фурӯшандагони оптии Дордойро пайдо кунед.",
        },
        {
          question: `Дар категорияи «${n}» дар каталог чӣ мавҷуд аст?`,
          answer: "Профилҳо бо тавсифи асортимент ва роҳнамоҳои бозор. Тамос тавассути хизмат кушода мешавад.",
        },
        {
          question: "Чӣ тавр контакти таъминкунандаро гирифтан мумкин аст?",
          answer: "Профили фурӯшандаро кушоед ва тугмаи дархости тамосро истифода баред.",
        },
        {
          question: "Оё дар бозори Дордой бо харидор кор кардан мумкин аст?",
          answer: "Бале. Қисми харидорҳо ва Dordoi.help кӯмак мекунад, ки мутахассисро ҷалб кунед.",
        },
      ];
  }
}
