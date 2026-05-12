# Проверка админки: Google Places кандидаты

Дата проверки: 2026-05-12  
Окружение: кодовая база `c:\dev\Dordoi`, удалённая БД Supabase (только **SELECT** для отчёта).  
Ограничения: без новых Google Places API, без `discovery_unmapped`, без insert/update/delete, без commit/push, без изменений auth/payments/RLS/policies.

## Как открыть локально

1. Запустить сайт: `npm run dev`.
2. Войти под учёткой с ролью **admin** (как обычно для кабинета).
3. Админ-модерация продавцов: **`http://localhost:3000/ru/cabinet/admin`** (вкладка по умолчанию — «Ожидают решения», `filter` не `all`).

Страница подключает `getPendingVendors()` и рендерит `VendorModerationView` ([`app/[locale]/cabinet/admin/page.tsx`](app/[locale]/cabinet/admin/page.tsx)).

---

## 1. Сколько Google Places карточек видно в админке

**Ожидаемо в очереди «Ожидают решения»:** **46** карточек.

Обоснование:

- В БД: `status = pending_review` и `application_source = google_places` → **46** строк (агрегат по `status` / `application_source`).
- `getPendingVendors()` выбирает `status IN ('pending_moderation', 'pending_review')` ([`lib/actions/vendor-moderation.ts`](lib/actions/vendor-moderation.ts)), поэтому все 46 попадают в список pending.

SQL (выполнено read-only): распределение сейчас такое:

| status           | application_source | cnt |
|------------------|--------------------|-----|
| pending_review   | google_places      | 46  |
| approved         | telegram          | 2   |
| rejected         | telegram          | 1   |

---

## 2. Сколько Telegram-заявок видно

| Контекст | Количество | Комментарий |
|----------|--------------|-------------|
| **Вкладка «Ожидают решения»** (`/cabinet/admin`) | **0** Telegram | Ни одна строка `telegram` не в статусе `pending_moderation` / `pending_review`: две витринные заявки **approved**, одна реальная **rejected**. |
| **Всего строк `application_source = telegram`** в `vendors` | **3** | Те же три записи; в списке «Все заявки» (`?filter=all`) они должны отображаться вместе с 46 Google. |

Итог: требование «3 старые telegram-заявки остались» выполняется по **данным в БД**; в **pending**-очереди их сейчас **нет**, потому что они уже не в статусе ожидания решения.

---

## 3. Десять примеров Google Places (данные + как это рисует UI)

Компонент карточки: [`components/cabinet/VendorModerationView.tsx`](components/cabinet/VendorModerationView.tsx).

Для каждой строки ниже в UI ожидается:

- Заголовок: **store_name** (или «Без названия», если пусто).
- Адрес: строка с иконкой `MapPin` из **location_row** (если не пусто).
- Бейджи: **«Google Places»** + **«Проверить вручную»** (верхний правый блок).
- Статус: бейдж **«На проверке»** (`statusPendingReview`) для `pending_review`.
- Голубой блок-подсказка: текст `googlePlacesAutoFoundHint` + ссылка **«Открыть в Google Maps»** при наличии `google_maps_uri` или `google_place_id` (функция `googleMapsHref`).
- Описание: секция «О магазине» из **description** (+ при необходимости `description_detail`) — для импорта там префикс про авто-поиск и JSON с `catalogMainId`, типами и т.д.
- Категории: чипы из массива **categories** (сейчас это slug вида `womens`, `household` — как в БД).
- Телефон: при `phone_number` пустом для Google — строка с иконкой телефона и текстом **`googlePlacesNoPhoneYet`** (RU: «Телефон не указан — добавьте при редактировании заявки.») — **не** строка «Нет данных».
- Кнопки «Редактировать» / «Одобрить» / «Отклонить» — так же, как для pending Telegram, т.к. `showActions === isVendorPendingQueueStatus(v.status)`.

