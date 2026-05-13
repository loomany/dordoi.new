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
  const { categoryName: n, categoryNameAcc: acc } = labels(locale, categoryName, categoryNameAcc);
  switch (locale) {
    case "ru":
      return `На рынке Дордой в Бишкеке сосредоточены десятки продавцов категории «${n}»: от небольших павильонов до шоурумов с широким ассортиментом. Dordoi.help помогает покупателям из Кыргызстана, Казахстана, Узбекистана, Таджикистана и других стран найти подходящего поставщика без хаотичного обхода ряда. В каталоге собраны опубликованные профили продавцов с описанием ассортимента, условиями опта и навигацией по рынку. Вы можете сравнить несколько точек, открыть профиль поставщика и запросить контакт через сервис — без публикации прямых телефонов и мессенджеров в открытом HTML. Для закупки ${acc} удобно сочетать каталог с разделом байеров: специалист на месте помогает проверить товар, собрать партию и согласовать логистику. Условия минимальной партии, наличие образцов и сроки отгрузки уточняются у конкретного продавца через профиль.`;
    case "kk":
      return `Бішкектегі Дордой нарығында «${n}» санаты бойынша ондаған сатушы бар: кіші павильондардан кең ассортименті бар шоурумдарға дейін. Dordoi.help сатып алушыларға қатарды кездейсоқ араламастан сәйкес жеткізушіні табуға көмектеседі. Каталогта ассортимент сипаттамасы, опт шарттары және нарық навигациясы бар жарияланған сатушы профильдері жинақталған. Бірнеше нүктені салыстырып, жеткізуші профилін ашып, қызмет арқылы байланыс сұрауға болады — ашық HTML-да тікелей телефондар мен мессенджерлер жарияланбайды. ${acc} сатып алу үшін каталогты сатып алушы бөлімімен бірге пайдалану ыңғайлы: маман тауарды тексеруге, партия жинауға және логистиканы келісуге көмектеседі.`;
    case "kg":
      return `Бишкектеги Дордой базарында «${n}» категориясындагы ондагон сатуучу бар: кичине павильондордон кең ассортименти бар шоурумдарга чейин. Dordoi.help сатып алуучуларга катарды кокустук араламай туура жеткирүүчүнү табууга жардам берет. Каталогдо ассортимент сүрөттөмөсү, опт шарттары жана базар навигациясы бар жарыяланган сатуучу профилдери топтолгон. Бир нече чекитти салыштырып, жеткирүүчүнүн профилин ачып, кызмат аркылуу байланыш сураса болот — ачык HTMLде түз телефондор жана мессенджерлер жарыяланбайт. ${acc} сатып алуу үчүн каталогду сатып алуучу бөлүмү менен бирге колдонуу ыңгайлуу.`;
    case "uz":
      return `Bishkekdagi Dordoy bozorida «${n}» toifasi bo'yicha o'nlab sotuvchilar mavjud: kichik pavilyonlardan keng assortimentli shourumlargacha. Dordoi.help xaridorlarga qatorni tasodifiy aylanmasdan mos yetkazib beruvchini topishga yordam beradi. Katalogda assortiment tavsifi, ulgurji shartlari va bozor navigatsiyasi bo'lgan e'lon qilingan sotuvchi profillari jamlangan. Bir nechta nuqtani solishtirib, yetkazib beruvchi profilini ochib, xizmat orqali aloqa so'rashingiz mumkin — ochiq HTMLda to'g'ridan-to'g'ri telefon va messenjerlar e'lon qilinmaydi. ${acc} xarid qilish uchun katalogni xaridorlar bo'limi bilan birga ishlatish qulay.`;
    case "tj":
      return `Дар бозори Дордой дар Бишкек дар категорияи «${n}» даҳҳо фурӯшанда ҳастанд: аз павильонҳои хурд то шоурумҳо бо асортименти васеъ. Dordoi.help ба харидорон кӯмак мекунад, ки бе гашти тасодуфӣ таъминкунандаи мувофиқро пайдо кунанд. Дар каталог профилҳои фурӯшандагони нашршуда бо тавсифи асортимент, шартҳои оптӣ ва навигацияи бозор ҷамъ аст. Шумо метавонед якчанд нуқтаро муқоиса кунед, профили таъминкунандаро кушоед ва тавассути хизмат тамос дархост кунед — телефонҳо ва мессенҷерҳои мустақим дар HTML-и ошкоро нашр намешаванд. Барои хариди ${acc} каталогро бо қисми харидорҳо истифода бурдан мувофиқ аст.`;
  }
}

