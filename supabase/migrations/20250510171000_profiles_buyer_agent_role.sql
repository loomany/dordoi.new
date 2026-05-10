-- Роль байера (услуги на рынке): отдельный кабинет от покупателя и продавца.

alter table public.profiles drop constraint if exists profiles_role_check;

alter table public.profiles
  add constraint profiles_role_check
  check (role in ('user', 'buyer', 'buyer_agent', 'vendor', 'admin'));

comment on column public.profiles.role is
  'user — базовый; buyer — покупатель; buyer_agent — байер; vendor — продавец (анкета в vendors); admin — персонал.';
