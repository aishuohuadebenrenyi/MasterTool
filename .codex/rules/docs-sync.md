# Documentation And Memory Sync

## Update Formal Docs When

- Product behavior, user-facing flow, release process, security baseline, or data contract changes.
- CloudBase setup, collection requirements, permissions, or deployment steps change.
- A versioned release note or checklist item changes.

Use these destinations:

- Product state: `docs/product/product-overview.md`
- User operation: `docs/product/user-manual.md`
- Release process: `docs/operations/release-checklist.md` and `docs/operations/wechat/RELEASE_GUIDE.md`
- CloudBase launch: `docs/operations/cloudbase-prod-launch-runbook.md`
- Security baseline: `docs/operations/cloudbase-security-baseline.md`
- History: `docs/archive/history-evolution.md`
- Version changes: `docs/changelog.md`

## Update Memory When

- A long-lived architectural fact is confirmed.
- A rule or workflow should affect future tasks.
- A recurring pitfall or fix pattern is discovered.
- A decision affects future implementation choices.

Use these destinations:

- `.codex/memory/project-context.md` for durable project facts.
- `.codex/memory/decisions.md` for decisions and rationale.
- `.codex/memory/lessons-learned.md` for pitfalls and repeatable lessons.

## Update Tasks When

- A task starts, moves between states, completes, or leaves follow-up work.
- Verification succeeds, fails, or is intentionally skipped.
- A future engineer needs to know what was changed and why.

Use `.codex/tasks/records/` for task details and `.codex/tasks/todo.md`, `.codex/tasks/in-progress.md`, `.codex/tasks/done.md` as status indexes.
