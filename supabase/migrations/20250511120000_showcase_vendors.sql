-- Два эталонных витринных магазина (демо-карточки для продавцов).
--
-- Почему SQL-миграция, а не TS-seed:
--   * выполняется как postgres → обходит RLS (иначе INSERT в vendors / партии доступен
--     только «владельцу» через authenticated);
--   * одинаково накатывается локально и в проде через `supabase db push` / CI;
--   * не нужен service_role в скрипте.
--
-- Идемпотентность: фиксированные id у vendors и партий + ON CONFLICT DO UPDATE.
-- Важно: при конфликте НЕ трогаем logo_url / container_photo_url / product_photos и
-- не перезаписываем vendor_photo_batch_items — иначе повторный db push затирает
-- реальные URL из Storage после `npm run seed:showcase-ai`.
-- Зарезервированы «технические» telegram_chat_id -991000000001 / -991000000002
-- (отрицательный диапазон не используется реальными user/chat id бота).

with
  photos1 as (
    select array_agg(
             format('https://picsum.photos/seed/clothes%s/1080/1920', n)
             order by n
           ) as urls
      from generate_series(1, 15) as n
  ),
  photos2 as (
    select array_agg(
             format('https://picsum.photos/seed/shoes%s/1080/1920', n)
             order by n
           ) as urls
      from generate_series(1, 15) as n
  ),
  v1 as (
    insert into public.vendors (
      id,
      user_id,
      telegram_chat_id,
      language,
      phone_number,
      store_name,
      location_row,
      logo_url,
      description,
      categories,
      product_photos,
      container_photo_url,
      min_batch,
      payment_methods,
      delivery_help,
      whatsapp_1,
      whatsapp_2,
      instagram_url,
      telegram_url,
      samples_available,
      returns_policy,
      status,
      approved_at,
      slug,
      last_photo_reminder_at
    )
    select
      '10000000-0000-4000-8000-000000000001'::uuid,
      null::uuid,
      -991000000001::bigint,
      'ru',
      '+996000000001',
      'Dordoi.help | Пример #1',
      'Главная витрина каталога',
      'https://picsum.photos/seed/dordoi_logo1/400/400',
      $d1$🔥 Для оптовых покупателей по СНГ: 21 мая — открытие каталога и старт масштабной рекламы для байеров. Полная карточка продавца одежды — женской, мужской и детской, от базовых моделей до верхней. Яркие вертикальные фото 9:16 и указание сезона с размерным рядом повышают отклик опта.$d1$,
      array[
        'Женская одежда',
        'Мужская одежда',
        'Детская одежда',
        'Верхняя одежда'
      ]::text[],
      p.urls,
      'https://picsum.photos/seed/dordoi_cont1/800/600',
      'От 1 размерного ряда',
      'Наличные, Перевод, Золотая Корона',
      true,
      '+996000000001',
      '+996000000002',
      'https://instagram.com/dordoi.help',
      'https://t.me/dordoi_help',
      true,
      'Обмен фабричного брака в течение 14 дней. Видеофиксация при сборке груза.',
      'approved',
      now(),
      'dordoi-showcase-example-1-clothing',
      null::timestamptz
      from photos1 p
    on conflict (id) do update set
      telegram_chat_id = excluded.telegram_chat_id,
      language = excluded.language,
      phone_number = excluded.phone_number,
      store_name = excluded.store_name,
      location_row = excluded.location_row,
      description = excluded.description,
      categories = excluded.categories,
      min_batch = excluded.min_batch,
      payment_methods = excluded.payment_methods,
      delivery_help = excluded.delivery_help,
      whatsapp_1 = excluded.whatsapp_1,
      whatsapp_2 = excluded.whatsapp_2,
      instagram_url = excluded.instagram_url,
      telegram_url = excluded.telegram_url,
      samples_available = excluded.samples_available,
      returns_policy = excluded.returns_policy,
      status = excluded.status,
      approved_at = excluded.approved_at,
      slug = excluded.slug,
      last_photo_reminder_at = excluded.last_photo_reminder_at
    returning id
  ),
  v2 as (
    insert into public.vendors (
      id,
      user_id,
      telegram_chat_id,
      language,
      phone_number,
      store_name,
      location_row,
      logo_url,
      description,
      categories,
      product_photos,
      container_photo_url,
      min_batch,
      payment_methods,
      delivery_help,
      whatsapp_1,
      whatsapp_2,
      instagram_url,
      telegram_url,
      samples_available,
      returns_policy,
      status,
      approved_at,
      slug,
      last_photo_reminder_at
    )
    select
      '10000000-0000-4000-8000-000000000002'::uuid,
      null::uuid,
      -991000000002::bigint,
      'ru',
      '+996000000002',
      'Dordoi.help | Пример #2',
      'Главная витрина каталога',
      'https://picsum.photos/seed/dordoi_logo2/400/400',
      $d2$🚀 Для оптовых покупателей: 21 мая на площадку придут оптовики из СНГ. Пример карточки для обуви, белья, носков, сумок и аксессуаров. Честно опишите возврат, доставку и минимальные партии — так быстрее закрывают опт. Фото фасона и актуальные контакты экономят время. Укажите цены оптом.$d2$,
      array[
        'Обувь',
        'Нижнее белье',
        'Чулочно-носочные изделия',
        'Сумки и Аксессуары'
      ]::text[],
      p.urls,
      'https://picsum.photos/seed/dordoi_cont2/800/600',
      'От 1 коробки / 1 упаковки',
      'Наличные, Перевод на карту',
      true,
      '+996000000003',
      null::varchar,
      'https://instagram.com/dordoi.help',
      null::text,
      false,
      'Возврат только в случае распаковки груза на видео при получении (фабричный брак).',
      'approved',
      now(),
      'dordoi-showcase-example-2-shoes',
      null::timestamptz
      from photos2 p
    on conflict (id) do update set
      telegram_chat_id = excluded.telegram_chat_id,
      language = excluded.language,
      phone_number = excluded.phone_number,
      store_name = excluded.store_name,
      location_row = excluded.location_row,
      description = excluded.description,
      categories = excluded.categories,
      min_batch = excluded.min_batch,
      payment_methods = excluded.payment_methods,
      delivery_help = excluded.delivery_help,
      whatsapp_1 = excluded.whatsapp_1,
      whatsapp_2 = excluded.whatsapp_2,
      instagram_url = excluded.instagram_url,
      telegram_url = excluded.telegram_url,
      samples_available = excluded.samples_available,
      returns_policy = excluded.returns_policy,
      status = excluded.status,
      approved_at = excluded.approved_at,
      slug = excluded.slug,
      last_photo_reminder_at = excluded.last_photo_reminder_at
    returning id
  ),
  b1 as (
    insert into public.vendor_photo_batches (
      id,
      vendor_id,
      status,
      created_at,
      approved_at,
      reviewed_by,
      rejection_reason
    )
    select
      '20000000-0000-4000-8000-000000000001'::uuid,
      v1.id,
      'approved',
      now(),
      now(),
      null::uuid,
      null::text
      from v1
    on conflict (id) do update set
      vendor_id = excluded.vendor_id,
      status = excluded.status,
      approved_at = excluded.approved_at,
      rejection_reason = null
    returning id, vendor_id
  ),
  b2 as (
    insert into public.vendor_photo_batches (
      id,
      vendor_id,
      status,
      created_at,
      approved_at,
      reviewed_by,
      rejection_reason
    )
    select
      '20000000-0000-4000-8000-000000000002'::uuid,
      v2.id,
      'approved',
      now(),
      now(),
      null::uuid,
      null::text
      from v2
    on conflict (id) do update set
      vendor_id = excluded.vendor_id,
      status = excluded.status,
      approved_at = excluded.approved_at,
      rejection_reason = null
    returning id, vendor_id
  )
insert into public.vendor_photo_batch_items (
  batch_id,
  photo_url,
  position,
  created_at
)
select b1.id, u.url, u.pos::smallint, now()
  from b1
  join lateral (
    select ord as pos, url
      from unnest(
             (
               select urls
                 from photos1
             )
           ) with ordinality as t(url, ord)
  ) u on true
 where b1.id is not null
union all
select b.id, u.url, u.pos::smallint, now()
  from b2 b
  join lateral (
    select ord as pos, url
      from unnest(
             (
               select urls
                 from photos2
             )
           ) with ordinality as t(url, ord)
  ) u on true
 where b.id is not null
on conflict (batch_id, position) do nothing;
