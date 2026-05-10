from __future__ import annotations

import asyncio
import io
import logging
import re
from typing import TYPE_CHECKING, Any
from urllib.parse import urlparse

from aiogram import Bot, F, Router
from aiogram.enums import ParseMode
from aiogram.filters import Command, StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    Message,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)

from bot.repository import VendorRepository, normalize_contact_phone, validate_phone
from bot.states import VendorOnboarding

if TYPE_CHECKING:
    from bot.config import Settings

# --- Константы UI ---

VENDOR_CATEGORIES: list[str] = [
    "Одежда",
    "Обувь",
    "Текстиль",
    "Аксессуары",
    "Электроника",
    "Бытовая техника",
    "Продукты питания",
    "Упаковка",
    "Сырьё",
    "Другое",
]

CB_LANG_RU = "vo:l:ru"
CB_LANG_KG = "vo:l:kg"
CB_ADD_STORE = "vo:add"
CB_CAT_PREFIX = "vo:g:"
CB_CAT_DONE = "vo:cat_done"
CB_PHOTOS_DONE = "vo:photos_done"
CB_PAY_CASH = "vo:pay:cash"
CB_PAY_TRANSFER = "vo:pay:transfer"
CB_PAY_BOTH = "vo:pay:both"
CB_DEL_Y = "vo:del:y"
CB_DEL_N = "vo:del:n"
CB_WA2_SKIP = "vo:wa2:skip"
CB_IG_SKIP = "vo:ig:skip"
CB_TG_SKIP = "vo:tg:skip"
CB_SMP_Y = "vo:smp:y"
CB_SMP_N = "vo:smp:n"
CB_RET_Y = "vo:ret:y"
CB_RET_N = "vo:ret:n"
CB_RET_COND = "vo:ret:cond"

_STORE_NAME_STEP_PROMPT = (
    "Номер сохранён.\n\n"
    "Название магазина:\n\n"
    "Это заголовок вашей карточки в каталоге Dordoi.help: его увидят оптовики в списке магазинов "
    "и по нему вас будут искать до модерации и после публикации.\n\n"
    "Отправьте одним сообщением — так, как на вывеске, визитке или в названии чата WhatsApp "
    "(можно кириллица и латиница вместе).\n\n"
    "Если у точки несколько формулировок, напишите основную, под которой вас узнают покупатели."
)

_photo_locks: dict[int, asyncio.Lock] = {}
_cat_locks: dict[int, asyncio.Lock] = {}
_log = logging.getLogger(__name__)

# MarkdownV2: символы, которые нужно экранировать в тексте сущности
_MD2_SPECIAL = frozenset("_*[]()~`>#+-=|{}.!")


def md2_escape(text: str) -> str:
    return "".join(("\\" + c if c in _MD2_SPECIAL else c) for c in text)


def build_seller_confirmation_md2(phone: str, cabinet_url: str) -> str:
    """Итоговое сообщение продавцу (MarkdownV2)."""
    p = md2_escape(phone.strip())
    u = md2_escape(cabinet_url.strip().rstrip("/"))
    link_title = md2_escape("Открыть кабинет")
    return (
        "*Ваша заявка принята\\!*\n"
        "Ожидает модерации\\.\n\n"
        f"Ваш логин для входа: {p}\n"
        f"Ссылка на кабинет: [{link_title}]({u})"
    )


def build_admin_notification_text(
    vendor_id: Any,
    telegram_chat_id: int,
    row: dict[str, Any],
    fsm_data: dict[str, Any],
) -> str:
    """Полная копия данных для администратора (plain text)."""
    lines: list[str] = [
        "📋 Новая заявка продавца (таблица vendors)",
        f"id заявки: {vendor_id}",
        f"telegram_chat_id: {telegram_chat_id}",
        f"язык: {row.get('language')}",
        f"телефон (логин): {row.get('phone_number')}",
        "",
        f"магазин: {row.get('store_name')}",
        f"торговый ряд: {row.get('location_row')}",
        f"описание: {row.get('description')}",
        f"категории: {', '.join(row.get('categories') or [])}",
        f"мин. партия: {row.get('min_batch')}",
        f"оплата: {row.get('payment_methods')}",
        f"помощь с доставкой: {row.get('delivery_help')}",
        f"образцы: {row.get('samples_available')}",
        f"возврат брака: {row.get('returns_policy')}",
        "",
        "— Медиа —",
        f"логотип: {row.get('logo_url')}",
        f"фото контейнера: {row.get('container_photo_url')}",
    ]
    photos = row.get("product_photos") or fsm_data.get("product_photo_urls") or []
    if photos:
        lines.append("фото товаров:")
        for i, url in enumerate(photos, 1):
            lines.append(f"  {i}. {url}")
    else:
        lines.append("фото товаров: —")

    lines.extend(
        [
            "",
            "— Контакты —",
            f"WhatsApp 1: {row.get('whatsapp_1')}",
            f"WhatsApp 2: {row.get('whatsapp_2') or '—'}",
            f"Instagram: {row.get('instagram_url') or '—'}",
            f"Telegram: {row.get('telegram_url') or '—'}",
            "",
            f"статус в БД: {row.get('status')}",
        ]
    )
    return "\n".join(lines)


