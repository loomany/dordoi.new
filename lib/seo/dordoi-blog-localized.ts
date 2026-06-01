import type { RouteLocale } from "@/lib/seo/route-locale";
import { ROUTE_LOCALES } from "@/lib/seo/route-locale";

export type LocalizedBlogMeta = {
  slug: string;
  topic: string;
  keyword: string;
};

type NonRuLocale = Exclude<RouteLocale, "ru">;

const TOPICS: Record<string, Record<NonRuLocale, LocalizedBlogMeta>> = {
  "rynok-bishkek-optovye-rynki-gde-iskat-postavshchikov": {
    kk: { slug: "bishkek-koterme-naryktar-zhetkizushi-izdeu", topic: "Бішкек көтерме нарықтары және жеткізушіні қайдан іздеу", keyword: "Бішкек жеткізушілері" },
    kg: { slug: "bishkek-optom-bazarlary-zhetkiruuchu-izdoo", topic: "Бишкек оптом базарлары жана жеткирүүчүнү кайдан издөө", keyword: "Бишкек жеткирүүчүлөрү" },
    uz: { slug: "bishkek-ulgurji-bozorlar-yetkazib-beruvchi-izlash", topic: "Bishkek ulgurji bozorlarida yetkazib beruvchi izlash", keyword: "Bishkek yetkazib beruvchilar" },
    tj: { slug: "bozorhoi-yakluhti-bishkek-taminkunanda-yoftan", topic: "Бозорҳои яклухти Бишкек ва ҷустуҷӯи таъминкунанда", keyword: "таъминкунандагони Бишкек" },
  },
  "postavshchiki-bishkek-kak-nayti-optovogo-partnera": {
    kk: { slug: "bishkek-zhetkizushileri-koterme-seriktes-tabu", topic: "Бішкек жеткізушілері: көтерме серіктесті қалай табу", keyword: "Бішкек жеткізушілері" },
    kg: { slug: "bishkek-zhetkiruuchuloru-optom-sherik-tabuu", topic: "Бишкек жеткирүүчүлөрү: оптом шерикти кантип табуу", keyword: "Бишкек жеткирүүчүлөрү" },
    uz: { slug: "bishkek-yetkazib-beruvchilar-ulgurji-hamkor-topish", topic: "Bishkek yetkazib beruvchilari: ulgurji hamkor topish", keyword: "Bishkek yetkazib beruvchilar" },
    tj: { slug: "taminkunandagoni-bishkek-shariki-yakluht-yoftan", topic: "Таъминкунандагони Бишкек: шарики яклухтро чӣ тавр ёфтан", keyword: "таъминкунандагони Бишкек" },
  },
  "rynok-dordoi-bishkek-postavshchiki-katalog-i-kategorii": {
    kk: { slug: "dordoi-bishkek-zhetkizushiler-katalog-sanattar", topic: "Дордой Бішкек: жеткізушілер, каталог және санаттар", keyword: "Дордой жеткізушілері" },
    kg: { slug: "dordoi-bishkek-zhetkiruuchulor-katalog-kategoriyalar", topic: "Дордой Бишкек: жеткирүүчүлөр, каталог жана категориялар", keyword: "Дордой жеткирүүчүлөрү" },
    uz: { slug: "dordoy-bishkek-yetkazib-beruvchilar-katalog-toifalar", topic: "Dordoy Bishkek: yetkazib beruvchilar, katalog va toifalar", keyword: "Dordoy yetkazib beruvchilar" },
    tj: { slug: "dordoi-bishkek-taminkunandagon-katalog-kategoriyaho", topic: "Дордой Бишкек: таъминкунандагон, каталог ва категорияҳо", keyword: "таъминкунандагони Дордой" },
  },
  "optovye-rynki-bishkeka-dordoi-madina-alamedin-kak-vybrat": {
    kk: { slug: "bishkek-koterme-naryktary-dordoi-madina-alamedin", topic: "Бішкектің көтерме нарықтары: Дордой, Мадина, Аламедин", keyword: "Бішкек көтерме нарықтары" },
    kg: { slug: "bishkek-optom-bazarlary-dordoi-madina-alamedin", topic: "Бишкектин оптом базарлары: Дордой, Мадина, Аламедин", keyword: "Бишкек оптом базарлары" },
    uz: { slug: "bishkek-ulgurji-bozorlar-dordoy-madina-alamedin", topic: "Bishkek ulgurji bozorlari: Dordoy, Madina, Alamedin", keyword: "Bishkek ulgurji bozorlar" },
    tj: { slug: "bozorhoi-yakluhti-bishkek-dordoi-madina-alamedin", topic: "Бозорҳои яклухти Бишкек: Дордой, Мадина, Аламедин", keyword: "бозорҳои яклухти Бишкек" },
  },
  "odezhda-optom-bishkek-postavshchiki-dordoi": {
    kk: { slug: "bishkek-kiim-koterme-dordoi-zhetkizushiler", topic: "Бішкек киім көтерме: Дордой жеткізушілері", keyword: "Бішкек киім көтерме" },
    kg: { slug: "bishkek-kiyim-optom-dordoi-zhetkiruuchulor", topic: "Бишкек кийим оптом: Дордой жеткирүүчүлөрү", keyword: "Бишкек кийим оптом" },
    uz: { slug: "bishkek-kiyim-ulgurji-dordoy-yetkazib-beruvchilar", topic: "Bishkek kiyim ulgurji: Dordoy yetkazib beruvchilari", keyword: "Bishkek kiyim ulgurji" },
    tj: { slug: "libos-yakluht-bishkek-taminkunandagoni-dordoi", topic: "Либос яклухт Бишкек: таъминкунандагони Дордой", keyword: "либос яклухт Бишкек" },
  },
  "tovary-optom-bishkek-dlya-magazina-i-marketpleysa": {
    kk: { slug: "bishkek-tauarlar-koterme-duken-marketpleis", topic: "Бішкек тауарлар көтерме: дүкен және маркетплейс үшін", keyword: "Бішкек тауарлар көтерме" },
    kg: { slug: "bishkek-tovarlar-optom-dukon-marketpleis", topic: "Бишкек товарлар оптом: дүкөн жана маркетплейс үчүн", keyword: "Бишкек товарлар оптом" },
    uz: { slug: "bishkek-tovarlar-ulgurji-dokon-marketpleys", topic: "Bishkek tovarlar ulgurji: do'kon va marketpleys uchun", keyword: "Bishkek tovarlar ulgurji" },
    tj: { slug: "molhoi-yakluht-bishkek-baroi-dukon-marketpleys", topic: "Молҳои яклухт Бишкек: барои дӯкон ва маркетплейс", keyword: "молҳои яклухт Бишкек" },
  },
  "katalog-postavshchikov-bishkek-kak-polzovatsya": {
    kk: { slug: "bishkek-zhetkizushiler-katalogy-qalai-paidalanu", topic: "Бішкек жеткізушілер каталогын қалай пайдалану", keyword: "Бішкек жеткізушілер каталогы" },
    kg: { slug: "bishkek-zhetkiruuchulor-katalogu-kantip-koldonuu", topic: "Бишкек жеткирүүчүлөр каталогун кантип колдонуу", keyword: "Бишкек жеткирүүчүлөр каталогу" },
    uz: { slug: "bishkek-yetkazib-beruvchilar-katalogidan-foydalanish", topic: "Bishkek yetkazib beruvchilar katalogidan foydalanish", keyword: "Bishkek yetkazib beruvchilar katalogi" },
    tj: { slug: "katalogi-taminkunandagoni-bishkek-istifoda", topic: "Каталоги таъминкунандагони Бишкекро чӣ тавр истифода бурдан", keyword: "каталоги таъминкунандагони Бишкек" },
  },
  "kak-vybrat-rynok-v-bishkeke-dlya-optovoy-zakupki": {
    kk: { slug: "bishkekte-koterme-satyp-alu-ushin-naryk-tandau", topic: "Бішкекте көтерме сатып алу үшін нарықты қалай таңдау", keyword: "Бішкек көтерме нарық" },
    kg: { slug: "bishkekte-optom-satyp-aluu-uchun-bazar-tandoo", topic: "Бишкекте оптом сатып алуу үчүн базарды кантип тандоо", keyword: "Бишкек оптом базар" },
    uz: { slug: "bishkekda-ulgurji-xarid-uchun-bozor-tanlash", topic: "Bishkekda ulgurji xarid uchun bozor tanlash", keyword: "Bishkek ulgurji bozor" },
    tj: { slug: "bishkek-baroi-haridi-yakluht-bozor-intihob", topic: "Дар Бишкек барои хариди яклухт бозорро чӣ тавр интихоб кардан", keyword: "Бишкек бозори яклухт" },
  },
  "kak-nayti-postavshchika-dordoi": {
    kk: { slug: "dordoi-zhetkizushini-qalai-tabu", topic: "Дордой жеткізушісін қалай табуға болады", keyword: "Дордой жеткізушілері" },
    kg: { slug: "dordoi-zhetkiruuchunu-kantip-tabuu", topic: "Дордой жеткирүүчүсүн кантип табуу керек", keyword: "Дордой жеткирүүчүлөрү" },
    uz: { slug: "dordoy-yetkazib-beruvchini-qanday-topish", topic: "Dordoy yetkazib beruvchisini qanday topish kerak", keyword: "Dordoy yetkazib beruvchilar" },
    tj: { slug: "dordoi-taminkunandaro-chi-tavr-yoftan", topic: "Таъминкунандаи Дордойро чӣ тавр ёфтан мумкин", keyword: "таъминкунандагони Дордой" },
  },
  "kargo-dordoi-kak-rabotaet-dostavka": {
    kk: { slug: "dordoi-kargo-qalai-zhumys-isteidi", topic: "Дордой карго қалай жұмыс істейді", keyword: "Дордой карго" },
    kg: { slug: "dordoi-kargo-kantip-ishteit", topic: "Дордой карго кантип иштейт", keyword: "Дордой карго" },
    uz: { slug: "dordoy-kargo-qanday-ishlaydi", topic: "Dordoy kargo qanday ishlaydi", keyword: "Dordoy kargo" },
    tj: { slug: "kargoi-dordoi-chi-tavr-kor-mekunad", topic: "Каргои Дордой чӣ тавр кор мекунад", keyword: "каргои Дордой" },
  },
  "kak-kupit-optom-na-dordoe": {
    kk: { slug: "dordoi-koterme-qalai-satyp-alu", topic: "Дордойдан көтерме қалай сатып алуға болады", keyword: "Дордой көтерме" },
    kg: { slug: "dordoi-optom-kantip-satyp-aluu", topic: "Дордойдон оптом кантип сатып алуу керек", keyword: "Дордой оптом" },
    uz: { slug: "dordoy-ulgurji-qanday-xarid-qilish", topic: "Dordoydan ulgurji qanday xarid qilish kerak", keyword: "Dordoy ulgurji" },
    tj: { slug: "dordoi-yakluht-chi-tavr-haridan", topic: "Аз Дордой яклухт чӣ тавр харидан мумкин", keyword: "Дордой яклухт" },
  },
  "dordoi-optom-polnyy-gid": {
    kk: { slug: "dordoi-koterme-tolyk-nuskaulyk", topic: "Дордой көтерме толық нұсқаулық", keyword: "Дордой көтерме" },
    kg: { slug: "dordoi-dununon-toluk-koldonmo", topic: "Дордой дүңүнөн толук колдонмо", keyword: "Дордой дүңүнөн" },
    uz: { slug: "dordoy-ulgurji-toliq-qollanma", topic: "Dordoy ulgurji to'liq qo'llanma", keyword: "Dordoy ulgurji" },
    tj: { slug: "dordoi-yakluht-dasturi-purra", topic: "Дордой яклухт дастури пурра", keyword: "Дордой яклухт" },
  },
  "dordoi-online-katalog-kak-polzovatsya": {
    kk: { slug: "dordoi-onlain-katalog-qalai-paidalanu", topic: "Дордой онлайн каталогын қалай пайдалану керек", keyword: "Дордой онлайн каталогы" },
    kg: { slug: "dordoi-onlain-katalog-kantip-koldonuu", topic: "Дордой онлайн каталогун кантип колдонуу керек", keyword: "Дордой онлайн каталогу" },
    uz: { slug: "dordoy-onlayn-katalog-qanday-foydalanish", topic: "Dordoy onlayn katalogidan qanday foydalanish kerak", keyword: "Dordoy onlayn katalogi" },
    tj: { slug: "katalogi-onlaini-dordoi-chi-tavr-istifoda-burdan", topic: "Каталоги онлайни Дордойро чӣ тавр истифода бурдан", keyword: "каталоги онлайни Дордой" },
  },
  "dordoi-prais-listy-i-tseny-kak-utochnyat": {
    kk: { slug: "dordoi-bagalary-men-prais-qalai-naqtylau", topic: "Дордой бағалары мен прайс-листтерін қалай нақтылау керек", keyword: "Дордой бағалары" },
    kg: { slug: "dordoi-baalary-prais-kantip-taktoo", topic: "Дордой баалары жана прайс-листтерин кантип тактоо керек", keyword: "Дордой баалары" },
    uz: { slug: "dordoy-narxlari-va-prais-qanday-aniqlash", topic: "Dordoy narxlari va prays-listlarini qanday aniqlash kerak", keyword: "Dordoy narxlari" },
    tj: { slug: "narhhoi-dordoi-va-prais-chi-tavr-anik-kardan", topic: "Нархҳои Дордой ва прайс-листҳоро чӣ тавр аниқ кардан", keyword: "нархҳои Дордой" },
  },
  "kontakty-postavshchikov-dordoi-kak-otkryt-bezopasno": {
    kk: { slug: "dordoi-zhetkizushi-kontaktary-qauipsiz-ashu", topic: "Дордой жеткізушілерінің контактілерін қауіпсіз ашу", keyword: "Дордой контактілері" },
    kg: { slug: "dordoi-zhetkiruuchu-kontaktaryn-koopsuz-achuu", topic: "Дордой жеткирүүчүлөрүнүн контакттарын коопсуз ачуу", keyword: "Дордой контакттары" },
    uz: { slug: "dordoy-yetkazib-beruvchi-kontaktlarini-xavfsiz-ochish", topic: "Dordoy yetkazib beruvchi kontaktlarini xavfsiz ochish", keyword: "Dordoy kontaktlari" },
    tj: { slug: "kontakt-hoi-taminkunandagoni-dordoi-behatar-kushodan", topic: "Контактҳои таъминкунандагони Дордойро бехатар кушодан", keyword: "контактҳои Дордой" },
  },
  "postavshchiki-rynka-dordoi-kak-nayti": {
    kk: { slug: "dordoi-narygy-zhetkizushilerin-qalai-tabu", topic: "Дордой нарығы жеткізушілерін қалай табу керек", keyword: "Дордой жеткізушілері" },
    kg: { slug: "dordoi-bazary-zhetkiruuchulorun-kantip-tabuu", topic: "Дордой базарынын жеткирүүчүлөрүн кантип табуу керек", keyword: "Дордой жеткирүүчүлөрү" },
    uz: { slug: "dordoy-bozori-yetkazib-beruvchilarini-topish", topic: "Dordoy bozori yetkazib beruvchilarini topish", keyword: "Dordoy yetkazib beruvchilar" },
    tj: { slug: "taminkunandagoni-bozori-dordoi-yoftan", topic: "Таъминкунандагони бозори Дордойро ёфтан", keyword: "таъминкунандагони Дордой" },
  },
  "kak-proverit-postavshchika-dordoi": {
    kk: { slug: "dordoi-zhetkizushini-qalai-tekseru", topic: "Дордой жеткізушісін қалай тексеру керек", keyword: "Дордой жеткізушісін тексеру" },
    kg: { slug: "dordoi-zhetkiruuchunu-kantip-teksheruu", topic: "Дордой жеткирүүчүсүн кантип текшерүү керек", keyword: "Дордой жеткирүүчүсүн текшерүү" },
    uz: { slug: "dordoy-yetkazib-beruvchini-qanday-tekshirish", topic: "Dordoy yetkazib beruvchisini qanday tekshirish kerak", keyword: "Dordoy yetkazib beruvchini tekshirish" },
    tj: { slug: "taminkunandai-dordoi-chi-tavr-sanjidan", topic: "Таъминкунандаи Дордойро чӣ тавр санҷидан", keyword: "санҷиши таъминкунанда Дордой" },
  },
  "chek-list-zakupki-na-dordoe": {
    kk: { slug: "dordoi-satyp-alu-chek-paragy", topic: "Дордойдан сатып алу чек-парағы", keyword: "Дордой сатып алу" },
    kg: { slug: "dordoi-satyp-aluu-chek-baragy", topic: "Дордойдон сатып алуу чек-барагы", keyword: "Дордой сатып алуу" },
    uz: { slug: "dordoy-xarid-chek-royxati", topic: "Dordoy xaridi uchun chek-ro'yxat", keyword: "Dordoy xarid" },
    tj: { slug: "cheklisti-harid-az-dordoi", topic: "Чек-листи харид аз Дордой", keyword: "харид аз Дордой" },
  },
  "kak-sravnit-postavshchikov-dordoi": {
    kk: { slug: "dordoi-zhetkizushilerin-qalai-salystyru", topic: "Дордой жеткізушілерін қалай салыстыру керек", keyword: "Дордой жеткізушілерін салыстыру" },
    kg: { slug: "dordoi-zhetkiruuchulorun-kantip-salyshtyruu", topic: "Дордой жеткирүүчүлөрүн кантип салыштыруу керек", keyword: "Дордой жеткирүүчүлөрүн салыштыруу" },
    uz: { slug: "dordoy-yetkazib-beruvchilarini-solishtirish", topic: "Dordoy yetkazib beruvchilarini solishtirish", keyword: "Dordoy yetkazib beruvchilarini solishtirish" },
    tj: { slug: "taminkunandagoni-dordoi-mukoisa-kardan", topic: "Таъминкунандагони Дордойро муқоиса кардан", keyword: "муқоисаи таъминкунандагони Дордой" },
  },
  "kak-napisat-postavshchiku-dordoi": {
    kk: { slug: "dordoi-zhetkizushisine-qalai-zhazu", topic: "Дордой жеткізушісіне қалай жазу керек", keyword: "Дордой жеткізушісіне жазу" },
    kg: { slug: "dordoi-zhetkiruuchusuno-kantip-zhazuu", topic: "Дордой жеткирүүчүсүнө кантип жазуу керек", keyword: "Дордой жеткирүүчүсүнө жазуу" },
    uz: { slug: "dordoy-yetkazib-beruvchiga-qanday-yozish", topic: "Dordoy yetkazib beruvchiga qanday yozish kerak", keyword: "Dordoy yetkazib beruvchiga yozish" },
    tj: { slug: "ba-taminkunandai-dordoi-chi-tavr-navishtan", topic: "Ба таъминкунандаи Дордой чӣ тавр навиштан", keyword: "навиштан ба таъминкунанда Дордой" },
  },
  "kak-zakupat-na-dordoe-udalenno": {
    kk: { slug: "dordoi-qashyqtan-qalai-satyp-alu", topic: "Дордойдан қашықтан қалай сатып алу керек", keyword: "Дордой қашықтан сатып алу" },
    kg: { slug: "dordoi-aralyktan-kantip-satyp-aluu", topic: "Дордойдон аралыктан кантип сатып алуу керек", keyword: "Дордой аралыктан сатып алуу" },
    uz: { slug: "dordoydan-masofadan-qanday-xarid-qilish", topic: "Dordoydan masofadan qanday xarid qilish kerak", keyword: "Dordoy masofadan xarid" },
    tj: { slug: "az-dordoi-fosilavi-chi-tavr-haridan", topic: "Аз Дордой фосилавӣ чӣ тавр харидан", keyword: "хариди фосилавӣ Дордой" },
  },
  "zhenskaya-odezhda-optom-dordoi": {
    kk: { slug: "ayelder-kiimi-koterme-dordoi", topic: "Дордой әйелдер киімі көтерме", keyword: "әйелдер киімі көтерме" },
    kg: { slug: "ayaldar-kiyimi-dununon-dordoi", topic: "Дордой аялдар кийими дүңүнөн", keyword: "аялдар кийими дүңүнөн" },
    uz: { slug: "ayollar-kiyimi-ulgurji-dordoy", topic: "Dordoy ayollar kiyimi ulgurji", keyword: "ayollar kiyimi ulgurji" },
    tj: { slug: "liboshoi-zanona-yakluht-dordoi", topic: "Дордой либосҳои занона яклухт", keyword: "либосҳои занона яклухт" },
  },
  "muzhskaya-odezhda-optom-dordoi": {
    kk: { slug: "erler-kiimi-koterme-dordoi", topic: "Дордой ерлер киімі көтерме", keyword: "ерлер киімі көтерме" },
    kg: { slug: "erkekter-kiyimi-dununon-dordoi", topic: "Дордой эркектер кийими дүңүнөн", keyword: "эркектер кийими дүңүнөн" },
    uz: { slug: "erkaklar-kiyimi-ulgurji-dordoy", topic: "Dordoy erkaklar kiyimi ulgurji", keyword: "erkaklar kiyimi ulgurji" },
    tj: { slug: "liboshoi-mardona-yakluht-dordoi", topic: "Дордой либосҳои мардона яклухт", keyword: "либосҳои мардона яклухт" },
  },
  "detskaya-odezhda-optom-dordoi": {
    kk: { slug: "balalar-kiimi-koterme-dordoi", topic: "Дордой балалар киімі көтерме", keyword: "балалар киімі көтерме" },
    kg: { slug: "baldar-kiyimi-dununon-dordoi", topic: "Дордой балдар кийими дүңүнөн", keyword: "балдар кийими дүңүнөн" },
    uz: { slug: "bolalar-kiyimi-ulgurji-dordoy", topic: "Dordoy bolalar kiyimi ulgurji", keyword: "bolalar kiyimi ulgurji" },
    tj: { slug: "liboshoi-kudakona-yakluht-dordoi", topic: "Дордой либосҳои кӯдакона яклухт", keyword: "либосҳои кӯдакона яклухт" },
  },
  "obuv-optom-dordoi": {
    kk: { slug: "ayaq-kiim-koterme-dordoi", topic: "Дордой аяқ киім көтерме", keyword: "аяқ киім көтерме" },
    kg: { slug: "but-kiyim-dununon-dordoi", topic: "Дордой бут кийим дүңүнөн", keyword: "бут кийим дүңүнөн" },
    uz: { slug: "poyabzal-ulgurji-dordoy", topic: "Dordoy poyabzal ulgurji", keyword: "poyabzal ulgurji" },
    tj: { slug: "poyafzol-yakluht-dordoi", topic: "Дордой пойафзол яклухт", keyword: "пойафзол яклухт" },
  },
  "obuv-optom-bishkek-dordoi": {
    kk: { slug: "bishkek-dordoi-ayaq-kiim-koterme", topic: "Бішкек Дордой аяқ киім көтерме", keyword: "аяқ киім көтерме Бішкек" },
    kg: { slug: "bishkek-dordoi-but-kiyim-dununon", topic: "Бишкек Дордой бут кийим дүңүнөн", keyword: "бут кийим дүңүнөн Бишкек" },
    uz: { slug: "bishkek-dordoy-poyabzal-ulgurji", topic: "Bishkek Dordoy poyabzal ulgurji", keyword: "poyabzal ulgurji Bishkek" },
    tj: { slug: "bishkek-dordoi-poyafzol-yakluht", topic: "Бишкек Дордой пойафзол яклухт", keyword: "пойафзол яклухт Бишкек" },
  },
  "trikotazh-optom-dordoi": {
    kk: { slug: "trikotazh-koterme-dordoi", topic: "Дордой трикотаж көтерме", keyword: "трикотаж көтерме" },
    kg: { slug: "trikotazh-dununon-dordoi", topic: "Дордой трикотаж дүңүнөн", keyword: "трикотаж дүңүнөн" },
    uz: { slug: "trikotaj-ulgurji-dordoy", topic: "Dordoy trikotaj ulgurji", keyword: "trikotaj ulgurji" },
    tj: { slug: "trikotazh-yakluht-dordoi", topic: "Дордой трикотаж яклухт", keyword: "трикотаж яклухт" },
  },
  "tkani-i-furnitura-dordoi": {
    kk: { slug: "matalar-furnitura-dordoi", topic: "Дордой маталар және фурнитура", keyword: "маталар фурнитура Дордой" },
    kg: { slug: "kezdeme-furnitura-dordoi", topic: "Дордой кездеме жана фурнитура", keyword: "кездеме фурнитура Дордой" },
    uz: { slug: "mato-va-furnitura-dordoy", topic: "Dordoy mato va furnitura", keyword: "mato furnitura Dordoy" },
    tj: { slug: "mato-va-furnitura-dordoi", topic: "Дордой матоъ ва фурнитура", keyword: "матоъ фурнитура Дордой" },
  },
  "tkani-i-furnitura-bishkek-dordoi": {
    kk: { slug: "bishkek-dordoi-matalar-furnitura", topic: "Бішкек Дордой маталар және фурнитура", keyword: "маталар Бішкек" },
    kg: { slug: "bishkek-dordoi-kezdeme-furnitura", topic: "Бишкек Дордой кездеме жана фурнитура", keyword: "кездеме Бишкек" },
    uz: { slug: "bishkek-dordoy-mato-furnitura", topic: "Bishkek Dordoy mato va furnitura", keyword: "mato Bishkek" },
    tj: { slug: "bishkek-dordoi-mato-furnitura", topic: "Бишкек Дордой матоъ ва фурнитура", keyword: "матоъ Бишкек" },
  },
  "sumki-optom-dordoi": {
    kk: { slug: "somkeler-koterme-dordoi", topic: "Дордой сөмкелер көтерме", keyword: "сөмкелер көтерме" },
    kg: { slug: "sumkalar-dununon-dordoi", topic: "Дордой сумкалар дүңүнөн", keyword: "сумкалар дүңүнөн" },
    uz: { slug: "sumkalar-ulgurji-dordoy", topic: "Dordoy sumkalar ulgurji", keyword: "sumkalar ulgurji" },
    tj: { slug: "sumkaho-yakluht-dordoi", topic: "Дордой сумкаҳо яклухт", keyword: "сумкаҳо яклухт" },
  },
  "sumki-i-kozhgalantereya-optom-dordoi": {
    kk: { slug: "somke-teriden-buyymdar-koterme-dordoi", topic: "Дордой сөмке және теріден бұйымдар көтерме", keyword: "сөмке көтерме" },
    kg: { slug: "sumka-bulgary-buyumdar-dununon-dordoi", topic: "Дордой сумка жана булгары буюмдар дүңүнөн", keyword: "сумка дүңүнөн" },
    uz: { slug: "sumka-va-charm-buyumlar-ulgurji-dordoy", topic: "Dordoy sumka va charm buyumlar ulgurji", keyword: "sumka ulgurji" },
    tj: { slug: "sumka-va-charmgallantereya-yakluht-dordoi", topic: "Дордой сумка ва чармгалантерея яклухт", keyword: "сумка яклухт" },
  },
  "nizhnee-bele-i-korsety-optom-dordoi": {
    kk: { slug: "is-kiim-korset-koterme-dordoi", topic: "Дордой іш киім және корсеттер көтерме", keyword: "іш киім көтерме" },
    kg: { slug: "ich-kiyim-korset-dununon-dordoi", topic: "Дордой ич кийим жана корсет дүңүнөн", keyword: "ич кийим дүңүнөн" },
    uz: { slug: "ichki-kiyim-korset-ulgurji-dordoy", topic: "Dordoy ichki kiyim va korset ulgurji", keyword: "ichki kiyim ulgurji" },
    tj: { slug: "libosi-tagi-korset-yakluht-dordoi", topic: "Дордой либоси таг ва корсет яклухт", keyword: "либоси таг яклухт" },
  },
  "sportivnye-kostyumy-optom-dordoi": {
    kk: { slug: "sport-kiimder-koterme-dordoi", topic: "Дордой спорт киімдері көтерме", keyword: "спорт киімдері көтерме" },
    kg: { slug: "sport-kiyimder-dununon-dordoi", topic: "Дордой спорт кийимдер дүңүнөн", keyword: "спорт кийим дүңүнөн" },
    uz: { slug: "sport-kiyimlar-ulgurji-dordoy", topic: "Dordoy sport kiyimlar ulgurji", keyword: "sport kiyim ulgurji" },
    tj: { slug: "liboshoi-varzishi-yakluht-dordoi", topic: "Дордой либосҳои варзишӣ яклухт", keyword: "либоси варзишӣ яклухт" },
  },
  "postelnoe-bele-optom-kyrgyzstan": {
    kk: { slug: "kyrgyzstan-tosek-zhabdgy-koterme", topic: "Қырғызстан төсек жабдығы көтерме", keyword: "төсек жабдығы көтерме" },
    kg: { slug: "kyrgyzstan-toshok-zhabdyk-dununon", topic: "Кыргызстан төшөк жабдык дүңүнөн", keyword: "төшөк жабдык дүңүнөн" },
    uz: { slug: "qirgiziston-korpa-toshak-ulgurji", topic: "Qirg'iziston ko'rpa-to'shak ulgurji", keyword: "ko'rpa-to'shak ulgurji" },
    tj: { slug: "qirghiziston-joypush-yakluht", topic: "Қирғизистон ҷойпӯш яклухт", keyword: "ҷойпӯш яклухт" },
  },
  "verhnyaya-odezhda-optom-bishkek": {
    kk: { slug: "bishkek-syrt-kiim-koterme", topic: "Бішкек сырт киім көтерме", keyword: "сырт киім көтерме" },
    kg: { slug: "bishkek-syrt-kiyim-dununon", topic: "Бишкек сырт кийим дүңүнөн", keyword: "сырт кийим дүңүнөн" },
    uz: { slug: "bishkek-ustki-kiyim-ulgurji", topic: "Bishkek ustki kiyim ulgurji", keyword: "ustki kiyim ulgurji" },
    tj: { slug: "bishkek-libosi-bolo-yakluht", topic: "Бишкек либоси боло яклухт", keyword: "либоси боло яклухт" },
  },
  "dostavka-s-dordoya-v-kazakhstan": {
    kk: { slug: "dordoidan-qazaqstanga-zhetkizu", topic: "Дордойдан Қазақстанға жеткізу", keyword: "Дордой Қазақстан жеткізу" },
    kg: { slug: "dordoidon-kazakstanga-zhetkiruu", topic: "Дордойдон Казакстанга жеткирүү", keyword: "Дордой Казакстан жеткирүү" },
    uz: { slug: "dordoydan-qozogistonga-yetkazish", topic: "Dordoydan Qozog'istonga yetkazish", keyword: "Dordoy Qozog'iston yetkazish" },
    tj: { slug: "az-dordoi-ba-qazoqiston-intiqol", topic: "Аз Дордой ба Қазоқистон интиқол", keyword: "Дордой Қазоқистон интиқол" },
  },
  "dostavka-s-dordoya-v-uzbekistan": {
    kk: { slug: "dordoidan-ozbekstanga-zhetkizu", topic: "Дордойдан Өзбекстанға жеткізу", keyword: "Дордой Өзбекстан жеткізу" },
    kg: { slug: "dordoidon-ozbekstanga-zhetkiruu", topic: "Дордойдон Өзбекстанга жеткирүү", keyword: "Дордой Өзбекстан жеткирүү" },
    uz: { slug: "dordoydan-ozbekistonga-yetkazish", topic: "Dordoydan O'zbekistonga yetkazish", keyword: "Dordoy O'zbekiston yetkazish" },
    tj: { slug: "az-dordoi-ba-uzbekiston-intiqol", topic: "Аз Дордой ба Ӯзбекистон интиқол", keyword: "Дордой Ӯзбекистон интиқол" },
  },
  "dostavka-s-dordoya-v-tajikistan": {
    kk: { slug: "dordoidan-tazhikstanga-zhetkizu", topic: "Дордойдан Тәжікстанға жеткізу", keyword: "Дордой Тәжікстан жеткізу" },
    kg: { slug: "dordoidon-tazhikstanga-zhetkiruu", topic: "Дордойдон Тажикстанга жеткирүү", keyword: "Дордой Тажикстан жеткирүү" },
    uz: { slug: "dordoydan-tojikistonga-yetkazish", topic: "Dordoydan Tojikistonga yetkazish", keyword: "Dordoy Tojikiston yetkazish" },
    tj: { slug: "az-dordoi-ba-tojikiston-intiqol", topic: "Аз Дордой ба Тоҷикистон интиқол", keyword: "Дордой Тоҷикистон интиқол" },
  },
  "dostavka-s-dordoya-v-russia": {
    kk: { slug: "dordoidan-reseige-zhetkizu", topic: "Дордойдан Ресейге жеткізу", keyword: "Дордой Ресей жеткізу" },
    kg: { slug: "dordoidon-rossiyaga-zhetkiruu", topic: "Дордойдон Россияга жеткирүү", keyword: "Дордой Россия жеткирүү" },
    uz: { slug: "dordoydan-rossiyaga-yetkazish", topic: "Dordoydan Rossiyaga yetkazish", keyword: "Dordoy Rossiya yetkazish" },
    tj: { slug: "az-dordoi-ba-rusiya-intiqol", topic: "Аз Дордой ба Русия интиқол", keyword: "Дордой Русия интиқол" },
  },
  "dostavka-tovarov-iz-kyrgyzstana": {
    kk: { slug: "qyrgyzstandan-tauar-zhetkizu", topic: "Қырғызстаннан тауар жеткізу", keyword: "Қырғызстаннан тауар жеткізу" },
    kg: { slug: "kyrgyzstandan-tovar-zhetkiruu", topic: "Кыргызстандан товар жеткирүү", keyword: "Кыргызстандан товар жеткирүү" },
    uz: { slug: "qirgizistondan-tovar-yetkazish", topic: "Qirg'izistondan tovar yetkazish", keyword: "Qirg'izistondan tovar yetkazish" },
    tj: { slug: "az-qirghiziston-intiqoli-mol", topic: "Аз Қирғизистон интиқоли мол", keyword: "интиқоли мол аз Қирғизистон" },
  },
  "kargo-dordoi-dostavka-kak-rabotaet": {
    kk: { slug: "dordoi-kargo-zhetkizu-qalai-zhumys-isteidi", topic: "Дордой карго жеткізу қалай жұмыс істейді", keyword: "Дордой карго жеткізу" },
    kg: { slug: "dordoi-kargo-zhetkiruu-kantip-ishteit", topic: "Дордой карго жеткирүү кантип иштейт", keyword: "Дордой карго жеткирүү" },
    uz: { slug: "dordoy-kargo-yetkazish-qanday-ishlaydi", topic: "Dordoy kargo yetkazish qanday ishlaydi", keyword: "Dordoy kargo yetkazish" },
    tj: { slug: "kargoi-dordoi-intiqol-chi-tavr-kor-mekunad", topic: "Каргои Дордой интиқол чӣ тавр кор мекунад", keyword: "каргои Дордой интиқол" },
  },
  "kargo-dordoi-skolko-vremeni-zanimaet": {
    kk: { slug: "dordoi-kargo-qansha-uakyt-alady", topic: "Дордой карго қанша уақыт алады", keyword: "Дордой карго уақыт" },
    kg: { slug: "dordoi-kargo-kancha-ubakyt-alat", topic: "Дордой карго канча убакыт алат", keyword: "Дордой карго убакыт" },
    uz: { slug: "dordoy-kargo-qancha-vaqt-oladi", topic: "Dordoy kargo qancha vaqt oladi", keyword: "Dordoy kargo vaqt" },
    tj: { slug: "kargoi-dordoi-chi-qadar-vaqt-megirad", topic: "Каргои Дордой чӣ қадар вақт мегирад", keyword: "каргои Дордой вақт" },
  },
  "kargo-bishkek-rossiya": {
    kk: { slug: "bishkek-resei-kargo", topic: "Бішкек Ресей карго", keyword: "Бішкек Ресей карго" },
    kg: { slug: "bishkek-rossiya-kargo", topic: "Бишкек Россия карго", keyword: "Бишкек Россия карго" },
    uz: { slug: "bishkek-rossiya-kargo", topic: "Bishkek Rossiya kargo", keyword: "Bishkek Rossiya kargo" },
    tj: { slug: "bishkek-rusiya-kargo", topic: "Бишкек Русия карго", keyword: "Бишкек Русия карго" },
  },
  "bayer-dordoi-kto-eto-i-zachem-nuzhen": {
    kk: { slug: "dordoi-bayer-degen-kim", topic: "Дордой байері деген кім және не үшін керек", keyword: "Дордой байер" },
    kg: { slug: "dordoi-bayer-kim-zhana-emne-uchun-kerek", topic: "Дордой байери ким жана эмне үчүн керек", keyword: "Дордой байер" },
    uz: { slug: "dordoy-bayer-kim-va-nima-uchun-kerak", topic: "Dordoy bayer kim va nima uchun kerak", keyword: "Dordoy bayer" },
    tj: { slug: "bayeri-dordoi-kist-va-baroi-chi-lozim", topic: "Байери Дордой кист ва барои чӣ лозим", keyword: "байери Дордой" },
  },
  "bayery-dordoy-bishkek-kto-eto": {
    kk: { slug: "bishkek-dordoi-bayerleri-kim", topic: "Бішкек Дордой байерлері кім", keyword: "Дордой байерлері" },
    kg: { slug: "bishkek-dordoi-bayerleri-kim", topic: "Бишкек Дордой байерлери ким", keyword: "Дордой байерлери" },
    uz: { slug: "bishkek-dordoy-bayerlar-kim", topic: "Bishkek Dordoy bayerlar kim", keyword: "Dordoy bayerlar" },
    tj: { slug: "bayerhoi-bishkek-dordoi-kistand", topic: "Байерҳои Бишкек Дордой кистанд", keyword: "байерҳои Дордой" },
  },
  "kak-vybrat-bayera-dordoi": {
    kk: { slug: "dordoi-bayerin-qalai-tandau", topic: "Дордой байерін қалай таңдау керек", keyword: "Дордой байер таңдау" },
    kg: { slug: "dordoi-bayerin-kantip-tandoo", topic: "Дордой байерин кантип тандоо керек", keyword: "Дордой байер тандоо" },
    uz: { slug: "dordoy-bayerini-qanday-tanlash", topic: "Dordoy bayerini qanday tanlash kerak", keyword: "Dordoy bayer tanlash" },
    tj: { slug: "bayeri-dordoi-chi-tavr-intihob-kardan", topic: "Байери Дордойро чӣ тавр интихоб кардан", keyword: "интихоби байер Дордой" },
  },
  "bayer-dordoi-dlya-kazakhstana": {
    kk: { slug: "qazaqstan-ushin-dordoi-bayer", topic: "Қазақстан үшін Дордой байері", keyword: "Дордой байер Қазақстан" },
    kg: { slug: "kazakstan-uchun-dordoi-bayer", topic: "Казакстан үчүн Дордой байер", keyword: "Дордой байер Казакстан" },
    uz: { slug: "qozogiston-uchun-dordoy-bayer", topic: "Qozog'iston uchun Dordoy bayer", keyword: "Dordoy bayer Qozog'iston" },
    tj: { slug: "bayeri-dordoi-baroi-qazoqiston", topic: "Байери Дордой барои Қазоқистон", keyword: "байер Дордой Қазоқистон" },
  },
  "bayer-ili-samostoyatelnaya-zakupka-dordoi": {
    kk: { slug: "dordoi-bayer-nemese-oz-betimen-satyp-alu", topic: "Дордой: байер немесе өз бетімен сатып алу", keyword: "Дордой байер" },
    kg: { slug: "dordoi-bayer-zhe-oz-aldyncha-satyp-aluu", topic: "Дордой: байер же өз алдынча сатып алуу", keyword: "Дордой байер" },
    uz: { slug: "dordoy-bayer-yoki-mustaqil-xarid", topic: "Dordoy: bayer yoki mustaqil xarid", keyword: "Dordoy bayer" },
    tj: { slug: "dordoi-bayer-yo-haridi-mustaqil", topic: "Дордой: байер ё хариди мустақил", keyword: "байер Дордой" },
  },
  "proverennye-bayery-kyrgyzstan-bezopasnyy-podhod": {
    kk: { slug: "qyrgyzstan-bayerleri-qauipsiz-tasildeme", topic: "Қырғызстан байерлері: қауіпсіз тәсіл", keyword: "Қырғызстан байерлері" },
    kg: { slug: "kyrgyzstan-bayerleri-koopsuz-mamile", topic: "Кыргызстан байерлери: коопсуз мамиле", keyword: "Кыргызстан байерлери" },
    uz: { slug: "qirgiziston-bayerlar-xavfsiz-yondashuv", topic: "Qirg'iziston bayerlar: xavfsiz yondashuv", keyword: "Qirg'iziston bayerlar" },
    tj: { slug: "bayerhoi-qirghiziston-raviši-behatar", topic: "Байерҳои Қирғизистон: равиши бехатар", keyword: "байерҳои Қирғизистон" },
  },
  "postavshchiki-dlya-wildberries-bishkek": {
    kk: { slug: "wildberries-ushin-bishkek-zhetkizushileri", topic: "Wildberries үшін Бішкек жеткізушілері", keyword: "Wildberries жеткізушілері Бішкек" },
    kg: { slug: "wildberries-uchun-bishkek-zhetkiruuchuloru", topic: "Wildberries үчүн Бишкек жеткирүүчүлөрү", keyword: "Wildberries жеткирүүчүлөрү Бишкек" },
    uz: { slug: "wildberries-uchun-bishkek-yetkazib-beruvchilar", topic: "Wildberries uchun Bishkek yetkazib beruvchilar", keyword: "Wildberries yetkazib beruvchilar Bishkek" },
    tj: { slug: "taminkunandagon-baroi-wildberries-bishkek", topic: "Таъминкунандагон барои Wildberries Бишкек", keyword: "таъминкунандагон Wildberries Бишкек" },
  },
  "tovary-optom-dlya-marketpleysov-kyrgyzstan": {
    kk: { slug: "qyrgyzstan-marketpleis-tauarlary-koterme", topic: "Қырғызстан маркетплейстеріне тауарлар көтерме", keyword: "маркетплейс тауарлары көтерме" },
    kg: { slug: "kyrgyzstan-marketpleis-tovarlary-dununon", topic: "Кыргызстан маркетплейстерине товарлар дүңүнөн", keyword: "маркетплейс товарлары дүңүнөн" },
    uz: { slug: "qirgiziston-marketpleys-tovarlari-ulgurji", topic: "Qirg'iziston marketplace tovarlari ulgurji", keyword: "marketplace tovarlari ulgurji" },
    tj: { slug: "molhoi-marketpleys-az-qirghiziston-yakluht", topic: "Молҳои marketplace аз Қирғизистон яклухт", keyword: "молҳои marketplace яклухт" },
  },
  "kak-pokupat-tovary-dlya-marketpleysa-na-dordoe": {
    kk: { slug: "dordoi-marketpleis-ushin-tauar-qalai-alu", topic: "Дордойдан marketplace үшін тауар қалай алу керек", keyword: "marketplace үшін тауар Дордой" },
    kg: { slug: "dordoi-marketpleis-uchun-tovar-kantip-aluu", topic: "Дордойдон marketplace үчүн товар кантип алуу керек", keyword: "marketplace үчүн товар Дордой" },
    uz: { slug: "dordoydan-marketplace-uchun-tovar-qanday-olish", topic: "Dordoydan marketplace uchun tovar qanday olish kerak", keyword: "marketplace uchun tovar Dordoy" },
    tj: { slug: "az-dordoi-baroi-marketplace-mol-chi-tavr-haridan", topic: "Аз Дордой барои marketplace мол чӣ тавр харидан", keyword: "marketplace Дордой" },
  },
  "shveynye-tsekha-bishkek-i-proizvodstvo-odezhdy": {
    kk: { slug: "bishkek-tigin-tsehtary-kiim-ondirisi", topic: "Бішкек тігін цехтары және киім өндірісі", keyword: "Бішкек тігін цехтары" },
    kg: { slug: "bishkek-tiguu-tsehtary-kiyim-ondurush", topic: "Бишкек тигүү цехтары жана кийим өндүрүш", keyword: "Бишкек тигүү цехтары" },
    uz: { slug: "bishkek-tikuv-sexlar-va-kiyim-ishlab-chiqarish", topic: "Bishkek tikuv sexlari va kiyim ishlab chiqarish", keyword: "Bishkek tikuv sexlari" },
    tj: { slug: "tsehhhoi-duzandagi-bishkek-va-istehsoli-libos", topic: "Сехҳои дӯзандагии Бишкек ва истеҳсоли либос", keyword: "сехҳои дӯзандагӣ Бишкек" },
  },
  "poshiv-odezhdy-pod-klyuch-bishkek": {
    kk: { slug: "bishkek-daiyn-kiim-tigu", topic: "Бішкек дайын киім тігу", keyword: "киім тігу Бішкек" },
    kg: { slug: "bishkek-dayar-kiyim-tigu", topic: "Бишкек даяр кийим тигүү", keyword: "кийим тигүү Бишкек" },
    uz: { slug: "bishkek-tayyor-kiyim-tikish", topic: "Bishkek tayyor kiyim tikish", keyword: "kiyim tikish Bishkek" },
    tj: { slug: "duhtani-libos-purrai-bishkek", topic: "Дӯхтани либос пурра дар Бишкек", keyword: "дӯхтани либос Бишкек" },
  },
};

