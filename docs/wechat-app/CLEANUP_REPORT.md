# wechat-app 清理报告

本文档记录 `wechat-app/` 当前已完成的高确定性清理结果，便于后续维护和继续瘦身。

## 当前保留边界

- `miniprogram/`
  - 当前小程序前端运行目录。
- `cloudfunctions/`
  - 当前保留的云函数目录仅包含：
    - `trainer-api/`
    - `live-api/`
    - `participant-api/`
    - `review-api/`
- `cloudfunctions/*/_shared.js`
  - 当前云函数复用通过各目录下本地 `_shared.js` 完成。
- `tests/unit/`
  - 当前最小自动化回归测试目录。

## 已删除内容

- `cloudfunctions/scheduled-jobs/`
  - 无控制台触发器，且 `daily_metrics` 无页面或云函数消费。
- `cloudfunctions/export-api/`
  - 无运行时代码调用，导出能力由前端本地处理。
- `cloudfunctions/_shared/`
  - 顶层共享目录无运行时代码引用，职责已被各云函数本地 `_shared.js` 覆盖。
- `shared/`
  - 无运行时引用，仅残留在文档与脚本中。
- `miniprogram/project.private.config.json`
  - 冗余私有工程配置副本。
- 未引用静态资源：
  - `miniprogram/static/icons/home-start.png`
  - `miniprogram/static/icons/icon-sound-error.png`
  - `miniprogram/static/icons/icon-state-arrow-right.png`
  - `miniprogram/static/icons/icon-state-check.png`
  - `miniprogram/static/icons/icon-state-cloud.png`
  - `miniprogram/static/icons/icon-state-promise.png`
  - `miniprogram/static/icons/icon-state-tag.png`
  - `miniprogram/static/icons/icon-todo-draft.png`
  - `miniprogram/static/icons/icon-todo-pending.png`
- 冗余页面级组件声明：
  - `miniprogram/pages/live/index/index.json` 中多余的 `entry-code-card`

## 本轮关键结论

- 顶层 `cloudfunctions/_shared/` 不在当前运行主链路中。
- 4 个业务云函数入口都依赖各自目录下的本地 `./_shared.js`。
- 文档和目录结构应以“本地 `_shared.js`”为当前事实，而不是顶层共享目录。

## 验证方式

建议在 `wechat-app/` 下执行：

```bash
npm run lint
npm test
npm run syntax-check
npm run verify:all
```

当前统一校验基线：

- `npm run verify:all` 应通过
- `npm test` 应通过全部 `tests/unit`
- `npm run syntax-check` 应输出 `release contract ok`