async def _send_admin_text_chunks(bot: Bot, chat_id: str | int, text: str) -> None:
    """Отправка текста администратору с учётом лимита Telegram 4096 символов."""
    max_len = 4096
    if len(text) <= max_len:
        await bot.send_message(chat_id=chat_id, text=text)
        return
    for i in range(0, len(text), max_len):
        await bot.send_message(chat_id=chat_id, text=text[i : i + max_len])


def _lock(d: dict[int, asyncio.Lock], uid: int) -> asyncio.Lock:
    if uid not in d:
        d[uid] = asyncio.Lock()
    return d[uid]


def _lang_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="Русский", callback_data=CB_LANG_RU),
                InlineKeyboardButton(text="Кыргызча", callback_data=CB_LANG_KG),
            ]
        ]
    )


def _add_store_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="🏪 Добавить магазин", callback_data=CB_ADD_STORE)]
        ]
    )


def _contact_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Поделиться контактом", request_contact=True)]
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def _category_kb(indices: list[int]) -> InlineKeyboardMarkup:
    picked = set(indices)
    rows: list[list[InlineKeyboardButton]] = []
    row: list[InlineKeyboardButton] = []
    for i, name in enumerate(VENDOR_CATEGORIES):
        mark = "✓ " if i in picked else "○ "
        row.append(
            InlineKeyboardButton(
                text=f"{mark}{name}",
                callback_data=f"{CB_CAT_PREFIX}{i}",
            )
        )
        if len(row) == 2:
            rows.append(row)
            row = []
    if row:
        rows.append(row)
    rows.append(
        [InlineKeyboardButton(text="Готово", callback_data=CB_CAT_DONE)]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def _payment_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="Наличные", callback_data=CB_PAY_CASH),
                InlineKeyboardButton(text="Перевод", callback_data=CB_PAY_TRANSFER),
            ],
            [InlineKeyboardButton(text="Оба варианта", callback_data=CB_PAY_BOTH)],
        ]
    )


def _yes_no_kb(prefix_y: str, prefix_n: str, y_text: str, n_text: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text=y_text, callback_data=prefix_y),
                InlineKeyboardButton(text=n_text, callback_data=prefix_n),
            ]
        ]
    )


def _skip_kb(cb: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[[InlineKeyboardButton(text="Пропустить", callback_data=cb)]]
    )


def _returns_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="Да", callback_data=CB_RET_Y),
                InlineKeyboardButton(text="Нет", callback_data=CB_RET_N),
            ],
            [InlineKeyboardButton(text="Условия (текстом)", callback_data=CB_RET_COND)],
        ]
    )


def _url_ok(s: str) -> bool:
    s = s.strip()
    u = urlparse(s)
    if u.scheme in ("http", "https") and u.netloc:
        return True
    if re.match(r"^@[\w\d_]{3,}$", s):
        return True
    if re.match(r"^t\.me/[\w\d_/]+$", s, re.I):
        return True
    return False


async def _download_photo_jpeg(bot: Bot, photo) -> tuple[bytes, str]:
    buf = io.BytesIO()
    await bot.download(photo, destination=buf)
    body = buf.getvalue()
    return body, "image/jpeg"


def _phone_digits_for_storage(raw: str) -> str:
    """Как в веб-логине: в БД только цифры для совпадения с OTP."""
    return re.sub(r"\D", "", raw)


# Должен совпадать с `INTL_MOBILE` в `lib/phone.ts` (вход по OTP на сайте).
_SAAS_MOBILE_DIGITS = re.compile(r"^(?:7\d{10}|996\d{9}|998\d{9}|992\d{9})$")


def _digits_valid_saas_login(digits: str) -> bool:
    return bool(_SAAS_MOBILE_DIGITS.match(digits))


def _normalize_phone_manual_saas(raw: str) -> str | None:
    """Ручной ввод: только международный вид с «+» в начале → цифры как на сайте."""
    s = raw.strip()
    if not s.startswith("+"):
        return None
    d = _phone_digits_for_storage(s)
    if not _digits_valid_saas_login(d):
        return None
    return d


