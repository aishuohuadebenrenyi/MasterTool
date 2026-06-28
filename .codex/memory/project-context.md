# Project Context

## Current Product

`ImprovTool` / `MasterTool` is a WeChat Mini Program for trainers. It covers lesson preparation, live training delivery, participant interaction, feedback collection, review, and data accumulation.

The current formal product line is the WeChat Mini Program under `wechat-app/`. Future H5, iOS, or management-console directions may be mentioned briefly as future possibilities, but formal current-state docs should stay centered on the WeChat Mini Program.

## Architecture

- Publishable WeChat project: `wechat-app/`
- Mini Program source: `wechat-app/miniprogram/`
- CloudBase cloud functions: `wechat-app/cloudfunctions/`
- Tests, lint, formatting, release checks, and integration data: `wechat-app-support/`
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
- Keep `wechat-app/` limited to WeChat Developer Tools upload content: `project.config.json`, `miniprogram/`, and `cloudfunctions/`.
- Keep tests and Node development tooling in `wechat-app-support/`.
- Keep formal docs current-state focused.
- Move old architecture, migration notes, and historical context to `docs/archive/`.
- Keep public repository AppID and CloudBase env IDs as placeholders.
- Treat `.codex/memory/` and `.codex/tasks/` as collaboration support, not replacements for `docs/`.

## Common Pitfalls

- Do not treat `.codex/` as fully tracked source. Only `.codex/rules/`, `.codex/memory/`, and `.codex/tasks/` are intended to be committed.
- Do not modify local private config such as `wechat-app/project.private.config.json` or `.env` files.
- Do not assume CloudBase collections or security rules are deployed just because docs mention them; verify current files and deployment state when release readiness matters.
- Do not update formal docs from memory alone; check current implementation first.