| # | id (uuid) | store_name | location_row (кратко) | categories | UI-отличия от Telegram |
|---|-----------|------------|------------------------|--------------|-------------------------|
| 1 | `423e4536-4b7b-41c8-858f-a4c543d96945` | Рынок | Дордой, Мурас-Спорт… | womens | Бейджи Google + подсказка + Maps |
| 2 | `c060dd8f-e89c-42a7-9fc8-c2b389dad081` | Дордой Южная Корея | 7 проход 722… | womens | то же |
| 3 | `a7e63cf7-743f-4b1b-bc03-23e15dfd6a02` | Dordoi odejda | пр7 кон 689… | womens | то же |
| 4 | `01b7f7c9-8631-45a7-858a-dc261887aa39` | Турецкая Пластиковая Посуда | WJPC+9JX… | household | то же |
| 5 | `ee06a26b-8e2a-4581-abb1-ccdf50413e07` | Женская одежда Бишкек… | Дордой-АЗС… | womens | то же |
| 6 | `e35aef79-c212-4c78-bceb-1192cf22005d` | Риман текстиль | Улица Дордой 17… | fabrics-notions | то же |
| 7 | `3121bc5d-bd6e-4f7d-a6a1-0d2920d47fab` | Медер Текстиль | WJV8+7V9… | womens | то же |
| 8 | `daf03fac-d84c-4876-9ff2-644352d6d51a` | Игрушки 1882 | Дордой… | toys-children | то же |
| 9 | `318bebfc-14a0-4a4d-b44c-052e8afae4a4` | Alivia | WJRC+M4R… | womens | то же |
| 10 | `eac725de-cc9b-4cb2-ace8-3bf2bade4f13` | UNO - Бренд номер 1 | Алканов… | womens | то же |

По выборке read-only: у всех десяти `phone_number IS NULL`, `google_maps_uri` заполнен, `moderation_note` заполнен; начало `description` совпадает с текстом модерации + JSON.

---

## 4. Какие поля обычно пустые (Google кандидаты)

По данным импорта и коду карточки:

| Поле | Обычно | В UI |
|------|--------|------|
| `phone_number` | NULL | Текст `googlePlacesNoPhoneYet` (не «Нет данных») |
| `telegram_chat_id` | NULL | Для Google не показываются бейджи с номером заявки из чата |
| `whatsapp_1` / `whatsapp_2` | NULL | Строки WA не рендерятся |
| `instagram_url` / `telegram_url` | NULL | Блок контактов без этих ссылок |
| `logo_url` / `container_photo_url` | NULL | Плейсхолдер «нет изображения» (`cardNoImage`) |
| `product_photos` | `[]` | Нет галереи товаров |
| `description_detail` | NULL | Только основное описание |
| `quality_flags` / `quality_note` | NULL | **Отдельного блока в UI нет** — не выводятся |
| `moderation_note` | Заполнен в БД | **Отдельной секции нет**; смысл продублирован в начале `description` |

Заполнено: `store_name`, `location_row`, `description`, `categories`, `min_batch` / `payment_methods` / `returns_policy` (импортом подставлены «Не указано» где нужно), `google_maps_uri`, `google_place_id`.

---

## 5. Что улучшить в UI (рекомендации)

1. **Телефон / «Нет данных»:** сейчас показывается длинная фраза `googlePlacesNoPhoneYet`. Если продуктово нужно короткое «Нет данных» — поменять копирайт или добавить второй вариант для админки.
2. **`moderation_note`:** хранится в БД, но в карточке не выделен; админ видит тот же текст в начале **«О магазине»**. Имеет смысл либо отдельный блок «Заметка модерации», либо оставить как есть и не дублировать в БД.
3. **Категории:** в чипах показываются **технические slug** (`womens`, `household`). Для модерации удобнее человекочитаемые подписи (как в `catalogMainLabel` из JSON — сейчас это только внутри JSON в `description`).
4. **JSON в описании:** полезно для аудита, но на карточке громоздко; можно свернуть в «Подробности импорта» / `<details>` или показывать только в режиме редактирования.
5. **Секция «Медиа»:** для Google почти всегда пустая — можно компактнее (одна строка «Фото не приложены») до первого реального медиа.
6. **Telegram-карточки в `filter=all`:** убедиться визуально, что у строк с `application_source = telegram` **нет** бейджа Google (ветка `v.application_source === "google_places"` в коде).

