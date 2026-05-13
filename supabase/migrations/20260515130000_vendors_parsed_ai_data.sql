-- Снимок нормализованных полей карточки после ИИ-текста (не заменяет сырые description / description_detail).

alter table public.vendors
  add column if not exists parsed_ai_data jsonb;

comment on column public.vendors.parsed_ai_data is
  'JSON: опциональный снимок ParsedVendorCardData (+ meta), из OpenAI text moderation. Сырой текст в description не затирается.';
