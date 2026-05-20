# Dordoi.help — Schema / structured data audit

Date: 2026-05-18  
Method: live HTML JSON-LD extraction + smoke/i18n crawl

## Summary

**Verdict: PASS** with minor P2 notes.

## Types observed (sample)

| Page type | Schema types |
|-----------|--------------|
| Home `/ru` | Organization, WebSite, SearchAction, Country, ContactPoint |
| Catalog | CollectionPage + site graph |
| About | AboutPage, FAQPage, BreadcrumbList |
| How-it-works / FAQ | WebPage, FAQPage, BreadcrumbList |
| For-buyers / for-sellers | WebPage, Service, Audience, FAQPage |
| Buyer-service / kargo | WebPage, Service, FAQPage |
| Guides | BlogPosting, FAQPage (smoke verified) |
| Categories | CollectionPage, FAQPage, BreadcrumbList (smoke) |

## Compliance checks

| Rule | Status |
|------|--------|
| FAQPage only where FAQ visible | ✅ |
| BlogPosting on guide pages | ✅ (585 smoke checks) |
| `inLanguage` correct per locale | ✅ (389-route crawl, 0 schema language failures) |
| No fake Review / AggregateRating | ✅ |
| No Product schema on non-product pages | ✅ |
| No LocalBusiness on locked vendor pages | ✅ (privacy smoke) |
| No vendor telephone/sameAs/streetAddress in locked pages | ✅ |

## P2 notes

- Site-wide Organization graph repeats on many pages (normal for Next layout); monitor rich result eligibility in GSC.
- `ContactPoint` on public pages may include **platform** support channels (not vendor-private); distinguish from vendor leaks in privacy audit.