---

## 6. Ошибки в консоли / на странице

- **`npm run build`** — успешно (Next.js 16.2.6, Turbopack), без ошибок компиляции.
- **`npx tsc --noEmit`** — выполнялся в той же сессии перед `build`, код **0**.
- **Живой браузер** в этой проверке **не открывался** — сообщения React/браузерной консоли зафиксировать нечем. Рекомендуется один раз открыть `/ru/cabinet/admin` и `?filter=all` с открытой консолью DevTools.

---

## 7. Скриншоты

В этой среде сделать скриншоты страницы нельзя. Нужны ручные скрины после `npm run dev`: pending-список (46 карточек), при желании — одна карточка крупно и вкладка «Все заявки».

---

## 8. Approve для `google_places` (без нажатия в UI)

Проверено **по коду**, реальный approve **не вызывался**.

В `updateVendorStatus` при `status === "approved"`:

- Если `application_source === 'google_places'`, блок с `ensureVendorSlug`, обновлением `profiles.role` и `notifyVendorApplicationApproved` **не выполняется** — только обновление `vendors.status` (и ревалидация путей).

Фрагмент:

```164:205:lib/actions/vendor-moderation.ts
  if (status === "approved") {
    const isGooglePlaces = vendor.application_source === "google_places";

    if (!isGooglePlaces) {
      // SEO-slug фиксируем при первом approve: стабильный URL во всех локалях.
      const finalSlug = await ensureVendorSlug(admin, {
        id: String(vendor.id),
        slug: typeof vendor.slug === "string" ? vendor.slug : null,
        store_name:
          typeof vendor.store_name === "string" ? vendor.store_name : null,
      });

      const phoneDigits = normalizePhone(String(vendor.phone_number ?? ""));
      if (phoneDigits.length >= 8) {
        const { error: profileErr } = await admin
          .from("profiles")
          .update({ role: "vendor" })
          .eq("phone", phoneDigits)
          .neq("role", "admin");
        // ...
      }

      const chatId = vendor.telegram_chat_id;
      if (typeof chatId === "number" && Number.isFinite(chatId)) {
        void notifyVendorApplicationApproved({
          telegramChatId: chatId,
          // ...
        }).catch(/* ... */);
      }
    }
    // google_places: без slug/профиля/Telegram — только смена статуса (ручная публикация позже).
  }
```

---

## 9. Подтверждения по ограничениям задачи

| Требование | Статус |
|------------|--------|
| Новые Google Places API | не запускались |
| `discovery_unmapped` | не импортировался и скрипты импорта не запускались |
| Изменения БД (insert/update/delete) | не выполнялись (только SELECT для отчёта) |
| auth / payments / RLS / policies | не менялись |
| commit / push | не выполнялись |

---

## 10. Сборка и типы

| Команда | Результат |
|---------|-----------|
| `npx tsc --noEmit` | exit **0** |
| `npm run build` | exit **0**, сборка успешна |

---

## Краткий чеклист для ручной визуальной проверки

- [ ] `/ru/cabinet/admin` — 46 карточек в «Ожидают решения».
- [ ] Бейджи Google + «Проверить вручную», статус «На проверке».
- [ ] Ссылка «Открыть в Google Maps» открывается.
- [ ] Блок телефона: ожидаемый текст (см. п. 5.1).
- [ ] `/ru/cabinet/admin?filter=all` — 49 строк; три Telegram без бейджа Google.
- [ ] Консоль браузера без ошибок на этих страницах.
