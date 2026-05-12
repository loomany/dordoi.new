-- Импорт 2GIS/Google: несколько карточек могут указывать один телефон (общий контакт, сеть).
-- Уникальность телефона оставляем только для реальных заявок из Telegram.

alter table public.vendors
  drop constraint if exists vendors_phone_number_key;

create unique index if not exists vendors_phone_number_telegram_uidx
  on public.vendors (phone_number)
  where application_source = 'telegram'
    and phone_number is not null;
