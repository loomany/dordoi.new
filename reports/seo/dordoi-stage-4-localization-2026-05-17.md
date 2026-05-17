# Dordoi.help Stage 4 Localization Report — 2026-05-17

## Scope

Stage 4 added controlled localization for the SEO foundation without mass auto-translation and without changing auth, payments, RLS, database, checkout, pricing, subscriptions, or admin logic.

Covered route locales:

- `/kk` with `hreflang="kk"`
- `/kg` with `hreflang="ky"`
- `/uz` with `hreflang="uz"`
- `/tj` with `hreflang="tg"`

## Files Added

- `reports/seo/dordoi-stage-4-localization-audit-plan-2026-05-17.md`
- `reports/seo/dordoi-localization-glossary-2026-05-17.md`
- `lib/seo/stage4-localized-content.ts`

## Files Updated

- `components/seo/SafePageSchemaJsonLd.tsx`
- `lib/seo/stage2-content.ts`
- `lib/catalog/seo-category-content.ts`
- `components/seo/SeoGrowthLandingPage.tsx`
- `components/seo/SeoCoreLanding.tsx`
- `components/seo/SeoCategoryLanding.tsx`
- `components/seo/BlogGuidePage.tsx`
- `components/seo/BlogHubPage.tsx`
- `app/[locale]/blog/page.tsx`

## Localized Pages

Priority 1 pages localized for `kk`, `kg`, `uz`, `tj`:

- `/about`
- `/how-it-works`
- `/faq`
- `/for-buyers`
- `/for-sellers`

Priority 2 country pages localized for `kk`, `kg`, `uz`, `tj`:

- `/dordoi-kazakhstan`
- `/dordoi-uzbekistan`
- `/dordoi-tajikistan`
- `/dordoi-russia`
- `/dordoi-kyrgyzstan`

Priority 3 category pages localized for the top 9 commercial categories:

- womens
- mens
- kids
- footwear
- fabrics-notions
- bags-leather
- underwear-swim
- home-textiles
- accessories

Priority 4 first blog guides localized for `kk`, `kg`, `uz`, `tj`:

- `/blog/kak-nayti-postavshchika-dordoi`
- `/blog/kargo-dordoi-kak-rabotaet-dostavka`
- `/blog/kak-kupit-optom-na-dordoe`

## Schema / Language

- `SafePageSchemaJsonLd` and `BlogPostingJsonLd` now use mapped HTML/BCP language values:
  - `/kg` outputs `inLanguage: "ky"`
  - `/tj` outputs `inLanguage: "tg"`
- Existing route locale segments remain unchanged:
  - `/kg`, not `/ky`
  - `/tj`, not `/tg`

## Hreflang / Canonical Checks

Production-build crawl result:

- `LOCALIZATION_CRAWL 96/96 passed`

Checked:

- HTTP 200
- canonical equals the current localized URL
- `hrefLang` includes `ru`, `kk`, `ky`, `uz`, `tg`, `x-default`
- `<html lang>` maps correctly:
  - kk -> kk
  - kg -> ky
  - uz -> uz
  - tj -> tg
- schema `inLanguage` matches the locale mapping
- title, description, and H1 are present
- robots are `index, follow`

Note: Next.js 16 renders the alternate attribute as `hrefLang`, not lowercase `hreflang`, in raw HTML. Smoke checks should accept this casing.

## Privacy Regression

Checked locked/public pages:

- `/ru/catalog/postavshik-zhenskoy-odezhdy-a9e9`
- `/ru/categories/zhenskaya-odezhda-optom`
- `/ru/suppliers/asso-corsets`
- `/kk/categories/ayelder-kiimi-koterme`
- `/kg/categories/ayaldar-kiyimi-dung`
- `/uz/categories/ayollar-kiyimi-ulgurji`
- `/tj/categories/libosi-zanona-yaklukht`

Strict privacy pattern result: empty for all checked locked supplier/category pages.

No vendor phone, WhatsApp, Telegram, Instagram, map URLs, `LocalBusiness`, `telephone`, `sameAs`, or `streetAddress` were found in locked output.

## Build / Tests

- `npx.cmd tsc --noEmit` — passed
- `npm.cmd run build` with temporary production SEO env — passed

Temporary env used only for the command:

- `NEXT_PUBLIC_SITE_INDEXABLE=true`
- `NEXT_PUBLIC_APP_URL=https://dordoi.help`

No env files were changed.

## Remaining Localization Risks

- Non-RU content is now useful and localized, but should still receive native speaker review before aggressive paid/PR promotion.
- Blog expansion in Stage 5 is planned RU-first; localized versions of new guides should be added after the RU content structure proves useful in GSC/Yandex data.
- Some marketplace terms such as “байер”, “карго”, and “оптом” are intentionally preserved where they are common user-search vocabulary.

## Stage 5 Next

- Add editorial framework.
- Add 20–30 high-quality RU guides without AI spam.
- Link guides to categories, country pages, buyer-service, cargo, FAQ, and catalog.
- Verify sitemap, canonical, schema, privacy, and build after guide expansion.
