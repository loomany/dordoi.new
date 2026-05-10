from __future__ import annotations

import asyncio
import io
import logging
import re
from typing import TYPE_CHECKING
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

from bot.photo_batch_handlers import (
    ADD_PHOTOS_BUTTON_TEXT as PHOTO_BATCH_BUTTON_TEXT,
)
from bot.repository import VendorRepository, normalize_contact_phone, validate_phone
from bot.states import VendorOnboarding
from bot.vendor_limits import (
    CATEGORY_LABEL_MAX_CHARS,
    DESCRIPTION_CARD_MAX_CHARS,
    DESCRIPTION_CARD_RECOMMENDED_CHARS,
    DESCRIPTION_DETAIL_MAX_CHARS,
    MAX_VENDOR_CATEGORIES,
    STORE_NAME_MAX_CHARS,
)

if TYPE_CHECKING:
    from bot.config import Settings

# --- Константы UI ---

CB_LANG_RU = "vo:l:ru"
CB_LANG_KG = "vo:l:kg"
CB_CAT_ANOTHER = "vo:cat:another"
CB_CAT_DONE = "vo:cat_done"
CB_PHOTOS_DONE = "vo:photos_done"
CB_PHOTOS_MORE = "vo:photos_more"
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
CB_SMP_CUSTOM = "vo:smp:custom"
CB_RET_Y = "vo:ret:y"
CB_RET_N = "vo:ret:n"
CB_RET_COND = "vo:ret:cond"
CB_DESC_DETAIL_SKIP = "vo:desc2:skip"

_STORE_NAME_STEP_PROMPT = (
    "Номер сохранён.\n\n"
    "🔤 Название для каталога — одним сообщением.\n\n"
    f"Не больше {STORE_NAME_MAX_CHARS} символов (пробелы считаются). "
    "Так название лучше помещается в шапку карточки в каталоге (обычно 1–2 строки на экране компьютера).\n\n"
    "Напишите как на вывеске или в WhatsApp: это название вашей карточки на Dordoi.help."
)

_DESCRIPTION_DETAIL_STEP_PROMPT = (
    "📄 Шаг 6 — продолжение описания (по желанию)\n\n"
    "Можно дописать текст так, будто это продолжение предыдущего сообщения "
    "(без нового заголовка «о нас»). Эту часть покажем только внутри вашего профиля на сайте — "
    "не в маленькой карточке в общем каталоге.\n\n"
    f"До {DESCRIPTION_DETAIL_MAX_CHARS} символов. Если продолжение не нужно — нажмите кнопку ниже."
)

_TELEGRAM_CHANNEL_STEP_PROMPT = (
    "✈️ Канал или чат в Telegram (необязательно)\n\n"
    "Введите ссылку на канал или чат: t.me/… или @username. Покупатель откроет её из карточки "
    "магазина в Dordoi.help и сможет посмотреть витрину и новинки до того, как напишет вам."
)

_SAMPLES_STEP_PROMPT = (
    "🧵 Минимальный заказ или пробная закупка\n\n"
    "Даёте ли покупателю возможность оформить небольшую оплачиваемую партию или мелкий тестовый заказ "
    "до крупного — чтобы проверить качество, цвет, размеры или условия отгрузки?\n\n"
    "«Да» — если такую опцию предлагаете; «Нет» — если работаете только от полной партии; "
    "«Свой вариант» — распишите условия одним сообщением."
)

_RETURNS_STEP_PROMPT = (
    "↩️ Как вы работаете с браком\n\n"
    "После отгрузки: принимаете ли претензии по браку и некондиции и что делаете в таких случаях "
    "(замена, возврат, срок обращения). Это покажем покупателям в карточке магазина.\n\n"
    "«Да» — работаете с браком по понятным правилам; «Нет» — претензии по браку не принимаете; "
    "«Условия (текстом)» — распишите политику одним сообщением."
)

_photo_locks: dict[int, asyncio.Lock] = {}
_log = logging.getLogger(__name__)

# MarkdownV2: символы, которые нужно экранировать в тексте сущности
_MD2_SPECIAL = frozenset("_*[]()~`>#+-=|{}.!")


def md2_escape(text: str) -> str:
    return "".join(("\\" + c if c in _MD2_SPECIAL else c) for c in text)


def _login_display_e164(raw: str) -> str:
    """Логин для экрана продавца: в БД только цифры — показываем как телефон с «+»."""
    s = (raw or "").strip()
    if s.startswith("+"):
        return s
    digits = re.sub(r"\D", "", s)
    return f"+{digits}" if digits else s


