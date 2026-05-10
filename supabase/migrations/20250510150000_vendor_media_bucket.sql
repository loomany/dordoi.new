-- Публичные изображения профилей продавцов (URL отдаются в FSM и в каталог).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vendor-media',
  'vendor-media',
  true,
  10485760,
  array[
    'image/jpeg'::text,
    'image/png'::text,
    'image/webp'::text
  ]
)
on conflict (id) do nothing;
