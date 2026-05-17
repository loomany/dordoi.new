# Dordoi.help keyword guide implementation — 2026-05-17

What changed:
- Added central localized blog slug/meta map: `lib/seo/dordoi-blog-localized.ts`.
- Added 11 new keyword-driven RU source guides to the existing `lib/seo/stage5-guides.ts`.
- Total published guide count is now 34.
- Existing Stage 2 and Stage 5 guide architecture was extended; no second blog system was created.
- Blog hub now groups guides by cluster: wholesale, categories, cargo, bayer, marketplace, production, prices/contact safety.
- Dynamic blog route now resolves localized slugs and can redirect non-RU legacy source slugs to localized slugs.
- Metadata can now use locale-specific alternate paths for localized slugs.
- Core sitemap now emits localized guide URLs.
- Sitemap index cache key includes `baseUrl` to prevent stale localhost entries.
- SEO smoke script now checks localized guides, hreflang, canonical, sitemap, query noindex, category SEO and privacy.

New RU guides:
1. `/ru/blog/dordoi-optom-polnyy-gid`
2. `/ru/blog/dordoi-online-katalog-kak-polzovatsya`
3. `/ru/blog/dordoi-prais-listy-i-tseny-kak-utochnyat`
4. `/ru/blog/kontakty-postavshchikov-dordoi-kak-otkryt-bezopasno`
5. `/ru/blog/trikotazh-optom-dordoi`
6. `/ru/blog/nizhnee-bele-i-korsety-optom-dordoi`
7. `/ru/blog/postelnoe-bele-optom-kyrgyzstan`
8. `/ru/blog/postavshchiki-dlya-wildberries-bishkek`
9. `/ru/blog/tovary-optom-dlya-marketpleysov-kyrgyzstan`
10. `/ru/blog/shveynye-tsekha-bishkek-i-proizvodstvo-odezhdy`
11. `/ru/blog/poshiv-odezhdy-pod-klyuch-bishkek`

Privacy contract:
- Contact-intent content explains gated access instead of publishing contacts.
- No fake prices, fake reviews, fake ratings or unsupported “verified” claims were added.
- No vendor private contacts are present in article text, JSON-LD, sitemap or smoke sample output.

Internal linking:
- Guide cards link via localized blog paths.
- Category/country/trust pages retain existing Stage 3/4 internal links.
- New guide suggestions were added to category/country guide helpers for fabrics, underwear/corsets, home textile, Kazakhstan, Kyrgyzstan, FAQ and Dordoi optom.
