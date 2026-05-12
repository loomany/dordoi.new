# Dordoi admin Telegram analytics — Stage 1 (1A + 1B)

## Step 1B — client tracker (this change)

### 1. Files changed / added

| Path | Role |
|------|------|
| [`components/dordoi/DordoiAnalyticsTracker.tsx`](../components/dordoi/DordoiAnalyticsTracker.tsx) | Client-only tracker: `first_visit`, click delegation, storage |
| [`app/[locale]/layout.tsx`](../app/[locale]/layout.tsx) | Renders `<DordoiAnalyticsTracker locale={…} />` under `NextIntlClientProvider` |

No edits to: `leadNotifications`, `vendor-moderation`, auth, Python, DB/migrations/RLS, payments, `middleware.ts`, `lib/dordoi/analytics/types.ts` (payload already matched Step 1A API).

### 2. How the tracker is wired

- [`app/[locale]/layout.tsx`](../app/[locale]/layout.tsx) imports `DordoiAnalyticsTracker` and passes `locale` from route params (cast to `DordoiLocale` after `routing` validation).
- The tracker returns `null` (no UI). It runs only on the client (`"use client"`).

### 3. Storage keys

| Key | Storage | Content |
|-----|-----------|---------|
| `dordoi_visitor_id` | `localStorage` | Stable UUID per browser |
| `dordoi_session_id` | `sessionStorage` | UUID per tab session |
| `dordoi_first_touch` | `localStorage` | JSON: `firstPath`, `firstSearch`, `firstReferrer`, UTM fields, `gclidPresent` / `gbraidPresent` / `wbraidPresent`, `visitorId`, `sessionId`, `createdAt` |
| `dordoi_first_visit_sent` | `sessionStorage` | `"1"` after the first eligible `first_visit` POST for this tab |

First-touch is written **once** when absent and the current path is **not** excluded; it is **not** overwritten on later navigations.

### 4. Events sent from the client

| Event | Trigger |
|-------|---------|
| `first_visit` | First non-excluded view in the tab (`sessionStorage` guard) |
| `whatsapp_click` | `click` on `a[href]` containing `wa.me` or `whatsapp` |
| `telegram_click` | `click` on `a[href]` containing `t.me` or `telegram` |
| `phone_click` | `click` on `a[href^="tel:"]` |
| `contact_click` | `mailto:` **or** `data-analytics-event="contact_click"` |
| `seller_registration_started` | Only `data-analytics-event="seller_registration_started"` |

Telegram broadcast for `seller_registration_started` remains off in Stage 1 (handled server-side in Step 1A).

### 5. Path exclusions (client)

No POSTs while `pathname` matches (case-insensitive substring / pattern):

- `/cabinet`
- `/api`
- `/_next`
- `/legacy`
- `scholarship` / `scholarships`
- Static asset paths by extension (e.g. `.png`, `.jpg`, `.svg`, `.css`, `.js`, …)

### 6. Security

- No `DORDOI_ADMIN_TELEGRAM_*` or tokens on the client.
- Tracker only `POST`s JSON to `/api/dordoi/analytics/event`.
- No form field values collected; `targetHref` / `targetLabel` clipped (300 / 120 chars).

### 7. Checks run (automated)

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Exit **0** (same shell as `npm run build`) |
| `npm run build` | Exit **0** |

### 8. Manual browser smoke (recommended)

Not executed in this environment (no interactive browser). Suggested checklist:

1. Open `/ru` or `/ru/catalog` — DevTools **Network**: one `POST /api/dordoi/analytics/event` with `eventType: "first_visit"`.
2. Hard refresh (F5) same URL — **no** second `first_visit` (same tab, `sessionStorage` guard).
3. Click a visible WhatsApp / Telegram / `tel:` link — expect matching `*_click` POST.
4. Open `/ru/cabinet/...` — no analytics POSTs from navigation alone (excluded).
5. Confirm response body remains `{ ok: true, sent: …, skippedReason?: … }` (Telegram still decided server-side).

### 9. Scope confirmation (Step 1B)

