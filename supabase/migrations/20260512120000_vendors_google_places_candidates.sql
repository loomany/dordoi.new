-- Google Places кандидаты в той же таблице vendors (применять только после approve вручную).
-- application_source: telegram (по умолчанию) | google_places

alter table public.vendors
  add column if not exists application_source text not null default 'telegram';

alter table public.vendors
  drop constraint if exists vendors_application_source_check;

alter table public.vendors
  add constraint vendors_application_source_check
  check (application_source in ('telegram', 'google_places'));

alter table public.vendors
  add column if not exists google_place_id text;

alter table public.vendors
  add column if not exists moderation_note text;

alter table public.vendors
  add column if not exists quality_flags text[];

alter table public.vendors
  add column if not exists quality_note text;

alter table public.vendors
  add column if not exists google_maps_uri text;

comment on column public.vendors.google_maps_uri is
  'Ссылка Google Maps из Places (Search); для кандидатов google_places.';

comment on column public.vendors.application_source is
  'telegram — заявка из бота; google_places — кандидат из импорта Places (не считать заявкой продавца).';

comment on column public.vendors.google_place_id is
  'Google Place ID (places.id) для дедупа импорта; для application_source=google_places.';

alter table public.vendors
  alter column telegram_chat_id drop not null;

alter table public.vendors
  alter column phone_number drop not null;

alter table public.vendors
  drop constraint if exists vendors_telegram_or_google_integrity;

alter table public.vendors
  add constraint vendors_telegram_or_google_integrity check (
    (
      application_source = 'telegram'
      and telegram_chat_id is not null
      and phone_number is not null
    )
    or (
      application_source = 'google_places'
      and google_place_id is not null
      and length(trim(google_place_id)) > 0
    )
  );

create unique index if not exists vendors_google_place_id_uidx
  on public.vendors (google_place_id)
  where google_place_id is not null;
