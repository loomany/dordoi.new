# Final SEO Smoke — Before Push (dordoi.help)

**Date:** 2026-05-13  
**Branch:** `main` (ahead of `origin/main` by 5 commits)  
**Push:** not done (per task)

## Commit history (all five SEO commits present)

```
580eb93 fix(seo): safe vendor profile titles and legacy slug index policy
adc4dd8 feat(seo): sitemap and internal linking for SEO pages
6f55c04 feat(seo): add category vendor grids and index policy
4a9b1a6 feat(seo): add category route manifest and landing skeletons
d29a68e fix(seo): secure catalog indexing and vendor privacy
```

## Pre-check

### `git status`

Tracked tree **clean** after restoring accidental local edits (see Remaining risks). Untracked junk only:

- `.sync-*`, `backups/`, `sync-all-media-*.log`
- `tmp-*`, `tmp-catalog-ru.html`, `tmp-seo-ru.html`, `tmp-static2.html`
- Old audit/plan CSVs/MD under `reports/seo/` (pre-stage artifacts)
- Ad-hoc scripts: `scripts/fix-div.mjs`, `scripts/precommit-seo-review.mjs`, `scripts/seo-stage1-html-check.mjs`

### `git diff --stat`

Empty on tracked files at report time.

## Build / TypeScript

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | **Pass** (exit 0) |
| `npm run build` | **Pass** (Next.js 16.2.6, 205 static paths) |

Smoke runtime: production server (`npm run start`) with `NEXT_PUBLIC_SITE_INDEXABLE=true`, after clean rebuild from committed tree.

## Sitemap smoke

Fetched `http://localhost:3000/sitemap.xml` (local `baseUrl`; production must use `https://dordoi.help` via `NEXT_PUBLIC_APP_URL` at build).

| Check | Expected | Result |
|-------|----------|--------|
| `<url>` count | 155 | **155** |
| Core landings (`rynok-dordoi`, `dordoi-optom`, `kargo-dordoi`) | present | **Present** |
| Sample categories (`zhenskaya-odezhda-optom`, `obuv-optom`, `sumki-kozhgalantereya-optom`, `tkani-shveynaya-furnitura-optom`) | present | **Present** |
| Query params (`?cat=`, `?page=`, `?search=`, `?sort=`, `?compare=`) | absent | **Absent** |
| `:8080`, `undefined`, `null` | absent | **Absent** |
| Contact/social (`instagram.com`, `t.me`, `wa.me`, `tel:`) | absent | **Absent** |
| `hreflang="kg"` / `hreflang="tj"` | absent | **Absent** |
| `hreflang="ky"`, `hreflang="tg"`, `x-default` | present | **Present** |

`localhost` in `<loc>` is expected locally; not a blocker for push if CI/production sets the public app URL before build.

## Key page smoke

| URL | HTTP | Robots | Title dup `\| Dordoi.help \| Dordoi.help` | H1 (safe/public) |
|-----|------|--------|------------------------------------------|------------------|
| `/ru` | 200 | index,follow | ok | ok |
| `/ru/catalog` | 200 | index,follow | ok | ok |
| `/ru/suppliers` | 200 | index,follow | ok | ok |
| `/ru/rynok-dordoi` | 200 | index,follow | ok | ok |
| `/ru/dordoi-optom` | 200 | index,follow | ok | ok |
| `/ru/kargo-dordoi` | 200 | index,follow | ok | ok |
| `/ru/categories/zhenskaya-odezhda-optom` | 200 | index,follow | ok | ok |
| `/ru/categories/obuv-optom` | 200 | index,follow | ok | ok |
| `/ru/categories/sumki-kozhgalantereya-optom` | 200 | index,follow | ok | ok |
| `/ru/categories/tkani-shveynaya-furnitura-optom` | 200 | index,follow | ok | ok |
| `/ru/catalog/asso-corsets` | 200 | **noindex,follow** | ok | safe supplier H1 |
| `/ru/catalog/arusha-kg` | 200 | **noindex,follow** | ok | safe supplier H1 |
| `/ru/catalog/slavyana-moda` | 200 | **noindex,follow** | ok | safe supplier H1 |
| `/ru/categories/random-fake-category` | **404** | n/a | n/a | n/a |
| `/ru/random-fake-seo-page` | **404** | n/a | n/a | n/a |

Canonical tags present on sampled indexable pages (`self` on clean URLs). Descriptions present via `buildPageMetadata`.

## Robots policy (query URLs)

