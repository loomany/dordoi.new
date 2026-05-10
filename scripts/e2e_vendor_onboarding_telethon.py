#!/usr/bin/env python3
"""
Проходит полный сценарий онбординга продавца в Telegram от имени **обычного аккаунта**
(не через Bot API): отправляет /start, жмёт инлайн-кнопки, текст и фото — как живой пользователь.

Зачем: проверить весь путь до заявки `pending_moderation` в Supabase и затем опубликовать из админки.

Требования
----------
1. Учётка https://my.telegram.org → **api_id** и **api_hash**.
2. Переменные окружения (удобно положить в `.env.local`, скрипт подхватывает через python-dotenv):
   - TELEGRAM_API_ID
   - TELEGRAM_API_HASH
   - E2E_VENDOR_BOT_USERNAME — username бота без @ (как в NEXT_PUBLIC_TELEGRAM_VENDOR_BOT)
   - E2E_PHONE — номер в международном формате с «+», допустимый для входа на сайте
     (как в боте: +7…, +996…, +998…, +992…). Лучше **отдельный тестовый номер**, которого ещё нет в `vendors`.

Первый запуск: Telethon запросит код из Telegram и (если есть) облачный пароль — ввод в консоли.
Сессия сохраняется в файл рядом со скриптом (в .gitignore).

Запуск из корня репозитория::

    pip install -r scripts/requirements-e2e-telegram.txt
    python scripts/e2e_vendor_onboarding_telethon.py

Перед запуском должен работать бот (aiogram) с тем же TELEGRAM_BOT_TOKEN и доступом к Supabase Storage.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
import os
import sys
import time
import urllib.request
from pathlib import Path

_ROOT = Path(__file__).resolve().parents[1]

try:
    from dotenv import load_dotenv
except ImportError:
    load_dotenv = None  # type: ignore[misc, assignment]

from telethon import TelegramClient
from telethon.errors import RPCError
from telethon.tl.custom.message import Message

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
_log = logging.getLogger("e2e_vendor")


def _load_env() -> None:
    if load_dotenv is None:
        return
    for name in (".env.local", ".env"):
        p = _ROOT / name
        if p.is_file():
            load_dotenv(p)
            _log.info("Loaded env from %s", p)
            return


def _sample_jpeg_bytes() -> bytes:
    url = os.environ.get(
        "E2E_SAMPLE_IMAGE_URL",
        "https://picsum.photos/seed/dordoi-e2e/480/480",
    )
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            return r.read()
    except Exception as e:
        _log.warning("Could not download sample image (%s), using tiny stub: %s", url, e)
        # Минимальный валидный JPEG 1×1
        return (
            b"\xff\xd8\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a\x1f\x1e\x1d\x1a\x1c\x1c $.\' \",#\x1c\x1c(7),01444\x1f\'9=82<.342\xff\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00\x14\x00\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x08\xff\xc4\x00\x14\x10\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xaa\xff\xd9"
        )


async def _max_incoming_id(client: TelegramClient, bot) -> int:
    mid = 0
    async for m in client.iter_messages(bot, limit=120):
        if not m.out and m.id > mid:
            mid = m.id
    return mid


async def _wait_new_incoming(
    client: TelegramClient,
    bot,
    min_id: int,
    *,
    timeout: float = 120.0,
    settle_s: float = 1.15,
) -> list[Message]:
    t0 = time.monotonic()
    seen: set[int] = set()

    while time.monotonic() - t0 < timeout:
        batch: list[Message] = []
        async for m in client.iter_messages(bot, limit=60):
            if m.out or m.id <= min_id:
                continue
            if m.id not in seen:
                seen.add(m.id)
                batch.append(m)
        if batch:
            await asyncio.sleep(settle_s)
            async for m in client.iter_messages(bot, limit=80):
                if m.out or m.id <= min_id:
                    continue
                if m.id not in seen:
                    seen.add(m.id)
                    batch.append(m)
            batch.sort(key=lambda x: x.id)
            return batch
        await asyncio.sleep(0.35)

    raise TimeoutError(f"Нет новых входящих от бота (после msg id {min_id}) за {timeout}s")


async def _click_inline(msg: Message, substr: str) -> None:
    if not msg.buttons:
        raise RuntimeError("У сообщения нет inline-кнопок")
    for i, row in enumerate(msg.buttons):
        for j, btn in enumerate(row):
            label = (btn.text or "").strip()
            if substr in label:
                await msg.click(i, j)
                return
    raise RuntimeError(f"Кнопка с подстрокой {substr!r} не найдена: {msg.buttons!r}")


async def _click_newest_inline(client: TelegramClient, bot, min_id: int, substr: str) -> None:
    await asyncio.sleep(0.5)
    candidates: list[Message] = []
    async for m in client.iter_messages(bot, limit=30):
        if m.out or m.id <= min_id:
            continue
        if m.buttons:
            candidates.append(m)
    candidates.sort(key=lambda x: -x.id)
    for m in candidates:
        try:
            await _click_inline(m, substr)
            return
        except RuntimeError:
            continue
    raise RuntimeError(f"Ни одно входящее после id={min_id} не содержит кнопку {substr!r}")


async def run_flow(*, dry_run: bool) -> None:
    api_id = int(os.environ["TELEGRAM_API_ID"])
    api_hash = os.environ["TELEGRAM_API_HASH"]
    bot_username = os.environ["E2E_VENDOR_BOT_USERNAME"].strip().lstrip("@")
    phone = os.environ["E2E_PHONE"].strip()
    store_name = os.environ.get("E2E_STORE_NAME", "[E2E] Автопроверка анкеты").strip()

    session_path = os.environ.get(
        "E2E_TELEGRAM_SESSION",
        str(Path(__file__).resolve().parent / ".e2e_telegram.session"),
    )

    if dry_run:
        _log.info("DRY-RUN: переменные заданы, session=%s", session_path)
        return

    client = TelegramClient(session_path, api_id, api_hash)
    await client.connect()
    if not await client.is_user_authorized():
        await client.start(phone=phone)
    else:
        _log.info("Сессия уже авторизована: %s", session_path)

    bot = await client.get_entity(bot_username)
    _log.info("Диалог с ботом @%s", bot_username)

    img = _sample_jpeg_bytes()

    async def send_text(text: str) -> list[Message]:
        base = await _max_incoming_id(client, bot)
        await client.send_message(bot, text)
        return await _wait_new_incoming(client, bot, base)

    async def send_photo() -> list[Message]:
        base = await _max_incoming_id(client, bot)
        await client.send_file(bot, file=img)
        return await _wait_new_incoming(client, bot, base)

    async def click_on_message(msg: Message, substr: str) -> list[Message]:
        base = await _max_incoming_id(client, bot)
        await _click_inline(msg, substr)
        return await _wait_new_incoming(client, bot, base)

    # 1) /start
    msgs = await send_text("/start")
    _log.info("После /start: %s сообщ.", len(msgs))

    # 2) Язык: «Русский»
    lang_msg = next((m for m in reversed(msgs) if m.buttons), None)
    if not lang_msg:
        raise RuntimeError("Нет сообщения с кнопками языка после /start")
    msgs = await click_on_message(lang_msg, "Русский")
    _log.info("После выбора языка")

    # 3) Телефон текстом
    await send_text(phone)

    # 4) Название, локация
    await send_text(store_name)
    await send_text("E2E: контейнер тест, ряд условный")

    # 5) Логотип — фото
    await send_photo()

    # 6) Описание каталога
    desc = (
        "Автотест анкеты Dordoi.help: оптовая торговля, тестовая карточка для модерации. "
        "Не для реальных покупателей."
    )
    msgs = await send_text(desc)

    # 7) Пропуск продолжения описания
    detail_msg = next((m for m in reversed(msgs) if m.buttons), None)
    if not detail_msg:
        base = await _max_incoming_id(client, bot)
        msgs = await _wait_new_incoming(client, bot, base, timeout=30)
        detail_msg = next((m for m in reversed(msgs) if m.buttons), None)
    if not detail_msg:
        raise RuntimeError("Нет кнопки «Без продолжения» после описания")
    msgs = await click_on_message(detail_msg, "Без продолжения")
    _log.info("Категории: шаг начат")

    # 8) Одна категория → продолжить к фото
    await send_text("E2E категория")
    base = await _max_incoming_id(client, bot)
    await _click_newest_inline(client, bot, base, "Продолжить")
    await _wait_new_incoming(client, bot, base)
    _log.info("Загрузка фото товаров")

    # 9) Одно фото товара → завершить
    await send_photo()
    base = await _max_incoming_id(client, bot)
    await _click_newest_inline(client, bot, base, "Завершить")
    await _wait_new_incoming(client, bot, base)

    # 10) Фото контейнера
    await send_photo()

    # 11) Мин. партия
    msgs = await send_text("От 1 коробки (E2E)")

    # 12) Оплата — Перевод
    pay_msg = next((m for m in reversed(msgs) if m.buttons), None)
    if not pay_msg:
        raise RuntimeError("Нет клавиатуры оплаты")
    msgs = await click_on_message(pay_msg, "Перевод")

    # 13) Доставка — Нет
    del_msg = next((m for m in reversed(msgs) if m.buttons), None)
    if not del_msg:
        raise RuntimeError("Нет клавиатуры доставки")
    msgs = await click_on_message(del_msg, "Нет")

    # 14) WhatsApp основной — тот же номер текстом
    await send_text(phone)

    # 15) Второй WhatsApp — пропуск
    base = await _max_incoming_id(client, bot)
    await _click_newest_inline(client, bot, base, "Пропустить")
    await _wait_new_incoming(client, bot, base)

    # 16) Instagram — пропуск
    base = await _max_incoming_id(client, bot)
    await _click_newest_inline(client, bot, base, "Пропустить")
    await _wait_new_incoming(client, bot, base)

    # 17) Telegram канал — пропуск
    base = await _max_incoming_id(client, bot)
    await _click_newest_inline(client, bot, base, "Пропустить")
    await _wait_new_incoming(client, bot, base)

    # 18) Образцы — Нет
    base = await _max_incoming_id(client, bot)
    await _click_newest_inline(client, bot, base, "Нет")
    msgs = await _wait_new_incoming(client, bot, base)

    # 19) Возврат брака — Да (короткий путь без текста)
    ret_msg = next((m for m in reversed(msgs) if m.buttons), None)
    if not ret_msg:
        base = await _max_incoming_id(client, bot)
        msgs = await _wait_new_incoming(client, bot, base, timeout=30)
        ret_msg = next((m for m in reversed(msgs) if m.buttons), None)
    if not ret_msg:
        raise RuntimeError("Нет клавиатуры возврата")
    await click_on_message(ret_msg, "Да")

    _log.info(
        "Готово. Проверьте чат и заявку в Supabase (status=pending_moderation). "
        "Затем опубликуйте из админки."
    )
    await client.disconnect()


def main() -> None:
    _load_env()
    p = argparse.ArgumentParser(description="E2E онбординг продавца через Telethon")
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="только проверить переменные окружения и выход",
    )
    args = p.parse_args()

    required = (
        "TELEGRAM_API_ID",
        "TELEGRAM_API_HASH",
        "E2E_VENDOR_BOT_USERNAME",
        "E2E_PHONE",
    )
    missing = [k for k in required if not os.environ.get(k)]
    if missing:
        print("Не заданы переменные:", ", ".join(missing), file=sys.stderr)
        sys.exit(1)

    try:
        asyncio.run(run_flow(dry_run=args.dry_run))
    except RPCError as e:
        _log.exception("Telegram RPC error")
        sys.exit(2)
    except Exception as e:
        _log.exception("Ошибка сценария: %s", e)
        sys.exit(3)


if __name__ == "__main__":
    main()
