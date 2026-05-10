"""
Отправить два тестовых HTML-сообщения админам (как при /start и при сдаче анкеты).
Запуск из корня репозитория, с теми же .env / .env.local, что и бот:

  python scripts/telegram_admin_ping_test.py

Нужны TELEGRAM_BOT_TOKEN и хотя бы один из: ADMIN_NOTIFY_CHAT, TELEGRAM_ADMIN_IDS / ADMIN_TELEGRAM_IDS.
"""
from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from aiogram import Bot

from bot.admin_notify import _notify_destinations, notify_admins_html
from bot.config import load_settings


async def main() -> None:
    settings = load_settings()
    dests = _notify_destinations(settings)
    if not dests:
        print(
            "ERROR: nowhere to send. Set ADMIN_NOTIFY_CHAT and/or "
            "ADMIN_TELEGRAM_IDS (or TELEGRAM_ADMIN_IDS) in .env.local",
            file=sys.stderr,
        )
        raise SystemExit(1)
    bot = Bot(settings.telegram_bot_token)
    try:
        await notify_admins_html(
            bot,
            settings,
            "<b>Тест Dordoi.help</b>\n\n"
            "Сообщение 1: симуляция <b>нажатия /start</b> (новая анкета).",
        )
        await notify_admins_html(
            bot,
            settings,
            "<b>Тест Dordoi.help</b>\n\n"
            "Сообщение 2: симуляция <b>полностью заполненной анкеты</b> (сохранение в БД).",
        )
        print(f"OK: sent 2 test notifications to {len(dests)} destination(s).")
    finally:
        await bot.session.close()


if __name__ == "__main__":
    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass
    asyncio.run(main())
