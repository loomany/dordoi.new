# Dordoi.help — аудит: Telegram admin-уведомления и статистика визитов (audit-only)

**Дата:** 2026-05-13  
**Область:** только анализ репозитория `Dordoi` (код/миграции/env не менялись в рамках этого аудита).  
**Примечание по ScholarshipTop:** в текущем репозитории **нет** папок/файлов ScholarshipTop; упоминания встречаются только в отчётах SEO (`reports/seo/*.md`) как факт отсутствия следов. Сравнение с «паттерном ScholarshipTop» ниже — по **типовой** архитектуре и по тому, что **уже есть в Dordoi** (Telegram, env), а не по копируемому коду из другого проекта.

---

## 1. Executive summary

- **Telegram сегодня в Dordoi** используется для **онбординга продавца** (Python-бот, aiogram) и **уведомлений продавцу** из Next.js после модерации (`lib/telegram/*`). Админу в Telegram уходят события **только из бота** (`/start`, завершение анкеты) через `bot/admin_notify.py` и переменные `ADMIN_NOTIFY_CHAT` / `ADMIN_TELEGRAM_IDS` / `TELEGRAM_ADMIN_IDS`. **Отдельного трекинга визитов сайта, UTM, referrer, bot/human и `/api/analytics` в коде нет.**
- **Аналитика веб-визитов:** нет клиентского `AnalyticsTracker`, нет маршрутов `app/api/analytics/*`, нет GTM/GA/Plausible в зависимостях и типовом коде приложения. В `supabase/migrations` **нет** таблиц `visits` / `analytics` / `events`.
- **Безопасное направление для Stage 1:** новый изолированный модуль (например `lib/dordoi-analytics/*` + `app/api/dordoi/analytics/visit/route.ts`), **отдельные** env для включения/чата админа сайта (чтобы не смешивать с ботом продавцов при необходимости), клиентский трекер только в **`app/[locale]/layout.tsx`** (публичные страницы с локалью), **исключая** `/cabinet/*`, статику, `api`, healthcheck. Telegram `sendMessage` — **только сервер**; токен не в `NEXT_PUBLIC_*`.
- **Главные риски:** спам в Telegram при трафике; двойной fire при SSR+client без явной политики; утечка PII в логи/Telegram; путаница с **тем же** `TELEGRAM_BOT_TOKEN`, если админские визиты смешать с пользовательским ботом; GDPR/локальные нормы по IP/UA.

---

## 2. Current implementation map

