# 瘦身 wechat-app 发布目录

## Status

- Date: 2026-06-26
- Status: Done

## Goal

让 `wechat-app/` 只保留微信开发者工具发布和 CloudBase 云函数部署需要的内容，把测试、Lint、格式化和校验工具链集中到 `wechat-app-support/`。

## Scope

Changed:

- `wechat-app-support/package.json`
- `wechat-app-support/package-lock.json`
- `wechat-app-support/eslint.config.js`
- `wechat-app-support/.prettierrc.json`
- `wechat-app-support/tests/unit/`
- `README.md`
- `AGENTS.md`
- `.codex/rules/`
- `.codex/memory/`
- `docs/release-checklist.md`
- `docs/wechat-app/RELEASE_GUIDE.md`
- `docs/wechat-app/CLEANUP_REPORT.md`

Removed from `wechat-app/`:

- `package.json`
- `package-lock.json`
- `eslint.config.js`
- `.prettierrc.json`
- `tests/`
- `node_modules/`
- `.DS_Store`

## Result

- `wechat-app/` is the publishable WeChat project directory.
- `wechat-app-support/` owns tests, lint, formatting, release checks, and integration support data.

## Verification

- Planned: `npm run lint`, `npm test`, `npm run syntax-check`, `git diff --check`.
- Result: Passed.
