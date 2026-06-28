# wechat-app 清理报告

本文档记录 `wechat-app/` 当前目录边界。当前目标是让 `wechat-app/` 只保留微信开发者工具导入、预览、上传和云函数部署需要的内容。

## 当前保留边界

- `project.config.json`
  - 微信开发者工具工程配置入口。
- `miniprogram/`
  - 当前小程序前端运行目录。
- `cloudfunctions/`
  - 当前 CloudBase 云函数目录，包含 `trainer-api/`、`live-api/`、`participant-api/`、`review-api/`。
- `cloudfunctions/*/package.json`
  - 云函数依赖声明，CloudBase 部署需要保留。
- `project.private.config.json`
  - 微信开发者工具本地私有配置，已被 `.gitignore` 忽略，不属于提交内容。

## 已迁出内容

- `package.json`、`package-lock.json`
  - 已迁至 `wechat-app-support/`，作为测试、Lint、格式化和校验脚本入口。
- `eslint.config.js`、`.prettierrc.json`
  - 已迁至 `wechat-app-support/`。
- `tests/unit/`
  - 已迁至 `wechat-app-support/tests/unit/`。

## 已删除内容

- `wechat-app/node_modules/`
  - 本地开发依赖目录，后续在 `wechat-app-support/` 下安装。
- `wechat-app/.DS_Store`
  - 本地系统文件。
- 历史清理中已删除的非主线云函数、共享目录和未引用静态资源，继续以当前 Git 历史为准。

## 验证方式

在 `wechat-app-support/` 下执行：

```bash
npm run lint
npm test
npm run syntax-check
npm run verify:all
```

当前统一校验基线：

- `npm run verify:all` 应通过。
- `npm test` 应通过全部 `tests/unit`。
- `npm run syntax-check` 应输出 `release contract ok`。
