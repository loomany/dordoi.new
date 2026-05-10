"""
Сценарий «📸 Добавить фото товаров» для approved-продавцов.

Приходит на чат-id бота, сравнивает с `vendors.telegram_chat_id`. Если статус
`approved` — запускается FSM `VendorPhotoBatch.collecting`: продавец присылает
до 15 фото, мы сохраняем их в Storage и записываем в `vendor_photo_batches` /
`vendor_photo_batch_items`. Партия создаётся со статусом `pending_moderation`,
админ публикует её в админке (Next.js), после чего фото попадают в карточку
магазина в каталоге.

Бот никогда не пишет напрямую в `vendors.product_photos` — это делает админский
approve в `lib/actions/vendor-photo-batch-moderation.ts` для preview-cache карточки.
"""

from __future__ import annotations

import asyncio
import io
import logging
from typing import TYPE_CHECKING

from aiogram import Bot, F, Router
from aiogram.filters import StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
)

from bot.repository import VendorRepository
from bot.states import VendorPhotoBatch

if TYPE_CHECKING:
    from bot.config import Settings

# Совпадает с lib/telegram/vendor-keyboard.ts (Next.js → reply keyboard).
ADD_PHOTOS_BUTTON_TEXT = "📸 Добавить фото товаров"

CB_BATCH_FINISH = "vph:finish"
CB_BATCH_CANCEL = "vph:cancel"

MAX_PHOTOS_PER_BATCH = 15
MAX_PHOTO_BYTES = 10 * 1024 * 1024

_log = logging.getLogger(__name__)
_locks: dict[int, asyncio.Lock] = {}


def _lock_for(uid: int) -> asyncio.Lock:
    if uid not in _locks:
        _locks[uid] = asyncio.Lock()
    return _locks[uid]


def _persistent_keyboard() -> ReplyKeyboardMarkup:
    """То же, что Next.js собирает в `buildVendorReplyKeyboard`."""
    return ReplyKeyboardMarkup(
        keyboard=[[KeyboardButton(text=ADD_PHOTOS_BUTTON_TEXT)]],
        resize_keyboard=True,
        is_persistent=True,
        input_field_placeholder="Нажмите «Добавить фото товаров» или /start",
    )


