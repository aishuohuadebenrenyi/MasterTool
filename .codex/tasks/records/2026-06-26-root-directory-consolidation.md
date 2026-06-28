# 精简根目录并合并协作与历史资料

## Status

- Date: 2026-06-26
- Status: Done

## Goal

减少根目录噪音，不破坏当前微信小程序主线、正式文档和 AI 协作规则体系。

## Scope

Changed:

- `.codex/memory/`
- `.codex/tasks/`
- `docs/archive/cloudbase-rebuild/`
- `docs/archive/legacy-implementation-inventory.md`
- `AGENTS.md`
- `README.md`
- `.gitignore`

Removed from root:

- `memory/`
- `tasks/`
- `specs/`
- `archive/`

Removed local caches:

- `.cloudbase-mcp/`
- `.mcp-runtime/`
- `.mcporter/`
- `.npm/`
- `.venv/`
- `.claude/`
- `.config/`
- `config/`

## Result

- AI 协作资料集中到 `.codex/`。
- 历史规格资料集中到 `docs/archive/cloudbase-rebuild/`。
- 旧实现以文档清单形式保留，不再保留根目录旧代码和本地缓存。

## Verification

- Planned: `git diff --check`
- Result: Passed.