- **Step 1C** / `leadNotifications` / vendor moderation hooks: **see Step 1C section below** (added after Step 1B).
- **Auth / Python / DB / RLS / payments / middleware**: **not** changed for Step 1B.
- **Commit / push**: **not** performed.

### 10. Step 1A reference

Server module and `POST /api/dordoi/analytics/event` were added in Step 1A. This document covers **Step 1B** (client tracker) and **Step 1C** (vendor moderation admin Telegram).

---

## Step 1C — vendor moderation admin Telegram (server-only)

### 1. Files changed / added

| Path | Role |
|------|------|
| [`lib/dordoi/analytics/leadNotifications.ts`](../lib/dordoi/analytics/leadNotifications.ts) | `notifyDordoiVendorModerationStatusChanged`, `notifyDordoiVendorApproved`, `notifyDordoiVendorRejected` |
| [`lib/actions/vendor-moderation.ts`](../lib/actions/vendor-moderation.ts) | After successful `vendors` status `update`, calls Dordoi notify (non-blocking); `select` extended with `categories` |
| [`lib/dordoi/analytics/types.ts`](../lib/dordoi/analytics/types.ts) | Types: `DordoiVendorModerationNotifyParams`, `DordoiLeadNotifyResult`, `DordoiVendorModerationNotifyStatus` |

**Not changed:** `telegramFormatter.ts`, `rateLimit.ts` (reuse `rateLimitVendorModeration`), `telegramHtml.ts`, tracker, layout, auth, Python, DB/migrations/RLS, payments, `vendor-admin-pending-edit.ts`, `middleware.ts`.

### 2. Hook placement

In [`updateVendorStatus`](lib/actions/vendor-moderation.ts):

1. `requireAdmin`, fetch vendor (now includes `categories`).
2. `admin.from("vendors").update({ status })` — **if `updErr`**, return error **without** calling Dordoi notify.
3. Existing branch for `approved` (slug, profile role, **existing** `notifyVendorApplicationApproved` to **seller** Telegram) unchanged.
4. **`notifyDordoiVendorModerationStatusChanged`** is invoked **only after** the successful DB update (and after the approve-only side effects block), via `void … .catch(...)` so **Telegram / Dordoi admin errors never change** `{ ok: true }` or rollback moderation.

### 3. Why only `vendor_approved` / `vendor_rejected`

| Lead | Reason not wired in 1C |
|------|-------------------------|
| `seller_registration_submitted` | No public web form saving a new vendor in Next; onboarding is Python bot (out of scope). |
| `buyer_request_submitted` | No server save path for buyer requests in app code. |
| `vendor_application_saved` | No separate “application saved” web path; admin pending edit left untouched per scope. |
| Auth registration | Auth routes are **forbidden** to modify. |

### 4. Telegram message content

- HTML via `escapeTelegramHtml` / `clip` on title, category string, vendor id, status.
- **No** full phone/email, cookies, JWT, or IP in this message (moderation text is vendor id + store name + categories + status only).

**Example — approved**

```text
<b>Продавец одобрен на Dordoi.help</b>

<b>Продавец</b>
Vendor ID: <code>…uuid…</code>
Название: …
Категория: …

<b>Статус</b>
approved
```

**Example — rejected**

Same structure with `<b>Продавец отклонён на Dordoi.help</b>` and `rejected`.

Missing store name or categories → literal `unknown` (escaped).

### 5. Dedupe / rate limit

- Uses [`rateLimitVendorModeration(vendorId, status)`](../lib/dordoi/analytics/rateLimit.ts): key `dordoi:vm:{vendorId}:{status}`, TTL **30 minutes**.
- If duplicate within TTL: **no** Telegram send; result `skippedReason: "rate_limited"`.

### 6. Env / infra

Same as Step 1A: `DORDOI_ADMIN_TELEGRAM_ENABLED`, `DORDOI_ADMIN_TELEGRAM_DRY_RUN`, `DORDOI_ADMIN_TELEGRAM_BOT_TOKEN`, `DORDOI_ADMIN_TELEGRAM_CHAT_IDS`, `sendDordoiAdminTelegram`, HTML escaping.