export function buildCategorySeoText(
  locale: RouteLocale,
  categoryName: string,
  categoryNameAcc: string,
): string {
  const { categoryName: n, categoryNameAcc: acc } = labels(locale, categoryName, categoryNameAcc);
  switch (locale) {
    case "ru":
      return `Категория «${n}» на рынке Дордой — одна из самых востребованных среди оптовых покупателей из СНГ. Поставщики предлагают разные форматы работы: от классического опта с минимальной партией до смешанных моделей, когда в одной точке можно подобрать и розничные позиции для теста спроса. Dordoi.help не заменяет личный осмотр товара, но сокращает время на первичный поиск: в каталоге видны описание ассортимента, ориентиры по ряду и тип сделки. Для ${acc} покупатели часто приезжают в Бишкек сами, подключают байера на месте или заказывают подбор дистанционно. Сервис помогает открыть профиль продавца и запросить контакт в защищённом потоке — без публикации Instagram, Telegram, WhatsApp и телефонов в публичной разметке. Перед закупкой имеет смысл уточнить MOQ, наличие образцов, варианты упаковки и сроки отгрузки. Если нужна доставка в другой город или страну, условия зависят от направления и обсуждаются с байером или логистическим партнёром — Dordoi.help помогает найти контакт для организации, но не обещает единый тариф карго. Используйте эту страницу как вход в каталог по категории, сравните смежные разделы и перейдите к полному списку поставщиков, когда будете готовы к следующему шагу.`;
    case "kk":
      return `«${n}» санаты Дордой нарығында ТМД-тен келетін көтерме сатып алушылар арасында танымал. Жеткізушілер әртүрлі жұмыс форматтарын ұсынады: минималды партиямен классикалық опттан бастап, сұранысты тексеру үшін бөлшек позицияларды бір нүктеден таңдауға болатын аралас модельдерге дейін. Dordoi.help тауарды жеке қарауды алмастырмайды, бірақ бастапқы іздеу уақытын қысқартады. ${acc} сатып алу үшін сатып алушылар Бішкекке өздері келеді, жергілікті байерді тартады немесе қашықтан іріктеу тапсырады. Қызмет сатушы профилін ашуға және қорғалған ағымда байланыс сұрауға көмектеседі. Жеткізу шарттары бағытқа байланысты — Dordoi.help ұйымдастыру үшін контакт табуға көмектеседі, бірақ бірыңғай карго тарифін уәде етпейді.`;
    case "kg":
      return `«${n}» категориясы Дордой базарында ТМДдан келген опт сатып алуучулар арасында популярдуу. Жеткирүүчүлөр ар түрдүү иш форматтарын сунуштайт: минималдуу партия менен классикалык опттон баштап, суроо-талапты текшерүү үчүн чекене позицияларды бир чекиттен тандоого болгон аралаш моделдерге чейин. Dordoi.help товарды жеке көрүүнү алмаштырбайт, бирок баштапкы издөө убактысын кыскартат. ${acc} сатып алуу үчүн сатып алуучулар Бишкекке өздөрү келишет, жергиликтүү байерди тартышат же алыскы тандоо буйрушат. Кызмат сатуучу профилин ачууга жана корголгон агымда байланыш суроого жардам берет.`;
    case "uz":
      return `«${n}» toifasi Dordoy bozorida MDHdan keladigan ulgurji xaridorlar orasida talabgir. Yetkazib beruvchilar turli ish formatlarini taklif qiladi: minimal partiya bilan klassik ulgurjidan tortib, talabni sinash uchun chakana pozitsiyalarni bir nuqtadan tanlash mumkin bo'lgan aralash modellargacha. Dordoi.help tovarni shaxsan ko'rishni almashtirmaydi, lekin dastlabki qidiruv vaqtini qisqartiradi. ${acc} xarid qilish uchun xaridorlar Bishkekka o'zlari keladi, mahalliy xaridorni jalb qiladi yoki masofadan tanlash buyurtma qiladi. Xizmat sotuvchi profilini ochish va himoyalangan oqimda aloqa so'rashga yordam beradi.`;
    case "tj":
      return `Категорияи «${n}» дар бозори Дордой дар байни харидорони оптии ИДМ маъмул аст. Таъминкунандагон форматҳои гуногуни корро пешниҳод мекунанд: аз опти классикӣ бо партияи минималӣ то моделҳои омехта. Dordoi.help иваз кардани дидани шахсии молро иваз намекунад, аммо вақти ҷустуҷӯи ибтидоиро коҳиш медиҳад. Барои хариди ${acc} харидорон ба Бишкек мераванд, харидори маҳаллиро ҷалб мекунанд ё интихоби дуртаро фармоиш медиҳанд. Хизмат кушодани профили фурӯшандаро ва дархости тамос дар ҷараёни ҳифзшуда кӯмак мекунад.`;
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
            "Профили с описанием ассортимента, типом сделки, ориентирами по рынку и возможностью запросить контакт без публикации прямых телефонов в открытом HTML.",
        },
        {
          question: "Как получить контакт поставщика?",
          answer:
            "Откройте профиль продавца в каталоге и воспользуйтесь кнопкой запроса контакта. Прямые ссылки на мессенджеры и телефоны в публичной разметке не показываются.",
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
            "Ассортимент сипаттамасы, мәміле түрі және ашық HTML-да тікелей телефондарсыз байланыс сұрау мүмкіндігі бар профильдер.",
        },
        {
          question: "Жеткізуші контактісін қалай алуға болады?",
          answer:
            "Каталогтағы сатушы профилін ашып, байланыс сұрау батырмасын пайдаланыңыз.",
        },
        {
          question: "Дордой нарығында байермен жұмыс істеуге бола ма?",
          answer:
            "Иә. Байерлер бөлімі және Dordoi.help маманды қосуға көмектеседі.",
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
          answer:
            "Ооба. Каталог Дордойдогу опт сатуучуларды табууга жардам берет.",
        },
        {
          question: `«${n}» категориясында каталогдо эмне болот?`,
          answer:
            "Ассортимент сүрөттөмөсү жана ачык HTMLде түз телефондорсуз байланыш суроо мүмкүнчүлүгү бар профилдер.",
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
          answer:
            "Ha. Katalog Dordoydagi ulgurji sotuvchilarni topishga yordam beradi.",
        },
        {
          question: `«${n}» toifasi bo'yicha katalogda nima bor?`,
          answer:
            "Assortiment tavsifi va ochiq HTMLda to'g'ridan-to'g'ri telefonlarsiz aloqa so'rash imkoniyati bo'lgan profillar.",
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
          answer:
            "Бале. Каталог ёри мерасад, ки фурӯшандагони оптии Дордойро пайдо кунед.",
        },
        {
          question: `Дар категорияи «${n}» дар каталог чӣ мавҷуд аст?`,
          answer:
            "Профилҳо бо тавсифи асортимент ва имконияти дархости тамос бе телефонҳои мустақим дар HTML.",
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
