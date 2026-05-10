"""
Шедулер «загрузите свежие фото»: каждые 48 часов от последней активности
продавца отправляем напоминание + persistent reply-кнопку.

Источник «последней активности»:
  max(vendors.approved_at, vendor_photo_batches.created_at where status='approved')

Дедуп: vendors.last_photo_reminder_at — после успешной отправки выставляем now().
Без cap по числу напоминаний (по требованию пользователя): шлём раз в 48ч всегда.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING

from aiogram import Bot

from bot.repository import VendorRepository

if TYPE_CHECKING:
    from bot.config import Settings

_log = logging.getLogger(__name__)

REMINDER_INTERVAL = timedelta(hours=48)
TICK_INTERVAL = timedelta(minutes=30)


def _parse_iso(value: str | None) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        # Supabase возвращает в формате "2026-05-10 15:26:28.943012+00"
        # — datetime.fromisoformat в py>=3.11 это понимает.
        return datetime.fromisoformat(value.replace(" ", "T"))
    except ValueError:
        return None


def _max_dt(*values: datetime | None) -> datetime | None:
    items = [v for v in values if v is not None]
    if not items:
        return None
    return max(items)


def _build_reminder_text(store_name: str | None, card_url: str | None) -> str:
    title = (store_name or "ваш магазин").strip() or "ваш магазин"
    link_block = (
        f'\n\n➡️ <a href="{card_url}">Открыть карточку магазина</a>'
        if card_url
        else ""
    )
    return (
        "📸 <b>Свежие фото — выше отклик</b>\n\n"
        "Покупатели рынка Дордой и оптовики из СНГ чаще пишут продавцам, "
        "у которых в карточке регулярно появляются новые товары. "
        f"Пришли минут на десять подборку — мы добавим её в карточку <b>«{title}»</b>"
        " отдельной партией с датой загрузки."
        f"{link_block}\n\n"
        "Нажмите «📸 Добавить фото товаров» под полем ввода ↓"
    )


async def _send_reminder(
    bot: Bot,
    chat_id: int,
    store_name: str | None,
    card_url: str | None,
) -> bool:
    try:
        await bot.send_message(
            chat_id=chat_id,
            text=_build_reminder_text(store_name, card_url),
            parse_mode="HTML",
            disable_web_page_preview=False,
        )
        return True
    except Exception:
        _log.exception("photo reminder send failed chat_id=%s", chat_id)
        return False


def _build_card_url(base: str | None, locale: str | None, slug: str | None) -> str | None:
    if not base:
        return None
    loc = (locale or "ru").lower()
    if slug:
        return f"{base.rstrip('/')}/{loc}/catalog/{slug}"
    return f"{base.rstrip('/')}/{loc}/catalog"


async def run_photo_reminder_loop(
    bot: Bot,
    repo: VendorRepository,
    settings: "Settings",
) -> None:
    """Бесконечный цикл шедулера. Запускается через asyncio.create_task в main."""
    site_base = ""
    try:
        # NEXT_PUBLIC_APP_URL не лежит в Settings; подсасываем из env лениво.
        import os

        site_base = (os.getenv("NEXT_PUBLIC_APP_URL") or "").strip().rstrip("/")
    except Exception:
        site_base = ""

    _log.info(
        "Photo-reminder loop started: interval=%s, tick=%s, site=%s",
        REMINDER_INTERVAL,
        TICK_INTERVAL,
        site_base or "<no NEXT_PUBLIC_APP_URL>",
    )

    while True:
        try:
            await _tick(bot, repo, site_base)
        except asyncio.CancelledError:
            raise
        except Exception:
            _log.exception("photo-reminder tick failed")

        try:
            await asyncio.sleep(TICK_INTERVAL.total_seconds())
        except asyncio.CancelledError:
            raise


async def _tick(bot: Bot, repo: VendorRepository, site_base: str) -> None:
    now = datetime.now(timezone.utc)
    cutoff = (now - REMINDER_INTERVAL).isoformat()

    candidates = repo.list_vendors_due_for_photo_reminder(cutoff)
    if not candidates:
        return

    _log.info("photo-reminder candidates: %s", len(candidates))

    for v in candidates:
        chat_id = v.get("telegram_chat_id")
        vendor_id = v.get("id")
        if not isinstance(chat_id, int) or not isinstance(vendor_id, str):
            continue

        approved_at = _parse_iso(v.get("approved_at"))
        last_batch_at_iso = repo.latest_approved_photo_batch_at(vendor_id)
        last_batch_at = _parse_iso(last_batch_at_iso)
        last_activity = _max_dt(approved_at, last_batch_at)
        if last_activity is None:
            continue

        if now - last_activity < REMINDER_INTERVAL:
            continue

        # ещё раз перепроверим last_photo_reminder_at — между тиками могли
        # отправить руками. И не шлём слишком часто.
        last_reminder = _parse_iso(v.get("last_photo_reminder_at"))
        if last_reminder is not None and now - last_reminder < REMINDER_INTERVAL:
            continue

        store_name = v.get("store_name") if isinstance(v.get("store_name"), str) else None
        slug = v.get("slug") if isinstance(v.get("slug"), str) else None
        language = v.get("language") if isinstance(v.get("language"), str) else "ru"
        card_url = _build_card_url(site_base, language, slug)

        sent_ok = await _send_reminder(bot, chat_id, store_name, card_url)
        if sent_ok:
            try:
                repo.mark_photo_reminder_sent(vendor_id, now.isoformat())
            except Exception:
                _log.exception("mark_photo_reminder_sent failed vendor=%s", vendor_id)
