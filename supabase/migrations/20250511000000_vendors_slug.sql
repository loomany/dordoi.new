-- SEO-friendly уникальный slug продавца, формируется при approve
-- (`lib/actions/vendor-moderation.ts → updateVendorStatus`).
-- Используется в /catalog/{slug} как стабильный URL для всех локалей.

alter table public.vendors
  add column if not exists slug text unique;

create index if not exists vendors_slug_idx on public.vendors (slug);

comment on column public.vendors.slug is
  'SEO slug для URL /catalog/{slug}. Заполняется один раз при первом approve, далее не меняется.';