def build_seller_confirmation_md2(phone: str, cabinet_url: str) -> str:
    """Итоговое сообщение продавцу (MarkdownV2)."""
    p = md2_escape(_login_display_e164(phone))
    u = md2_escape(cabinet_url.strip().rstrip("/"))
    link_title = md2_escape("Открыть кабинет")
    return (
        "*Ваша заявка принята\\!*\n"
        "Ожидает модерации\\.\n\n"
        f"Ваш логин для входа: {p}\n"
        f"Ссылка на кабинет: [{link_title}]({u})"
    )


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


def _contact_kb() -> ReplyKeyboardMarkup:
    return ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="📱 Поделиться контактом", request_contact=True)]
        ],
        resize_keyboard=True,
        one_time_keyboard=True,
    )


def _product_photos_kb(saved_count: int) -> InlineKeyboardMarkup:
    """После каждого сохранённого фото — действия внизу чата, без прокрутки наверх."""
    rows: list[list[InlineKeyboardButton]] = []
    if saved_count < 15:
        rows.append(
            [
                InlineKeyboardButton(
                    text="Добавить ещё фото",
                    callback_data=CB_PHOTOS_MORE,
                )
            ]
        )
    rows.append(
        [
            InlineKeyboardButton(
                text="Завершить загрузку фото",
                callback_data=CB_PHOTOS_DONE,
            )
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def _categories_more_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="➕ Ещё одну категорию",
                    callback_data=CB_CAT_ANOTHER,
                ),
                InlineKeyboardButton(
                    text="✅ Продолжить к фото",
                    callback_data=CB_CAT_DONE,
                ),
            ],
        ]
    )


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


def _samples_kb() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="Да", callback_data=CB_SMP_Y),
                InlineKeyboardButton(text="Нет", callback_data=CB_SMP_N),
            ],
            [
                InlineKeyboardButton(
                    text="Свой вариант (текстом)",
                    callback_data=CB_SMP_CUSTOM,
                )
            ],
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


async def _advance_vendor_to_product_photos(message: Message, state: FSMContext) -> None:
    """После категорий — шаг загрузки фото товаров."""
    await state.set_state(VendorOnboarding.product_photos)
    await state.update_data(product_photo_urls=[])
    await message.answer(
        "📸 Шаг 8 — фото ассортимента\n\n"
        "Пришлите до 15 фото товаров, которые хотите показывать покупателям "
        "(можно по одному или несколько в одном альбоме).\n\n"
        "💡 Чем понятнее фото — тем проще покупателю решиться на контакт.\n"
        "Когда загрузите всё нужное — нажмите «Завершить загрузку фото».",
        reply_markup=_product_photos_kb(0),
    )


async def _prompt_vendor_categories(message: Message, state: FSMContext) -> None:
    """Переход к вводу категорий после описания / продолжения описания."""
    await state.update_data(categories_list=[])
    await state.set_state(VendorOnboarding.categories)
    lim = CATEGORY_LABEL_MAX_CHARS
    await message.answer(
        "🏷️ Шаг 7 — категории товаров\n\n"
        "Список **придумываете вы сами** — так его увидят покупатели в карточке магазина "
        "(первая строка списка часто показывается под названием в каталоге).\n\n"
        "**Как заполнить, по шагам:**\n"
        f"1️⃣ Отправьте **одно название категории одним сообщением** — без фото и файлов, "
        f"просто текст. Длина одной строки — **от 1 до {lim} символов** "
        "(пробелы считаются; лучше коротко и по делу).\n"
        "2️⃣ Я сохраню строку и покажу, что уже в списке. Дальше можно:\n"
        "   • отправить **ещё одно сообщение** с названием следующей категории, **или**\n"
        "   • нажать кнопку **«➕ Ещё одну категорию»** — если так удобнее, а потом тоже прислать текст;\n"
        "   • нажать **«✅ Продолжить к фото»**, когда категорий достаточно.\n"
        f"3️⃣ Всего можно добавить **не больше {MAX_VENDOR_CATEGORIES} категорий**.\n\n"
        "**Важно:** не перечисляйте несколько категорий в одном сообщении через запятую — "
        "так легко ошибиться. Пишите **по одной строке за раз** — я каждую сохраню отдельно.\n\n"
        "👉 **Сейчас пришлите первую категорию** одним сообщением (пример: «Женская одежда опт»)."
    )