| File path | Что делает | Переиспользование для Dordoi | Риск | Комментарий |
|-----------|------------|------------------------------|------|---------------|
| `bot/admin_notify.py` | Рассылка HTML админам: `notify_admins_html`, список получателей из `ADMIN_NOTIFY_CHAT` + numeric ids | **Идея** доставки и `html.escape` — да; **прямой вызов из Next** — нет (другой рантайм) | Низкий как reference; средний если дублировать логику без единого helper | Нет rate limit / dedupe / retry кроме `try/except` на получателя |
| `bot/config.py` | Загрузка env: `TELEGRAM_BOT_TOKEN`, `ADMIN_NOTIFY_CHAT`, `ADMIN_TELEGRAM_IDS` / `TELEGRAM_ADMIN_IDS`, Supabase URL/keys | Согласовать **имена** env или ввести **префикс DORDOI_*** для сайта | Средний | Next-часть проекта не использует этот модуль напрямую |
| `bot/vendor_handlers.py` | FSM анкеты; `notify_admins_html` на `/start` и после `insert_vendor` | Только как образец **формата сообщений** для админа | Высокий при правках «заодно» | Не трогать в Stage 1 без необходимости |
| `lib/telegram/notify-vendor-approved.ts` | `fetch` к Bot API: публикация анкеты продавцу | Не смешивать с admin visit — другой `chat_id` и смысл | Средний | `server-only`, без throw наружу при отсутствии token |
| `lib/telegram/notify-photo-batch.ts` | Уведомления продавцу о модерации фото | Аналогично | Средний | Тот же `TELEGRAM_BOT_TOKEN` |
| `lib/telegram/vendor-keyboard.ts` | Reply keyboard для бота | Не относится к визитам | Низкий | — |
| `lib/actions/vendor-moderation.ts` | Server Action: approve → `notifyVendorApplicationApproved` | Не переиспользовать для визитов | Низкий | Ядро модерации |
| `lib/vendor-onboarding-telegram.ts` | `NEXT_PUBLIC_TELEGRAM_VENDOR_BOT` → ссылка на бота | Публичная ссылка OK; **не** для секретов | Низкий | Дефолт `https://t.me/dordoi_help_admin_bot` |
| `middleware.ts` | next-intl + `x-dordoi-route-locale` + `updateSession` (Supabase auth cookie) | Можно **не** вставлять трекинг здесь (риск дубля, сложность) | Средний при логировании каждого запроса | Matcher уже исключает `api`, `_next`, файлы с расширением |
| `utils/supabase/middleware.ts` | `getUser()` для refresh сессии | **Не** связывать с analytics без явной политики | Высокий | Трогать осторожно — auth |
| `app/[locale]/layout.tsx` | Шапка/подвал, все публичные локализованные страницы | **Лучшая точка** для клиентского трекера визитов (с условием исключения cabinet внутри компонента или отдельным layout) | Низкий | Сейчас нет провайдера аналитики |
| `app/[locale]/cabinet/layout.tsx` | Кабинет, `robots: noindex`, редирект без сессии | **Не** подключать visit tracker (или гарантировать no-op) | Средний | Авторизованная зона |
| `app/layout.tsx` | Корень, шрифты, `NuqsAdapter` | Менее удобно, чем `[locale]/layout` (нет знания публичного маршрута без headers) | Низкий | — |
| `app/api/auth/*` | OTP и регистрация | **Не использовать** для визитов | Критический | Auth |
| `app/api/catalog/vendors/[vendorId]/photo-batches/route.ts` | Загрузка партий фото | Не связано | Низкий | — |
| `components/provider/VendorContactActions.tsx` | Кнопки контактов → модалка (не прямой outbound) | Для MVP: событие `contact_intent` / `contact_modal_open` | Низкий | Реальный клик по wa/tg может быть внутри модалки — проверить дочерние компоненты |
| `components/provider/DatabaseProviderProfileView.tsx` | Карточка вендора из БД, href wa/tg/tel | Точки `onClick` / link follow для CTA events | Низкий | Основной seller profile для БД-каталога |
| `components/provider/ProviderProfileView.tsx` | Статические «провайдеры» из registry, `wa.me` | Аналогично | Низкий | Ветка `isProviderSlug` в `catalog/[slug]` |
| `lib/admin/vendor-edit-seen.ts` | localStorage для админ UI | Не аналитика визитов | Низкий | Пример client storage — не путать с first-touch |
| `.env.example` | Документация env | Источник правды для **новых** переменных Stage 2+ | Низкий | `TELEGRAM_BOT_TOKEN`, `ADMIN_TELEGRAM_IDS`, `ADMIN_NOTIFY_CHAT` уже описаны |
| `scripts/telegram_admin_ping_test.py` | Тест админ-уведомлений через тот же Python API | Полезен для проверки доставки | Низкий | Не прод-код сайта |
| **ScholarshipTop (вне репо)** | Ожидаемый legacy-паттерн | Читать **только** если есть копия проекта; здесь не найден | — | Для аудита зафиксировано отсутствие |

---

## 3. Existing ScholarshipTop analytics / Telegram patterns

**В репозитории Dordoi кода ScholarshipTop нет.** Ниже — что обычно искали бы в «ScholarshipTop-стиле» и что **уже похоже** в Dordoi:

| Ожидаемый элемент ScholarshipTop | Аналог в Dordoi сегодня |
|----------------------------------|-------------------------|
| Admin Telegram при лиде/визите | Частично: **только** Python-бот → `notify_admins_html` (анкета), не веб-визиты |
| `sendMessage` helper | `fetch` в `lib/telegram/*.ts` + `aiogram` в Python |
| HTML formatting + escape | `escapeTelegramHtml` (TS), `html.escape` (Python), `html_user_line` в `bot/admin_notify.py` |
| `TELEGRAM_BOT_TOKEN` / admin chat ids | `.env.example`: `TELEGRAM_BOT_TOKEN`, `ADMIN_TELEGRAM_IDS`, `TELEGRAM_ADMIN_IDS`, `ADMIN_NOTIFY_CHAT` |
| Rate limit / dedupe | **Не реализовано** для admin notify |
| `/api/analytics/*` | **Отсутствует** |
| first-touch / UTM в localStorage | **Не найдено** |
| isbot / UA parse | **Нет** зависимостей `isbot`, `ua-parser-js` в `package.json` |

**Рекомендация:** не копировать слепо Python admin notify в горячий путь Next.js без общего TS-модуля; при желании единообразия — вынести **один** server-side `sendAdminTelegramHtml` в TS и использовать и для визитов, и (опционально, позже) обернуть дубли с ботом.

---

## 4. Dordoi current route / layout map

**Локали (`i18n/routing.ts`):** `ru`, `kk`, `kg`, `uz`, `tj` (префикс локали всегда в URL). *В ТЗ фигурировало `kz` — в коде для казахского используется код `kk` (BCP 47 / next-intl).*

**Публичные страницы (`app/[locale]/…/page.tsx`):**

| Маршрут | Назначение | page_type (предложение) |
|---------|------------|-------------------------|
| `/[locale]/` | Лендинг | `home` |
| `/[locale]/catalog` | Каталог | `catalog` |
| `/[locale]/catalog/[slug]` | Профиль продавца (БД) или статический provider | `seller_profile` / `other` (provider registry) |
| `/[locale]/buyers` | Справочник покупателей | `buyers` |
| `/[locale]/buyer-service` | Услуга для покупателей | `buyer_service` |
| `/[locale]/suppliers` | Поставщики (маркетинг) | `other` или `suppliers` |
| `/[locale]/sell` | Стать продавцом | `help` / `sell` |
| `/[locale]/help` | Хелп-центр | `help` |
| `/[locale]/contact` | Контакты | `help` |
| `/[locale]/faq`, `/about`, `/privacy`, `/terms`, `/refund` | Юридическое/инфо | `other` |

**Кабинет:** `/[locale]/cabinet` (+ `admin`, `vendor`, `buyer`, `buyer-agent`, nested) — **noindex**, сессия обязательна для части веток.

**API (Next):** только `app/api/auth/*` и `app/api/catalog/vendors/.../photo-batches` — новый endpoint аналитики не пересечёт их, если путь уникален.

**Cargo:** отдельной страницы в `app/[locale]` **не найдено**; слово `cargo` есть в данных каталога/поиска (`data/dordoiCategorySearchMap.ts`, `data/dordoiDiscoveryConfig.ts`) — события cargo имеет смысл планировать как **future**.

**Уже существующий заголовок для локали маршрута:** `middleware.ts` выставляет `x-dordoi-route-locale` — можно читать на сервере в Route Handler для обогащения логов (опционально).

---

## 5. Recommended architecture

1. **Отдельный модуль** (например `lib/dordoi-admin-analytics/`): типы событий, нормализация payload, маскирование IP, классификация канала, bot score (обёртка над библиотекой позже), **без** импорта в client bundle секретов.
2. **Один Route Handler:** `POST /api/dordoi/analytics/event` (или `/api/analytics/dordoi-visit`) — валидация тела (zod), игнор неизвестных полей, **быстрый** 204/200, внутри: опционально запись в БД (Stage 2), **опционально** Telegram.
3. **Клиентский компонент** `DordoiVisitTracker` (или общий `DordoiAnalyticsClient`):  
   - читает `document.referrer`, `window.location`, UTM из query;  
   - first-touch в `localStorage` (отдельный ключ с префиксом `dordoi.`);  
   - отправляет **один** `session_start` или `page_view` по правилам dedupe;  
   - для CTA — отдельные лёгкие POST.  
   Подключение: **`app/[locale]/layout.tsx`** внутри провайдера — с пропом `locale` из params (через обёртку client layout segment при необходимости).