### 7. Manual / dry-run checklist (local)

With process or `.env.local`:

- `DORDOI_ADMIN_TELEGRAM_ENABLED=1`
- `DORDOI_ADMIN_TELEGRAM_DRY_RUN=1`
- `DORDOI_ADMIN_TELEGRAM_BOT_TOKEN=dummy`
- `DORDOI_ADMIN_TELEGRAM_CHAT_IDS=123`

Then approve/reject a vendor from admin UI:

- First action: server logs (if `DORDOI_ANALYTICS_DEBUG=1`) or dry-run path in `sendDordoiAdminTelegram` — prepared message for approved/rejected.
- Repeat same vendor + same status within 30 min: no second Telegram (`rate_limited`).
- If `update` fails: no notify (notify only after successful `update`).

### 8. Automated checks

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Exit **0** |
| `npm run build` | Exit **0** |

### 9. Scope confirmation (Step 1C)

- **DB / migrations / RLS:** not changed.
- **Auth / payments / Lemon / Python / middleware / tracker / layout:** not changed.
- **Commit / push:** not performed.

---

## Step 1D — final verification (2026-05-13)

### 1. Git — `git status --short` (snapshot)

**Modified (tracked):**

- `.env.example`
- `app/[locale]/layout.tsx`
- `lib/actions/vendor-moderation.ts`
- `package-lock.json`
- `package.json`

**Untracked:**

- `app/api/dordoi/` (includes `analytics/event/route.ts`)
- `components/dordoi/`
- `lib/dordoi/`
- `reports/dordoi-admin-telegram-analytics-audit.md`
- `reports/dordoi-admin-telegram-analytics-stage1.md` (this file)
- `reports/dordoi-analytics-step1b-browser-verification.md`
- `reports/step1a-verification-smoke.md`
- `scripts/download-instagram-media.ts`
- `scripts/publish-vendors-with-storage-media.ts`
- `scripts/sync-all-media.ts`
- `supabase/migrations/20260515120000_vendor_videos_bucket.sql`

**`git diff --stat` (tracked only):**

```
 .env.example                     |  13 +++++
 app/[locale]/layout.tsx          |   3 ++
 lib/actions/vendor-moderation.ts |  12 ++++-
 package-lock.json                | 107 ++++++++++++++++++++++++++++++++++++++-
 package.json                     |   3 ++
 5 files changed, 135 insertions(+), 3 deletions(-)
```

### 2. Untracked paths vs Stage 1

| Path | Needed for Stage 1? |
|------|---------------------|
| `lib/dordoi/analytics/*` (+ `lib/dordoi/` tree used by API) | **Yes** — Step 1A/1C server code |
| `app/api/dordoi/analytics/event/route.ts` | **Yes** — Step 1A API |
| `components/dordoi/DordoiAnalyticsTracker.tsx` | **Yes** — Step 1B tracker |
| `reports/dordoi-admin-telegram-analytics-audit.md` | Audit artifact (optional commit) |
| `reports/dordoi-admin-telegram-analytics-stage1.md` | **Yes** — Stage 1 sign-off |
| `reports/dordoi-analytics-step1b-browser-verification.md` | Step 1B notes (optional) |
| `reports/step1a-verification-smoke.md` | Step 1A notes (optional) |
| `scripts/download-instagram-media.ts`, `publish-vendors-with-storage-media.ts`, `sync-all-media.ts` | **No** — media pipeline, not Stage 1 |
| `supabase/migrations/20260515120000_vendor_videos_bucket.sql` | **No** — DB migration (out of Stage 1 scope) |

### 3. `package.json` / `package-lock.json`

| Change | Purpose |
|--------|---------|
| `dependencies`: `axios` (^1.16.0) | **Not used by Stage 1.** Repo-wide search: no `import` of `axios` in `.ts`/`.tsx` (only the substring `axios/` in `botDetection.ts` as a UA hint). Untracked Instagram/media scripts use other stacks (e.g. `sharp`). **Recommendation:** for a **Stage-1-only** commit, drop `axios` and the extra npm scripts unless those scripts are committed in the same PR. |
| `scripts`: `download:instagram-media`, `sync:all-media` | Entry points for **untracked** scripts — not required for analytics. |

