# Dordoi.help DB Public Content Translation Audit

Date: 2026-05-18

This mirrors the read-only DB localization audit for the A-to-Z translation task.

## Current Status

- Static UI/SEO translations were fixed in code.
- DB-backed public vendor names/descriptions remain source-of-truth content and were not rewritten.
- Exact vendor contact/location/social/map fields remain gated/private.

## DB Content Still Requiring Translation Approval

- Public vendor/store names where the business wants localized display aliases.
- Public vendor descriptions imported or generated in one language.
- Public term fields such as MOQ/payment/returns when they contain source-language prose rather than normalized placeholders.

## Safe Interim Behavior

- Use localized category labels and localized page chrome around DB-backed cards.
- Use localized coarse location for locked supplier pages.
- Use localized fallback for unset MOQ/terms.
- Do not expose or translate private contact fields.

