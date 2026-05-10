-- Избранные карточки каталога для покупателей (по auth.uid).

create table public.buyer_catalog_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  listing_key text not null,
  created_at timestamptz not null default now(),
  constraint buyer_catalog_favorites_listing_key_format check (
    listing_key ~ '^slug:.+' or listing_key ~ '^sample:[0-9]+$'
  ),
  constraint buyer_catalog_favorites_listing_key_len check (char_length(listing_key) <= 256),
  unique (user_id, listing_key)
);

create index buyer_catalog_favorites_user_id_created_idx
  on public.buyer_catalog_favorites (user_id, created_at desc);

comment on table public.buyer_catalog_favorites is
  'Поставщики/карточки из каталога, сохранённые покупателем; listing_key: slug:<slug> или sample:<id>.';

alter table public.buyer_catalog_favorites enable row level security;

create policy "buyer_catalog_favorites_select_own"
  on public.buyer_catalog_favorites
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "buyer_catalog_favorites_insert_own"
  on public.buyer_catalog_favorites
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "buyer_catalog_favorites_delete_own"
  on public.buyer_catalog_favorites
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
