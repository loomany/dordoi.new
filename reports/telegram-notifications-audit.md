# Telegram notifications audit — Dordoi.help (read-only)

**Дата аудита:** 2026-05-13  
**Область:** только чтение кода и локальных артефактов репозитория; Railway/браузер без доступа — помечено отдельно.

---

## 1. Executive summary

В проекте действительно **два контура**: (A) **Site / Next.js** — админ-аналитика через `DORDOI_ADMIN_TELEGRAM_*` и HTTP `sendMessage`; (B) **Python bot (aiogram)** — long polling, те же механики Telegram API для пользователя и админа, env `TELEGRAM_BOT_TOKEN`, Supabase и т.д.

**Визиты и hot-clicks на сайте:** логика в коде согласована (трекер → `POST` → маскировка IP из заголовков → `sendMessage`). **Подтвердить доставку в проде без деплоя/логов Railway нельзя.**

**Регистрация покупателя на сайте (`complete-registration`):** после **Step 1E** вызывается `notifyDordoiSiteRegistrationCompleted` через `DORDOI_ADMIN_TELEGRAM_*` только после **успешного** входа (`session`), с маскировкой email/phone. Атрибуция (first touch / UTM) в этом шаге **не передаётся** — см. `reports/dordoi-admin-telegram-analytics-stage1.md` § Step 1E.

**Python bot admin notify:** реализовано на `/start` (новый онбординг) и после успешного сохранения анкеты в БД; при уже **approved** или **pending_moderation** повторный `/start` **не шлёт** admin notify. Успешная отправка **не логируется** на INFO; ошибки — да (`exception` / `warning` при пустых получателях).

**Конфликт polling одного токена:** если **один и тот же** бот-токен используется и на **Site** только для `sendMessage`, и на **Bot** для `start_polling`, конфликта **нет**. Риск `TelegramConflictError` — **два процесса с polling** или webhook + polling на том же токене. В Next.js **нет** `getUpdates` / polling для админ-бота.

---

## 2. Site service Telegram notifications status

| Компонент | Статус |
|-----------|--------|
| Загрузка env | `DORDOI_ADMIN_TELEGRAM_ENABLED`, `DRY_RUN`, `BOT_TOKEN`, `CHAT_IDS`, `MIN_INTERVAL_SECONDS`, `DORDOI_ANALYTICS_DEBUG` — явно в `lib/dordoi/analytics/env.ts` |
| Отправка | Только `fetch` к `https://api.telegram.org/bot…/sendMessage` в `sendDordoiAdminTelegram.ts` |
| Аналитика визитов / CTA | Через `POST` `app/api/dordoi/analytics/event/route.ts` + форматтер `telegramFormatter.ts` |
| Модерация вендоров (сайт) | Отдельный HTML в `leadNotifications.ts` после успешного `update` в `vendor-moderation.ts` |

**Отдельно (не DORDOI_ADMIN):** `lib/telegram/notify-vendor-approved.ts` и `notify-photo-batch.ts` используют **`TELEGRAM_BOT_TOKEN`** для сообщений **продавцу** (не админ-дашборд аналитики).

---

## 3. Bot service Telegram notifications status

| Компонент | Статус |
|-----------|--------|
| Старт | `python -m bot` / `python3 -m bot` → `bot/__main__.py` → `bot/main.py` |
| Polling | `delete_webhook` затем `dp.start_polling(bot)` |
| Admin | `bot/admin_notify.py` — `notify_admins_html`; получатели из `ADMIN_NOTIFY_CHAT` и/или `TELEGRAM_ADMIN_IDS` / `ADMIN_TELEGRAM_IDS` |
| События | `/start` (ветка нового онбординга) и сохранение анкеты в `vendor_handlers.py` |

