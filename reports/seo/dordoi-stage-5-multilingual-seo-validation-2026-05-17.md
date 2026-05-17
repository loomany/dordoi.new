# Dordoi.help multilingual SEO validation — 2026-05-17

Commands run:
- `npx.cmd tsc --noEmit` — passed.
- `node --test --import tsx lib/seo/dordoi-blog-localized.test.ts` — 4/4 passed.
- `NEXT_PUBLIC_SITE_INDEXABLE=true NEXT_PUBLIC_APP_URL=https://dordoi.help npm.cmd run build` — passed, 435 static pages generated.
- Local production smoke with `BASE_URL=http://127.0.0.1:3005` — 376/376 passed.

Smoke coverage:
- Redirect aliases:
  - `/ru/dordoi-market` -> `/ru/rynok-dordoi`
  - `/ru/wholesale` -> `/ru/dordoi-optom`
  - `/ru/cargo` -> `/ru/kargo-dordoi`
- `/llms.txt` status and vendor privacy mention.
- `/sitemap.xml` and `/sitemaps/core.xml` status.
- Sitemap contains RU and localized guide URLs.
- Sitemap excludes redirect aliases.
- Sitemap has no localhost.
- Query URL `/ru/catalog?search=test&utm_source=x&gclid=abc` returns canonical `/ru/catalog` and `noindex, follow`.
- Locked privacy pages pass strict private-data grep:
  - `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`
  - `/ru/categories/zhenskaya-odezhda-optom`
  - `/ru/suppliers/asso-corsets`
- Top 9 category pages pass status/canonical/H1/FAQ/JSON-LD/private-data checks.
- Blog hubs pass for `/ru/blog`, `/kk/blog`, `/kg/blog`, `/uz/blog`, `/tj/blog`.
- All RU guide sample paths pass status/canonical/H1/BlogPosting/FAQ/private-data checks.
- Localized sample guides pass status/canonical/H1/BlogPosting/hreflang/private-data checks.

Hreflang validation:
- Localized sample pages include `ru`, `kk`, `ky`, `uz`, `tg`, `x-default`.
- Smoke confirms no wrong `hreflang=kg` or `hreflang=tj` on localized guide samples.

Build note:
- Next.js still reports the existing middleware-to-proxy deprecation warning. This is unrelated to this SEO/content task and was not changed.
