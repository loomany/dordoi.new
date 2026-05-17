# Dordoi.help Localization Glossary

Date: 2026-05-17
Scope: `kk`, `kg` route with `hreflang=ky`, `uz`, `tj` route with `hreflang=tg`

## Rules

- Keep the brand as `Dordoi.help`.
- Keep the market name recognizable as `Дордой` / `Dordoy`.
- Route locale stays `/kg`, but HTML lang and hreflang must be `ky`.
- Route locale stays `/tj`, but HTML lang and hreflang must be `tg`.
- Do not translate private vendor contact fields or add phone/social/map links.
- Do not promise guaranteed deals, delivery times, prices, verified suppliers or ratings unless verified by business data.

## Core Terms

| RU term | kk preferred | kg preferred | uz preferred | tj preferred | Avoid | Notes |
|---|---|---|---|---|---|---|
| Дордой | Дордой | Дордой | Dordoy | Дордой | Dordoi market mixed randomly | Brand/market entity should stay stable. |
| рынок Дордой | Дордой нарығы | Дордой базары | Dordoy bozori | бозори Дордой | базар Дордои | Use local natural phrase. |
| поставщик | жеткізуші | жеткирүүчү | yetkazib beruvchi | таъминкунанда | supplier in local UI | Use local term in metadata/H1. |
| продавец | сатушы | сатуучу | sotuvchi | фурӯшанда | vendor as visible label | `vendor` can stay only in code. |
| оптом | көтерме | оптом / дүң | ulgurji | оптӣ / опт | retail wording | Use commercial wholesale intent. |
| оптовая закупка | көтерме сатып алу | оптом сатып алуу | ulgurji xarid | хариди оптӣ | guaranteed purchase | Avoid claims that Dordoi.help sells goods. |
| каталог | каталог | каталог | katalog | каталог | directory transliteration where awkward | OK to keep short and familiar. |
| байер | байер | байер | xaridor-agent | байер | buyer as English only | In Uzbek, `xaridor-agent` is clearer. |
| карго | карго | карго | kargo | карго | доставка company | Dordoi.help is not a single cargo operator. |
| доставка | жеткізу | жеткирүү | yetkazish | интиқол | guaranteed delivery | Use as scenario, not promise. |
| контакты | контакттер | контакттар | kontaktlar | контактҳо | public phone | Keep gated/private rule. |
| доступ к контактам | контактке қолжетімділік | контактка доступ | kontaktlarga kirish | дастрасӣ ба контактҳо | paid contacts in open schema | Do not expose actual contact values. |
| категории | санаттар | категориялар | toifalar | категорияҳо | categories in English | Use in nav and category pages. |
| покупатели | сатып алушылар | сатып алуучулар | xaridorlar | харидорон | clients where ambiguous | Buyer audience. |
| продавцы | сатушылар | сатуучулар | sotuvchilar | фурӯшандагон | merchants mixed | Seller audience. |
| Кыргызстан | Қырғызстан | Кыргызстан | Qirg'iziston | Қирғизистон | Kyrgyzstan in local H1 unless English page | Use country page label by locale. |
| Казахстан | Қазақстан | Казакстан | Qozog'iston | Қазоқистон | Kazakhstan in local H1 unless English page | Use country page label by locale. |
| Узбекистан | Өзбекстан | Өзбекстан | O'zbekiston | Ӯзбекистон | Uzbekistan in local H1 unless English page | Use country page label by locale. |
| Таджикистан | Тәжікстан | Тажикстан | Tojikiston | Тоҷикистон | Tajikistan in local H1 unless English page | Use country page label by locale. |
| Россия | Ресей | Россия | Rossiya | Русия | РФ in SEO H1 | Use neutral country name. |
| СНГ | ТМД | КМШ | MDH | ИДМ | CIS mixed into local copy | Use where natural, avoid overuse. |

## Human Review Notes

- Kazakh: review grammar around country-case endings for country pages.
- Kyrgyz: review wholesale wording between `оптом` and `дүң`; current copy uses familiar market wording.
- Uzbek: keep Latin script; use `xaridor-agent` for buyer to reduce ambiguity.
- Tajik: review business terms `оптӣ`, `байер`, `карго` for local audience clarity.
- Category terms should be reviewed against actual buyer search queries after GSC/Yandex data arrives.