4. **Telegram formatter** отдельный файл (например `format-dordoi-admin-visit.ts`) — чистая функция строки HTML/Markdown v2 (лучше HTML как в боте).
5. **Env (Stage 1 — только предложение, сейчас не добавлять):**  
   - `DORDOI_ADMIN_TELEGRAM_ENABLED=1`  
   - `DORDOI_ADMIN_TELEGRAM_DRY_RUN=1` (лог в stdout, без send)  
   - Либо переиспользовать `ADMIN_NOTIFY_CHAT` + **отдельный** бот токен `DORDOI_SITE_ADMIN_BOT_TOKEN`, если не хотите смешивать с онбординг-ботом.  
6. **Не ломать** текущий vendor bot: визиты сайта не должны писать в `telegram_chat_id` вендоров.

**Исключения маршрутов:** не инициализировать трекер на `/_next/*`, `/api/*`, статике; для `/[locale]/cabinet/*` — ранний return (проверка `pathname.includes('/cabinet')`).

---

## 6. MVP event list

**Обязательно (согласно ТЗ):**

| event_type | Когда | Telegram |
|------------|-------|----------|
| `page_view` / `session_entry` | Первый просмотр за сессию на публичном сайте | Да, с dedupe |
| `seller_profile_view` | Открытие `/catalog/[slug]` (и разделение showcase vs DB при необходимости) | Да (можно объединить с session_entry если тот же fire) |
| `contact_click` | Подтверждённый outbound или открытие модалки контактов — **уточнить продукт** | Да |
| `catalog_open` | Переход на `/catalog` или первый заход с entry `/catalog` | Опционально в MVP если уже есть session_entry |
| `seller_form_submit` | Успешная отправка анкеты **на сайте** (если появится); сейчас основной поток — **Telegram-бот** | Да, при появлении web-form |
| `buyer_request_submit` | Если есть форма заявки покупателя на сайте | Да |
| `cargo_page_view` / `cargo_contact_click` | Только когда появятся маршруты/CTA | Отложено |

**Примечание по текущему UI:** в `VendorContactActions` клик открывает модалку, а не сразу `wa.me` — для MVP логично слать `contact_modal_open` и отдельно `contact_outbound` при фактическом переходе по ссылке внутри модалки (нужен короткий просмотр разметки модалки в следующем этапе).

---

## 7. Telegram message format examples

*Примеры на русском, HTML как в существующем стиле админ-уведомлений бота.*

**A. Первый визит сессии (human-like)**

```text
<b>Новый визит на Dordoi.help</b>
Статус: Human-like visit

<b>Канал:</b> Paid Google Ads
Campaign: spring_wholesale_2026
UTM: source=google / medium=cpc / campaign=spring_wholesale_2026 / content= — / term= —
Referrer: https://www.google.com/

<b>Страница:</b>
Entry: /ru/catalog/example-slug
Locale: ru
Page type: seller_profile

<b>Клиент:</b>
Country: KG
IP (masked): 185.54.xxx.xxx
Device: Mobile
OS: Android 14
Browser: Chrome 124
UA (short): Mozilla/5.0 (Linux; Android 14) …
Bot: no

<b>Сессия:</b>
First visit: yes
Session: <code>sha256:…truncated</code>
Visitor: <code>sha256:…truncated</code>

<b>Причина классификации:</b>
utm_medium=cpc → Paid; gclid present.
```

**B. CTA (всегда слать, если не dry-run)**

```text
<b>Событие на Dordoi.help</b>
Тип: contact_outbound — WhatsApp
Страница: /ru/catalog/my-shop
Locale: ru
Канал: Organic Google (referrer google, no paid params)
Bot: no
Session: <code>…</code>
```

**C. Bot (политика: не слать или digest)**

```text
<b>Визит (bot) — digest</b>
UA: Googlebot/2.1
Страница: /ru/
Классификация: Known crawler UA → Bot
```

---

## 8. Attribution / channel classification rules