async def _complete_vendor_logo_step(
    message: Message,
    state: FSMContext,
    repo: VendorRepository,
    bucket: str,
    body: bytes,
    mime: str,
    filename_hint: str,
) -> None:
    """Сохраняет логотип в Storage и переводит на шаг описания; при ошибке отвечает в чат."""
    uid = message.chat.id
    if len(body) > 10 * 1024 * 1024:
        await message.answer("⚠️ Файл больше 10 МБ — сожмите фото или пришлите другое.")
        return
    try:
        _, pub = repo.upload_public_image(
            bucket, uid, body, filename_hint, mime
        )
    except Exception:
        _log.exception(
            "vendor logo upload failed chat_id=%s filename=%s mime=%s bytes=%s",
            uid,
            filename_hint,
            mime,
            len(body),
        )
        await message.answer(
            "⚠️ Не удалось сохранить файл на сервере. Попробуйте через минуту или другое фото."
        )
        return
    await state.update_data(logo_url=pub)
    await state.set_state(VendorOnboarding.description)
    await message.answer(
        "📝 Шаг 5 — описание для каталога\n\n"
        "Этот текст покажем в карточке магазина в общем каталоге — то, что покупатель видит "
        "снаружи, до перехода к полному профилю.\n\n"
        f"От 5 до {DESCRIPTION_CARD_MAX_CHARS} символов. Ориентир для аккуратного макета карточки — "
        f"до ~{DESCRIPTION_CARD_RECOMMENDED_CHARS} символов; длиннее текст на сайте может сильнее "
        "обрезаться в превью каталога.\n\n"
        "Пишите просто: чем торгуете, для кого, без лишней воды.\n\n"
        "Следующим шагом можно добавить продолжение — оно будет только внутри профиля на сайте."
    )


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


