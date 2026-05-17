# Dordoi.help keyword clustering — 2026-05-17

Mode: scoped SEO/content implementation. No auth, payments, RLS, database, env, checkout, pricing, admin or private vendor contact logic changed.

Pre-check:
- Worktree was already dirty before this stage: previous Stage 3/4/5 SEO files were uncommitted.
- Required production env for deploy: `NEXT_PUBLIC_SITE_INDEXABLE=true`, `NEXT_PUBLIC_APP_URL=https://dordoi.help`.
- Privacy regression on locked supplier/category pages passed in smoke: no vendor phone, WhatsApp, Telegram, Instagram, map URLs, `LocalBusiness`, `telephone`, `sameAs`, `streetAddress`.
- The separate raw keyword attachment was not present in the workspace; clustering used the seed keyword set from the task and merged duplicates/near-duplicates by intent.

| Cluster | Intent | RU keywords | KK keywords | KG/KY keywords | UZ keywords | TJ/TG keywords | Recommended page | Priority | Notes |
|---|---|---|---|---|---|---|---|---|---|
| Dordoi wholesale core | Buy wholesale / understand process | дордой оптом, оптом дордой | Дордой көтерме | Дордой дүңүнөн | Dordoy ulgurji | Дордой яклухт | `/blog/dordoi-optom-polnyy-gid` | High | Core money-support guide. |
| Dordoi online catalog | Use online catalog | дордой онлайн каталог | Дордой онлайн каталогы | Дордой онлайн каталогу | Dordoy onlayn katalogi | Каталоги онлайни Дордой | `/blog/dordoi-online-katalog-kak-polzovatsya` | High | Supports `/catalog`. |
| Suppliers / supplier base | Find suppliers | поставщики Дордой, база поставщиков Кыргызстан | Кыргызстан поставщиктер базасы | Дордой жеткирүүчүлөрү | Dordoy yetkazib beruvchilar | Таъминкунандагони Дордой | existing `/blog/kak-nayti-postavshchika-dordoi` | High | Merged with existing Stage 2 URL. |
| Supplier check | Risk reduction | как проверить поставщика Дордой | жеткізушіні тексеру | жеткирүүчүнү текшерүү | yetkazib beruvchini tekshirish | санҷиши таъминкунанда | `/blog/kak-proverit-postavshchika-dordoi` | High | Trust/conversion guide. |
| Buying checklist | Transaction prep | чек-лист закупки Дордой | сатып алу чек-парағы | сатып алуу чек-барагы | xarid chek-ro'yxati | чек-листи харид | `/blog/chek-list-zakupki-na-dordoe` | High | Practical guide. |
| Remote buying | Buyer/cargo workflow | закупать на Дордое удаленно | қашықтан сатып алу | аралыктан сатып алуу | masofadan xarid | хариди фосилавӣ | `/blog/kak-zakupat-na-dordoe-udalenno` | High | Useful for CIS buyers. |
| Women clothing | Category commercial | женская одежда оптом Дордой | әйелдер киімі көтерме | аялдар кийими дүңүнөн | ayollar kiyimi ulgurji | либосҳои занона яклухт | `/blog/zhenskaya-odezhda-optom-dordoi` | High | Supports category page. |
| Men clothing | Category commercial | мужская одежда оптом Дордой | ерлер киімі көтерме | эркектер кийими | erkaklar kiyimi | либосҳои мардона | `/blog/muzhskaya-odezhda-optom-dordoi` | High | Supports category page. |
| Kids clothing | Category commercial | детская одежда оптом Дордой | балалар киімі көтерме | балдар кийими | bolalar kiyimi | либосҳои кӯдакона | `/blog/detskaya-odezhda-optom-dordoi` | High | Supports category page. |
| Footwear | Category commercial | обувь оптом Дордой | аяқ киім көтерме | бут кийим дүңүнөн | poyabzal ulgurji | пойафзол яклухт | `/blog/obuv-optom-dordoi` | High | Existing URL kept. |
| Knitwear | Category commercial | трикотаж оптом Дордой | трикотаж көтерме | трикотаж дүңүнөн | trikotaj ulgurji | трикотаж яклухт | `/blog/trikotazh-optom-dordoi` | High | New guide added. |
| Fabrics/sewing | Category + production | ткани, фурнитура, швейные цеха | маталар, тігін | кездеме, тигүү | mato, tikuv | матоъ, дӯзандагӣ | `/blog/tkani-i-furnitura-dordoi`, `/blog/shveynye-tsekha-bishkek-i-proizvodstvo-odezhdy` | High | Split category vs production. |
| Bags/leather goods | Category commercial | сумки оптом Дордой | сөмкелер көтерме | сумкалар дүңүнөн | sumkalar ulgurji | сумкаҳо яклухт | `/blog/sumki-optom-dordoi` | High | Existing URL kept. |
| Underwear/corsets | Category commercial | нижнее бельё корсеты Дордой | іш киім корсет | ич кийим корсет | ichki kiyim korset | либоси таг корсет | `/blog/nizhnee-bele-i-korsety-optom-dordoi` | High | New safe guide. |
| Home textile | Category commercial | постельное бельё оптом | төсек жабдығы | төшөк жабдык | ko'rpa-to'shak | ҷойпӯш | `/blog/postelnoe-bele-optom-kyrgyzstan` | Medium | New guide. |
| Cargo/delivery | Logistics investigation | карго Дордой доставка | жеткізу, карго | жеткирүү, карго | yetkazish, kargo | интиқол, карго | existing cargo/country guides | High | No exact price/time promises. |
| Bayer/buyer-agent | Assisted buying | байер Дордой Бишкек | байер Дордой | байер Дордой | Dordoy bayer | байери Дордой | existing buyer guides | High | Avoid “verified” unless proven. |
| Marketplace/Wildberries | Marketplace supplier search | поставщики для Wildberries Бишкек | Wildberries жеткізушілер | Wildberries жеткирүүчүлөрү | Wildberries yetkazib beruvchilar | Wildberries таъминкунандагон | `/blog/postavshchiki-dlya-wildberries-bishkek` | High | No compliance guarantees. |
| Prices / price lists | Price investigation | дордой прайс листы, цены | Дордой бағалары | Дордой баалары | Dordoy narxlari | нархҳои Дордой | `/blog/dordoi-prais-listy-i-tseny-kak-utochnyat` | Medium | Safe angle: explain variability. |
| Contacts / phone / social | Risky contact intent | номера контейнеров, контакты, Telegram, Instagram | контактілер | контакттар | kontaktlar | контактҳо | `/blog/kontakty-postavshchikov-dordoi-kak-otkryt-bezopasno` | High but risky | Do not publish vendor contacts. |
| Bishkek market generic | Broader discovery | рынок Бишкек, рынок Дордой | Бішкек нарығы | Бишкек базары | Bishkek bozori | бозори Бишкек | existing `/rynok-dordoi` + guides | Medium | Connect to Dordoi entity. |

Ignored or merged:
- Direct phone/container/social list keywords are not served with raw contact lists. They are routed into the safe contact-access guide.
- “Verified bayers” intent is handled with cautious wording; no “verified” claim is made without business proof.
- Duplicate country delivery variants are merged into country-specific delivery guides and country landing pages.
