-- Роли личного кабинета и защита от самоповышения через RLS.

alter table public.profiles
  add column if not exists role text not null default 'buyer'
    check (role in ('user', 'buyer', 'vendor', 'admin'));

comment on column public.profiles.role is
  'user — базовый; buyer — покупатель; vendor — продавец (анкета в vendors); admin — персонал.';

update public.profiles
set role = 'buyer'
where role is null;

drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = (
      select p.role
      from public.profiles p
      where p.id = (select auth.uid())
    )
  );