def create_router(settings: "Settings", repo: VendorRepository) -> Router:
    r = Router()
    bucket = settings.vendor_media_bucket

    @r.message(Command("start"))
    async def cmd_start(message: Message, state: FSMContext) -> None:
        if not message.from_user:
            return
        tid = message.chat.id
        existing = repo.get_vendor_by_telegram(tid)
        if existing:
            st = (existing.get("status") or "").strip()
            if st in ("pending_moderation", "approved"):
                await message.answer(
                    "✅ У вас уже есть заявка продавца в Dordoi.help.\n\n"
                    "Чтобы что‑то изменить в данных магазина, напишите в поддержку "
                    "или дождитесь доступа к личному кабинету после модерации."
                )
                return

        await state.clear()
        await state.set_state(VendorOnboarding.language)
        await message.answer(
            "👋 Добро пожаловать в Dordoi.help — онлайн-витрина для оптовиков рынка Дордой.\n\n"
            "Сейчас мы соберём анкету вашего магазина прямо здесь, в Telegram: "
            "фото, контакты, условия — всё увидит модератор перед публикацией.\n\n"
            "🌐 Выберите язык интерфейса анкеты:",
            reply_markup=_lang_kb(),
        )

    @r.message(Command("cancel"))
    async def cmd_cancel(message: Message, state: FSMContext) -> None:
        uid = message.from_user.id if message.from_user else None
        if uid is not None:
            _photo_locks.pop(uid, None)
            _cat_locks.pop(uid, None)
        await state.clear()
        await message.answer(
            "🛑 Анкета остановлена. Чтобы начать заново, отправьте /start",
            reply_markup=ReplyKeyboardRemove(),
        )

    @r.callback_query(StateFilter(VendorOnboarding.language), F.data.in_({CB_LANG_RU, CB_LANG_KG}))
    async def cb_language(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        lang = "ru" if query.data == CB_LANG_RU else "kg"
        await state.update_data(lang=lang)
        await state.set_state(VendorOnboarding.add_store)
        await query.message.edit_reply_markup(reply_markup=None)
        await query.message.answer(
            "🏪 Шаг 1 из анкеты — добавим вашу торговую точку в каталог.\n\n"
            "Нажмите кнопку ниже, когда будете готовы продолжить.",
            reply_markup=_add_store_kb(),
        )

    @r.callback_query(StateFilter(VendorOnboarding.add_store), F.data == CB_ADD_STORE)
    async def cb_add_store(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        await query.message.edit_reply_markup(reply_markup=None)
        await state.set_state(VendorOnboarding.phone)
        await query.message.answer(
            "📱 Шаг 2 — номер для входа в кабинет продавца на сайте Dordoi.help\n\n"
            "Это должен быть тот же номер, что привязан к вашему WhatsApp: "
            "по нему вы позже получаете код входа (SMS/WhatsApp) на сайте.\n\n"
            "✍️ Напишите номер одним сообщением в международном формате и "
            "обязательно с символом «+» в начале, например:\n"
            "• +7 778 123 45 67\n"
            "• +996 555 123456\n\n"
            "💡 Если Telegram на другом телефоне — всё равно укажите номер WhatsApp.\n"
            "Либо нажмите «Поделиться контактом», если в профиле Telegram тот же номер.",
            reply_markup=_contact_kb(),
        )

    @r.message(StateFilter(VendorOnboarding.phone), F.contact)
    async def step_phone_contact(message: Message, state: FSMContext) -> None:
        if not message.from_user or not message.contact:
            return
        phone = normalize_contact_phone(message.contact.phone_number)
        if not phone:
            await message.answer(
                "⚠️ Не удалось прочитать номер из контакта. Введите номер вручную сообщением."
            )
            return
        digits = _phone_digits_for_storage(phone)
        if not _digits_valid_saas_login(digits):
            await message.answer(
                "⚠️ Этот номер не подходит для входа на Dordoi.help "
                "(нужен формат как на сайте: страны +7, +996, +998, +992).\n\n"
                "✍️ Введите номер WhatsApp вручную строкой, начиная с + "
                "(например +7… или +996…).",
            )
            return
        await state.update_data(phone_number=digits)
        await state.set_state(VendorOnboarding.store_name)
        await message.answer(
            _STORE_NAME_STEP_PROMPT,
            reply_markup=ReplyKeyboardRemove(),
        )

    @r.message(StateFilter(VendorOnboarding.phone), F.text)
    async def step_phone_text(message: Message, state: FSMContext) -> None:
        if not message.text:
            return
        digits = _normalize_phone_manual_saas(message.text.strip())
        if not digits:
            await message.answer(
                "⚠️ Нужен международный номер с «+» в начале — как в телефонной книге "
                "(например +7 778 816 6661 или +996 555 123456).\n\n"
                "Без «+» мы не сохраним номер: так же устроен вход на сайте Dordoi.help.",
            )
            return
        await state.update_data(phone_number=digits)
        await state.set_state(VendorOnboarding.store_name)
        await message.answer(
            _STORE_NAME_STEP_PROMPT,
            reply_markup=ReplyKeyboardRemove(),
        )

    @r.message(StateFilter(VendorOnboarding.phone))
    async def step_phone_invalid(message: Message) -> None:
        await message.answer(
            "⚠️ Отправьте номер текстом (с «+» в начале) или нажмите "
            "«📱 Поделиться контактом» под полем ввода.",
        )

    @r.message(StateFilter(VendorOnboarding.store_name), F.text)
    async def step_store_name(message: Message, state: FSMContext) -> None:
        if not message.text:
            return
        name = message.text.strip()
        if len(name) < 2 or len(name) > 500:
            await message.answer(
                "Название слишком короткое или длинное.\n"
                "Нужно от 2 до 500 символов — отправьте название ещё раз одной строкой."
            )
            return
        await state.update_data(store_name=name)
        await state.set_state(VendorOnboarding.location_row)
        await message.answer(
            "📍 Шаг 4 — где вас искать на Дордое\n\n"
            "Укажите торговый ряд / контейнер / ориентир на рынке "
            "(покупателям это поможет найти точку вживую).\n\n"
            "Например: «ряд X, контейнер Y» или как принято у вас:"
        )

    @r.message(StateFilter(VendorOnboarding.store_name), ~F.text)
    async def step_store_name_not_text(message: Message) -> None:
        await message.answer(
            "На этом шаге нужно текстовое сообщение с названием магазина, без фото и стикеров. "
            "Одной строкой, как на вывеске."
        )

    @r.message(StateFilter(VendorOnboarding.location_row), F.text)
    async def step_location(message: Message, state: FSMContext) -> None:
        if not message.text:
            return
        loc = message.text.strip()
        if len(loc) < 1 or len(loc) > 500:
            await message.answer(
                "⚠️ Укажите локацию короче (до 500 символов) или чуть подробнее одним сообщением."
            )
            return
        await state.update_data(location_row=loc)
        await state.set_state(VendorOnboarding.logo)
        await message.answer(
            "🖼️ Шаг 5 — логотип для карточки магазина\n\n"
            "Пришлите одно фото с логотипом или вывеской "
            "(JPG, PNG или WebP с телефона).\n"
            "Это фото покажем на витрине в каталоге."
        )

    @r.message(StateFilter(VendorOnboarding.logo), F.photo)
    async def step_logo(message: Message, state: FSMContext, bot: Bot) -> None:
        if not message.from_user:
            return
        uid = message.chat.id
        try:
            body, mime = await _download_photo_jpeg(bot, message.photo[-1])
        except Exception:
            await message.answer(
                "⚠️ Не удалось получить фото из Telegram. Отправьте картинку ещё раз."
            )
            return
        if len(body) > 10 * 1024 * 1024:
            await message.answer("⚠️ Файл больше 10 МБ — сожмите фото или пришлите другое.")
            return
        try:
            _, pub = repo.upload_public_image(
                bucket, uid, body, "logo.jpg", mime
            )
        except Exception:
            await message.answer(
                "⚠️ Не удалось сохранить файл на сервере. Попробуйте через минуту или другое фото."
            )
            return
        await state.update_data(logo_url=pub)
        await state.set_state(VendorOnboarding.description)
        await message.answer(
            "📝 Шаг 6 — описание для покупателей\n\n"
            "Расскажите своими словами, чем торгуете и кому удобно заказывать у вас "
            "(ассортимент, форматы работы, без лишней воды — "
            "этот текст попадёт в карточку магазина):"
        )

    @r.message(StateFilter(VendorOnboarding.logo))
    async def step_logo_bad(message: Message) -> None:
        await message.answer(
            "⚠️ Нужно именно фото картинкой (не PDF и не файл документа). "
            "Сделайте снимок или отправьте JPEG/PNG одним сообщением."
        )

    @r.message(StateFilter(VendorOnboarding.description), F.text)
    async def step_description(message: Message, state: FSMContext) -> None:
        if not message.text:
            return
        desc = message.text.strip()
        if len(desc) < 5 or len(desc) > 4000:
            await message.answer(
                "⚠️ Описание должно быть от 5 до 4000 символов — добавьте пару предложений "
                "или сократите текст."
            )
            return
        await state.update_data(description=desc, cat_indices=[])
        await state.set_state(VendorOnboarding.categories)
        m = await message.answer(
            "🏷️ Шаг 7 — категории товаров\n\n"
            "Выберите одну или несколько категорий кнопками ниже "
            "(покупатели фильтруют каталог по ним).\n"
            "Когда всё отметите — нажмите «Готово».",
            reply_markup=_category_kb([]),
        )
        await state.update_data(categories_msg_id=m.message_id)

    @r.callback_query(
        StateFilter(VendorOnboarding.categories),
        F.data.startswith(CB_CAT_PREFIX),
    )
    async def cb_cat_toggle(query: CallbackQuery, state: FSMContext) -> None:
        if not query.from_user or not query.message:
            return
        await query.answer()
        idx_s = query.data.replace(CB_CAT_PREFIX, "")
        try:
            idx = int(idx_s)
        except ValueError:
            return
        if idx < 0 or idx >= len(VENDOR_CATEGORIES):
            return
        uid = query.from_user.id
        async with _lock(_cat_locks, uid):
            data = await state.get_data()
            cur: list[int] = list(data.get("cat_indices") or [])
            if idx in cur:
                cur.remove(idx)
            else:
                cur.append(idx)
            cur.sort()
            await state.update_data(cat_indices=cur)
            try:
                await query.message.edit_reply_markup(
                    reply_markup=_category_kb(cur)
                )
            except Exception:
                pass

    @r.callback_query(
        StateFilter(VendorOnboarding.categories), F.data == CB_CAT_DONE
    )
    async def cb_cat_done(query: CallbackQuery, state: FSMContext) -> None:
        if not query.message:
            return
        await query.answer()
        data = await state.get_data()
        indices: list[int] = list(data.get("cat_indices") or [])
        if not indices:
            await query.answer(
                "👉 Выберите хотя бы одну категорию — без этого заявку не собрать.",
                show_alert=True,
            )
            return
        names = [VENDOR_CATEGORIES[i] for i in indices]
        await state.update_data(categories_list=names)
        await query.message.edit_reply_markup(reply_markup=None)
        await state.set_state(VendorOnboarding.product_photos)
        await state.update_data(product_photo_urls=[])
        await query.message.answer(
            "📸 Шаг 8 — фото ассортимента\n\n"
            "Пришлите до 15 фото товаров, которые хотите показывать байерам "
            "(можно по одному или несколько в одном альбоме).\n\n"
            "💡 Чем понятнее фото — тем проще покупателю решиться на контакт.\n"
            "Когда загрузите всё нужное — нажмите «Завершить загрузку фото».",
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(
                            text="Завершить загрузку фото",
                            callback_data=CB_PHOTOS_DONE,
                        )
                    ]
                ]
            ),
        )

    @r.message(StateFilter(VendorOnboarding.product_photos), F.photo)
    async def step_product_photo(message: Message, state: FSMContext, bot: Bot) -> None:
        if not message.from_user:
            return
        uid = message.from_user.id
        async with _lock(_photo_locks, uid):
            data = await state.get_data()
            urls: list[str] = list(data.get("product_photo_urls") or [])
            if len(urls) >= 15:
                await message.answer(
                    "📎 Уже загружено максимум 15 фото.\n"
                    "Нажмите «Завершить загрузку фото», чтобы перейти дальше."
                )
                return
            try:
                body, mime = await _download_photo_jpeg(bot, message.photo[-1])
            except Exception:
                await message.answer("⚠️ Не удалось получить фото из Telegram — отправьте ещё раз.")
                return
            if len(body) > 10 * 1024 * 1024:
                await message.answer(
                    "⚠️ Это фото больше 10 МБ — пропускаем. Пришлите сжатое или другое."
                )
                return
            try:
                _, pub = repo.upload_public_image(
                    bucket,
                    message.chat.id,
                    body,
                    f"product_{len(urls) + 1}.jpg",
                    mime,
                )
            except Exception:
                await message.answer(
                    "⚠️ Не удалось сохранить фото на сервере. Попробуйте другое изображение."
                )
                return
            urls.append(pub)
            await state.update_data(product_photo_urls=urls)
            await message.answer(f"✅ Сохранено фото {len(urls)} из 15. Можете добавить ещё или завершить загрузку.")

    @r.callback_query(
        StateFilter(VendorOnboarding.product_photos), F.data == CB_PHOTOS_DONE
    )
    async def cb_photos_done(query: CallbackQuery, state: FSMContext) -> None:
        if not query.message:
            return
        data = await state.get_data()
        urls: list[str] = list(data.get("product_photo_urls") or [])
        if len(urls) < 1:
            await query.answer(
                "📷 Добавьте хотя бы одно фото товара — без этого шаг не завершить.",
                show_alert=True,
            )
            return
        await query.answer()
        await state.set_state(VendorOnboarding.container_photo)
        await query.message.answer(
            "📦 Шаг 9 — где вы отгружаете заказ\n\n"
            "Пришлите одно фото контейнера, точки или склада на рынке — "
            "так байеру проще найти вас при первой поездке.\n\n"
            "Одно фото в сообщении."
        )

    @r.message(StateFilter(VendorOnboarding.container_photo), F.photo)
    async def step_container(message: Message, state: FSMContext, bot: Bot) -> None:
        if not message.from_user:
            return
        try:
            body, mime = await _download_photo_jpeg(bot, message.photo[-1])
        except Exception:
            await message.answer(
                "⚠️ Не удалось получить фото. Отправьте изображение ещё раз."
            )
            return
        if len(body) > 10 * 1024 * 1024:
            await message.answer("⚠️ Файл больше 10 МБ — пришлите фото поменьше.")
            return
        try:
            _, pub = repo.upload_public_image(
                bucket, message.chat.id, body, "container.jpg", mime
            )
        except Exception:
            await message.answer(
                "⚠️ Ошибка сохранения фото. Попробуйте другое изображение или позже."
            )
            return
        await state.update_data(container_photo_url=pub)
        await state.set_state(VendorOnboarding.min_batch)
        await message.answer(
            "📊 Шаг 10 — минимальный заказ и отгрузка\n\n"
            "Опишите текстом минимальную партию и как вы отгружаете "
            "(например: «от 50 шт», «короб», «под заказ 3 дня»):"
        )

    @r.message(StateFilter(VendorOnboarding.container_photo))
    async def step_container_bad(message: Message) -> None:
        await message.answer(
            "⚠️ Нужно одно фото (не документ). Снимите контейнер или точку отгрузки."
        )

    @r.message(StateFilter(VendorOnboarding.min_batch), F.text)
    async def step_min_batch(message: Message, state: FSMContext) -> None:
        if not message.text:
            return
        t = message.text.strip()
        if len(t) < 1 or len(t) > 500:
            await message.answer(
                "⚠️ Текст до 500 символов — укоротите или разбейте на главное."
            )
            return
        await state.update_data(min_batch=t)
        await state.set_state(VendorOnboarding.payment)
        await message.answer(
            "💳 Шаг 11 — как вы принимаете оплату\n\n"
            "Выберите вариант кнопкой ниже (это увидят покупатели в карточке):",
            reply_markup=_payment_kb(),
        )

    @r.callback_query(StateFilter(VendorOnboarding.payment), F.data.startswith("vo:pay:"))
    async def cb_payment(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        label = {
            CB_PAY_CASH: "Наличные",
            CB_PAY_TRANSFER: "Перевод",
            CB_PAY_BOTH: "Наличные и перевод",
        }.get(query.data or "", "—")
        await state.update_data(payment_methods=label)
        await query.message.edit_reply_markup(reply_markup=None)
        await state.set_state(VendorOnboarding.delivery_help)
        await query.message.answer(
            "🚚 Шаг 12 — доставка для покупателя\n\n"
            "Помогаете ли вы организовать доставку до клиента или перевозчика "
            "(консолидация, контакты транспорта и т.п.)?\n\n"
            "Выберите «Да» или «Нет»:",
            reply_markup=_yes_no_kb(CB_DEL_Y, CB_DEL_N, "Да", "Нет"),
        )

    @r.callback_query(
        StateFilter(VendorOnboarding.delivery_help),
        F.data.in_({CB_DEL_Y, CB_DEL_N}),
    )
    async def cb_delivery(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        dh = query.data == CB_DEL_Y
        await state.update_data(delivery_help=dh)
        await query.message.edit_reply_markup(reply_markup=None)
        await state.set_state(VendorOnboarding.whatsapp_1)
        await query.message.answer(
            "💬 Шаг 13 — основной WhatsApp для покупателей\n\n"
            "Это номер, по которому байеры и оптовики будут писать вам напрямую "
            "из каталога.\n\n"
            "Отправьте контакт кнопкой ниже или введите номер текстом "
            "(можно тот же, что для входа в кабинет, если он же в WhatsApp):",
            reply_markup=_contact_kb(),
        )

    @r.message(StateFilter(VendorOnboarding.whatsapp_1), F.contact)
    async def step_wa1(message: Message, state: FSMContext) -> None:
        if not message.contact:
            return
        phone = normalize_contact_phone(message.contact.phone_number)
        if not phone:
            await message.answer(
                "⚠️ Не удалось прочитать контакт. Введите номер WhatsApp текстом "
                "или отправьте контакт ещё раз."
            )
            return
        await state.update_data(whatsapp_1=phone)
        await state.set_state(VendorOnboarding.whatsapp_2)
        await message.answer(
            "📲 Дополнительный WhatsApp (необязательно)\n\n"
            "Если есть второй номер для заказов — отправьте контакт или номер тем же способом.",
            reply_markup=_contact_kb(),
        )
        await message.answer(
            "Или нажмите «Пропустить», если второго номера нет:",
            reply_markup=_skip_kb(CB_WA2_SKIP),
        )

    @r.message(StateFilter(VendorOnboarding.whatsapp_1), F.text)
    async def step_wa1_text(message: Message, state: FSMContext) -> None:
        p = validate_phone(message.text or "")
        if not p:
            await message.answer(
                "⚠️ Нужен номер в международном виде или контакт кнопкой "
                "(как в предыдущем шаге)."
            )
            return
        await state.update_data(whatsapp_1=p)
        await state.set_state(VendorOnboarding.whatsapp_2)
        await message.answer(
            "📲 Дополнительный WhatsApp (необязательно)",
            reply_markup=_contact_kb(),
        )
        await message.answer(
            "Или «Пропустить», если один номер:",
            reply_markup=_skip_kb(CB_WA2_SKIP),
        )

    @r.message(StateFilter(VendorOnboarding.whatsapp_1))
    async def step_wa1_bad(message: Message) -> None:
        await message.answer(
            "⚠️ Отправьте контакт кнопкой или напишите номер текстом в международном формате."
        )

    @r.callback_query(StateFilter(VendorOnboarding.whatsapp_2), F.data == CB_WA2_SKIP)
    async def cb_wa2_skip(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        await state.update_data(whatsapp_2=None)
        await query.message.edit_reply_markup(reply_markup=None)
        await state.set_state(VendorOnboarding.instagram)
        await query.message.answer(
            "📷 Instagram (необязательно)\n\n"
            "Если ведёте витрину в Instagram — пришлите ссылку https://… "
            "или ник @username. Это покажем в карточке.\n\n"
            "Или нажмите «Пропустить»:",
            reply_markup=_skip_kb(CB_IG_SKIP),
        )

    @r.message(StateFilter(VendorOnboarding.whatsapp_2), F.contact)
    async def step_wa2_contact(message: Message, state: FSMContext) -> None:
        if not message.contact:
            return
        phone = normalize_contact_phone(message.contact.phone_number)
        if not phone:
            await message.answer(
                "⚠️ Контакт не распознан. Введите второй WhatsApp текстом или пропустите шаг."
            )
            return
        await state.update_data(whatsapp_2=phone)
        await state.set_state(VendorOnboarding.instagram)
        await message.answer(
            "📷 Instagram — ссылка или @username (необязательно):",
            reply_markup=ReplyKeyboardRemove(),
        )
        await message.answer(
            "Или пропустите:",
            reply_markup=_skip_kb(CB_IG_SKIP),
        )

    @r.message(StateFilter(VendorOnboarding.whatsapp_2), F.text)
    async def step_wa2_text(message: Message, state: FSMContext) -> None:
        p = validate_phone(message.text or "")
        if not p:
            await message.answer(
                "⚠️ Нужен номер текстом, контакт или «Пропустить» второй WhatsApp."
            )
            return
        await state.update_data(whatsapp_2=p)
        await state.set_state(VendorOnboarding.instagram)
        await message.answer(
            "📷 Instagram — ссылка или ник (необязательно):",
            reply_markup=_skip_kb(CB_IG_SKIP),
        )

    @r.callback_query(StateFilter(VendorOnboarding.instagram), F.data == CB_IG_SKIP)
    async def cb_ig_skip(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        await state.update_data(instagram_url=None)
        await query.message.edit_reply_markup(reply_markup=None)
        await state.set_state(VendorOnboarding.telegram_channel)
        await query.message.answer(
            "✈️ Telegram канал или чат (необязательно)\n\n"
            "Укажите ссылку t.me/… или @username вашего канала/бота для заказов.\n\n"
            "Или пропустите:",
            reply_markup=_skip_kb(CB_TG_SKIP),
        )

    @r.message(StateFilter(VendorOnboarding.instagram), F.text)
    async def step_instagram(message: Message, state: FSMContext) -> None:
        raw = (message.text or "").strip()
        if not _url_ok(raw):
            await message.answer(
                "⚠️ Нужна корректная ссылка https://… или ник вида @username"
            )
            return
        await state.update_data(instagram_url=raw)
        await state.set_state(VendorOnboarding.telegram_channel)
        await message.answer(
            "✈️ Telegram для заказов — ссылка или @username (необязательно):",
            reply_markup=_skip_kb(CB_TG_SKIP),
        )

    @r.callback_query(StateFilter(VendorOnboarding.telegram_channel), F.data == CB_TG_SKIP)
    async def cb_tg_skip(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        await state.update_data(telegram_url=None)
        await query.message.edit_reply_markup(reply_markup=None)
        await state.set_state(VendorOnboarding.samples)
        await query.message.answer(
            "🧵 Образцы перед крупным заказом\n\n"
            "Отправляете ли вы образцы ткани/товара до большой партии?\n\n"
            "Выберите «Да» или «Нет»:",
            reply_markup=_yes_no_kb(CB_SMP_Y, CB_SMP_N, "Да", "Нет"),
        )

    @r.message(StateFilter(VendorOnboarding.telegram_channel), F.text)
    async def step_tg_ch(message: Message, state: FSMContext) -> None:
        raw = (message.text or "").strip()
        if len(raw) < 3 or len(raw) > 500:
            await message.answer(
                "⚠️ Введите от 3 до 500 символов: ссылку на t.me или @username."
            )
            return
        await state.update_data(telegram_url=raw)
        await state.set_state(VendorOnboarding.samples)
        await message.answer(
            "🧵 Образцы перед крупным заказом — да или нет?",
            reply_markup=_yes_no_kb(CB_SMP_Y, CB_SMP_N, "Да", "Нет"),
        )

    @r.callback_query(
        StateFilter(VendorOnboarding.samples), F.data.in_({CB_SMP_Y, CB_SMP_N})
    )
    async def cb_samples(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        sa = query.data == CB_SMP_Y
        await state.update_data(samples_available=sa)
        await query.message.edit_reply_markup(reply_markup=None)
        await state.set_state(VendorOnboarding.returns)
        await query.message.answer(
            "↩️ Возврат брака и пересорт\n\n"
            "Укажите, работаете ли вы с возвратом некондиции и на каких условиях "
            "(это важно оптовикам).\n\n"
            "Выберите вариант кнопкой или опишите текстом условия:",
            reply_markup=_returns_kb(),
        )

    @r.callback_query(
        StateFilter(VendorOnboarding.returns), F.data.in_({CB_RET_Y, CB_RET_N})
    )
    async def cb_returns_yn(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        policy = "Да" if query.data == CB_RET_Y else "Нет"
        await state.update_data(returns_policy=policy)
        await query.message.edit_reply_markup(reply_markup=None)
        await _finalize(query.message, state, settings, repo)

    @r.callback_query(StateFilter(VendorOnboarding.returns), F.data == CB_RET_COND)
    async def cb_returns_cond(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        await query.message.edit_reply_markup(reply_markup=None)
        await state.set_state(VendorOnboarding.returns_conditions)
        await query.message.answer(
            "✍️ Опишите условия возврата брака своими словами "
            "(например: пересорт в течение 24 ч, частичный возврат и т.д.):"
        )

    @r.message(StateFilter(VendorOnboarding.returns_conditions), F.text)
    async def step_returns_text(message: Message, state: FSMContext) -> None:
        if not message.text:
            return
        t = message.text.strip()
        if len(t) < 3 or len(t) > 2000:
            await message.answer(
                "⚠️ Нужно от 3 до 2000 символов — опишите условия чуть подробнее или короче."
            )
            return
        await state.update_data(returns_policy=t)
        await _finalize(message, state, settings, repo)

    async def _finalize(
        message: Message,
        state: FSMContext,
        st: "Settings",
        rep: VendorRepository,
    ) -> None:
        uid = message.chat.id
        data = await state.get_data()
        required_keys = (
            "lang",
            "phone_number",
            "store_name",
            "location_row",
            "logo_url",
            "description",
            "categories_list",
            "product_photo_urls",
            "container_photo_url",
            "min_batch",
            "payment_methods",
            "whatsapp_1",
            "returns_policy",
        )
        for k in required_keys:
            if k == "returns_policy":
                continue
            if data.get(k) is None:
                await message.answer(
                    f"⚠️ Анкета неполная (не заполнено: {k}). Начните снова с команды /start"
                )
                await state.clear()
                return
        rp = data.get("returns_policy")
        if rp is None or (isinstance(rp, str) and not rp.strip()):
            await message.answer(
                "⚠️ Не указаны условия возврата. Начните анкету заново: /start"
            )
            await state.clear()
            return

        row = {
            "telegram_chat_id": uid,
            "language": data["lang"],
            "phone_number": data["phone_number"],
            "store_name": data["store_name"],
            "location_row": data["location_row"],
            "logo_url": data["logo_url"],
            "description": data["description"],
            "categories": data["categories_list"],
            "product_photos": data["product_photo_urls"],
            "container_photo_url": data["container_photo_url"],
            "min_batch": data["min_batch"],
            "payment_methods": data["payment_methods"],
            "delivery_help": bool(data.get("delivery_help")),
            "whatsapp_1": data["whatsapp_1"],
            "whatsapp_2": data.get("whatsapp_2"),
            "instagram_url": data.get("instagram_url"),
            "telegram_url": data.get("telegram_url"),
            "samples_available": bool(data.get("samples_available")),
            "returns_policy": data["returns_policy"],
            "status": "pending_moderation",
        }
        try:
            saved = rep.insert_vendor(row)
        except Exception as e:
            err = str(e).lower()
            if "unique" in err or "duplicate" in err:
                await message.answer(
                    "⚠️ Этот номер или профиль уже есть в базе Dordoi.help.\n"
                    "Если это ошибка — напишите в поддержку."
                )
            else:
                await message.answer(
                    "⚠️ Не удалось сохранить заявку. Попробуйте позже или напишите в поддержку."
                )
            return

        saved_row = saved if isinstance(saved, dict) else row
        phone_login = str(saved_row.get("phone_number") or row["phone_number"])
        seller_text = build_seller_confirmation_md2(phone_login, st.vendor_login_url)
        admin_text = build_admin_notification_text(
            saved_row.get("id", "?"),
            uid,
            saved_row,
            data,
        )

        try:
            await message.answer(
                seller_text,
                parse_mode=ParseMode.MARKDOWN_V2,
                reply_markup=ReplyKeyboardRemove(),
            )
        except Exception:
            _log.exception("MarkdownV2 seller message failed, sending plain text")
            await message.answer(
                "✅ Заявка принята и отправлена на модерацию.\n\n"
                f"Логин для входа на сайт: {phone_login}\n"
                f"Личный кабинет: {st.vendor_login_url}",
                reply_markup=ReplyKeyboardRemove(),
            )

        try:
            await _send_admin_text_chunks(
                message.bot, st.admin_notify_chat, admin_text
            )
        except Exception:
            _log.exception(
                "Admin notify failed (chat=%s)", st.admin_notify_chat
            )

        for aid in st.admin_telegram_ids:
            try:
                await _send_admin_text_chunks(message.bot, aid, admin_text)
            except Exception:
                _log.exception("Admin notify failed (chat_id=%s)", aid)

        _photo_locks.pop(uid, None)
        _cat_locks.pop(uid, None)
        await state.clear()

    return r
