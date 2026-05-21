# Dordoi.help — llms production fix (2026-05-21)

## Root cause

- Earlier `app/llms-full.txt/route.ts` used async `readFile` and returned **HTTP 404** when `public/llms-full.txt` was not found at runtime (Railway `cwd`/artifact mismatch).
- External checks could hit that 404 before static `public/` file was present on a given deploy.
- Fix: bake file contents at module load during `next build` (sync `readFileSync` + `force-static`), export `GET` and `HEAD`, no runtime 404 branch.

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
