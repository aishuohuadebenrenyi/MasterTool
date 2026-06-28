# Lessons Learned

## Documentation Boundaries

- Keep formal docs focused on the current product state.
- Move old architecture, migration reasoning, and deprecated flows into `docs/archive/`.
- When docs and memory disagree, inspect the current repository before updating either one.

## Collaboration Hygiene

- Record durable decisions in `.codex/memory/decisions.md`, not only in chat.
- Record task outcomes in `.codex/tasks/records/`, not only in final responses.
- Avoid broad staging or broad cleanup when the worktree already contains unrelated changes.
