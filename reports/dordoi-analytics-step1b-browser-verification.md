# Step 1B verification — DordoiAnalyticsTracker (code + tooling, no live DevTools)

**Date:** 2026-05-13  
**Hotfix:** `credentials: "omit"` on analytics `fetch` (same document updated).  
**Scope:** Verification only — no new functionality, no Step 1C, no lead hooks / vendor-moderation / auth / Python / DB / RLS / migrations / payments.  
**Live browser:** Not executed in this environment (no interactive Chrome DevTools). Below: **static proof** from source + **example payloads** matching the implementation. A human should still run the DevTools checklist once locally.

---

## Method

1. Read [`components/dordoi/DordoiAnalyticsTracker.tsx`](../components/dordoi/DordoiAnalyticsTracker.tsx) and cross-check each checklist item against control flow.
2. `grep` the tracker folder for admin Telegram env / token / cookie / jwt strings in source.
3. `npx tsc --noEmit` and `npm run build`.

---

## 1. `/ru` first load — expected Network (Request payload, JSON)

**Single** `POST /api/dordoi/analytics/event` from the tracker’s first `useEffect` when path is not excluded and `sessionStorage` flag is not yet set.

**Example payload** (values illustrative; shape is fixed by code):

```json
{
  "eventType": "first_visit",
  "path": "/ru",
  "search": "",
  "referrer": "",
  "locale": "ru",
  "sessionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "visitorId": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
  "firstTouch": {
    "firstPath": "/ru",
    "firstSearch": "",
    "firstReferrer": "",
    "visitorId": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy",
    "sessionId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
    "createdAt": "2026-05-13T12:34:56.789Z"
  },
  "timestamp": "2026-05-13T12:34:56.800Z"
}
```

If the landing URL has UTM / gclid, `firstTouch` also includes `utmSource`, `utmMedium`, … and `gclidPresent` / `gbraidPresent` / `wbraidPresent` per `parseUtmFromSearch` in code.

**Application storage (code-defined keys)**

| Requirement | Key in code | Storage |
|-------------|-------------|---------|
| visitorId | `dordoi_visitor_id` (`STORAGE_VISITOR`) | `localStorage` |
| firstTouch JSON | `dordoi_first_touch` (`STORAGE_FIRST_TOUCH`) | `localStorage` |
| sessionId | `dordoi_session_id` (`STORAGE_SESSION`) | `sessionStorage` |
| first visit guard | `dordoi_first_visit_sent` (`SESSION_FIRST_VISIT`) | `sessionStorage`, value `"1"` |

Evidence: lines 8–11, 88–103, 167–187 in [`DordoiAnalyticsTracker.tsx`](../components/dordoi/DordoiAnalyticsTracker.tsx).

---

## 2. Refresh `/ru` — no duplicate `first_visit`

Before sending, the effect returns if `sessionStorage.getItem("dordoi_first_visit_sent") === "1"` (line 167). The flag is set to `"1"` before `postEvent` (line 174), so a normal reload in the **same tab** does not enqueue a second `first_visit`.

---

## 3. Navigate `/ru` → `/ru/catalog`

- **No second `first_visit`:** same `sessionStorage` guard (line 167) on every `pathname` change.
- **first_touch not overwritten:** `ensureFirstTouchSnapshot` returns immediately if `readFirstTouch()` is truthy (lines 112–113); only the initial creation path calls `writeFirstTouch` (lines 115–125).

---

## 4. WhatsApp / Telegram / phone click — example payload

After a matching `click` (capture phase), `postEvent` sends e.g. for WhatsApp:

```json
{
  "eventType": "whatsapp_click",
  "path": "/ru/catalog",
  "search": "",
  "referrer": "",
  "locale": "ru",
  "sessionId": "…",
  "visitorId": "…",
  "firstTouch": { "…": "…" },
  "targetHref": "https://wa.me/996555123456",
  "targetLabel": "WhatsApp",
  "timestamp": "…"
}
```

- `targetHref` / `targetLabel` are passed through `clip(..., MAX_HREF)` / `clip(..., MAX_LABEL)` with `MAX_HREF = 300`, `MAX_LABEL = 120` (lines 13–14, 241–247, 249–260).
- No form `.value` reads: handler only uses `href`, `data-analytics-event`, and link text / `aria-label` / `title` (lines 194–261).

