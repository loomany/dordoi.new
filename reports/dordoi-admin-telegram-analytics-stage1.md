# Dordoi admin Telegram analytics — Stage 1 (1A + 1B)

## Step 1B — client tracker (this change)

### 1. Files changed / added

| Path | Role |
|------|------|
| [`components/dordoi/DordoiAnalyticsTracker.tsx`](../components/dordoi/DordoiAnalyticsTracker.tsx) | Client-only tracker: `first_visit`, click delegation, storage |
| [`app/[locale]/layout.tsx`](../app/[locale]/layout.tsx) | Renders `<DordoiAnalyticsTracker locale={…} />` under `NextIntlClientProvider` |

No edits to: `leadNotifications`, `vendor-moderation`, auth (except Step 1E / 1F `complete-registration` notify params), Python, DB/migrations/RLS, payments, `middleware.ts`. **Step 1F** extends [`lib/dordoi/analytics/types.ts`](../lib/dordoi/analytics/types.ts) and related server modules — see **§10 Step 1F** below.

### 2. How the tracker is wired

- [`app/[locale]/layout.tsx`](../app/[locale]/layout.tsx) imports `DordoiAnalyticsTracker` and passes `locale` from route params (cast to `DordoiLocale` after `routing` validation).
- The tracker returns `null` (no UI). It runs only on the client (`"use client"`).

### 3. Storage keys

| Key | Storage | Content |
|-----|-----------|---------|
| `dordoi_visitor_id` | `localStorage` | Stable UUID per browser |
| `dordoi_session_id` | `sessionStorage` | UUID per tab session |
| `dordoi_first_touch` | `localStorage` | JSON: `firstPath`, `firstSearch`, `firstReferrer`, UTM fields, `gclidPresent` / `gbraidPresent` / `wbraidPresent`, `visitorId`, `sessionId`, `createdAt` |
| `dordoi_first_visit_sent` | `sessionStorage` | `"1"` only after a **successful** `first_visit` POST (`HTTP 200` and body **not** `skippedReason: "rate_limited"`) for this tab |
| `dordoi_last_first_visit_notified_at` | `localStorage` | Milliseconds timestamp; with successful POST above, blocks another `first_visit` POST for **24 hours** (same browser) |

First-touch is written **once** when absent and the current path is **not** excluded; it is **not** overwritten on later navigations.

### 4. Events sent from the client

| Event | Trigger |
|-------|---------|
| `first_visit` | First non-excluded view in the tab when **not** blocked by `sessionStorage` (`dordoi_first_visit_sent`) **and** not within **24h** of the last successful `first_visit` (`dordoi_last_first_visit_notified_at`) |
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
2. Hard refresh (F5) same URL — **no** second `first_visit` (same tab: `sessionStorage` + 24h `localStorage` guard).
3. New tab same browser within 24h — **no** second `first_visit` (`localStorage` timestamp); after 24h or cleared `dordoi_last_first_visit_notified_at`, new tab may POST again once per tab until success.
4. Click a visible WhatsApp / Telegram / `tel:` link — expect matching `*_click` POST.
5. Open `/ru/cabinet/...` — no analytics POSTs from navigation alone (excluded).
6. Confirm response body remains `{ ok: true, sent: …, skippedReason?: … }` (Telegram still decided server-side). If the server returns `skippedReason: "rate_limited"`, the client **does not** persist `dordoi_first_visit_sent` / `dordoi_last_first_visit_notified_at` (may retry on next navigation).

### 9. Scope confirmation (Step 1B)

- **Step 1C** / `leadNotifications` / vendor moderation hooks: **see Step 1C section below** (added after Step 1B).
- **Auth / Python / DB / RLS / payments / middleware**: **not** changed for Step 1B.
- **Commit / push**: **not** performed.

### 10. Step 1F — admin Telegram format refresh (traffic, bots, anti-spam)

**Scope:** shorter admin messages, richer traffic labels, bot policy for `first_visit`, internal referrer rule, registration locale from `Referer`, client + server anti-spam.