def _manual_phone_invalid_hint(raw: str) -> str:
    """Пояснение при отказе: без «+», неверная длина и т.п. (совпадает с lib/phone.ts)."""
    s = raw.strip()
    tail = (
        "Формат должен совпадать с входом по коду на сайте Dordoi.help "
        "(те же цифры, что для SMS или WhatsApp)."
    )
    if not s.startswith("+"):
        return (
            "⚠️ Начните строку с символа «+», затем код страны и номер без других знаков, "
            "например +7 778 816 6661 или +996 555 123456.\n\n" + tail
        )
    d = _phone_digits_for_storage(s)
    if d.startswith("7") and len(d) != 11:
        return (
            "⚠️ Для кода +7 нужно ровно 11 цифр в номере целиком "
            "(семёрка страны и ещё десять цифр абонента).\n\n"
            f"Сейчас получилось {len(d)} цифр — чаще всего одна цифра лишняя или недостаёт. "
            "Сверьтесь с номером в WhatsApp.\n\n" + tail
        )
    if any(d.startswith(p) for p in ("996", "998", "992")) and len(d) != 12:
        return (
            "⚠️ Для +996, +998 или +992 всего должно быть 12 цифр "
            "(код страны три цифры и девять цифр номера).\n\n"
            f"Сейчас получилось {len(d)} цифр.\n\n" + tail
        )
    return (
        "⚠️ Номер не подходит под поддерживаемые страны (+7, +996, +998, +992) "
        "или в нём ошибка.\n\n" + tail
    )


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
            if st == "approved":
                await message.answer(
                    "✅ Ваша карточка опубликована в Dordoi.help.\n\n"
                    "Чтобы добавить новые фото товаров — нажмите кнопку ниже. "
                    "Партия пройдёт модерацию и появится в карточке отдельным "
                    "блоком с датой загрузки.",
                    reply_markup=ReplyKeyboardMarkup(
                        keyboard=[[KeyboardButton(text=PHOTO_BATCH_BUTTON_TEXT)]],
                        resize_keyboard=True,
                        is_persistent=True,
                        input_field_placeholder=(
                            "Нажмите «Добавить фото товаров» или /start"
                        ),
                    ),
                )
                return
            if st == "pending_moderation":
                await message.answer(
                    "⏳ Анкета на модерации. Когда админ её опубликует, мы пришлём сюда "
                    "уведомление и дадим кнопку «📸 Добавить фото товаров»."
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
        await query.message.edit_reply_markup(reply_markup=None)
        await state.set_state(VendorOnboarding.phone)
        await query.message.answer(
            "📱 Шаг 1 — номер для входа в кабинет продавца на сайте Dordoi.help\n\n"
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
            await message.answer(_manual_phone_invalid_hint(message.text.strip()))
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
        if len(name) < 2 or len(name) > STORE_NAME_MAX_CHARS:
            await message.answer(
                f"⚠️ Название должно быть от 2 до {STORE_NAME_MAX_CHARS} символов "
                "(шапка карточки в каталоге). "
                "Отправьте название ещё раз одной строкой."
            )
            return
        await state.update_data(store_name=name)
        await state.set_state(VendorOnboarding.location_row)
        await message.answer(
            "📍 Шаг 3 — где вас искать на Дордое\n\n"
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
            "🖼️ Шаг 4 — логотип для карточки магазина\n\n"
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
            _log.exception("telegram photo download failed chat_id=%s", uid)
            await message.answer(
                "⚠️ Не удалось получить фото из Telegram. Отправьте картинку ещё раз."
            )
            return
        await _complete_vendor_logo_step(
            message, state, repo, bucket, body, mime, "logo.jpg"
        )

    @r.message(StateFilter(VendorOnboarding.logo), F.document)
    async def step_logo_document(message: Message, state: FSMContext, bot: Bot) -> None:
        """Фото как «файл» (document) без сжатия — у многих клиентов так уходит в Telegram."""
        if not message.from_user or not message.document:
            return
        doc = message.document
        if doc.file_size and doc.file_size > 10 * 1024 * 1024:
            await message.answer("⚠️ Файл больше 10 МБ — сожмите фото или пришлите другое.")
            return
        mime = (doc.mime_type or "").strip().lower()
        if not mime.startswith("image/"):
            await message.answer(
                "⚠️ Нужна картинка (JPG, PNG или WebP). PDF и другие типы файлов на этом шаге не принимаем."
            )
            return
        uid = message.chat.id
        try:
            buf = io.BytesIO()
            await bot.download(doc, destination=buf)
            body = buf.getvalue()
        except Exception:
            _log.exception("telegram document download failed chat_id=%s", uid)
            await message.answer(
                "⚠️ Не удалось получить файл из Telegram. Отправьте картинку ещё раз."
            )
            return
        ext = "jpg"
        if "png" in mime:
            ext = "png"
        elif "webp" in mime:
            ext = "webp"
        await _complete_vendor_logo_step(
            message,
            state,
            repo,
            bucket,
            body,
            doc.mime_type or "image/jpeg",
            f"logo.{ext}",
        )

    @r.message(StateFilter(VendorOnboarding.logo))
    async def step_logo_bad(message: Message) -> None:
        await message.answer(
            "⚠️ Пришлите логотип как фото (камера/галерея) или как файл-картинку JPG/PNG/WebP. "
            "Если Telegram отправляет только как файл — так тоже можно (мы принимаем и документ с типом image/*)."
        )

    @r.message(StateFilter(VendorOnboarding.description), F.text)
    async def step_description(message: Message, state: FSMContext) -> None:
        if not message.text:
            return
        desc = message.text.strip()
        if len(desc) < 5 or len(desc) > DESCRIPTION_CARD_MAX_CHARS:
            await message.answer(
                f"⚠️ Это описание должно быть от 5 до {DESCRIPTION_CARD_MAX_CHARS} символов "
                "(оно идёт в карточку каталога). Добавьте пару предложений или сократите текст."
            )
            return
        await state.update_data(description=desc)
        await state.set_state(VendorOnboarding.description_detail)
        await message.answer(
            _DESCRIPTION_DETAIL_STEP_PROMPT,
            reply_markup=InlineKeyboardMarkup(
                inline_keyboard=[
                    [
                        InlineKeyboardButton(
                            text="Без продолжения — дальше",
                            callback_data=CB_DESC_DETAIL_SKIP,
                        )
                    ]
                ]
            ),
        )

    @r.message(StateFilter(VendorOnboarding.description), ~F.text)
    async def step_description_bad(message: Message) -> None:
        await message.answer(
            "⚠️ На этом шаге нужно текстовое описание одним сообщением, без фото и стикеров."
        )

    @r.callback_query(
        StateFilter(VendorOnboarding.description_detail),
        F.data == CB_DESC_DETAIL_SKIP,
    )
    async def cb_description_detail_skip(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        try:
            await query.message.edit_reply_markup(reply_markup=None)
        except Exception:
            pass
        await state.update_data(description_detail=None)
        await _prompt_vendor_categories(query.message, state)

    @r.message(StateFilter(VendorOnboarding.description_detail), F.text)
    async def step_description_detail(message: Message, state: FSMContext) -> None:
        if not message.text:
            return
        extra = message.text.strip()
        if len(extra) < 5:
            await message.answer(
                "⚠️ Продолжение — хотя бы 5 символов, или нажмите «Без продолжения — дальше»."
            )
            return
        if len(extra) > DESCRIPTION_DETAIL_MAX_CHARS:
            await message.answer(
                f"⚠️ Слишком длинно — максимум {DESCRIPTION_DETAIL_MAX_CHARS} символов. "
                "Сократите или разделите мысль."
            )
            return
        await state.update_data(description_detail=extra)
        await _prompt_vendor_categories(message, state)

    @r.message(StateFilter(VendorOnboarding.description_detail))
    async def step_description_detail_bad(message: Message) -> None:
        await message.answer(
            "⚠️ Отправьте продолжение текстом или нажмите «Без продолжения — дальше»."
        )

    @r.callback_query(
        StateFilter(VendorOnboarding.categories),
        F.data == CB_CAT_ANOTHER,
    )
    async def cb_cat_another(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        try:
            await query.message.edit_reply_markup(reply_markup=None)
        except Exception:
            pass
        lim = CATEGORY_LABEL_MAX_CHARS
        await query.message.answer(
            f"Хорошо. Пришлите **следующую категорию** одним сообщением "
            f"(до {lim} символов)."
        )

    @r.callback_query(
        StateFilter(VendorOnboarding.categories), F.data == CB_CAT_DONE
    )
    async def cb_cat_done(query: CallbackQuery, state: FSMContext) -> None:
        if not query.message:
            return
        data = await state.get_data()
        cats: list[str] = list(data.get("categories_list") or [])
        if not cats:
            await query.answer(
                "Нужна хотя бы одна категория. Напишите название одним сообщением.",
                show_alert=True,
            )
            return
        await query.answer()
        try:
            await query.message.edit_reply_markup(reply_markup=None)
        except Exception:
            pass
        await _advance_vendor_to_product_photos(query.message, state)

    @r.message(StateFilter(VendorOnboarding.categories), F.text)
    async def step_categories_text(message: Message, state: FSMContext) -> None:
        if not message.text:
            return
        line = " ".join(message.text.split()).strip()
        if not line:
            await message.answer(
                "⚠️ Пустое сообщение. Напишите **название категории** одной строкой."
            )
            return
        if len(line) > CATEGORY_LABEL_MAX_CHARS:
            await message.answer(
                f"⚠️ Слишком длинно для одной категории (максимум {CATEGORY_LABEL_MAX_CHARS} символов). "
                "Сократите или разбейте на две категории — **вторым сообщением**."
            )
            return
        data = await state.get_data()
        cats: list[str] = list(data.get("categories_list") or [])
        if len(cats) >= MAX_VENDOR_CATEGORIES:
            await message.answer(
                f"📌 Уже сохранено максимум {MAX_VENDOR_CATEGORIES} категорий. "
                "Нажмите **«Продолжить к фото»**, чтобы перейти к следующему шагу.",
                reply_markup=_categories_more_kb(),
            )
            return
        cats.append(line)
        await state.update_data(categories_list=cats)
        numbered = "\n".join(f"  {i + 1}) {c}" for i, c in enumerate(cats))
        if len(cats) >= MAX_VENDOR_CATEGORIES:
            await message.answer(
                f"✅ Сохранено: «{line}»\n\n"
                f"Список полный (**{MAX_VENDOR_CATEGORIES}** из {MAX_VENDOR_CATEGORIES}):\n{numbered}\n\n"
                "Переходим к загрузке фото товаров."
            )
            await _advance_vendor_to_product_photos(message, state)
            return
        await message.answer(
            f"✅ Сохранено: «{line}»\n\n"
            f"Сейчас в списке **{len(cats)}** из {MAX_VENDOR_CATEGORIES}:\n{numbered}\n\n"
            "**Что дальше?**\n"
            "• Нужна ещё одна категория — отправьте **ещё одно сообщение** с названием "
            "(или нажмите **«Ещё одну категорию»** — и потом пришлите текст).\n"
            "• Категорий достаточно — нажмите **«Продолжить к фото»**.",
            reply_markup=_categories_more_kb(),
        )

    @r.message(StateFilter(VendorOnboarding.categories))
    async def step_categories_bad(message: Message) -> None:
        await message.answer(
            "⚠️ На этом шаге пришлите **название категории текстом** — одним сообщением, "
            "без фото, стикеров и файлов."
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
                    "Нажмите «Завершить загрузку фото», чтобы перейти дальше.",
                    reply_markup=_product_photos_kb(15),
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
            await message.answer(
                f"✅ Сохранено фото {len(urls)} из 15. Можете добавить ещё или завершить загрузку.",
                reply_markup=_product_photos_kb(len(urls)),
            )

    @r.callback_query(
        StateFilter(VendorOnboarding.product_photos), F.data == CB_PHOTOS_MORE
    )
    async def cb_photos_more_hint(query: CallbackQuery, state: FSMContext) -> None:
        data = await state.get_data()
        urls: list[str] = list(data.get("product_photo_urls") or [])
        left = 15 - len(urls)
        if left <= 0:
            await query.answer(
                "Уже 15 фото — завершите загрузку кнопкой ниже.",
                show_alert=True,
            )
            return
        await query.answer(
            f"Отправьте следующее фото сообщением в чат. Ещё можно до {left} шт.",
            show_alert=True,
        )

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
            "Пришлите одно фото контейнера, точки или склада на рынке (одно сообщение — одно фото) — "
            "чтобы покупателю было проще найти вас при первой поездке."
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
            "Это номер, по которому покупатели и оптовики будут писать вам напрямую "
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
            _TELEGRAM_CHANNEL_STEP_PROMPT + "\n\nИли пропустите:",
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
            _TELEGRAM_CHANNEL_STEP_PROMPT,
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
            _SAMPLES_STEP_PROMPT,
            reply_markup=_samples_kb(),
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
            _SAMPLES_STEP_PROMPT,
            reply_markup=_samples_kb(),
        )

    @r.callback_query(StateFilter(VendorOnboarding.samples), F.data == CB_SMP_CUSTOM)
    async def cb_samples_custom_start(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        await query.message.edit_reply_markup(reply_markup=None)
        await state.set_state(VendorOnboarding.samples_custom)
        await query.message.answer(
            "✍️ Опишите своими словами: даёте ли мелкую оплачиваемую партию для проверки и на каких "
            "условиях (или почему нет) — одним сообщением, до 500 символов."
        )

    @r.callback_query(
        StateFilter(VendorOnboarding.samples), F.data.in_({CB_SMP_Y, CB_SMP_N})
    )
    async def cb_samples(query: CallbackQuery, state: FSMContext) -> None:
        await query.answer()
        if not query.message:
            return
        sa = query.data == CB_SMP_Y
        await state.update_data(samples_available=sa, samples_note=None)
        await query.message.edit_reply_markup(reply_markup=None)
        await state.set_state(VendorOnboarding.returns)
        await query.message.answer(
            _RETURNS_STEP_PROMPT,
            reply_markup=_returns_kb(),
        )

    @r.message(StateFilter(VendorOnboarding.samples_custom), F.text)
    async def step_samples_custom(message: Message, state: FSMContext) -> None:
        if not message.text:
            return
        t = message.text.strip()
        if len(t) < 3 or len(t) > 500:
            await message.answer(
                "⚠️ Нужно от 3 до 500 символов — чуть подробнее или короче одним сообщением."
            )
            return
        await state.update_data(samples_available=True, samples_note=t)
        await state.set_state(VendorOnboarding.returns)
        await message.answer(
            _RETURNS_STEP_PROMPT,
            reply_markup=_returns_kb(),
        )

    @r.message(StateFilter(VendorOnboarding.samples_custom))
    async def step_samples_custom_bad(message: Message) -> None:
        await message.answer("⚠️ Нужен текст одним сообщением (не фото и не стикер).")

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
            "✍️ Опишите своими словами политику по браку: замена, возврат средств, срок, "
            "в каких случаях принимаете претензию после отгрузки."
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

        cats_list = data.get("categories_list")
        if not isinstance(cats_list, list) or len(cats_list) == 0:
            await message.answer(
                "⚠️ Не указаны категории товаров. Начните анкету заново: /start"
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
            "description_detail": data.get("description_detail"),
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
            "samples_note": data.get("samples_note"),
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
                f"Логин для входа на сайт: {_login_display_e164(phone_login)}\n"
                f"Личный кабинет: {st.vendor_login_url}",
                reply_markup=ReplyKeyboardRemove(),
            )

        _photo_locks.pop(uid, None)
        await state.clear()

    return r
