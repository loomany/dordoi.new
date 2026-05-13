# Category Layout Width Cleanup — 2026-05-13

## Changed files

| File | Change |
|------|--------|
| `components/seo/SeoCategoryLanding.tsx` | Single `max-w-7xl` marketplace container; removed nested `max-w-3xl` article columns; chip-style related categories |

`app/[locale]/categories/[categorySlug]/page.tsx` — not modified (layout lives entirely in `SeoCategoryLanding`).

## What was wrong

- Outer wrapper was `max-w-6xl`, but header, vendor headings, CTAs, guide, related, and FAQ each sat in separate `mx-auto max-w-3xl` blocks.
- Vendor grid (`CatalogBrowseCardGrid`) had no inner width cap and visually spanned the full article width while text blocks were ~768px centered — page looked split: narrow article + wide cards.
- Related categories were plain underlined links in the narrow column.

## How layout was aligned

**Before (conceptual):**

```
article max-w-6xl
  div max-w-3xl     ← breadcrumbs, H1, intro, stats
  section
    div max-w-3xl   ← vendor H2
    grid full width ← cards wider than text
    div max-w-3xl   ← CTAs
  div max-w-3xl     ← guide, related, FAQ
```

**After:**

```
article mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8
  div space-y-8
    header          ← breadcrumbs full width; H1+intro max-w-4xl left-aligned
    stats row       ← full container width
    vendor section  ← H2, grid, CTAs — same container, no inner max-w-3xl
    guide           ← H2 full width; body max-w-4xl for readability
    related         ← chip links, flex-wrap, full container width
    FAQ             ← H2 full width; answers max-w-4xl
```

Readable prose uses `max-w-4xl` without `mx-auto`, so text stays left-aligned inside the marketplace shell — not a centered article column.

Related categories: `rounded-full border` chip links with `flex flex-wrap gap-2`.

Vendor grid unchanged (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`).

## Pages checked (build/static)

- `/ru/categories/muzhskaya-odezhda-optom`
- `/ru/categories/zhenskaya-odezhda-optom`
- `/ru/categories/obuv-optom`
- `/ru/categories/sumki-kozhgalantereya-optom`

## Checks result

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | PASS |
| `npm run build` | PASS |

SEO metadata, URLs, sitemap, robots, vendor fetch — unchanged.

## Git status

```
 M components/seo/SeoCategoryLanding.tsx
```

(Plus prior SEO UX cleanup files from earlier in the session.)

## Commit / push

Not done.