const TITLE_SUFFIX: Record<NonRuLocale, string> = {
  kk: " | Dordoi.help нұсқаулығы",
  kg: " | Dordoi.help колдонмосу",
  uz: " | Dordoi.help qo'llanmasi",
  tj: " | Роҳнамои Dordoi.help",
};

const DESCRIPTION_PREFIX: Record<NonRuLocale, string> = {
  kk: "Практикалық нұсқаулық: ",
  kg: "Практикалык колдонмо: ",
  uz: "Amaliy qo'llanma: ",
  tj: "Роҳнамои амалӣ: ",
};

const DESCRIPTION_SUFFIX: Record<NonRuLocale, string> = {
  kk: ". Каталог, санаттар, байер, карго және контактілерге қауіпсіз қолжетімділік.",
  kg: ". Каталог, категориялар, байер, карго жана контактка коопсуз доступ.",
  uz: ". Katalog, toifalar, bayer, kargo va kontaktlarga xavfsiz kirish.",
  tj: ". Каталог, категорияҳо, байер, карго ва дастрасии бехатар ба контактҳо.",
};

const EXCERPT_SUFFIX: Record<NonRuLocale, string> = {
  kk: "Dordoi.help каталог, санаттар, байер және карго арқылы қауіпсіз алғашқы қадам жасауға көмектеседі.",
  kg: "Dordoi.help каталог, категориялар, байер жана карго аркылуу коопсуз биринчи кадам жасоого жардам берет.",
  uz: "Dordoi.help katalog, toifalar, bayer va kargo orqali xavfsiz birinchi qadam qilishga yordam beradi.",
  tj: "Dordoi.help тавассути каталог, категорияҳо, байер ва карго барои қадами аввалини бехатар кӯмак мекунад.",
};