---

## 5. `mailto:` → `contact_click`

`hrefRaw.startsWith("mailto:")` sets `eventType` to `contact_click` (lines 224–225).

---

## 6. `data-analytics-event="seller_registration_started"`

- Client **does** POST `seller_registration_started` when the attribute is allowed (lines 228–234, 249–261).
- Server ([`app/api/dordoi/analytics/event/route.ts`](../app/api/dordoi/analytics/event/route.ts)) treats it as `NO_TELEGRAM_EVENTS` → response **`sent: false`**, **`skippedReason: "event_not_broadcast_stage1"`** (unless Telegram is globally `disabled` / `dry_run` / missing token first — order is: rate limits → format → `sendDordoiAdminTelegram`; for this event type, `shouldSendTelegramForEvent` returns skip before send). If `DORDOI_ADMIN_TELEGRAM_ENABLED !== "1"`, skip reason is `disabled` earlier in the pipeline.

Exact `skippedReason` priority for this event in practice: usually **`event_not_broadcast_stage1`** when Telegram is enabled and not dry-run, because the event is filtered before Telegram; if admin Telegram is off, **`disabled`** applies first.

---

## 7. Forbidden paths — no events

`isExcludedPath` returns true for substrings `/cabinet`, `/api`, `/_next`, `/legacy`, `scholarship` / `scholarships`, and static-like extensions (lines 33–43).

- **first_visit:** effect returns at line 165 before any storage / POST.
- **clicks:** handler returns at lines 195–196.

Repo search: no `scholarship` routes under `app/` (grep empty) — guard is still present for future paths.

---

## 8. Secrets / cookies / JWT / form data — payload & source

**Hotfix (Step 1B):** `postEvent` uses `fetch(..., { credentials: "omit" })` so the analytics request **does not** send browser cookies, auth cookies, or session cookies with the request ([`DordoiAnalyticsTracker.tsx`](../components/dordoi/DordoiAnalyticsTracker.tsx) — single `fetch` to `/api/dordoi/analytics/event`; grep shows no other client calls to this URL).

**Source audit (`components/dordoi/`):**

- No `DORDOI_ADMIN_TELEGRAM_BOT_TOKEN`, `DORDOI_ADMIN_TELEGRAM_CHAT_IDS`, `TELEGRAM_BOT`, `process.env` in the tracker (grep: only `sessionStorage` / variable names containing “session”).
- Request body is built only from: `eventType`, `path`, `search`, `referrer`, `locale`, `sessionId`, `visitorId`, `firstTouch`, optional `targetHref` / `targetLabel`, `timestamp` — no JWT fields, no `document.cookie`, no form serialization.

**Cookies / `Cookie` header**

- The **JSON body** does not include cookies or tokens (by construction).
- With **`credentials: "omit"`**, the browser must **not** attach cookies to this `fetch` (per Fetch spec for credentialed requests). Analytics POSTs therefore do not carry Supabase/session cookies to the endpoint.

**Endpoint:** [`app/api/dordoi/analytics/event/route.ts`](../app/api/dordoi/analytics/event/route.ts) does not read `cookies()` or request cookies for authorization or event logic (grep: no matches).

---

## 9. `npx tsc --noEmit` / `npm run build`

| Command | Result |
|---------|--------|
| `npx tsc --noEmit` | Exit code **0** (hotfix re-check) |
| `npm run build` | Exit code **0** (hotfix re-check) |

---

## 10. Commit / push

**Not performed.**

---

## Local DevTools checklist (human)

1. Application → Local Storage / Session Storage: confirm the four keys above after `/ru`.
2. Network → filter `dordoi/analytics` → inspect **Payload** for `first_visit` and one click event.
3. Compare `localStorage.dordoi_first_touch` before and after `/ru/catalog` navigation — JSON unchanged (except you may see the same string; no rewrite).
4. Visit `/ru/cabinet/...` — confirm no new `POST …/event` from navigation alone.

---

## Screenshots

Not captured in this run (no browser). Use the JSON blocks above as **text equivalents** of the Network payload column.