`tsx` remains in **devDependencies** (pre-existing; used by other `npm run` scripts).

### 4. TypeScript / build

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Exit **0** |
| `npm run build` | Exit **0** (Next.js 16.2.6) |

### 5. API smoke — `POST /api/dordoi/analytics/event`

Server: `npx next start -p 3067` with process env (shell vars set **before** start so `.env.local` does not override existing keys).

| Case | Setup | Expected | Observed |
|------|--------|----------|----------|
| `first_visit`, normal UA | `DORDOI_ADMIN_TELEGRAM_ENABLED=1`, `DRY_RUN=1`, token+chats set | `ok: true`, `sent: false`, `skippedReason: dry_run` | **dry_run** |
| `first_visit`, Googlebot UA | same | `bot_skipped` | **bot_skipped** |
| `whatsapp_click` | same | reaches Telegram layer → **dry_run** | **dry_run** |
| `catalog_open` | same | `event_not_broadcast_stage1` | **event_not_broadcast_stage1** |
| invalid body (not JSON) | — | `invalid_json` | **invalid_json** |
| `first_visit`, `enabled=0` | `DORDOI_ADMIN_TELEGRAM_ENABLED=0` | `disabled` | **disabled** |

**Note:** `dry_run` is **`DORDOI_ADMIN_TELEGRAM_DRY_RUN=1`** in env (not a query flag). `sendDordoiAdminTelegram` returns `sent: false` with `skippedReason: dry_run` while still exercising HTML formatting.

### 6. Tracker — static verification (no interactive browser)

Verified in [`components/dordoi/DordoiAnalyticsTracker.tsx`](../components/dordoi/DordoiAnalyticsTracker.tsx):

- **`credentials: "omit"`** on analytics `fetch` (line ~133).
- **`first_visit` once per tab:** `sessionStorage` key `dordoi_first_visit_sent` set to `"1"` before POST; effect bails if already set.
- **`first_touch` not overwritten:** `ensureFirstTouchSnapshot` returns early if `readFirstTouch()` exists; only first eligible path writes `localStorage`.
- **Clicks:** `wa.me` / `whatsapp` → `whatsapp_click`; `t.me` / `telegram` → `telegram_click`; `tel:` → `phone_click`; `mailto:` / allowed `data-analytics-event` → `contact_click` / `seller_registration_started`.
- **Payload:** IDs, path, search, referrer, locale, optional `firstTouch` snapshot, `targetHref` / `targetLabel` for links — **no** `document.cookie`, forms, JWT, or `process.env` / `DORDOI_*` on the client (confirmed: no `process.env` / `DORDOI_` in `components/` for this tracker).

**Manual before deploy:** DevTools → Network on `/ru`: one `first_visit`; F5 same tab → no second `first_visit`; navigate `/ru` → `/ru/catalog` → `first_touch` unchanged in `localStorage`; click WhatsApp/Telegram/tel → matching POST; confirm **Request** has no `Cookie` (omit) and body has no secrets.

### 7. Vendor moderation notify (1C) — code + env semantics

**Not executed:** direct `tsx` import of `leadNotifications.ts` fails outside Next (`server-only` package). **No DB `UPDATE`** was run in this verification.

**Code review (verified):**

- [`updateVendorStatus`](lib/actions/vendor-moderation.ts): `notifyDordoiVendorModerationStatusChanged` runs **only after** successful `vendors.update`; on `updErr` the function returns early → **notify not called**.
- `void notify…(…).catch(…)`: rejections are logged; **`{ ok: true }` unchanged** if Telegram throws.
- [`notifyDordoiVendorModerationStatusChanged`](lib/dordoi/analytics/leadNotifications.ts): inner `try/catch` returns `{ ok: true, sent: false, skippedReason: notify_error }` on unexpected errors — **does not throw** to the server action.
- Dedupe: `rateLimitVendorModeration(vendorId, status)` — **30 min** TTL, same key for repeat same vendor + status → `skippedReason: rate_limited` without sending.
- Approved vs rejected HTML: different `<b>…</b>` headings; **no** full IP / phone / email / cookies in this message (vendor id, title, categories, status only).

