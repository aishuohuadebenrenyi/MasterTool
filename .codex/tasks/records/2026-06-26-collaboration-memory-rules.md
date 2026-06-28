# 建立协作记忆、规则与任务流水体系

## Status

- Date: 2026-06-26
- Status: Done

## Goal

建立一套 Git 可追踪的协作结构，让 AI 和人使用同一套项目规则、长期记忆、任务状态和任务详情记录。

## Assumptions

- `.codex/rules/` 需要多人共享，应纳入 Git。
- `.codex/` 下其他配置和缓存继续保持忽略。
- `.codex/tasks/` 使用状态索引加一任务一文件。
- `.codex/memory/` 记录长期上下文、决策和经验，不复制完整聊天流水。

## Scope

Changed:

- `AGENTS.md`
- `.codex/rules/`
- `.codex/memory/`
- `.codex/tasks/`
- `.gitignore`
- `README.md`

Not changed:

- 小程序业务代码
- CloudBase 云函数代码
- 发布脚本
- `.trae/`、`.agents/`、`.claude/` 等本地工具目录

## Result

- 新增 AI 协作入口规则。
- 新增 Codex 专用规则目录。
- 新增长期项目记忆目录。
- 新增任务状态索引和任务详情记录。
- 调整 `.gitignore`，只允许共享 `.codex/` 子目录被跟踪。
- 更新 README，说明协作结构和正式文档边界。

## Verification

- Planned: `git diff --check`
- Result: Passed.
