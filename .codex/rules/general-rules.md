# General Rules

## Work Style

- Think before coding. State assumptions, scope, success criteria, and verification before implementation.
- Keep changes surgical. Every changed line should trace back to the user request.
- Prefer simple, direct changes over new abstractions.
- Do not refactor adjacent code, rename unrelated symbols, or clean unrelated files.
- In a dirty worktree, preserve user changes and ignore unrelated modifications.

## Project Context

- Current product line is the WeChat Mini Program under `wechat-app/`.
- CloudBase Node.js cloud functions live under `wechat-app/cloudfunctions/`.
- Formal documentation lives under `docs/`.
- Historical or deprecated architecture belongs under `docs/archive/`.
- Local tool metadata such as `.trae/`, `.agents/`, `.claude/`, `.mcp-runtime/`, and most of `.codex/` is not product source.

## Collaboration Flow

1. Read `AGENTS.md`, relevant `.codex/rules/`, `.codex/memory/project-context.md`, and task-specific docs.
2. Create or update the task record in `.codex/tasks/`.
3. Implement the minimum required change.
4. Run the narrowest meaningful verification.
5. Update task status and any durable memory or formal docs affected by the change.
