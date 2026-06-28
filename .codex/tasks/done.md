# Done Tasks

## 2026-06-28: 同步 1.0.1 发布内容到 GitHub

- Record: `.codex/tasks/records/2026-06-28-sync-1.0.1-to-github.md`
- Outcome: 将 `1.0.1` 版本说明标记为已发布，补充实际修复项，并准备提交推送到 `origin/main`。
- Verification: `npm run verify:all`, `git diff --check`

## 2026-06-28: 小程序上线反馈逐项修复与验证

- Record: `.codex/tasks/records/2026-06-28-wechat-app-feedback-verification.md`
- Outcome: 修复首页昵称和“我的”页资料不一致，补充本地资料缓存与 `getProfile` 兜底，并逐项验证上线反馈修复点。
- Verification: `npm test`, `npm run verify:all`, `git diff --check`

## 2026-06-26: 建立协作记忆、规则与任务流水体系

- Record: `.codex/tasks/records/2026-06-26-collaboration-memory-rules.md`
- Outcome: 新增 `AGENTS.md`、`.codex/rules/`、`.codex/memory/`、`.codex/tasks/`，并更新 `.gitignore` 和 `README.md`。
- Verification: `git diff --check`

## 2026-06-26: 精简根目录并合并协作与历史资料

- Record: `.codex/tasks/records/2026-06-26-root-directory-consolidation.md`
- Outcome: 将协作记忆和任务流水合并到 `.codex/`，将历史规格合并到 `docs/archive/`，并记录旧实现清单。
- Verification: `git diff --check`

## 2026-06-26: 瘦身 wechat-app 发布目录

- Record: `.codex/tasks/records/2026-06-26-wechat-app-publish-directory-slimming.md`
- Outcome: 将 Node 工具链和单元测试迁到 `wechat-app-support/`，让 `wechat-app/` 只保留发布上传需要的工程文件。
- Verification: `npm run lint`, `npm test`, `npm run syntax-check`, `git diff --check`
