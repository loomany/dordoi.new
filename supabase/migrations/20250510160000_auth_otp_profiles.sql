-- OTP для входа по телефону (WhatsApp / GREEN-API) и профили пользователей.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  phone text not null unique,
  name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index profiles_email_unique_not_null
  on public.profiles (lower(trim(email)))
  where email is not null and trim(email) <> '';

create index profiles_phone_idx on public.profiles (phone);

comment on table public.profiles is 'Публичный профиль; id совпадает с auth.users.';

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create or replace function public.touch_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.touch_profiles_updated_at();

-- Хранение OTP (доступ только с service_role из Route Handlers).
create table public.otp_codes (
  phone text primary key,
  code text not null,
  expires_at timestamptz not null
);

alter table public.otp_codes enable row level security;

comment on table public.otp_codes is 'OTP для входа; операции только через сервер с service_role.';
