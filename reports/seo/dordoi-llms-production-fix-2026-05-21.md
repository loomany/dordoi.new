# Dordoi.help — llms production fix (2026-05-21)

## Root cause

- `public/llms-full.txt` was committed in `3443ad1` and served from `public/` on production (HTTP 200).
- There was no `app/llms-full.txt/route.ts`, so behavior depended on static file serving only.
- Added explicit App Router route for stable `text/plain` delivery and 404 handling if the file is missing at deploy time.

## Changes

- `app/llms-full.txt/route.ts` — reads `public/llms-full.txt`, `content-type: text/plain; charset=utf-8`
- `public/llms.txt` — added `https://dordoi.help/robots.txt` to public URL list

## Checks

| Check | Result |
|-------|--------|
| `npm run build` | OK (`/llms-full.txt` static route in manifest) |
| `npx tsc --noEmit` | OK |
| Production `/llms.txt` (pre-push) | 200, `text/plain; charset=UTF-8` |
| Production `/llms-full.txt` (pre-push) | 200, `text/plain; charset=UTF-8` |

## Deploy

Railway auto-deploy on push to `main` is expected. If URLs stay stale, run **Redeploy** on the latest commit.