| Area | Behavior |
|------|----------|
| **Traffic** | Paid (Google / Meta / TikTok / Telegram + click ids), AI referrers, organic search (Google / Bing / Yandex / DDG / Yahoo) with optional query line (Google may show «скрыт» when no `q`), social hosts, **Direct·internal** when referrer is `dordoi.help` / `www.dordoi.help`, then generic referral / direct. |
| **Locale in admin** | From landing path: `/ru` → RU, `/kk` → **KZ** (no `/kz` route), `/kg` `/uz` `/tj` → matching labels via [`pathToAdminLocaleDisplay`](../lib/dordoi/analytics/telegramFormatter.ts). |
| **`first_visit` bots** | Only **seven** major search crawlers → `search_crawler` → short Telegram allowed. **SEO** tools (Ahrefs, Semrush, MJ12, DotBot, PetalBot, Mediapartners-Google, …) → `bot_seo_skipped`. **Unknown** `*bot*` → `bot_unknown_skipped`. **Suspicious** / probe UA → `bot_suspicious_skipped`. Other bots → `bot_skipped`. |
| **Server rate limit** | `visitorId` length **≥ 8** → [`rateLimitFirstVisitByVisitor`](../lib/dordoi/analytics/rateLimit.ts) (**24h**); else existing session-based **30m** [`rateLimitFirstVisit`](../lib/dordoi/analytics/rateLimit.ts). |
| **Client anti-spam** | `dordoi_last_first_visit_notified_at` (**24h**) + `dordoi_first_visit_sent` per tab; both updated **only** after successful POST (and **not** when JSON `skippedReason === "rate_limited"`). |
| **Registration** | [`complete-registration`](../app/api/auth/complete-registration/route.ts) passes `referrerUrl: request.headers.get("referer")` into [`notifyDordoiSiteRegistrationCompleted`](../lib/dordoi/analytics/leadNotifications.ts) for display locale only (auth semantics unchanged). |

**Files (primary):** [`lib/dordoi/analytics/types.ts`](../lib/dordoi/analytics/types.ts), [`botDetection.ts`](../lib/dordoi/analytics/botDetection.ts), [`channel.ts`](../lib/dordoi/analytics/channel.ts), [`rateLimit.ts`](../lib/dordoi/analytics/rateLimit.ts), [`telegramFormatter.ts`](../lib/dordoi/analytics/telegramFormatter.ts), [`event/route.ts`](../app/api/dordoi/analytics/event/route.ts), [`DordoiAnalyticsTracker.tsx`](../components/dordoi/DordoiAnalyticsTracker.tsx), [`leadNotifications.ts`](../lib/dordoi/analytics/leadNotifications.ts).

**API smoke (curl / HTTP client):**

| Case | Expected `skippedReason` (when Telegram not sent) |
|------|-----------------------------------------------------|
| A — `first_visit`, normal browser UA | `dry_run` or real send per env |
| B — `first_visit`, SEO crawler UA (e.g. AhrefsBot) | `bot_seo_skipped` |
| C — `first_visit`, allowed search crawler (e.g. Googlebot) | passes bot gate → may hit `dry_run` / send / `rate_limited` |
| D — `first_visit`, generic `SomethingBot/1.0` | `bot_unknown_skipped` |
| E — `first_visit`, suspicious UA | `bot_suspicious_skipped` |
| F — repeat `first_visit` same `visitorId` within 24h | `rate_limited` |

**Locale path smoke:** open `/ru/…`, `/kk/…`, `/kg/…`, `/uz/…`, `/tj/…` with dry-run enabled and confirm admin HTML uses **RU / KZ / KG / UZ / TJ** labels where applicable.

**Automated (2026-05-13):** `npx tsc --noEmit` exit **0**; `npm run build` exit **0** (Next.js 16.2.6). **Commit / push:** not performed without separate approve.

### 11. Step 1A reference

Server module and `POST /api/dordoi/analytics/event` were added in Step 1A. This document covers **Step 1B** (client tracker), **Step 1C** (vendor moderation admin Telegram), **Step 1E** (registration), **Step 1D** (verification), and **Step 1F** (format refresh).

---

## Step 1C — vendor moderation admin Telegram (server-only)

### 1. Files changed / added

| Path | Role |
|------|------|
| [`lib/dordoi/analytics/leadNotifications.ts`](../lib/dordoi/analytics/leadNotifications.ts) | `notifyDordoiVendorModerationStatusChanged`, `notifyDordoiVendorApproved`, `notifyDordoiVendorRejected` |
| [`lib/actions/vendor-moderation.ts`](../lib/actions/vendor-moderation.ts) | After successful `vendors` status `update`, calls Dordoi notify (non-blocking); `select` extended with `categories` |
| [`lib/dordoi/analytics/types.ts`](../lib/dordoi/analytics/types.ts) | Types: `DordoiVendorModerationNotifyParams`, `DordoiLeadNotifyResult`, `DordoiVendorModerationNotifyStatus` |

