-- Instagram profile scraper enrichment: followers, video URLs, batch source tag.

alter table public.vendors
  add column if not exists followers_count integer;

comment on column public.vendors.followers_count is
  'Подписчики Instagram (и др. источники); заполняется скриптом sync-instagram-profiles.';

alter table public.vendors
  add column if not exists product_videos text[] not null default '{}';

alter table public.vendors
  drop constraint if exists vendors_product_videos_cardinality;

alter table public.vendors
  add constraint vendors_product_videos_cardinality
  check (cardinality(product_videos) <= 15);

comment on column public.vendors.product_videos is
  'URL видео постов (Instagram и др.); до 15 ссылок, симметрично product_photos.';

alter table public.vendor_photo_batches
  add column if not exists import_source text;

comment on column public.vendor_photo_batches.import_source is
  'Происхождение партии: например instagram_profile — для идемпотентной замены при повторном импорте.';

create index if not exists vendor_photo_batches_vendor_import_source_idx
  on public.vendor_photo_batches (vendor_id, import_source)
  where import_source is not null;
