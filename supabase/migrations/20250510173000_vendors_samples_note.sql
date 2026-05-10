-- Уточнение по пробным/мелким закупкам из бота («Свой вариант»).

alter table public.vendors
  add column if not exists samples_note text;

comment on column public.vendors.samples_note is
  'Текст от продавца о мелкой оплачиваемой партии/пробе; если задан — показываем вместо да/нет.';