| Канал | Условия (предложение) |
|-------|----------------------|
| **Paid Google Ads** | `utm_medium` ∈ {`cpc`,`ppc`,`paid`} **или** присутствует `gclid` / `gbraid` / `wbraid` (регистронезависимо в query) |
| **Organic Google** | referrer host совпадает с `google.*` / `www.google.*` **и** нет paid-сигналов выше **и** нет paid utm |
| **Direct / unknown** | нет referrer (или same-origin только), нет UTM, нет ads id — если UA browser-like → **Direct**; иначе **Unknown** |
| **Telegram** | referrer host `t.me` / `telegram.me` **или** `utm_source` содержит `telegram` |
| **Instagram** | referrer / utm указывает instagram **или** `utm_source` = ig / instagram |
| **Facebook** | facebook.com / fb.com / utm_source facebook |
| **Other** | иной referrer с UTM или без |

**Реклама «да/нет»:** `is_paid = (paid signals)` как выше.

---

## 9. Bot / human detection approach

**Сейчас в проекте нет готовой библиотеки.** Рекомендация Stage 1:

1. Добавить зависимость уровня **`isbot`** или лёгкий список + `User-Agent` (server + client согласованно не обязательно — источник истины **сервер** по заголовку `user-agent` и при деплое на Vercel/Cloudflare — `cf-connecting-ip`, `cf-ray`, `x-forwarded-for` с осторожностью).
2. **Сервер:** в Route Handler читать `request.headers.get("user-agent")`; опционально `sec-ch-ua` (Client Hints) — не обязательно в MVP.
3. **Классификация статуса для Telegram:**  
   - `Known bot` → не слать мгновенно / digest  
   - `Likely human` → дефолт  
   - `Suspicious` → эвристики: пустой UA, несовместимые hints, слишком частые POST с одного IP (см. anti-fake ниже)

---

## 10. Data storage options

**Сейчас:** отдельной таблицы визитов **нет** (проверка `supabase/migrations`).

**Stage 2 — черновик схемы (без миграции):** поля из ТЗ п.8:

- `id` (uuid), `created_at`  
- `site` = `'dordoi'`  
- `event_type`, `session_id_hash`, `visitor_id_hash`  
- `entry_path`, `current_path`, `page_type`  
- `referrer`, `utm_*`, `gclid_present`, `channel`  
- `country`, `region`, `ip_masked`  
- `user_agent_hash`, `browser`, `os`, `device`  
- `is_bot`, `bot_name`  
- `telegram_sent`, `metadata` jsonb  

**RLS (будущее):** только service role на запись из сервера; чтение — отдельная политика для `admin` role или только через dashboard — **не** в рамках этого аудита.

**Read-only listing:** отдельное админ UI или SQL views — позже.

---

## 11. Privacy / security checklist

- [ ] IP только **masked** (например последний октет или два — политика продукта).  
- [ ] Не отправлять в Telegram **полные** cookie, JWT, `Authorization`.  
- [ ] Не логировать email/телефон посетителя из случайных полей формы.  
- [ ] `TELEGRAM_BOT_TOKEN` / любой bot token — **только** server env, не `NEXT_PUBLIC_*`.  
- [ ] Клиентский трекер отправляет **минимальный** JSON (пути, UTM, event id, opaque ids).  
- [ ] **Обезличенные** session/visitor id (hash соли с server secret).  
- [ ] Ошибка Telegram **не** должна ломать рендер страницы (async fire-and-forget с swallow).  
- [ ] Rate limit на IP для `POST /api/.../event` (защита от флуда).  
- [ ] Юридический блок: уведомление в Privacy Policy при включении трекинга (вне кода аудита).

---

## 12. Risks

| Риск | Описание | Митигация |
|------|-----------|-----------|
| Telegram spam | Много трафика → много сообщений | session dedupe, per-minute cap, digest для ботов |
| Двойная отправка SSR + client | Next может вызвать эффекты дважды | только client для page_view **или** строгий idempotency-key |
| Утечка секретов | Случайный импорт token в client | `server-only`, отдельный bundle boundary |
| Смешение с ScholarshipTop | В этом репо нет кода — риск при **копипасте** из внешнего репо | изолированный модуль Dordoi |
| Смешение статистики с онбординг-ботом | Один токен / один чат | отдельный бот или topic / чёткий префикс сообщений |
| False human/bot | Неточная детекция | консервативные правила + ручной digest |
| GDPR / локальные законы | IP + UA = персональные данные в ряде юрисдикций | masking, retention, DPA, opt-out ссылка |