**Dry-run message:** uses the same [`sendDordoiAdminTelegram`](lib/dordoi/analytics/sendDordoiAdminTelegram.ts) as the API; with `ENABLED=1`, `DRY_RUN=1`, `DEBUG=1`, HTML is logged to stdout (first 4000 chars) and `sent` stays false.

### 8. Secrets / data minimization

| Check | Result |
|-------|--------|
| `DORDOI_ADMIN_TELEGRAM_BOT_TOKEN` in client bundle | **No** — token only in `process.env` on server modules (`env.ts`, `sendDordoiAdminTelegram.ts`, API route); tracker has **no** `DORDOI_*` reads. |
| Tracker reads `DORDOI_*` env | **No** |
| Analytics JSON body | Path, UTM-related fields, ids, link metadata — **no** cookies/JWT/session tokens by design |
| Moderation Telegram HTML | **No** full IP; moderation lead message has **no** IP field |

### 9. Railway env (Stage 1)

Set in Railway service (server-side only; **do not** prefix with `NEXT_PUBLIC_`):

```bash
# Production: enable sending when ready
DORDOI_ADMIN_TELEGRAM_ENABLED=1
DORDOI_ADMIN_TELEGRAM_DRY_RUN=0
DORDOI_ADMIN_TELEGRAM_BOT_TOKEN=<BotFather token>
DORDOI_ADMIN_TELEGRAM_CHAT_IDS=<numeric id or @channel, comma-separated>
DORDOI_ADMIN_TELEGRAM_MIN_INTERVAL_SECONDS=60
DORDOI_ANALYTICS_DEBUG=0
```

Staging / first deploy can use `DORDOI_ADMIN_TELEGRAM_DRY_RUN=1` and `DEBUG=1` briefly to validate logs without delivering to chats.

### 10. Known gaps (unchanged by design / scope)

- **Seller web submit** — no Next path emitting `seller_registration_submitted` to this admin bot (Python bot onboarding).
- **Buyer request save** — no app path for `buyer_request_submitted`.
- **Auth registration** — not modified.
- **Python bot** — not modified.

### 11. Deploy checklist

1. Set Railway env vars above; confirm **no** `NEXT_PUBLIC_*` for Dordoi admin Telegram.
2. Manual browser Network smoke (section 6).
3. Optional: one real `first_visit` / CTA with `DRY_RUN=1` + `DEBUG=1`, then disable dry-run.
4. Admin UI: one approve/reject in staging with dry-run off — confirm Telegram receives HTML (or keep dry-run until go-live).
5. Confirm `TELEGRAM_BOT_TOKEN` / seller bot remains separate from `DORDOI_ADMIN_TELEGRAM_*`.

### 12. Rollback plan

1. Set `DORDOI_ADMIN_TELEGRAM_ENABLED=0` (instant stop for API + moderation notify).
2. Redeploy previous image / revert commit that introduced `DordoiAnalyticsTracker` in layout + API route (tracker stops sending; API returns `disabled`).
3. No DB migration is part of Stage 1 — no SQL rollback required for analytics alone.

### 13. Sign-off (Step 1D)

| Question | Answer |
|----------|--------|
| Stage 1 ready? | **Ready** for code review + manual browser + Railway env; **caveat:** remove or split **unused `axios` + Instagram npm scripts** if the commit must be analytics-only. |
| Remaining manual checks | DevTools Network on `/ru`, refresh, catalog navigation, CTA clicks, optional real moderation Telegram in staging. |
| Commit allowed? | **Yes**, after you stage only intended files; **do not** bundle unrelated `scripts/` + migration + dead `axios` unless intentional. |
| Deploy allowed? | **Yes**, after manual Network check and env validation; start with `DRY_RUN=1` if desired. |
| Commit / push performed in this verification | **No** |