**Not changed (Step 1C scope only):** `telegramFormatter.ts` (see **Step 1F** for later formatter edits), `rateLimit.ts` (reuse `rateLimitVendorModeration`), `telegramHtml.ts`, tracker, layout, auth, Python, DB/migrations/RLS, payments, `vendor-admin-pending-edit.ts`, `middleware.ts`.

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
| Auth registration | **Step 1E** (approved scope): only [`app/api/auth/complete-registration/route.ts`](../app/api/auth/complete-registration/route.ts) — Dordoi admin Telegram after successful sign-in. Other auth routes unchanged. |

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

## Step 1E — site registration admin Telegram (`complete-registration`)

### 1. Files changed

| Path | Role |
|------|------|
| [`lib/dordoi/analytics/leadNotifications.ts`](../lib/dordoi/analytics/leadNotifications.ts) | `notifyDordoiSiteRegistrationCompleted` — HTML message, dedupe, `sendDordoiAdminTelegram` |
| [`lib/dordoi/analytics/types.ts`](../lib/dordoi/analytics/types.ts) | `DordoiSiteRegistrationNotifyParams`, `DordoiSiteRegistrationAttribution` |
| [`lib/dordoi/analytics/rateLimit.ts`](../lib/dordoi/analytics/rateLimit.ts) | `rateLimitSiteRegistrationCompleted` — TTL **30 min**, key `dordoi:site_reg:{userId}:registration_completed` (fallback `fb:{sha256…}` without raw email/phone in the key) |
| [`lib/dordoi/analytics/telegramHtml.ts`](../lib/dordoi/analytics/telegramHtml.ts) | `maskEmailForAdminTelegram`, `maskPhoneDigitsForAdminTelegram` |
| [`app/api/auth/complete-registration/route.ts`](../app/api/auth/complete-registration/route.ts) | After successful `signIn` session: `void notifyDordoiSiteRegistrationCompleted(…).catch(…)`; `registrationRole` from `linkVendorProfileForPhone`; `localeHintFromRequest` from `Accept-Language`; optional **`referrerUrl`** from `Referer` for admin **display** locale only |

**Not changed:** Python bot, payments/Lemon, DB/migrations/RLS, middleware, tracker, `package.json` / lockfile.

### 2. Hook placement

In [`POST` `complete-registration`](app/api/auth/complete-registration/route.ts):

1. Validation, token, profile upsert, `linkVendorProfileForPhone` — **unchanged** intent (added `registrationRole` = `vendor` if `linked`).
2. Sign-in must succeed (`session` non-null).
3. **`notifyDordoiSiteRegistrationCompleted`** runs **only then**, via `void … .catch(…)` — Telegram failures **do not** change HTTP 200 or cookies.
4. If profile upsert or earlier step fails → **no** notify (handler returns before notify).
5. If sign-in fails (`SIGN_IN_FAILED`) → **no** notify.

### 3. Telegram message

- **Short emoji-style** HTML (Step 1F refresh): masked **email** / **phone**, **role** (`buyer` / `vendor`), **locale** from registration **`Referer`** path when possible (`/kk` → KZ, etc.), else `Accept-Language` hint.
- **No** long User ID block; dynamic text still uses **`escapeTelegramHtml`** + **`clip`**. **No** password, JWT, cookies, session body, or `service_role` in the message.

### 4. Dedupe

- Primary key: **Supabase `authUser.id`** (UUID).
- Same user + completed within **30 minutes** → `skippedReason: "rate_limited"`, no second Telegram.

### 5. Gaps (follow-up, not this PR)

- **Attribution** (first touch / UTM / campaign) for registration: not sent from `complete-registration` body; extend API with optional fields or server session in a **separate** change.
- **`seller_registration_submitted` / `buyer_request_submitted`:** still no dedicated server save hook (unchanged).

### 6. Dry-run smoke (local / Site env)

With:

- `DORDOI_ADMIN_TELEGRAM_ENABLED=1`
- `DORDOI_ADMIN_TELEGRAM_DRY_RUN=1`
- `DORDOI_ADMIN_TELEGRAM_BOT_TOKEN=dummy`
- `DORDOI_ADMIN_TELEGRAM_CHAT_IDS=123`
- `DORDOI_ANALYTICS_DEBUG=1`

