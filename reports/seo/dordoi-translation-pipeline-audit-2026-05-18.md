# Dordoi.help Translation Pipeline Audit

Date: 2026-05-18

## Scripts Reviewed

- `scripts/translate-messages.mts`
- `scripts/translate-vendors.mts`
- `scripts/i18n-audit-fix-all.mts`

## Decision

These scripts are not used in this task because they can require `OPENAI_API_KEY` or external AI translation behavior. No OpenAI API or paid AI API was called.

## Safe Approach Used

- Static/Codex-authored translations were added directly to existing `messages/*.json` and `lib/seo/stage4-localized-content.ts`.
- Existing localized blog/content architecture was reused.
- No second blog/i18n system was created.
- Missing-key detection remains local via `npm run check:i18n`.
- Full public crawl coverage is now available through `npm run seo:i18n:full`.

## Future Recommendation

If automated translation is needed later, add a strict `TRANSLATION_PROVIDER=static` mode that reads prepared local translation files and fails closed when a translation is missing. It must never call OpenAI or another paid provider without explicit approval.

