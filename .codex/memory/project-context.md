# Project Context

## Current Product

`ImprovTool` / `MasterTool` is a WeChat Mini Program for trainers. It covers lesson preparation, live training delivery, participant interaction, feedback collection, review, and data accumulation.

The repository contains two runnable clients: the WeChat Mini Program under `apps/wechat-cloudbase/` and the native iOS/iPadOS trainer app under `apps/ios-personal/`.

## Architecture

- WeChat Developer Tools project: `apps/wechat-cloudbase/`
- Mini Program source: `apps/wechat-cloudbase/miniprogram/`
- Native iOS/iPadOS project: `apps/ios-personal/`
- Shared CloudBase functions: `backend/cloudbase/functions/`
- CloudBase seed and import data: `backend/cloudbase/seed/`
- Tests, lint, formatting, and release checks: `tooling/verification/`
- App Store materials: `releases/ios-personal/`
- Prototype index: `prototypes/`
- Formal documentation: `docs/`
- Historical documentation: `docs/archive/`
- Collaboration rules: `AGENTS.md` and `.codex/rules/`
- Durable project memory: `.codex/memory/`
- Task flow records: `.codex/tasks/`

Current cloud functions are split by domain:

- `trainer-api`: trainer profile, home summary, plans, templates, activities, and trainer records.
- `live-api`: session start, check-in, grouping, scoring, random draw, interactions, live notes, and Mini Program codes.
- `participant-api`: participant check-in, feedback, and interaction submissions.
- `review-api`: review list, review detail, and review save.
- `ios-api`: iOS authentication, account operations, and the HTTPS gateway to domain functions.

## Business Flow

The core flow is:

```text
template
  -> draft plan
  -> confirmed plan
  -> start session
  -> check-in
  -> grouping / scoring / random / interaction / notes
  -> feedback
  -> end session
  -> session data
  -> review
  -> data accumulation
```

Live data is bound by `sessionId`.

## Collaboration Rules

- Read project docs before changing code or formal docs.
- Keep `apps/wechat-cloudbase/` directly importable by WeChat Developer Tools.
- Keep `apps/ios-personal/` directly openable by Xcode.
- Keep shared CloudBase functions outside both clients under `backend/cloudbase/`.
- Keep tests and Node development tooling in `tooling/verification/`.
- Keep formal docs current-state focused.
- Move old architecture, migration notes, and historical context to `docs/archive/`.
- Keep public repository AppID and CloudBase env IDs as placeholders.
- Treat `.codex/memory/` and `.codex/tasks/` as collaboration support, not replacements for `docs/`.

## Common Pitfalls

- Do not treat `.codex/` as fully tracked source. Only `.codex/rules/`, `.codex/memory/`, and `.codex/tasks/` are intended to be committed.
- Do not modify local private config such as `apps/wechat-cloudbase/project.private.config.json` or `.env` files.
- Do not assume CloudBase collections or security rules are deployed just because docs mention them; verify current files and deployment state when release readiness matters.
- Do not update formal docs from memory alone; check current implementation first.
