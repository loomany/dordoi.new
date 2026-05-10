-- Лента фото товаров продавца (vendor_photo_batches + vendor_photo_batch_items).
--
-- Бизнес-смысл:
--   * каждая «партия» = одна загрузка продавца (Telegram или кабинет) на 1..15 фото;
--   * партия проходит модерацию админа: pending_moderation → approved | rejected;
--   * на публичной странице магазина показываем только approved-партии,
--     отсортированные по убыванию даты — сверху самая свежая.
--
-- Связанные изменения:
--   * vendors.approved_at — момент первого approve анкеты (для напоминалки 48ч);
--   * vendors.last_photo_reminder_at — последняя отправка напоминания, для дедупа;
--   * backfill: текущие vendors.product_photos approved-продавцов
--     переезжают в одну approved-партию с created_at = vendors.created_at,
--     чтобы старые фото остались видны и попали в ленту как «первая партия».
--   * vendors.product_photos оставляем как preview-cache для карточки каталога:
--     при approve новой партии триггер обновляет массив первыми 15 фото свежей партии.

-- 1. Колонки на vendors -----------------------------------------------------

alter table public.vendors
  add column if not exists approved_at timestamptz,
  add column if not exists last_photo_reminder_at timestamptz;

comment on column public.vendors.approved_at is
  'Момент первого approve анкеты. Используется как стартовая точка для расписания напоминаний (48ч).';

comment on column public.vendors.last_photo_reminder_at is
  'Последняя отправка Telegram-напоминания «загрузите свежие фото». Дедуп для шедулера в боте.';

update public.vendors
   set approved_at = coalesce(approved_at, created_at)
 where status = 'approved'
   and approved_at is null;

-- 2. Таблица партий ---------------------------------------------------------

create table if not exists public.vendor_photo_batches (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  status text not null default 'pending_moderation'
    check (status in ('pending_moderation', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  reviewed_by uuid references auth.users (id) on delete set null,
  rejection_reason text
);

comment on table public.vendor_photo_batches is
  'Партия фото товаров (одна загрузка продавца, 1..15 фото). Источник для ленты на странице магазина.';

create index if not exists vendor_photo_batches_vendor_status_idx
  on public.vendor_photo_batches (vendor_id, status, created_at desc);

create index if not exists vendor_photo_batches_status_pending_idx
  on public.vendor_photo_batches (status, created_at desc)
  where status = 'pending_moderation';

-- 3. Таблица элементов партии ----------------------------------------------

create table if not exists public.vendor_photo_batch_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid not null references public.vendor_photo_batches (id) on delete cascade,
  photo_url text not null,
  position smallint not null check (position between 1 and 15),
  created_at timestamptz not null default now(),
  unique (batch_id, position)
);

create index if not exists vendor_photo_batch_items_batch_idx
  on public.vendor_photo_batch_items (batch_id, position);

-- 4. RLS --------------------------------------------------------------------

alter table public.vendor_photo_batches enable row level security;
alter table public.vendor_photo_batch_items enable row level security;

-- Админ имеет полный доступ через service-role (RLS его не касается).
-- Продавцы видят только свои партии.
drop policy if exists "vendor_photo_batches_select_own" on public.vendor_photo_batches;
create policy "vendor_photo_batches_select_own"
  on public.vendor_photo_batches
  for select
  to authenticated
  using (
    vendor_id in (
      select v.id from public.vendors v
      where v.user_id = (select auth.uid())
         or (
           v.phone_number is not null
           and v.phone_number = (
             select u.phone from auth.users u where u.id = (select auth.uid())
           )
         )
    )
  );

-- Продавец может создавать pending-партии для своей анкеты
drop policy if exists "vendor_photo_batches_insert_own" on public.vendor_photo_batches;
create policy "vendor_photo_batches_insert_own"
  on public.vendor_photo_batches
  for insert
  to authenticated
  with check (
    status = 'pending_moderation'
    and vendor_id in (
      select v.id from public.vendors v
      where v.user_id = (select auth.uid())
         or (
           v.phone_number is not null
           and v.phone_number = (
             select u.phone from auth.users u where u.id = (select auth.uid())
           )
         )
    )
  );

-- items: видим только то, что от своих партий, можем добавить только в свою pending
drop policy if exists "vendor_photo_batch_items_select_own" on public.vendor_photo_batch_items;
create policy "vendor_photo_batch_items_select_own"
  on public.vendor_photo_batch_items
  for select
  to authenticated
  using (
    batch_id in (
      select b.id
      from public.vendor_photo_batches b
      join public.vendors v on v.id = b.vendor_id
      where v.user_id = (select auth.uid())
         or (
           v.phone_number is not null
           and v.phone_number = (
             select u.phone from auth.users u where u.id = (select auth.uid())
           )
         )
    )
  );

drop policy if exists "vendor_photo_batch_items_insert_own" on public.vendor_photo_batch_items;
create policy "vendor_photo_batch_items_insert_own"
  on public.vendor_photo_batch_items
  for insert
  to authenticated
  with check (
    batch_id in (
      select b.id
      from public.vendor_photo_batches b
      join public.vendors v on v.id = b.vendor_id
      where b.status = 'pending_moderation'
        and (
          v.user_id = (select auth.uid())
          or (
            v.phone_number is not null
            and v.phone_number = (
              select u.phone from auth.users u where u.id = (select auth.uid())
            )
          )
        )
    )
  );

-- 5. Backfill существующих product_photos в первую approved-партию ----------

with seed_batches as (
  insert into public.vendor_photo_batches (vendor_id, status, created_at, approved_at)
  select
    v.id,
    'approved',
    coalesce(v.created_at, now()),
    coalesce(v.approved_at, v.created_at, now())
  from public.vendors v
  where v.status = 'approved'
    and cardinality(coalesce(v.product_photos, '{}')) > 0
    and not exists (
      select 1 from public.vendor_photo_batches b
      where b.vendor_id = v.id
    )
  returning id, vendor_id, created_at
)
insert into public.vendor_photo_batch_items (batch_id, photo_url, position, created_at)
select
  sb.id,
  url,
  ord::smallint,
  sb.created_at
from seed_batches sb
join public.vendors v on v.id = sb.vendor_id
join lateral (
  select url, ord
  from unnest(v.product_photos) with ordinality as t(url, ord)
  where ord <= 15
) photos on true;