export function localizedBlogMeta(sourceSlug: string, locale: RouteLocale) {
  if (locale === "ru") return undefined;
  const meta = TOPICS[sourceSlug]?.[locale as NonRuLocale];
  if (!meta) return undefined;
  return {
    ...meta,
    title: `${meta.topic}${TITLE_SUFFIX[locale as NonRuLocale]}`,
    h1: meta.topic,
    description: `${DESCRIPTION_PREFIX[locale as NonRuLocale]}${meta.topic.toLowerCase()}${DESCRIPTION_SUFFIX[locale as NonRuLocale]}`,
    excerpt: `${meta.topic}. ${EXCERPT_SUFFIX[locale as NonRuLocale]}`,
  };
}

export function blogPostSlugForLocale(sourceSlug: string, locale: RouteLocale): string {
  if (locale === "ru") return sourceSlug;
  return TOPICS[sourceSlug]?.[locale as NonRuLocale]?.slug ?? sourceSlug;
}

export function blogPostPathForLocale(sourceSlug: string, locale: RouteLocale): string {
  return `/blog/${blogPostSlugForLocale(sourceSlug, locale)}`;
}

export function blogPostPathsByLocale(sourceSlug: string): Record<RouteLocale, string> {
  return Object.fromEntries(
    ROUTE_LOCALES.map((locale) => [locale, blogPostPathForLocale(sourceSlug, locale)]),
  ) as Record<RouteLocale, string>;
}

export function sourceSlugFromLocalizedBlogSlug(slug: string, locale: RouteLocale): string | undefined {
  if (locale === "ru") return slug;
  for (const [sourceSlug, localizedByLocale] of Object.entries(TOPICS)) {
    if (localizedByLocale[locale as NonRuLocale]?.slug === slug) {
      return sourceSlug;
    }
  }
  return undefined;
}

export function allLocalizedBlogStaticParams(sourceSlugs: string[]) {
  return ROUTE_LOCALES.flatMap((locale) =>
    sourceSlugs.map((sourceSlug) => ({
      locale,
      slug: blogPostSlugForLocale(sourceSlug, locale),
    })),
  );
}

export function duplicateLocalizedBlogSlugs(): string[] {
  const duplicates: string[] = [];
  for (const locale of ROUTE_LOCALES) {
    const seen = new Set<string>();
    for (const sourceSlug of Object.keys(TOPICS)) {
      const slug = blogPostSlugForLocale(sourceSlug, locale);
      const key = `${locale}:${slug}`;
      if (seen.has(key)) duplicates.push(key);
      seen.add(key);
    }
  }
  return duplicates;
}

export const BLOG_GUIDE_LOCALIZED_META = TOPICS;
