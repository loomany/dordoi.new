-- Публичные видео товаров (Instagram Reels / mp4) для каталога.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vendor-videos',
  'vendor-videos',
  true,
  104857600,
  array['video/mp4'::text]
)
on conflict (id) do nothing;
