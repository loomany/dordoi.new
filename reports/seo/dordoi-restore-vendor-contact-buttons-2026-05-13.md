# Restore vendor profile contact buttons — dordoi.help

**Date:** 2026-05-13  
**Scope:** UI-only fix — vendor profile sidebar must always show actionable buttons.

---

## Why buttons were not visible

### Root cause

Stage 1 SEO privacy set `contactsLocked` + forced `null` contact hrefs in `DatabaseProviderProfileView`. `VendorContactActions` then rendered **only** the gray `contactLockedMessage` box with no `<a>` buttons.

The first restore pass removed `contactsLocked` and passed real hrefs from vendor fields, but:

1. **Changes were local only** — not deployed to production (`dordoi.help`).
2. **Stale dev server** — `next dev` on port 3000 can keep serving the old bundle until restart.
3. **No fallback UI** — when `contactsLocked` was off but hrefs were empty, the sidebar could still look empty (no CTA pills).

### Contact fields in DB (live Supabase query)

| Slug | whatsapp_1 | phone_number | telegram_url | instagram_url |
|------|------------|--------------|--------------|---------------|
| `asso-corsets` | `996709072606` | `996709072606` | `https://t.me/ASSO` | `https://instagram.com/asso.corsets` |
| `arusha-kg` | `996705923254` | `996705923254` | `https://t.me/+996705923254` | `https://instagram.com/arusha__kg` |
| `slavyana-moda` | `996708098080` | `996708098080` | `https://t.me/+996708098080` | `https://instagram.com/slavyana.moda` |

`fetchPublishedVendorBySlug` already selects these fields via `PUBLISHED_VENDOR_PROFILE_SELECT_FIELDS` — data was never missing from the query.

### Component path

- Page: `app/[locale]/catalog/[slug]/page.tsx` → `DatabaseProviderProfileView`
- Sidebar: `VendorContactActions` (client component)
- `contactsLocked` removed from props; hrefs built in `DatabaseProviderProfileView`

---

## What changed

| File | Change |
|------|--------|
| `components/provider/DatabaseProviderProfileView.tsx` | Build `primaryWhatsapp`, `telegramHref`, `instagramHref`, `telHref` from vendor row |
| `components/provider/VendorContactActions.tsx` | Remove `contactsLocked` gate; show section title + contact pills when hrefs exist; fallback CTA pills (`/contact`, `/buyers`) when none |
| `messages/ru.json` (+ kk, kg, uz, tj) | `contactsSectionTitle`, `ctaRequestContact`, `ctaFindBuyer` |

**Not changed:** JSON-LD, FAQ contact flags, title/H1/robots, sitemap, category pages, DB, env, auth.

---

## Buttons now visible

**When contacts exist** (all 3 test vendors):

- Контакты поставщика (section label)
- Написать в WhatsApp → `wa.me/…`
- Telegram → `t.me/…`
- Instagram → `instagram.com/…`
- Позвонить → `tel:…`

**When contacts missing** (fallback):

- Gray info text (`contactLockedMessage`)
- Запросить контакт → `/contact`
- Найти байера → `/buyers`

---

## HTML verification (production build, `next start` :3012)

| URL | WhatsApp | Telegram | Instagram | Call | Locked-only box |
|-----|----------|----------|-----------|------|-----------------|
| `/ru/catalog/asso-corsets` | yes | yes | yes | yes | no |
| `/ru/catalog/arusha-kg` | yes | yes | yes | yes | no |
| `/ru/catalog/slavyana-moda` | yes | yes | yes | yes | no |

Example (`asso-corsets`): `Контакты поставщика`, `wa.me/996709072606`, `t.me/ASSO`, `Позвонить` present in HTML; locked gray box class absent.

---

## Checks

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | pass |
| `npm run build` | pass |

**Local note:** restart `next dev` or run `npm run build && npx next start` to see changes if an old dev server is still running.

---

## Git status

```
 M components/provider/DatabaseProviderProfileView.tsx
 M components/provider/VendorContactActions.tsx
 M messages/ru.json
 M messages/kk.json
 M messages/kg.json
 M messages/uz.json
 M messages/tj.json
?? reports/seo/dordoi-restore-vendor-contact-buttons-2026-05-13.md
```

**Commit/push:** not done.