Expect: successful `complete-registration` → `[dordoi-analytics][dry-run] prepared telegram message` in logs with registration HTML; failed registration / sign-in → **no** dry-run line for this hook; duplicate same `userId` within TTL → rate_limited path (no spam).

### 7. Automated checks (this change)

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Exit **0** |
| `npm run build` | Exit **0** (Next.js 16.2.6) |

### 8. Scope confirmation (Step 1E)

- **Commit / push:** not performed.

### 9. Step 1E final verification (checklist — 2026-05-13, read-only)

#### 9.1 `git status --short` (working tree snapshot)

**Modified (not staged):** `.gitignore`, `app/api/auth/complete-registration/route.ts`, `lib/dordoi/analytics/leadNotifications.ts`, `lib/dordoi/analytics/rateLimit.ts`, `lib/dordoi/analytics/telegramHtml.ts`, `lib/dordoi/analytics/types.ts`, `package-lock.json`, `package.json`, `reports/dordoi-admin-telegram-analytics-stage1.md`.

**Untracked:** `reports/dordoi-admin-telegram-analytics-audit.md`, `reports/dordoi-analytics-step1b-browser-verification.md`, `reports/step1a-verification-smoke.md`, `reports/telegram-notifications-audit.md`, `scripts/download-instagram-media.ts`, `scripts/publish-vendors-with-storage-media.ts`, `scripts/run-sync-all-media-overnight.mjs`, `scripts/sync-all-media.ts`, `supabase/migrations/20260515120000_vendor_videos_bucket.sql`.

**Staged:** none observed (`git status` first column empty for listed paths).

*Note: `package.json` / `package-lock.json` / `.gitignore` are **not** part of Step 1E implementation; do not bundle them into a Step 1E-only commit unless intentional.*

#### 9.2 `git diff --stat` (tracked files only)

```
 .gitignore                                        |   5 +
 app/api/auth/complete-registration/route.ts       |  38 +++++++-
 lib/dordoi/analytics/leadNotifications.ts         |  84 ++++++++++++++++-
 lib/dordoi/analytics/rateLimit.ts                 |   7 ++
 lib/dordoi/analytics/telegramHtml.ts              |  38 ++++++++
 lib/dordoi/analytics/types.ts                     |  18 ++++
 package-lock.json                                 | 107 +++++++++++++++++++++-
 package.json                                      |   4 +
 reports/dordoi-admin-telegram-analytics-stage1.md |  72 ++++++++++++++-
 9 files changed, 365 insertions(+), 8 deletions(-)
```

`reports/telegram-notifications-audit.md` is **untracked** → it does **not** appear in `git diff --stat`.

#### 9.3 `complete-registration` / security (code review)

| Check | Result |
|-------|--------|
| Notify only after successful **session** (`session` non-null) | **Pass** — `notifyDordoiSiteRegistrationCompleted` is after `if (!session) return … SIGN_IN_FAILED` (lines 225–240). |
| Profile upsert failure → no notify | **Pass** — returns at 167–184 before notify. |
| `SIGN_IN_FAILED` → no notify | **Pass** — early return 225–229 before notify. |
| Telegram error does not break registration | **Pass** — `void … .catch(console.error)`; response already built after fire-and-forget. |
| `authUser` guard | **Pass** — explicit `if (!authUser) return CREATE_USER_FAILED` (129–134) narrows type before `updateUserById` / notify. |
| `service_role` / JWT / cookies / session / password in Telegram HTML | **Pass** — notify payload is only `userId`, optional `email`, `phoneDigits`, `role`, `localeLabel`; HTML uses masks + `escapeTelegramHtml`. JWT is only in JSON response body, not passed to `notifyDordoi…`. |

#### 9.4 Masking / escaping / dedupe key

| Check | Result |
|-------|--------|
| Email masked | **Pass** — `maskEmailForAdminTelegram` + `escapeTelegramHtml` in `leadNotifications.ts`. |
| Phone masked | **Pass** — `maskPhoneDigitsForAdminTelegram` + `escapeTelegramHtml`. |
| Raw email/phone not in **map key** string | **Pass** — key is `dordoi:site_reg:{uuid}:registration_completed` or `fb:` + hex; digits feed **hash input** only for fallback, not stored as plaintext in the key. |
| HTML escape | **Pass** — `escapeTelegramHtml` on dynamic lines. |

