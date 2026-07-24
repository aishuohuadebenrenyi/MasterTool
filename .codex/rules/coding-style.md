# Coding Style

## Mini Program

- Match the existing JavaScript, WXML, WXSS, and JSON style in `apps/wechat-cloudbase/miniprogram/`.
- Keep page logic close to the page unless an existing shared utility already owns the behavior.
- Use existing utilities under `apps/wechat-cloudbase/miniprogram/utils/` before adding new helpers.
- Avoid speculative configurability or generic abstractions for one-off behavior.

## Cloud Functions

- Keep action names, request payloads, and response shapes consistent with existing cloud functions.
- Preserve the unified response shape: `code`, `message`, `data`, and `requestId`.
- Keep participant writes behind cloud functions; do not expose direct collection writes in client code.
- Preserve idempotency patterns around `requestId` for write actions.

## Tests

- Add or update focused tests when a bug fix or behavior change can be reproduced in unit tests.
- Prefer existing `tooling/verification/tests/unit/` patterns.
- Do not rewrite broad test structure for a narrow change.

## Documentation

- Write docs in concise Chinese, matching the current formal documentation style.
- Keep current-state docs free of old architecture details.
- Put historical background in `docs/archive/`.
