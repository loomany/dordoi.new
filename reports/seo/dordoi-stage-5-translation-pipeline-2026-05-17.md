# Dordoi.help translation/static localization pipeline — 2026-05-17

Scripts found:
- `scripts/translate-messages.mts`
- `scripts/translate-vendors.mts`
- `scripts/i18n-audit-fix-all.mts`

Finding:
- Translation scripts are tied to `OPENAI_API_KEY` / external AI translation flow.
- User explicitly prohibited OpenAI API and paid AI API usage in this task.

Implementation:
- No external translation script was run.
- Added static Codex-localized content/mapping in `lib/seo/dordoi-blog-localized.ts`.
- Reused existing `lib/seo/stage4-localized-content.ts` localization layer for blog content.
- Localized slugs, title, description, H1, excerpt and body sections are generated from static local modules.
- Missing external translations fail closed by falling back to existing content rather than calling an API.

Locale rules preserved:
- Route `/kg` uses language/hreflang `ky`.
- Route `/tj` uses language/hreflang `tg`.
- Brand remains `Dordoi.help`.
- Dordoi/Dordoy naming is stable by locale.
- No vendor phone, WhatsApp, Telegram, Instagram, map link, exact location or private field is introduced by localization.

Quality caveat:
- The current static localizations are SEO-safe and indexable, but native human copy review is still recommended for kk/kg/tj nuance before aggressive paid acquisition or PR.
