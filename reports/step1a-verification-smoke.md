# Step 1A verification (read-only + smoke)

**Date:** 2026-05-13  
**Scope:** No new product functionality; no Step 1B; no tracker/layout/forms/lead hooks.  
**Commit/push:** Not performed.

---

## 1. `git diff --stat`

Against the index (tracked changes only):

```text
 .env.example      |  13 +++++++
 package-lock.json | 107 +++++++++++++++++++++++++++++++++++++++++++++++++++++-
 package.json      |   3 ++
 3 files changed, 121 insertions(+), 2 deletions(-)
```

**Note:** Step 1A analytics code lives under **untracked** paths (not included in `git diff --stat` until staged):

- `app/api/dordoi/`
- `lib/dordoi/`

Other untracked items present in the working tree (unrelated to this verification): e.g. `reports/dordoi-admin-telegram-analytics-audit.md`, `scripts/publish-vendors-with-storage-media.ts`, `scripts/sync-all-media.ts`, `supabase/migrations/20260515120000_vendor_videos_bucket.sql`, and **`scripts/download-instagram-media.ts`** (entire file untracked in git).

---

## 2. `scripts/download-instagram-media.ts` — exact diff vs git

**`git diff scripts/download-instagram-media.ts` is empty** because the file is **not tracked** (`git status` shows `?? scripts/download-instagram-media.ts`). Git has no baseline to diff against.

**Relevant lines in the working tree** (Supabase batch items cast):

```ts
    const raw = (data ?? []) as unknown as Array<
      BatchItemRow & { vendor_photo_batches: { vendor_id: string } }
    >;
```

**Why this pattern**

- TypeScript (strict) rejects a direct cast from the generic Supabase `data` shape to the narrower row type: the inferred type does not overlap enough with `BatchItemRow & { vendor_photo_batches: { vendor_id: string } }`.
- `as unknown as Target` is the standard escape hatch when the runtime shape is believed correct but the ORM typings are wider/weaker.

**Pre-existing vs analytics**

- **Pre-existing typecheck blocker** for the repo whenever this file is included in `tsc` / `next build` (Next runs TypeScript across the project). It is **not** part of Dordoi analytics.

**Small fix on its own**

- **Yes:** a one-line typing-only change (or excluding `scripts/` from TS project scope) is a reasonable standalone chore, independent of analytics.

---

## 3. Manual POST smoke (`POST /api/dordoi/analytics/event`)

### Dev server (port 3000)

Already running (`next dev`). `DORDOI_*` not set in `.env.local` → `DORDOI_ADMIN_TELEGRAM_ENABLED` is not `"1"` → Telegram path **disabled**.

| # | Case | Session / notes | Response JSON |
|---|------|-------------------|-----------------|
| 1 | `first_visit`, Chrome-like UA | Unique `sessionId` | `{"ok":true,"sent":false,"skippedReason":"disabled"}` |
| 2 | `first_visit`, Googlebot UA | Unique `sessionId` | `{"ok":true,"sent":false,"skippedReason":"bot_skipped"}` |
| 3 | `catalog_open` | Unique `sessionId` | `{"ok":true,"sent":false,"skippedReason":"event_not_broadcast_stage1"}` |
| 4 | `whatsapp_click` + `targetHref` | Unique `sessionId` | `{"ok":true,"sent":false,"skippedReason":"disabled"}` |
| 5 | Invalid body `not json` | — | `{"ok":true,"sent":false,"skippedReason":"invalid_json"}` |

**Note:** Reusing the same `sessionId` for `first_visit` after a successful attempt can yield `skippedReason: "rate_limited"` (30-minute bucket); smoke used **fresh** session IDs per scenario.

### Env mode: `dry_run=1` (port 3066)

Started **`npx next start -p 3066`** with process env:

- `DORDOI_ADMIN_TELEGRAM_ENABLED=1`
- `DORDOI_ADMIN_TELEGRAM_DRY_RUN=1`
- `DORDOI_ADMIN_TELEGRAM_BOT_TOKEN=000000000:dummy`
- `DORDOI_ADMIN_TELEGRAM_CHAT_IDS=123456789`

`first_visit` with unique `sessionId`:

```json
{"ok":true,"sent":false,"skippedReason":"dry_run"}
```

Production server on 3066 was stopped after this check (`Stop-Process`).

---

## 4. Env modes (summary)

| Mode | How verified | Result |
|------|----------------|--------|
| `enabled≠1` (default on dev :3000) | POST with normal UA | `skippedReason: "disabled"` (and CTA same) |
| `dry_run=1` + `enabled=1` + token + chats | `next start` :3066 | `skippedReason: "dry_run"` |

---

## 5. `npx tsc --noEmit` / `npm run build`

- **`npx tsc --noEmit`:** exit code **0** (run in same shell before `npm run build`).
- **`npm run build`:** exit code **0**; route list includes `ƒ /api/dordoi/analytics/event`.

---

## 6. Confirmations

- **No code changes** were made for this verification (only this report file added).
- **DB / migrations / RLS / auth / Python / payments / tracker / layout / lead hooks:** not modified.
- **Commit / push:** not done.
