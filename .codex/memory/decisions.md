# Decisions

## 2026-06-26: Use Git-Tracked Collaboration Rules And Memory

- Decision: Use `AGENTS.md`, `.codex/rules/`, `.codex/memory/`, and `.codex/tasks/` as the shared collaboration structure.
- Reason: The project needs stable context for AI, consistent output rules, multi-person collaboration, and sustainable iteration after long gaps.
- Scope: Applies to future development, documentation, release, and review tasks in this repository.
- Consequence: Future tasks should update task records and durable memory when they create long-lived facts, rules, or decisions.

## 2026-06-26: Track Shared `.codex/` Collaboration Subdirectories

- Decision: Keep `.codex/` ignored by default, but allow `.codex/rules/**`, `.codex/memory/**`, and `.codex/tasks/**` to be tracked.
- Reason: `.codex/` may contain local tool state, while rules, memory, and task records should be shared by the team and AI assistants.
- Scope: Applies to Git tracking and repository hygiene.
- Consequence: Do not store required collaboration rules or durable memory in ignored `.codex/` files outside those shared subdirectories.

## 2026-06-26: Use Task Indexes Plus Per-Task Records

- Decision: Use `.codex/tasks/todo.md`, `.codex/tasks/in-progress.md`, `.codex/tasks/done.md`, plus detailed files under `.codex/tasks/records/`.
- Reason: Status indexes support scanning; per-task files keep details traceable without growing a single log forever.
- Scope: Applies to future traceable project tasks.
- Consequence: Each meaningful task should have a task record with goal, assumptions, scope, verification, and final status.

## 2026-06-26: Move Historical Specs Under `docs/archive/`

- Decision: Move the historical CloudBase rebuild specs from root `specs/` to `docs/archive/cloudbase-rebuild/`.
- Reason: Root should show the current product and collaboration surfaces; historical specifications belong with archived documentation.
- Scope: Applies to historical specification documents only.
- Consequence: New current specifications should not reuse the removed root `specs/` path unless a new active spec workflow is explicitly adopted.

## 2026-06-26: Keep `wechat-app/` Publish-Only

- Decision: Keep `wechat-app/` limited to WeChat Developer Tools upload content, and move Node tooling plus unit tests to `wechat-app-support/`.
- Reason: The app directory should be easy to inspect before release and should not mix publishable files with local development scaffolding.
- Scope: Applies to test, lint, format, and release verification commands.
- Consequence: Run project verification from `wechat-app-support/`, not from `wechat-app/`.
