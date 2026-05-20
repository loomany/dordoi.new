# Dordoi.help — AI visibility / GEO / AEO audit (final)

Date: 2026-05-18

## Summary

**Verdict: READY** for AI crawler discovery with strong guardrails.

## llms.txt (`/llms.txt`)

| Requirement | Status |
|-------------|--------|
| Describes Dordoi.help purpose | ✅ |
| Lists languages (/kg→ky, /tj→tg) | ✅ |
| Privacy rule (no vendor contacts) | ✅ |
| What not to claim | ✅ |
| Sitemap URL | ✅ |
| Best pages for citation | ✅ |

## AI answer blocks

- Present on core, category, blog, guide pages (`data-ai-answer-block="true"`)
- Smoke: 585 checks include AI block presence
- **UI:** hidden by default (`AiAnswerBlock hidden=true`) — content remains in DOM for crawlers

## Robots policy for AI bots

GPTBot, ChatGPT-User, OAI-SearchBot, PerplexityBot, ClaudeBot, Google-Extended, CCBot: **Allow: /** (same disallows as search bots).

## Answer-first / FAQ / schema

| Signal | Status |
|--------|--------|
| FAQ on key pages | ✅ |
| FAQPage JSON-LD | ✅ |
| About / how-it-works explain gated contacts | ✅ |
| No instructions to invent vendor contacts | ✅ (llms.txt + guide copy) |
| Localized guides (5 locales) | ✅ smoke PASS |

## Risks (P2)

- AI systems may still hallucinate contacts — llms.txt mitigates but cannot prevent all models
- Hidden UI blocks may reduce human-visible “answer-first” UX while helping machine-readable layer
- Monitor AI referral traffic separately (not in scope)

## Recommendation

Submit sitemap; ensure llms.txt URL discoverable; re-check after GSC/Bing Webmaster indexing. No new AI content until search data arrives.
