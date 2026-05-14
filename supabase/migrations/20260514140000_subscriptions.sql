-- Buyer catalog subscriptions (Lemon Squeezy webhooks → service role upsert).
create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  status text not null,
  variant_id text,
  subscription_id text,
  renews_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_subscription_id_idx on public.subscriptions (subscription_id);

alter table public.subscriptions enable row level security;

create policy "Users can read own subscription"
  on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

create or replace function public.touch_subscriptions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.touch_subscriptions_updated_at();
