# Dordoi.help — Robots / AI crawler audit

Date: 2026-05-18  
Source: live `https://dordoi.help/robots.txt`

## Summary

**Verdict: PASS** — public SEO surfaces allowed; private/admin/query traps blocked; sitemap referenced.

## Crawler rules

All listed user-agents receive `Allow: /` with targeted `Disallow`:

| User-Agent | Public SEO | Private blocked |
|------------|------------|-----------------|
| `*` | ✅ | api, admin, account, auth, checkout, payment, signin, cabinet, query params |
| Googlebot | ✅ | same |
| YandexBot | ✅ | same |
| Bingbot | ✅ | same |
| GPTBot | ✅ | same |
| ChatGPT-User | ✅ | same |
| OAI-SearchBot | ✅ | same |
| PerplexityBot | ✅ | same |
| ClaudeBot | ✅ | same |
| Applebot | ✅ | same |
| Google-Extended | ✅ | same |
| CCBot | ✅ | same |

## Path checks

| Path pattern | Blocked? | Expected |
|--------------|----------|----------|
| `/ru`, `/kk`, `/kg`, `/uz`, `/tj` | No | ✅ |
| `/blog`, `/categories` | No | ✅ |
| `/sitemap.xml` | No | ✅ |
| `/favicon.ico` | No | ✅ |
| `/llms.txt` | No | ✅ |
| `/_next/static` | Not globally blocked | ✅ |
| `?cat=`, `?page=`, `?search=` | Blocked via Disallow | ✅ intentional |

## Sitemap / host

- `Sitemap: https://dordoi.help/sitemap.xml`
- `Host: dordoi.help`

## Risks (P2)

- Query-param Disallow is pattern-based; verify in GSC that filtered catalog URLs stay `noindex` via meta as well (smoke confirms `?cat=` → noindex,follow).