def _batch_progress_kb(saved: int) -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []
    if saved >= 1:
        rows.append(
            [
                InlineKeyboardButton(
                    text="Завершить загрузку",
                    callback_data=CB_BATCH_FINISH,
                )
            ]
        )
    rows.append(
        [
            InlineKeyboardButton(
                text="Отменить партию",
                callback_data=CB_BATCH_CANCEL,
            )
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


async def _download_photo_jpeg(bot: Bot, photo) -> tuple[bytes, str]:
    buf = io.BytesIO()
    await bot.download(photo, destination=buf)
    return buf.getvalue(), "image/jpeg"


def create_photo_batch_router(
    settings: "Settings",
    repo: VendorRepository,
) -> Router:
    r = Router(name="vendor_photo_batch")
    bucket = settings.vendor_media_bucket

    @r.message(F.text == ADD_PHOTOS_BUTTON_TEXT)
    async def on_add_photos_button(message: Message, state: FSMContext) -> None:
        if not message.from_user:
            return

        chat_id = message.chat.id
        existing = repo.get_vendor_by_telegram(chat_id)
        if not existing:
            await message.answer(
                "Пока вашей анкеты нет в базе Dordoi.help. Отправьте /start, "
                "чтобы заполнить заявку.",
                reply_markup=_persistent_keyboard(),
            )
            return

        status = (existing.get("status") or "").strip()
        if status != "approved":
            await message.answer(
                "⏳ Карточка ещё на модерации. Когда админ её опубликует — "
                "вернитесь сюда и нажмите «Добавить фото товаров»: новые фото "
                "тоже пройдут проверку и появятся в карточке.",
                reply_markup=_persistent_keyboard(),
            )
            return

        # Если уже идёт сбор партии — не создаём новую, продолжаем текущую
        current = await state.get_data()
        if current.get("batch_id"):
            saved = int(current.get("saved_count") or 0)
            await message.answer(
                f"📸 Продолжаем загрузку: уже сохранено {saved} из {MAX_PHOTOS_PER_BATCH}. "
                "Пришлите следующие фото или нажмите «Завершить загрузку».",
                reply_markup=_batch_progress_kb(saved),
            )
            return

        try:
            batch_id = repo.create_pending_photo_batch(str(existing["id"]))
        except Exception:
            _log.exception(
                "create_pending_photo_batch failed chat_id=%s vendor=%s",
                chat_id,
                existing.get("id"),
            )
            await message.answer(
                "⚠️ Не удалось создать новую партию. Попробуйте ещё раз через минуту."
            )
            return

        await state.set_state(VendorPhotoBatch.collecting)
        await state.update_data(
            batch_id=batch_id,
            vendor_id=str(existing["id"]),
            saved_count=0,
        )
        await message.answer(
            "📸 Новая партия фото товаров\n\n"
            f"Пришлите до {MAX_PHOTOS_PER_BATCH} фото — по одному или в одном альбоме. "
            "После «Завершить загрузку» админ проверит партию и опубликует её "
            "в карточке магазина. Покупателям нравится видеть свежие подборки.",
            reply_markup=_batch_progress_kb(0),
        )

    @r.message(StateFilter(VendorPhotoBatch.collecting), F.photo)
    async def on_batch_photo(message: Message, state: FSMContext, bot: Bot) -> None:
        if not message.from_user:
            return
        uid = message.from_user.id

        async with _lock_for(uid):
            data = await state.get_data()
            batch_id = data.get("batch_id")
            if not batch_id:
                return
            saved = int(data.get("saved_count") or 0)
            if saved >= MAX_PHOTOS_PER_BATCH:
                await message.answer(
                    f"📎 В одной партии максимум {MAX_PHOTOS_PER_BATCH} фото. "
                    "Нажмите «Завершить загрузку» — следующую партию отправите позже.",
                    reply_markup=_batch_progress_kb(saved),
                )
                return

            try:
                body, mime = await _download_photo_jpeg(bot, message.photo[-1])
            except Exception:
                await message.answer(
                    "⚠️ Не удалось получить фото из Telegram — отправьте ещё раз."
                )
                return

            if len(body) > MAX_PHOTO_BYTES:
                await message.answer(
                    "⚠️ Это фото больше 10 МБ — пропускаем. Пришлите сжатое."
                )
                return

            try:
                _, public_url = repo.upload_public_image(
                    bucket,
                    message.chat.id,
                    body,
                    f"batch_{saved + 1}.jpg",
                    mime,
                )
            except Exception:
                _log.exception(
                    "batch upload failed chat_id=%s batch=%s",
                    message.chat.id,
                    batch_id,
                )
                await message.answer(
                    "⚠️ Не удалось сохранить фото. Попробуйте другое."
                )
                return

            try:
                repo.append_photo_batch_item(
                    batch_id=str(batch_id),
                    photo_url=public_url,
                    position=saved + 1,
                )
            except Exception:
                _log.exception(
                    "append_photo_batch_item failed batch=%s pos=%s",
                    batch_id,
                    saved + 1,
                )
                await message.answer(
                    "⚠️ Не удалось сохранить фото в базу. Попробуйте позже."
                )
                return

            saved += 1
            await state.update_data(saved_count=saved)
            await message.answer(
                f"✅ Сохранено {saved} из {MAX_PHOTOS_PER_BATCH}. "
                "Можно прислать ещё или завершить загрузку.",
                reply_markup=_batch_progress_kb(saved),
            )

    @r.callback_query(
        StateFilter(VendorPhotoBatch.collecting),
        F.data == CB_BATCH_FINISH,
    )
    async def cb_finish(query: CallbackQuery, state: FSMContext) -> None:
        if not query.message:
            return
        data = await state.get_data()
        saved = int(data.get("saved_count") or 0)
        if saved < 1:
            await query.answer(
                "Сначала пришлите хотя бы одно фото, чтобы было что отправлять на проверку.",
                show_alert=True,
            )
            return
        await query.answer()
        await state.clear()
        await query.message.answer(
            "📨 Партия отправлена на проверку\n\n"
            f"{saved} фото уже у админа — как только опубликует, они появятся в "
            "вашей карточке на Dordoi.help, а вам придёт уведомление сюда.",
            reply_markup=_persistent_keyboard(),
        )

    @r.callback_query(
        StateFilter(VendorPhotoBatch.collecting),
        F.data == CB_BATCH_CANCEL,
    )
    async def cb_cancel(query: CallbackQuery, state: FSMContext) -> None:
        if not query.message:
            return
        data = await state.get_data()
        batch_id = data.get("batch_id")
        await query.answer()
        if isinstance(batch_id, str) and batch_id:
            try:
                repo.delete_photo_batch(batch_id)
            except Exception:
                _log.exception("delete_photo_batch failed id=%s", batch_id)
        await state.clear()
        await query.message.answer(
            "🛑 Партия отменена. Когда захотите — начните снова кнопкой ниже.",
            reply_markup=_persistent_keyboard(),
        )

    return r
