import type { RouteLocale } from "@/lib/seo/route-locale";
import { ROUTE_LOCALES } from "@/lib/seo/route-locale";

export type CoreSeoLandingId = "rynok-dordoi" | "dordoi-optom" | "kargo-dordoi";

export type CoreSeoLanding = {
  id: CoreSeoLandingId;
  path: `/${CoreSeoLandingId}`;
  titleByLocale: Record<RouteLocale, string>;
  descriptionByLocale: Record<RouteLocale, string>;
  h1ByLocale: Record<RouteLocale, string>;
  introByLocale: Record<RouteLocale, string>;
  bodyByLocale: Record<RouteLocale, string[]>;
  faqByLocale: Record<RouteLocale, Array<{ question: string; answer: string }>>;
};

const CORE_LANDINGS: CoreSeoLanding[] = [
  {
    id: "rynok-dordoi",
    path: "/rynok-dordoi",
    titleByLocale: {
      ru: "Рынок Дордой Бишкек — поставщики, опт и каталог продавцов",
      kk: "Дордой нарығы Бішкек — жеткізушілер, опт және сатушылар каталогы",
      kg: "Дордой базары Бишкек — жеткирүүчүлөр, опт жана сатуучулар каталогу",
      uz: "Dordoy bozori Bishkek — yetkazib beruvchilar, ulgurji va sotuvchilar katalogi",
      tj: "Бозори Дордой Бишкек — таъминкунандагон, опт ва каталоги фурӯшандагон",
    },
    descriptionByLocale: {
      ru: "Информация о рынке Дордой в Бишкеке: поставщики, оптовые категории, байеры, карго и каталог продавцов на Dordoi.help.",
      kk: "Бішкектегі Дордой нарығы туралы: жеткізушілер, опт санаттары, байерлер және Dordoi.help каталогы.",
      kg: "Бишкектеги Дордой базары жөнүндө: жеткирүүчүлөр, опт категориялары, байерлер жана Dordoi.help каталогу.",
      uz: "Bishkekdagi Dordoy bozori haqida: yetkazib beruvchilar, ulgurji toifalar, xaridorlar va Dordoi.help katalogi.",
      tj: "Дар бораи бозори Дордой дар Бишкек: таъминкунандагон, категорияҳои оптӣ ва каталоги Dordoi.help.",
    },
    h1ByLocale: {
      ru: "Рынок Дордой в Бишкеке: поставщики, опт и каталог продавцов",
      kk: "Бішкектегі Дордой нарығы: жеткізушілер, опт және сатушылар каталогы",
      kg: "Бишкектеги Дордой базары: жеткирүүчүлөр, опт жана сатуучулар каталогу",
      uz: "Bishkekdagi Dordoy bozori: yetkazib beruvchilar, ulgurji va sotuvchilar katalogi",
      tj: "Бозори Дордой дар Бишкек: таъминкунандагон, опт ва каталоги фурӯшандагон",
    },
    introByLocale: {
      ru: "Dordoi.help помогает покупателям ориентироваться на рынке Дордой: находить поставщиков, категории товаров, байеров и полезные разделы для закупки.",
      kk: "Dordoi.help сатып алушыларға Дордой нарығында бағдар береді: жеткізушілер, санаттар және байерлер.",
      kg: "Dordoi.help сатып алуучуларга Дордой базарында багыт берет: жеткирүүчүлөр, категориялар жана байерлер.",
      uz: "Dordoi.help xaridorlarga Dordoy bozorida yo'l ko'rsatadi: yetkazib beruvchilar, toifalar va xaridorlar.",
      tj: "Dordoi.help ба харидорон дар бозори Дордой роҳнамоӣ мекунад: таъминкунандагон, категорияҳо ва харидорҳо.",
    },
    bodyByLocale: {
      ru: [
        "Откройте каталог поставщиков или перейдите к SEO-страницам категорий, чтобы сравнить ассортимент и условия опта.",
        "При необходимости подключайте байера для проверки товара на месте и согласования логистики.",
      ],
      kk: [
        "Жеткізушілерді салыстыру үшін каталогты немесе санат беттерін ашыңыз.",
        "Қажет болса, байерді тауарды тексеру үшін тартыңыз.",
      ],
      kg: [
        "Жеткирүүчүлөрдү салыштыруу үчүн каталогду же категория барактарын ачыңыз.",
        "Керек болсо, товарды текшерүү үчүн байерди тартыңыз.",
      ],
      uz: [
        "Yetkazib beruvchilarni solishtirish uchun katalog yoki toifa sahifalarini oching.",
        "Kerak bo'lsa, tovarni tekshirish uchun xaridorni jalb qiling.",
      ],
      tj: [
        "Барои муқоисаи таъминкунандагон каталог ё саҳифаҳои категорияро кушоед.",
        "Дар сурати зарурият харидорро барои санҷиши мол ҷалб кунед.",
      ],
    },
    faqByLocale: {
      ru: [
        {
          question: "Что такое рынок Дордой?",
          answer:
            "Это крупный оптовый рынок в Бишкеке с широким ассортиментом одежды, обуви, текстиля и других категорий для оптовых покупателей.",
        },
        {
          question: "Как найти поставщиков на Dordoi.help?",
          answer:
            "Откройте каталог, выберите категорию или воспользуйтесь SEO-страницами категорий, затем перейдите в профиль продавца.",
        },
        {
          question: "Нужен ли байер для закупки на Дордое?",
          answer:
            "Не всегда, но байер помогает проверить товар на месте, собрать партию и согласовать логистику. Раздел байеров доступен в сервисе.",
        },
        {
          question: "Можно ли закупать оптом дистанционно?",
          answer:
            "Каталог помогает найти поставщика и запросить контакт, но условия партии и отгрузки уточняются у конкретного продавца.",
        },
        {
          question: "Есть ли карго с Дордоя?",
          answer:
            "Dordoi.help помогает найти контакт для организации доставки, но не является единым карго-оператором. Условия зависят от направления.",
        },
      ],
      kk: [
        { question: "Дордой нарығы деген не?", answer: "Бішкектегі ірі көтерме нарық." },
        { question: "Dordoi.help арқылы қалай іздеуге болады?", answer: "Каталогты немесе санат беттерін ашыңыз." },
        { question: "Байер керек пе?", answer: "Әрқашан емес, бірақ көмектеседі." },
        { question: "Қашықтан сатып алуға бола ма?", answer: "Каталог бастапқы іздеуге көмектеседі." },
        { question: "Карго бар ма?", answer: "Қызмет жеткізуді ұйымдастыру үшін контакт табуға көмектеседі." },
      ],
      kg: [
        { question: "Дордой базары деген эмне?", answer: "Бишкектеги ири опт базар." },
        { question: "Dordoi.help аркылуу кантип издөө керек?", answer: "Каталогду же категория барактарын ачыңыз." },
        { question: "Байер керекпи?", answer: "Ар дайым эмес, бирок жардам берет." },
        { question: "Алыскыдан сатып алууга болобу?", answer: "Каталог баштапкы издөөгө жардам берет." },
        { question: "Карго барбы?", answer: "Кызмат жеткирүүнү уюштуруу үчүн байланыш табууга жардам берет." },
      ],
      uz: [
        { question: "Dordoy bozori nima?", answer: "Bishkekdagi yirik ulgurji bozor." },
        { question: "Dordoi.help orqali qanday qidirish mumkin?", answer: "Katalogni yoki toifa sahifalarini oching." },
        { question: "Xaridor kerakmi?", answer: "Har doim emas, lekin yordam beradi." },
        { question: "Masofadan xarid qilish mumkinmi?", answer: "Katalog dastlabki qidiruvga yordam beradi." },
        { question: "Kargo bormi?", answer: "Xizmat yetkazib berishni tashkil qilish uchun kontakt topishga yordam beradi." },
      ],
      tj: [
        { question: "Бозори Дордой чист?", answer: "Бозори бузурги оптӣ дар Бишкек." },
        { question: "Чӣ тавр дар Dordoi.help ҷустуҷӯ кардан мумкин аст?", answer: "Каталог ё саҳифаҳои категорияро кушоед." },
        { question: "Харидор лозим аст?", answer: "Ҳамеша не, аммо кӯмак мекунад." },
        { question: "Оё аз дур харид кардан мумкин аст?", answer: "Каталог ба ҷустуҷӯи ибтидоӣ кӯмак мекунад." },
        { question: "Карго ҳаст?", answer: "Хизмат барои ташкили интиқол тамос ёфтан кӯмак мекунад." },
      ],
    },
  },
  {
    id: "dordoi-optom",
    path: "/dordoi-optom",
    titleByLocale: {
      ru: "Дордой оптом — товары, поставщики и закупка в Бишкеке",
      kk: "Дордой оптом — тауарлар, жеткізушілер және сатып алу",
      kg: "Дордой оптом — товарлар, жеткирүүчүлөр жана сатып алуу",
      uz: "Dordoy ulgurji — tovarlar, yetkazib beruvchilar va xarid",
      tj: "Дордой опт — молҳо, таъминкунандагон ва харид",
    },
    descriptionByLocale: {
      ru: "Дордой оптом: категории товаров, поставщики, байеры и закупка через каталог Dordoi.help для покупателей из Кыргызстана и других стран.",
      kk: "Дордой оптом: тауар санаттары, жеткізушілер және Dordoi.help арқылы сатып алу.",
      kg: "Дордой оптом: товар категориялары, жеткирүүчүлөр жана Dordoi.help аркылуу сатып алуу.",
      uz: "Dordoy ulgurji: tovar toifalari, yetkazib beruvchilar va Dordoi.help orqali xarid.",
      tj: "Дордой опт: категорияҳо, таъминкунандагон ва харид тавассути Dordoi.help.",
    },
    h1ByLocale: {
      ru: "Дордой оптом: товары, поставщики и закупка через каталог",
      kk: "Дордой оптом: тауарлар, жеткізушілер және каталог арқылы сатып алу",
      kg: "Дордой оптом: товарлар, жеткирүүчүлөр жана каталог аркылуу сатып алуу",
      uz: "Dordoy ulgurji: tovarlar, yetkazib beruvchilar va katalog orqali xarid",
      tj: "Дордой опт: молҳо, таъминкунандагон ва харид тавассути каталог",
    },
    introByLocale: {
      ru: "Раздел для тех, кто ищет товары с Дордоя оптом. Откройте каталог поставщиков, сравните категории и выберите удобный способ закупки через сервис.",
      kk: "Дордойдан оптпен тауар іздейтіндерге арналған бөлім. Жеткізушілер каталогын ашып, санаттарды салыстырыңыз.",
      kg: "Дордойдон опт менен товар издегендер үчүн бөлүм. Жеткирүүчүлөр каталогун ачып, категорияларды салыштырыңыз.",
      uz: "Dordoydan ulgurji tovar qidiruvchilar uchun bo'lim. Yetkazib beruvchilar katalogini oching va toifalarni solishtiring.",
      tj: "Барои касоне, ки молҳои оптии Дордойро меҷӯянд. Каталоги таъминкунандаро кушоед ва категорияҳоро муқоиса кунед.",
    },
    bodyByLocale: {
      ru: [
        "Используйте каталог и страницы категорий, чтобы быстрее найти продавцов одежды, обуви, текстиля и других направлений.",
        "Условия минимальной партии и отгрузки уточняются в профиле поставщика. При необходимости подключайте байера для проверки товара на месте.",
      ],
      kk: [
        "Сатушыларды тезірек табу үшін каталог пен санат беттерін пайдаланыңыз.",
        "Минималды партия мен жөнелту шарттары профильде нақтыланады.",
      ],
      kg: [
        "Сатуучуларды тезирээк табуу үчүн каталогду жана категория барактарын колдонуңуз.",
        "Минималдуу партия жана жөнөтүү шарттары профилде такталат.",
      ],
      uz: [
        "Sotuvchilarni tezroq topish uchun katalog va toifa sahifalaridan foydalaning.",
        "Minimal partiya va jo'natish shartlari profilda aniqlanadi.",
      ],
      tj: [
        "Барои ёфтани зудтари фурӯшандагон аз каталог ва саҳифаҳои категория истифода баред.",
        "Шартҳои партияи минималӣ дар профил муайян мешаванд.",
      ],
    },
    faqByLocale: {
      ru: [
        { question: "Что можно купить оптом на Дордое?", answer: "Одежду, обувь, текстиль, аксессуары и другие категории — см. каталог и страницы категорий." },
        { question: "Как выбрать поставщика?", answer: "Сравните профили в каталоге по ассортименту и условиям, затем запросите контакт через сервис." },
        { question: "Есть ли минимальная партия?", answer: "Да, MOQ зависит от продавца и уточняется в профиле или при обращении." },
        { question: "Можно ли заказать подбор через байера?", answer: "Да, раздел байеров и сервис Dordoi.help помогают подключить специалиста на месте." },
        { question: "Как организовать доставку?", answer: "Условия зависят от направления; сервис помогает найти контакт для логистики, но не обещает единый тариф." },
      ],
      kk: [
        { question: "Дордойда оптпен не сатып алуға болады?", answer: "Киім, аяқ киім, текстиль және басқа санаттар." },
        { question: "Жеткізушіні қалай таңдауға болады?", answer: "Каталогта профильдерді салыстырыңыз." },
        { question: "Минималды партия бар ма?", answer: "Иә, MOQ сатушыға байланысты." },
        { question: "Байер арқылы іріктеуге бола ма?", answer: "Иә, байерлер бөлімі қолжетімді." },
        { question: "Жеткізуді қалай ұйымдастыруға болады?", answer: "Шарттар бағытқа байланысты." },
      ],
      kg: [
        { question: "Дордойдо опт менен эмне сатып алууга болот?", answer: "Кийим, бут кийим, текстиль жана башка категориялар." },
        { question: "Жеткирүүчүнү кантип тандоо керек?", answer: "Каталогдо профилдерди салыштырыңыз." },
        { question: "Минималдуу партия барбы?", answer: "Ооба, MOQ сатуучуга байланыштуу." },
        { question: "Байер аркылуу тандоого болобу?", answer: "Ооба, байерлер бөлүмү бар." },
        { question: "Жеткирүүнү кантип уюштуруу керек?", answer: "Шарттар багытка көз карандуу." },
      ],
      uz: [
        { question: "Dordoyda ulgurji nima xarid qilish mumkin?", answer: "Kiyim, poyabzal, tekstil va boshqa toifalar." },
        { question: "Yetkazib beruvchini qanday tanlash mumkin?", answer: "Katalogda profillarni solishtiring." },
        { question: "Minimal partiya bormi?", answer: "Ha, MOQ sotuvchiga bog'liq." },
        { question: "Xaridor orqali tanlash mumkinmi?", answer: "Ha, xaridorlar bo'limi mavjud." },
        { question: "Yetkazib berishni qanday tashkil qilish mumkin?", answer: "Shartlar yo'nalishga bog'liq." },
      ],
      tj: [
        { question: "Дар Дордой опт чӣ харид кардан мумкин аст?", answer: "Либос, пойафзал, мато ва дигар категорияҳо." },
        { question: "Чӣ тавр таъминкунандаро интихоб кардан мумкин аст?", answer: "Дар каталог профилҳоро муқоиса кунед." },
        { question: "Партияи минималӣ ҳаст?", answer: "Бале, MOQ ба фурӯшанда вобаста аст." },
        { question: "Оё тавассути харидор интихоб кардан мумкин аст?", answer: "Бале, қисми харидорҳо мавҷуд аст." },
        { question: "Интиқолро чӣ тавр ташкил кардан мумкин аст?", answer: "Шартҳо ба самт вобастаанд." },
      ],
    },
  },
  {
    id: "kargo-dordoi",
    path: "/kargo-dordoi",
    titleByLocale: {
      ru: "Карго Дордой — доставка товаров с рынка Дордой",
      kk: "Дордой карго — нарықтан тауар жеткізу",
      kg: "Дордой карго — базардан товар жеткирүү",
      uz: "Dordoy kargo — bozordan tovar yetkazib berish",
      tj: "Каргои Дордой — интиқоли мол аз бозор",
    },
    descriptionByLocale: {
      ru: "Карго Дордой и доставка товаров из Бишкека. Узнайте, как найти байера, поставщика и организовать доставку через сервис Dordoi.help.",
      kk: "Дордой карго және Бішкектен жеткізу. Dordoi.help арқылы байер мен логистиканы қалай табуға болады.",
      kg: "Дордой карго жана Бишкектен жеткирүү. Dordoi.help аркылуу байер жана логистиканы кантип табуу керек.",
      uz: "Dordoy kargo va Bishkekdan yetkazib berish. Dordoi.help orqali xaridor va logistikani qanday topish mumkin.",
      tj: "Каргои Дордой ва интиқол аз Бишкек. Чӣ тавр тавассути Dordoi.help харидор ва логистикаро ёфтан мумкин аст.",
    },
    h1ByLocale: {
      ru: "Карго Дордой: доставка товаров из Бишкека",
      kk: "Дордой карго: Бішкектен тауар жеткізу",
      kg: "Дордой карго: Бишкектен товар жеткирүү",
      uz: "Dordoy kargo: Bishkekdan tovar yetkazib berish",
      tj: "Каргои Дордой: интиқоли мол аз Бишкек",
    },
    introByLocale: {
      ru: "Раздел о доставке и организации закупки товаров с рынка Дордой. Dordoi.help помогает найти поставщика, байера и следующий шаг для отправки товара.",
      kk: "Дордой нарығынан тауар жеткізу және сатып алуды ұйымдастыру туралы бөлім.",
      kg: "Дордой базарынан товар жеткирүү жана сатып алууну уюштуруу жөнүндө бөлүм.",
      uz: "Dordoy bozoridan tovar yetkazib berish va xaridni tashkil etish haqida bo'lim.",
      tj: "Дар бораи интиқол ва ташкили харид аз бозори Дордой.",
    },
    bodyByLocale: {
      ru: [
        "Типичный сценарий: найдите поставщика в каталоге, согласуйте партию, затем обсудите доставку с байером или логистом.",
        "Условия маршрута и стоимости зависят от направления и обсуждаются отдельно — сервис не является единым карго-оператором.",
      ],
      kk: [
        "Алдымен каталогта жеткізушіні табыңыз, содан кейін жеткізуді келесіңіз.",
        "Шарттар бағытқа байланысты — Dordoi.help жеке карго компаниясы емес.",
      ],
      kg: [
        "Адегенде каталогдо жеткирүүчүнү табыңыз, андан кийин жеткирүүнү макулдашыңыз.",
        "Шарттар багытка көз карандуу — Dordoi.help өзүнчө карго компаниясы эмес.",
      ],
      uz: [
        "Avval katalogda yetkazib beruvchini toping, keyin yetkazib berishni muhokama qiling.",
        "Shartlar yo'nalishga bog'liq — Dordoi.help mustaqil kargo kompaniyasi emas.",
      ],
      tj: [
        "Аввал дар каталог таъминкунандаро ёбед, сипас интиқолро мувофиқ кунед.",
        "Шартҳо ба самт вобастаанд — Dordoi.help ширкати мустақили карго нест.",
      ],
    },
    faqByLocale: {
      ru: [
        { question: "Есть ли у Dordoi.help собственное карго?", answer: "Нет. Сервис помогает найти контакт для организации доставки, но не является единым карго-оператором." },
        { question: "Как начать закупку с доставкой?", answer: "Сначала найдите поставщика в каталоге, затем обсудите логистику с байером или партнёром." },
        { question: "В какие страны возможна доставка?", answer: "Зависит от направления и выбранного логиста; детали уточняются через сервис и при личном согласовании." },
        { question: "Сколько стоит карго с Дордоя?", answer: "Единого тарифа нет. Стоимость зависит от веса, направления и условий партнёра." },
        { question: "Нужен ли байер для карго?", answer: "Часто байер помогает собрать партию и передать её логисту, но схема зависит от вашей закупки." },
      ],
      kk: [
        { question: "Dordoi.help-те өз каргосы бар ма?", answer: "Жоқ. Қызмет контакт табуға көмектеседі." },
        { question: "Жеткізумен сатып алуды қалай бастауға болады?", answer: "Алдымен каталогта жеткізушіні табыңыз." },
        { question: "Қай елдерге жеткізу мүмкін?", answer: "Бағытқа байланысты." },
        { question: "Карго қанша тұрады?", answer: "Бірыңғай тариф жоқ." },
        { question: "Карго үшін байер керек пе?", answer: "Көп жағдайда көмектеседі, бірақ схема әртүрлі." },
      ],
      kg: [
        { question: "Dordoi.helpте өз каргосу барбы?", answer: "Жок. Кызмат байланыш табууга жардам берет." },
        { question: "Жеткирүү менен сатып алууну кантип баштоо керек?", answer: "Адегенде каталогдо жеткирүүчүнү табыңыз." },
        { question: "Кайсы өлкөлөргө жеткирүү мүмкүн?", answer: "Багытка көз карандуу." },
        { question: "Карго канча турат?", answer: "Бирдиктүү тариф жок." },
        { question: "Карго үчүн байер керекпи?", answer: "Көп учурда жардам берет." },
      ],
      uz: [
        { question: "Dordoi.helpda o'z kargosi bormi?", answer: "Yo'q. Xizmat kontakt topishga yordam beradi." },
        { question: "Yetkazib berish bilan xaridni qanday boshlash mumkin?", answer: "Avval katalogda yetkazib beruvchini toping." },
        { question: "Qaysi mamlakatlarga yetkazish mumkin?", answer: "Yo'nalishga bog'liq." },
        { question: "Kargo qancha turadi?", answer: "Yagona tarif yo'q." },
        { question: "Kargo uchun xaridor kerakmi?", answer: "Ko'pincha yordam beradi." },
      ],
      tj: [
        { question: "Оё Dordoi.help каргои мустақил дорад?", answer: "Не. Хизмат барои ёфтани тамос кӯмак мекунад." },
        { question: "Чӣ тавр харид бо интиқолро оғоз кардан мумкин аст?", answer: "Аввал дар каталог таъминкунандаро ёбед." },
        { question: "Ба кадом кишварҳо интиқол мумкин аст?", answer: "Ба самт вобаста аст." },
        { question: "Карго чанд арзиш дорад?", answer: "Тарифи ягона нест." },
        { question: "Оё барои карго харидор лозим аст?", answer: "Аксар вақт кӯмак мекунад." },
      ],
    },
  },
];

const LANDING_BY_ID = new Map(CORE_LANDINGS.map((l) => [l.id, l]));

export const CORE_SEO_LANDINGS = CORE_LANDINGS;

export function resolveCoreSeoLanding(id: string): CoreSeoLanding | undefined {
  return LANDING_BY_ID.get(id as CoreSeoLandingId);
}

export function getAllCoreSeoLandingStaticParams(): Array<{ locale: RouteLocale }> {
  return ROUTE_LOCALES.map((locale) => ({ locale }));
}
