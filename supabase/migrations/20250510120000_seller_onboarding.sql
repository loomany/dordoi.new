-- Онбординг продавцов: заявки из Telegram + файлы в Storage (bucket seller-documents).

create table public.seller_onboarding_applications (
  id uuid primary key default gen_random_uuid(),
  telegram_user_id bigint not null unique,
  telegram_username text,
  shop_name text,
  contact_full_name text,
  phone text,
  email text,
  category text,
  document_storage_path text,
  status text not null default 'in_progress'
    check (status in ('in_progress', 'submitted', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index seller_onboarding_applications_status_idx
  on public.seller_onboarding_applications (status);

create index seller_onboarding_applications_created_idx
  on public.seller_onboarding_applications (created_at desc);

alter table public.seller_onboarding_applications enable row level security;

create or replace function public.touch_seller_onboarding_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger seller_onboarding_applications_set_updated_at
  before update on public.seller_onboarding_applications
  for each row
  execute function public.touch_seller_onboarding_updated_at();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'seller-documents',
  'seller-documents',
  false,
  10485760,
  array[
    'image/jpeg'::text,
    'image/png'::text,
    'image/webp'::text,
    'application/pdf'::text
  ]
)
on conflict (id) do nothing;
