from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv

_repo_root = Path(__file__).resolve().parents[1]
load_dotenv(_repo_root / ".env")
load_dotenv(_repo_root / ".env.local", override=True)


def _parse_admin_ids(raw: str | None) -> list[int]:
    if not raw:
        return []
    out: list[int] = []
    for part in raw.split(","):
        part = part.strip()
        if not part:
            continue
        try:
            out.append(int(part))
        except ValueError:
            continue
    return out


@dataclass(frozen=True)
class Settings:
    telegram_bot_token: str
    supabase_url: str
    supabase_service_role_key: str
    admin_telegram_ids: list[int]
    vendor_login_url: str
    admin_notify_chat: str
    vendor_media_bucket: str = "vendor-media"


def load_settings() -> Settings:
    token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    url = os.getenv("SUPABASE_URL", "").strip() or os.getenv(
        "NEXT_PUBLIC_SUPABASE_URL", ""
    ).strip()
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip()
    admins_raw = os.getenv("ADMIN_TELEGRAM_IDS") or os.getenv(
        "TELEGRAM_ADMIN_IDS",
    )
    admins = _parse_admin_ids(admins_raw)

    missing = [
        name
        for name, val in (
            ("TELEGRAM_BOT_TOKEN", token),
            ("SUPABASE_URL", url),
            ("SUPABASE_SERVICE_ROLE_KEY", key),
        )
        if not val
    ]
    if missing:
        raise RuntimeError(
            "Задайте переменные окружения: " + ", ".join(missing)
        )

    site = os.getenv("NEXT_PUBLIC_APP_URL", "").strip().rstrip("/")
    login_url = os.getenv("VENDOR_LOGIN_URL", "").strip()
    if not login_url:
        login_url = f"{site}/login" if site else "https://example.com/login"

    notify = os.getenv("ADMIN_NOTIFY_CHAT", "@loomany").strip()
    if not notify:
        notify = "@loomany"

    bucket = os.getenv("VENDOR_MEDIA_BUCKET", "vendor-media").strip()
    if not bucket:
        bucket = "vendor-media"

    return Settings(
        telegram_bot_token=token,
        supabase_url=url,
        supabase_service_role_key=key,
        admin_telegram_ids=admins,
        vendor_media_bucket=bucket,
        vendor_login_url=login_url,
        admin_notify_chat=notify,
    )
