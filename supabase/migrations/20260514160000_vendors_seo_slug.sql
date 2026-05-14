-- Readable SEO slug for /suppliers/{seo_slug}; public catalog uses opaque `slug`.
alter table public.vendors
  add column if not exists seo_slug text;

create unique index if not exists vendors_seo_slug_unique_idx
  on public.vendors (seo_slug)
  where seo_slug is not null;

comment on column public.vendors.seo_slug is
  'SEO-readable slug for /suppliers/{seo_slug}. After migration, `slug` is opaque (postavshik-*-xxxx).';