Обязательные env для **старта** бота по `config.py`: `TELEGRAM_BOT_TOKEN`, `SUPABASE_URL` или `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, плюс `NEXT_PUBLIC_APP_URL` или `VENDOR_LOGIN_URL`.

---

## 4. Env checklist: Site service

| Переменная | Назначение по коду |
|------------|-------------------|
| `DORDOI_ADMIN_TELEGRAM_ENABLED=1` | Единственное значение, при котором `enabled === true` (иначе полный skip с `skippedReason: "disabled"`). |
| `DORDOI_ADMIN_TELEGRAM_DRY_RUN=1` | `dryRun === true`: **нет** HTTP к Telegram; при `DORDOI_ANALYTICS_DEBUG=1` печатается срез HTML в консоль. |
| `DORDOI_ADMIN_TELEGRAM_DRY_RUN=0` или unset | `dryRun === false`: при наличии токена и chat ids выполняется реальная отправка. |
| `DORDOI_ADMIN_TELEGRAM_BOT_TOKEN` | **Именно эта** переменная читается для админ-аналитики (не `TELEGRAM_BOT_TOKEN` в `env.ts`). |
| `DORDOI_ADMIN_TELEGRAM_CHAT_IDS` | Список через запятую; числа → `number`, иначе строка. |
| `DORDOI_ADMIN_TELEGRAM_MIN_INTERVAL_SECONDS` | Минимум между отправками **в один и тот же** `chat_id` (per-process in-memory map). По умолчанию 60. |
| `DORDOI_ANALYTICS_DEBUG=1` | Доп. логи `[dordoi-analytics]` в route и dry-run preview в sender. |

**В отчёте значения:** в репозитории секретов нет — в проде проверять вручную: **present / missing** (токены не печатать).

---

## 5. Env checklist: Bot service

| Переменная | Читает `bot/config.py` | Обязательность |
|------------|------------------------|----------------|
| `TELEGRAM_BOT_TOKEN` | Да | Обязательна (иначе `RuntimeError` при load) |
| `SUPABASE_URL` | Да, fallback `NEXT_PUBLIC_SUPABASE_URL` | Обязательна |
| `SUPABASE_SERVICE_ROLE_KEY` | Да | Обязательна |
| `TELEGRAM_ADMIN_IDS` или `ADMIN_TELEGRAM_IDS` | Да (`admin_telegram_ids`) | Опционально для admin notify (но тогда нужен `ADMIN_NOTIFY_CHAT` или будет warning и skip) |
| `ADMIN_NOTIFY_CHAT` | Да | Опционально; если пусто — только numeric admin ids |
| `NEXT_PUBLIC_APP_URL` / `VENDOR_LOGIN_URL` | Да | Нужна хотя бы одна логика для `vendor_login_url` |
| `VENDOR_MEDIA_BUCKET` | Да (default `vendor-media`) | Опционально |
| `DORDOI_ADMIN_TELEGRAM_*` | Нет | **Не используются** ботом |

**В репозитории не найдено:** `AUTH_REGISTRATION_SECRET` в `bot/`; переменные **`RAILPACK_*`** нигде в коде не задаются — если используются, это только конфигурация Railway UI (проверять в панели).

---

## 6. Conflict / polling analysis

| Вопрос | Ответ по коду |
|--------|----------------|
| Python bot делает polling? | **Да** — `await dp.start_polling(bot)` в `bot/main.py`. Перед этим `await bot.delete_webhook(drop_pending_updates=False)`. |
| Site admin analytics делает polling / getUpdates? | **Нет** — только POST `sendMessage` в `sendDordoiAdminTelegram.ts`. |
| Next.js `getUpdates` / webhook для того же контура? | **Не найдено** для Dordoi admin Telegram. |
| Конфликт одного токена Site sendMessage + Bot polling? | **Нет** при одном процессе polling и отправке только `sendMessage` с тем же токеном (типичная схема). |
| Когда будет `TelegramConflictError`? | Два (или более) процесса с **long polling** на одном токене; либо активный webhook, забирающий апдейты. В `main.py` есть комментарий про остановку лишнего инстанса на Railway. |

**Право на polling:** только **Python bot service**. **Site:** только исходящие **sendMessage** (и отдельно — `TELEGRAM_BOT_TOKEN` в `notify-vendor-approved` / photo batch — тоже только send, без polling).

---

## 7. Event matrix

| Событие / поток | Источник | Уходит в Dordoi admin Telegram (`DORDOI_ADMIN_*`)? | Примечание |
|-----------------|----------|-----------------------------------------------------|------------|
| `first_visit` | Клиент `DordoiAnalyticsTracker` | Да, если не бот, не stage1-skip, не disabled/dry-run/config, не rate limit | Бот: `skippedReason: "bot_skipped"`. Клиент: флаг в `sessionStorage` + серверный rate limit 30 мин на `sessionId`. |
| `whatsapp_click` / `telegram_click` / `phone_click` / `contact_click` | Клики по ссылкам / `data-analytics-event` | Да (subject to rate limit CTA 5 мин) | |
| `catalog_open` / `seller_profile_view` / `seller_registration_started` | API допускает, трекер шлёт только `seller_registration_started` для skip path? | Трекер шлёт `seller_registration_started` при клике с `data-analytics-event` | Endpoint: **`sent: false`**, `event_not_broadcast_stage1` **до** Telegram. |
| `seller_registration_submitted` | Не из `DordoiAnalyticsTracker` | Поддержано API + форматтер | В репозитории **нет** клиентского вызова с этим типом (только схема route). |
| Site buyer registration complete | `app/api/auth/complete-registration/route.ts` | **Да** (`notifyDordoiSiteRegistrationCompleted` после успешного sign-in) | Маскированные PII; attribution пока `unknown` без отдельного этапа. |
| `vendor_approved` / `vendor_rejected` | Теоретически POST в API; фактически **сайт** шлёт через `leadNotifications` из `vendor-moderation.ts` | Да, отдельный HTML; dedupe 30 мин `vendorId+status` | Путь модерации не использует `formatDordoiAdminAnalyticsHtml` для модерации — свой HTML в `leadNotifications.ts`. |
| Bot `/start` (новый онбординг) | Python | **Нет** (другой контур) | Admin: `notify_admins_html` с `TELEGRAM_BOT_TOKEN`. |
| Bot анкета сохранена | Python после `insert_vendor` | **Нет** | Admin notify HTML с магазином / телефоном (см. security). |

---

## 8. What works now (по коду)

- Цепочка Site: трекер → `POST` → валидация zod → IP из headers → `maskIp` → классификация канала → условный Telegram.
- `ENABLED=0` (не `"1"`): уведомления админ-аналитики **выключены**.
- `DRY_RUN=1`: **без** сетевого вызова к Telegram (кроме debug print при `DEBUG=1`).
- Ошибки Telegram API: логируются, endpoint возвращает **`ok: true`**, `sent: false` — **не бросает** наружу.
- Модерация: `notifyDordoiVendorModerationStatusChanged` после успешного `update`; ошибки **catch** и не ломают `updateVendorStatus` return.
- Bot: polling + admin notify на `/start` (не для approved/pending) и после успешного save.

---

## 9. What does not work now / gaps

- **«Кто зарегистрировался на сайте»** в Dordoi admin Telegram — **подключено** (Step 1E): хук в `complete-registration` после успешной сессии; без first-touch attribution в теле запроса.
- **`seller_registration_submitted`** в Telegram из текущего клиента **не отправляется** (трекер не постит этот тип).
- **`missing_config`** как строка `skippedReason` в коде **не используется**; вместо этого `missing_token_or_chats`, `telegram_all_failed_or_throttled`, `validation_error`, `notify_error` и др.
- Успешная admin-delivery в Python **`notify_admins_html`** не пишет INFO «sent ok» — только failures.

---

## 10. What cannot be verified without Railway / browser

- Фактическая доставка сообщений в чаты админов.
- Значения env в проде (только present/missing).
- Логи Railway: `Settings loaded`, `Start polling`, отсутствие `ModuleNotFoundError: aiogram`, отсутствие `python3: command not found`.
- Реальный `NIXPACKS_CONFIG_FILE` и Start Command на сервисе Bot.
- Поведение Cloudflare / прокси для `cf-connecting-ip` / `x-forwarded-for`.

---

## 11. Security notes

- В отчёте **нет** токенов и ключей; при ручной проверке маскировать: `abc123…xyz`.
- `sendDordoiAdminTelegram` логирует **только** статус и **обрезанный** ответ API (до 500 символов), не полный токен в URL в логах ошибки — но URL в fetch содержит токен (стандарт Telegram API); важно не логировать полный request URL внешними прокси.
- `service_role` и пароли в analytics **не передаются** в JSON тела трекера (strict schema).
- Python admin notify при сабмите анкеты включает **телефон** в HTML (`<code>`) — это PII в админский чат; осознанный выбор продукта, не смешивать с публичными каналами.

---

## 12. Exact next fixes (план только; код не менять в этом аудите)

1. **Регистрация сайта → Telegram (attribution):** опционально расширить тело `complete-registration` или отдельный store для first touch / UTM (отдельный approve).
2. **События заявок с сайта:** если нужны `seller_registration_submitted` / `buyer_request_submitted` — клиентские или server actions должны **`POST`** на тот же endpoint с нужными полями (сейчас трекер их не шлёт).
3. **Согласование имён skippedReason:** при желании унифицировать документацию под фактические строки в `route.ts` и `sendDordoiAdminTelegram.ts`.
4. **Railway Bot:** убедиться, что на Bot заданы `NIXPACKS_CONFIG_FILE=bot/nixpacks.toml` и старт `python3 -m bot` с корня репо (см. `reports/railway-bot-python-nixpacks.md`).

---

## 13. Confirmation (audit-only)

- **Код не менялся** (кроме добавления/обновления этого отчёта по явному запросу п.12 ТЗ).
- **`.env` / `.env.example` не менялись.**
- **package.json / lockfile не менялись.**
- **Миграции / RLS / БД не менялись.**
- **commit / push не выполнялись.**

---

## Appendix A — Карта файлов (таблица ТЗ)

| file path | контур | что делает | какие env | риск | работает / проверить |
|-----------|--------|------------|-----------|------|----------------------|
| `lib/dordoi/analytics/sendDordoiAdminTelegram.ts` | Site | `sendMessage` HTML, per-chat min interval, dry-run | `DORDOI_ADMIN_TELEGRAM_*`, `DORDOI_ANALYTICS_DEBUG` | In-memory rate map сбрасывается при рестарте инстанса | Логика ок; прод — smoke |
| `lib/dordoi/analytics/env.ts` | Site | Парсинг admin Telegram env | см. выше | `ENABLED` только строго `1` | Ок |
| `lib/dordoi/analytics/telegramFormatter.ts` | Site | HTML для типов событий | — | Fallback-блок для «не stage1» типов всё же может отправить generic текст, если событие пройдёт фильтры | Ок для штатных путей |
| `lib/dordoi/analytics/leadNotifications.ts` | Site | HTML модерации + `sendDordoiAdminTelegram` | `DORDOI_ADMIN_TELEGRAM_*` | Низкий | Ок |
| `app/api/dordoi/analytics/event/route.ts` | Site | `POST` аналитики, rate limits, skip rules | см. env | `validation_error` не детализирует поля клиенту | Ок |
| `components/dordoi/DordoiAnalyticsTracker.tsx` | Site client | `first_visit`, клики, `credentials: "omit"` | — | `first_visit` помечен отправленным до `await` post — при сетевой ошибке повтор в той же сессии не пойдёт | Принять как защита от дублей; edge case — см. smoke |
| `app/[locale]/layout.tsx` | Site | Рендер `<DordoiAnalyticsTracker locale=… />` | — | — | Подключён |
| `lib/actions/vendor-moderation.ts` | Site server | После успешного DB update — admin notify модерации | `DORDOI_ADMIN_TELEGRAM_*` | Дубли: rate limit 30 мин | Ок |
| `bot/main.py` | Bot | load settings, delete webhook, polling | `TELEGRAM_BOT_TOKEN`, Supabase… | Два инстанса → conflict | Проверить один реплик |
| `bot/config.py` | Bot | `load_settings()` | см. §5 | — | Ок |
| `bot/admin_notify.py` | Bot | Список получателей, `send_message` | `ADMIN_NOTIFY_CHAT`, `TELEGRAM_ADMIN_IDS` | Нет destinations → warning, тихий skip | Ок |
| `bot/vendor_handlers.py` | Bot | `/start`, FSM, save, admin notify | через Settings | approved/pending: нет notify на /start | Ок по задумке |
| `bot/__main__.py` | Bot | entry `asyncio.run(main())` | — | — | Ок |
| `bot/requirements.txt` | Bot | aiogram, supabase, dotenv | — | — | Ок |
| `bot/nixpacks.toml` | Railway Bot | merge python, pip install | `NIXPACKS_CONFIG_FILE` на сервисе | Site не должен ссылаться на этот файл | Проверить Railway |
| `reports/railway-bot-python-nixpacks.md` | Док | Объяснение Nixpacks для монорепо | — | — | Справочно |

---

## Appendix B — `skippedReason` (факт по коду)

Встречаются в ответах API / sender: `invalid_json`, `validation_error`, `disabled`, `dry_run`, `bot_skipped`, `event_not_broadcast_stage1`, `rate_limited`, `missing_vendor_id`, `missing_token_or_chats`, `telegram_all_failed_or_throttled`, `telegram_not_sent`, плюс в `leadNotifications`: `notify_error`.

Строки **`missing_config`** в коде **нет**.

---

## Appendix C — Smoke checklist (без правок кода)

См. исходное ТЗ п.11; повторять здесь не обязательно — выполняется вручную на стенде.

**Уточнение по коду:** серверный `rateLimitFirstVisit` — **30 минут** на `sessionId`; клиентский `sessionStorage` блокирует повтор **`first_visit`** в рамках одной вкладки сразу после постановки флага (до завершения fetch).

---

## Appendix D — Python bot: кому и когда шлётся admin notify

| Событие | Admin notify? |
|---------|----------------|
| `/start`, нет vendor или vendor не в `approved` / `pending_moderation` | **Да** |
| `/start`, vendor `approved` | **Нет** (ранний return) |
| `/start`, vendor `pending_moderation` | **Нет** |
| Анкета сохранена в БД успешно | **Да** |
| Ошибка `insert_vendor` | **Нет** |

Тест новой заявки: новый Telegram-аккаунт или удалить/обойти запись vendor в БД для этого `telegram_chat_id`, затем `/start` → пройти FSM до конца; проверить `ADMIN_NOTIFY_CHAT` и/или numeric admin ids заданы.
