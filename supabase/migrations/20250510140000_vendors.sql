-- Профили продавцов (каталог / модерация).
-- user_id — связь с Supabase Auth для политик по auth.uid(); опционально, если профиль создан только из бота.

create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  telegram_chat_id bigint not null unique,
  language varchar(10) not null check (language in ('ru', 'kg')),
  phone_number varchar(32) not null unique,
  store_name varchar(512),
  location_row varchar(512),
  logo_url text,
  description text,
  categories text[] not null default '{}',
  product_photos text[] not null default '{}' check (cardinality(product_photos) <= 15),
  container_photo_url text,
  min_batch varchar(256),
  payment_methods varchar(512),
  delivery_help boolean not null default false,
  whatsapp_1 varchar(64),
  whatsapp_2 varchar(64),
  instagram_url text,
  telegram_url text,
  samples_available boolean not null default false,
  returns_policy text,
  status varchar(64) not null default 'pending_moderation',
  created_at timestamptz not null default now()
);

create index vendors_user_id_idx on public.vendors (user_id) where user_id is not null;
create index vendors_status_idx on public.vendors (status);
create index vendors_created_at_idx on public.vendors (created_at desc);

comment on column public.vendors.user_id is
  'Связь с auth.users; для RLS: строка «своя», если user_id = auth.uid().';

alter table public.vendors enable row level security;

-- Чтение только своей строки: по user_id или по совпадению телефона с auth.users.phone
create policy "vendors_select_own"
  on public.vendors
  for select
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      phone_number is not null
      and phone_number = (
        select u.phone
        from auth.users u
        where u.id = (select auth.uid())
      )
    )
  );

-- Обновление только своей строки (те же условия)
create policy "vendors_update_own"
  on public.vendors
  for update
  to authenticated
  using (
    user_id = (select auth.uid())
    or (
      phone_number is not null
      and phone_number = (
        select u.phone
        from auth.users u
        where u.id = (select auth.uid())
      )
    )
  )
  with check (
    user_id = (select auth.uid())
    or (
      phone_number is not null
      and phone_number = (
        select u.phone
        from auth.users u
        where u.id = (select auth.uid())
      )
    )
  );

-- Вставка: либо сразу привязываем user_id, либо телефон в строке совпадает с телефоном аккаунта
create policy "vendors_insert_own"
  on public.vendors
  for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    or (
      phone_number is not null
      and phone_number = (
        select u.phone
        from auth.users u
        where u.id = (select auth.uid())
      )
    )
  );
