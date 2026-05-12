# Railway Bot service — Python via Nixpacks (no Dockerfile)

## 1. Why the error happened

- The repository **root** contains **`package.json`** (Next.js site).
- Railway **Bot** service was building from the **same repo root** with default Nixpacks detection.
- Nixpacks selected a **Node-centric** image/plan: **`python3` was not on PATH** → `python3: command not found`.
- **`bot/requirements.txt` exists** but lives under **`bot/`**, not the repo root, so it **does not trigger** the default Python provider by itself when the dominant signal is root `package.json`.

## 2. Why not Dockerfile

- Product constraint: **no Dockerfile** for this fix.
- Nixpacks can still produce a runnable image if we **extend** the detected plan with **Python** and an explicit **`pip install -r bot/requirements.txt`**.

## 3. Why Root Directory stays the repo root

- The Python package is imported as **`from bot.*`** and the app is started with **`python3 -m bot`** from the **monorepo root**.
- That layout requires the **`bot/`** directory to exist as a **subpackage** of the checkout root (`…/bot/…` on `PYTHONPATH` / cwd).
- Setting **Root Directory = `bot`** would flatten the tree and **break** `from bot.…` imports and/or `python -m bot` without structural/code changes — **out of scope**.

## 4. Why not root `requirements.txt`

- A **root** `requirements.txt` (or `-r bot/requirements.txt` there) would be visible to **any** Railway service that builds from the **same root**, including **Site**.
- That can change Nixpacks provider detection / phases for **Site** in hard-to-predict ways across Nixpacks versions.
- **Service-scoped** config is safer: **`NIXPACKS_CONFIG_FILE=bot/nixpacks.toml`** only on the **Bot** service.

## 5. Railway — Bot service (after this file is in the repo)

| Setting | Value |
|--------|--------|
| **Root Directory** | *(empty)* — **repository root** |
| **Variables** (Bot only) | `NIXPACKS_CONFIG_FILE=bot/nixpacks.toml` |
| **Start Command** | **`python3 -m bot`** in Railway UI is fine. If `[start].cmd` from this file is applied by Nixpacks, UI start may be redundant — either is OK as long as one runs `python3 -m bot` from **repo root**. |

### Build / install expectations

- Nixpacks merges **`providers = ["...", "python"]`** and **`nixPkgs = ["...", "python311"]`** with the auto plan (see Nixpacks docs for `"..."` array merge).
- **`pip install -r bot/requirements.txt`** runs in **install** phase (merged with Node install via `"..."` in `cmds`).

### If build fails on `python311`

Nixpkgs attribute names vary by Nixpacks snapshot. Try in **`bot/nixpacks.toml`** (same merge pattern):

- `python312` instead of `python311`, **or**
- consult [search.nixos.org](https://search.nixos.org/packages) for the exact attr in the channel Nixpacks pins.

If the image has **`python` but not `python3`**, set Railway **Start Command** to `python -m bot` (Bot service only) or adjust `[start] cmd` accordingly.

## 6. Railway — Site service (do **not** change for this fix)

| Do **NOT** set on Site |
|-------------------------|
| `NIXPACKS_CONFIG_FILE=bot/nixpacks.toml` |

Site should keep building as today (Node / Next). **`bot/nixpacks.toml` in the repo does nothing for Site** until that variable points to it.

## 7. Rollback

1. In **Bot** service: remove variable **`NIXPACKS_CONFIG_FILE`** (or clear its value).
2. Redeploy Bot — build reverts to default detection (Node-only risk returns).
3. Optionally stop referencing **`bot/nixpacks.toml`** (delete file in a later commit **with approve**). Site unaffected either way if step 1 is done.

## 8. Deploy checklist (Bot service)

After setting **`NIXPACKS_CONFIG_FILE=bot/nixpacks.toml`** and redeploying **Bot**:

- [ ] **Build logs**: evidence of **Python** / nix **python311** (or substituted attr) in setup.
- [ ] **Build logs**: line running **`pip install -r bot/requirements.txt`** and succeeding.
- [ ] **Runtime**: no **`python3: command not found`**.
- [ ] **Runtime**: no **`ModuleNotFoundError: bot`**.
- [ ] **Runtime logs**: bot reaches **settings load** / startup (e.g. log from `bot/main.py` after env load).
- [ ] **Telegram**: **`/start`** gets a reply from the bot.

**Site service:** compare one deploy before/after — **no new** `NIXPACKS_CONFIG_FILE`, **no** change to Site build/start intended.

## 9. Git / release

- **`bot/nixpacks.toml`** and this report are **new/untracked** until you **`git add`** them.
- **Do not commit/push without separate approve** (per project rules).

## 10. Site service impact

- **No** root `nixpacks.toml` — Site keeps default Nixpacks discovery.
- **No** `NIXPACKS_CONFIG_FILE` on Site — **`bot/nixpacks.toml` is ignored** for Site builds.
- **No** changes to Next.js, analytics, `package.json`, or Python bot logic in this change set.
