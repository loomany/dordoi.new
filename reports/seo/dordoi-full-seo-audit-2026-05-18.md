# Dordoi.help — Full SEO audit (Part A: Git / environment)

Date: 2026-05-18  
Mode: **AUDIT ONLY** — no code/env/DB changes

## Git state

```
git status --short
(clean — no output)

git log --oneline -5
8f48b65 docs(seo): add live favicon deploy validation to audit report
0be316d fix(seo): restore favicon availability for crawlers
a351ec9 docs(seo): add post-deploy i18n validation report
f884f65 feat(i18n): complete multilingual SEO translation coverage
9f9f719 Hide Korotko AI answer blocks in the UI while keeping markup for SEO.
```

| Check | Result |
|-------|--------|
| Working tree | **Clean** |
| Latest i18n commit | ✅ `f884f65` |
| Favicon fix commit | ✅ `0be316d` |
| Uncommitted files | **None** |

## Production environment (inferred from live)

| Variable | Expected | Live evidence |
|----------|----------|---------------|
| `NEXT_PUBLIC_SITE_INDEXABLE=true` | Allow indexing | `robots.txt` allows `/`; pages have `robots: index, follow` |
| `NEXT_PUBLIC_APP_URL=https://dordoi.help` | Canonical host | All canonicals use `https://dordoi.help/...`; sitemap idem |

## Live technical files

| URL | Status | Notes |
|-----|--------|-------|
| https://dordoi.help/robots.txt | 200 | Sitemap referenced; AI crawlers allowed |
| https://dordoi.help/sitemap.xml | 200 | Index → `sitemaps/core.xml` |
| https://dordoi.help/sitemaps/core.xml | 200 | 375 URLs; no localhost |
| https://dordoi.help/llms.txt | 200 | Privacy rules + sitemap link |

## Automated checks (2026-05-18)

| Command | Result |
|---------|--------|
| `npm run check:i18n` | PASS |
| `npx tsc --noEmit` | PASS |
| `node --test lib/seo/dordoi-blog-localized.test.ts` | 4/4 PASS |
| `NEXT_PUBLIC_SITE_INDEXABLE=true NEXT_PUBLIC_APP_URL=https://dordoi.help npm run build` | PASS (435 pages) |
| `BASE_URL=https://dordoi.help npm run seo:smoke:dordoi` | **585/585 PASS** |
| `BASE_URL=https://dordoi.help npm run seo:i18n:full` | **10/10 PASS**, 389 routes crawled |
| `BASE_URL=https://dordoi.help npm run audit:favicon` | **6/6 PASS** |

## Related deliverables

See companion reports in `reports/seo/` dated 2026-05-18 for technical, sitemap, robots, i18n, content, schema, privacy, AI, favicon, performance, GSC readiness, keyword gap, and final summary.