#### 9.5 Dedupe / TTL

| Check | Result |
|-------|--------|
| user id + `registration_completed` semantics | **Pass** — `rateLimitSiteRegistrationCompleted` uses `take(\`dordoi:site_reg:${t}:registration_completed\`, MIN30)`. |
| Fallback without raw PII in key | **Pass** — `fb:${sha256…}` only in key. |
| TTL 30 min | **Pass** — `MIN30` in `rateLimit.ts`. |

#### 9.6 Env / token separation

| Check | Result |
|-------|--------|
| Site registration uses `sendDordoiAdminTelegram` → `DORDOI_ADMIN_TELEGRAM_*` + `DORDOI_ANALYTICS_DEBUG` | **Pass** — `leadNotifications` → `sendDordoiAdminTelegram` → `loadDordoiAdminTelegramEnv`. |
| No `TELEGRAM_BOT_TOKEN` in registration notify path | **Pass** — grep `leadNotifications.ts`: no `TELEGRAM_BOT_TOKEN`. |

#### 9.7 Automated commands (re-run this verification)

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Exit **0** |
| `npm run build` | Exit **0** (Next.js 16.2.6) |

#### 9.8 Dry-run smoke (interactive registration)

**Not executed** in this environment: a full `complete-registration` requires a **valid** `tempToken` from the real OTP / `verify-code` flow, working Supabase Auth + `profiles` write, and matching env on the running server. Without that chain, we cannot confirm server stdout contains `[dordoi-analytics][dry-run]` with **«Новая регистрация на Dordoi.help»** or TTL anti-spam in vivo.

**Manual recipe (staging/local):** set env from §6 above → complete one real registration → inspect server logs for dry-run HTML; repeat `complete-registration` for the same user within 30 minutes (if your product allows) and confirm no second message / `rate_limited` internal path.

#### 9.9 Verdict

| Question | Answer |
|----------|--------|
| Registration notify **code-ready**? | **Yes** — wiring, guards, masking, dedupe, and env path match Step 1E spec. |
| Remaining manual checks | Interactive registration + log inspection (§9.8); optional Railway env confirmation. |
| **Commit** allowed? | **Yes, only if** you `git add` **only** Step 1E paths (`complete-registration`, `lib/dordoi/analytics/*` as changed, and chosen reports). **Avoid** committing unrelated `package.json` / lock / `.gitignore` / scripts / migration unless a separate approve. |
| Commit / push performed here? | **No** |

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
| `first_visit`, Googlebot UA (allowed search crawler) | same | passes bot policy → may reach Telegram layer → **dry_run** / send, or **`rate_limited`** on repeat within TTL | (re-run smoke) |
| `first_visit`, AhrefsBot / SemrushBot UA | same | `bot_seo_skipped` | **bot_seo_skipped** |
| `whatsapp_click` | same | reaches Telegram layer → **dry_run** | **dry_run** |
| `catalog_open` | same | `event_not_broadcast_stage1` | **event_not_broadcast_stage1** |
| invalid body (not JSON) | — | `invalid_json` | **invalid_json** |
| `first_visit`, `enabled=0` | `DORDOI_ADMIN_TELEGRAM_ENABLED=0` | `disabled` | **disabled** |

**Note:** `dry_run` is **`DORDOI_ADMIN_TELEGRAM_DRY_RUN=1`** in env (not a query flag). `sendDordoiAdminTelegram` returns `sent: false` with `skippedReason: dry_run` while still exercising HTML formatting.

### 6. Tracker — static verification (no interactive browser)

Verified in [`components/dordoi/DordoiAnalyticsTracker.tsx`](../components/dordoi/DordoiAnalyticsTracker.tsx):

- **`credentials: "omit"`** on analytics `fetch` (line ~133).
- **`first_visit` once per successful POST per tab:** `sessionStorage` key `dordoi_first_visit_sent` set to `"1"` only after `POST` returns `ok` and **not** `skippedReason: "rate_limited"`; `localStorage` `dordoi_last_first_visit_notified_at` updated on the same condition (**24h** cooldown across tabs).
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
- **Auth registration** — **Step 1E:** Dordoi admin notify on successful [`complete-registration`](app/api/auth/complete-registration/route.ts) only; no other auth routes changed.
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