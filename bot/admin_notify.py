"""Уведомления администратору в Telegram (тот же бот, что и онбординг)."""
from __future__ import annotations

import html
import logging
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from aiogram import Bot

    from bot.config import Settings

_log = logging.getLogger(__name__)


def _notify_destinations(settings: "Settings") -> list[str | int]:
    """Куда слать: ADMIN_NOTIFY_CHAT (@user или id) + числовые TELEGRAM_ADMIN_IDS / ADMIN_TELEGRAM_IDS."""
    out: list[str | int] = []
    chat = (settings.admin_notify_chat or "").strip()
    if chat:
        out.append(chat)
    for aid in settings.admin_telegram_ids:
        if aid not in out:
            out.append(aid)
    return out


async def notify_admins_html(bot: "Bot", settings: "Settings", text: str) -> None:
    """HTML-разметка — экранируйте пользовательские поля через html.escape."""
    dests = _notify_destinations(settings)
    if not dests:
        _log.warning(
            "admin notify skipped: no destinations (set ADMIN_NOTIFY_CHAT and/or "
            "ADMIN_TELEGRAM_IDS / TELEGRAM_ADMIN_IDS)"
        )
        return
    for dest in dests:
        try:
            await bot.send_message(
                dest,
                text,
                parse_mode="HTML",
                disable_web_page_preview=True,
            )
        except Exception:
            _log.exception("admin notify failed for dest=%r", dest)


def html_user_line(from_user) -> str:
    """Краткая строка о пользователе Telegram (для логов админа)."""
    if not from_user:
        return "user: —"
    uid = from_user.id
    name = html.escape(from_user.full_name or "—")
    un = from_user.username
    uname = html.escape(f"@{un}") if un else "—"
    return (
        f"Telegram ID: <code>{uid}</code>\n"
        f"Имя: {name}\n"
        f"Username: {uname}"
    )
