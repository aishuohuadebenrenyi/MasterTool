# 小程序上线反馈逐项修复与验证

## Status

- Date: 2026-06-28
- Status: Done

## Goal

逐一校验上线反馈修复是否仍然有效，并修复首页昵称与“我的”页资料不一致的问题。

## Assumptions

- 昵称以 `trainer_profiles.displayName` 为唯一真实来源。
- 首页必须在汇总接口超时或云函数尚未部署到当前环境时，优先复用“我的”页已加载或已保存的资料。
- 本次只修复昵称一致性并验证既有反馈项，不扩大到其他 UI 重构。

## Scope

Changed:

- `wechat-app/miniprogram/pages/home/index/index.js`
- `wechat-app/miniprogram/pages/mine/index/index.js`
- `wechat-app-support/tests/unit/home-profile.test.js`

Verified:

- 开课防重
- 我的页统计默认值和反馈提交草稿清空
- 签到小程序码生成保护
- 复盘完成提交和回首页
- 活动详情编辑入口
- 参与者反馈、互动提交和现场互动重复提交保护

## Result

- 首页 `onShow` 先读取本地资料缓存，再并行拉取 `getProfile` 和首页汇总，避免接口超时后停留在默认 `张老师`。
- “我的”页加载或保存昵称后写入同一份本地缓存，切回首页时立即一致。
- 首页问候继续按当前小时显示早上、下午、晚上。
- 上线反馈修复点通过源码核对和自动化校验。
- 针对云端 `generateMiniCode is not a function` 日志，在 `live-api` 增加本地兜底生成逻辑，避免 `_shared.js` 云端版本未同步时二维码生成直接失败。
- 优化签到入口展示：二维码卡片内容居中、默认隐藏长路径、签到弹层正文使用明确高度以恢复滚动。
- 增强参与者扫码入口解析，兼容直接 `sessionId`、裸 `scene`、编码键值 scene、`q` URL 和嵌套 scene，避免扫码进入后丢失场次导致“签到入口无效”。
- 将正式入口传播方式改为 URL Link 短链接：签到、反馈、互动入口生成时同时返回二维码和 `urlLink`，复制按钮复制短链接而不是内部页面路径。
- 互动小程序码改用短 `entryKey + joinCode` scene，避免 `interactionId + code` 超过微信小程序码 scene 长度限制；参与者互动页和接口保留旧参数兼容。
- 二维码和 URL Link 改为独立生成、分别记录失败原因；只在两者都失败时返回入口生成失败，避免短链接权限或接口异常拖垮可用的小程序码。
- 增强参与者签到/反馈入口解析：兼容 `scene`、`q`、`query`、`path`、`url` 中的裸场次、嵌套 scene 和 `sessionId/sid/session/id` 参数，修复扫码后页面打开但提交时报“签到入口无效”的问题。

## Verification

- Planned: `npm test`
- Result: Passed, 37 tests.
- Planned: `npm run verify:all`
- Result: Passed.
- Planned: `git diff --check`
- Result: Passed.
