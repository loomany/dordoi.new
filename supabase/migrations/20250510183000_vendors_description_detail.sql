-- Дополнительное описание магазина (продолжение первого), только для страницы магазина / кабинета.

alter table public.vendors
  add column if not exists description_detail text;

comment on column public.vendors.description_detail is
  'Продолжение поля description; показывается после него внутри профиля, не в карточке каталога в сетке.';