---

## 13. Step-by-step implementation plan (без реализации)

1. Утвердить продуктовую политику: что считается «важным визитом», слать ли ботов в digest.  
2. Зафиксировать список env и отдельный бот/чат vs существующий.  
3. Добавить zod-схему события и Route Handler `POST` (пустой ответ быстрый).  
4. Реализовать `maskIp`, `hashId`, `classifyChannel`, `parseUtm` в TS.  
5. Клиент: first-touch в `localStorage`, session id в `sessionStorage`, отправка на mount с debounce.  
6. Подключить трекер в `app/[locale]/layout.tsx` с исключениями cabinet/api.  
7. Инструментировать CTA в `DatabaseProviderProfileView` / модалке контактов.  
8. Telegram: formatter + send + dry-run + cap.  
9. Нагрузочный ручной тест + `telegram_admin_ping_test` остаётся для Python-части; для Next — отдельный curl/скрипт.  
10. Stage 2: миграция таблицы + запись из того же handler.

---

## 14. Acceptance criteria for future Stage 1 implementation

- Публичный сайт шлёт события только на новый endpoint; кабинет и auth не затронуты.  
- Секреты не попадают в client bundle.  
- При падении Telegram страница работает.  
- Есть `DORDOI_ADMIN_TELEGRAM_ENABLED` и dry-run (когда env добавят).  
- Нет дубля «каждый pageview» в Telegram для одной сессии без явной настройки.  
- Документированы поля и маскирование IP.

---

## 15. Files likely to change in Stage 1

- `app/[locale]/layout.tsx` (или новый `components/analytics/DordoiVisitTracker.tsx` + import)  
- Новый: `app/api/dordoi/analytics/event/route.ts` (или выбранный путь)  
- Новый: `lib/dordoi-admin-analytics/*`  
- `components/provider/DatabaseProviderProfileView.tsx`, `VendorContactActions.tsx` (CTA)  
- Возможно `middleware.ts` — **только если** решат логировать на edge (не обязательно)  
- `package.json` — зависимость isbot/…  
- `.env.example` — **после** approve (сейчас по аудиту не трогали)

---

## 16. Files forbidden to touch (или только по отдельному approve)

- `app/api/auth/**`  
- `utils/supabase/middleware.ts` (кроме косметики — лучше не трогать)  
- `lib/auth/**`  
- Любые существующие **RLS** миграции и политики Supabase  
- Платёжный код (в явном виде в найденных путях не выделялся — ориентир: не трогать интеграции оплат при появлении)  
- `bot/vendor_handlers.py` / FSM онбординга — не смешивать с веб-аналитикой без необходимости  
- `lib/telegram/notify-vendor-approved.ts`, `notify-photo-batch.ts` — не перепрофилировать под admin visits

---

## 17. Дополнительные улучшения (из ТЗ)

- Ежедневный **digest** в Telegram.  
- **Горячие** уведомления только на `contact_outbound`, `seller_form_submit`, `buyer_request_submit`.  
- Метки лидов: `seller_lead` / `buyer_lead` / `cargo_lead`.  
- **Source quality score** (эвристика).  
- **Anti-fake:** частота с одного IP/UA hash.  
- **Admin summary** блоком в конце дня.  
- **Telegram forum topic** (если супергруппа с топиками).  
- Флаги `DORDOI_ADMIN_TELEGRAM_ENABLED`, `DORDOI_ADMIN_TELEGRAM_DRY_RUN`.

---

## Подтверждение объёма аудита

- **Код приложения не изменялся** (кроме добавления этого файла отчёта в `reports/`, как запрошено).  
- **БД / миграции / env / commit / push** не выполнялись.  
- **Auth / payments / RLS** не анализировались на предмет изменений — только отмечены границы.