| URL | Robots | Canonical |
|-----|--------|-----------|
| `/ru/catalog?page=2` | noindex,follow | `/ru/catalog` |
| `/ru/catalog?cat=footwear` | noindex,follow | `/ru/catalog` |
| `/ru/catalog?search=dress` | noindex,follow | `/ru/catalog` |
| `/ru/catalog?sort=new` | noindex,follow | `/ru/catalog` |
| `/ru/catalog?compare=1` | **noindex,nofollow** | `/ru/catalog` |

No query URLs in sitemap.

## Canonical / hreflang

Sample `/ru` rendered alternates:

```html
<link rel="alternate" hrefLang="ru" href="http://localhost:3000/ru"/>
<link rel="alternate" hrefLang="kk" href="http://localhost:3000/kk"/>
<link rel="alternate" hrefLang="ky" href="http://localhost:3000/kg"/>
<link rel="alternate" hrefLang="uz" href="http://localhost:3000/uz"/>
<link rel="alternate" hrefLang="tg" href="http://localhost:3000/tj"/>
<link rel="alternate" hrefLang="x-default" href="http://localhost:3000/ru"/>
```

- URL segments `/kg` and `/tj` map to **ky** / **tg** hreflang (correct).
- No **kg** / **tj** hreflang values in HTML or sitemap.

Same six alternates confirmed on `/ru/catalog`, `/ru/categories/zhenskaya-odezhda-optom`, `/ru/rynok-dordoi`.

## Privacy grep

Rendered HTML checked for vendor contact leakage (`href` to `instagram.com`, `t.me`, `wa.me`, `tel:`, JSON-LD `sameAs` / `telephone`).

| Page | Vendor contact `href` | JSON-LD contact |
|------|----------------------|-----------------|
| `/ru` | none (platform `t.me/dordoi_help_admin_bot` support only) | none |
| `/ru/catalog` | none | none |
| SEO category pages | none | none |
| Core landings | none | none |
| Legacy vendor profiles (`asso-corsets`, etc.) | none | none |

i18n/admin bundle strings may still contain words like `instagram` / `telegram` in JS payloads; they are **not** crawlable vendor contact links. Contacts remain **locked** on vendor profiles (by design, Stage 3).

## Internal links

| Surface | Expected | Result |
|---------|----------|--------|
| **Footer** | Каталог поставщиков, Поставщики Дордой, Рынок Дордой, Дордой оптом, Байеры, Карго Дордой + top category links | **Pass** |
| **Home** | catalog, suppliers, rynok-dordoi, dordoi-optom, kargo-dordoi + 3 category links | **Pass** (`HomePopularSectionsBlock`) |
| **Catalog** | «Популярные категории», category links, no `?cat=` badges | **Pass** |
| **Vendor profile** | Catalog → SEO category → «Поставщик» breadcrumb | **Pass** (`/catalog`, `/categories/…` in HTML) |

## Remaining risks

1. **Production URL env** — Set `NEXT_PUBLIC_APP_URL=https://dordoi.help` (and indexable flag) before production `next build` so canonical, OG, and sitemap `<loc>` use the live host.
2. **Legacy vendor URLs** — Still reachable (200, noindex,follow) but **not** in sitemap; brand may remain in slug path until migration (documented Stage 3 tradeoff).
3. **Contact unlock** — Vendor Instagram/WhatsApp buttons intentionally not restored in SEO commits; separate product decision.
4. **Local uncommitted edits found during smoke** — Working tree had reverted `SiteFooter.tsx` SEO blocks, truncated `lib/seo/seo-internal-links.ts`, and a `CatalogBrowseLayout` popular-categories move. All were **discarded** (`git checkout -- .`) before final smoke; committed tree matches the five SEO commits.
5. **Dev Turbopack flakiness** — Transient 500s on `next dev` during earlier smoke (stale HMR); production `build` + `start` was stable.
6. **Stage 2D** — Marketing copy polish on landings/categories not in scope of these commits.

## Final git status

```
On branch main
Your branch is ahead of 'origin/main' by 5 commits.
nothing to commit, working tree clean (untracked junk only)
```

## Recommendation

**Push now.** All smoke criteria pass on the committed five-commit SEO stack: 155-URL sitemap, indexable SEO surfaces, legacy vendor noindex, query URL robots, hreflang ky/tg/x-default, no vendor contact leaks in rendered SEO pages, internal linking intact, build/tsc green.

**Push not done** — awaiting explicit approval after this report.
