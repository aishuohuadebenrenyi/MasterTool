# 独立开发者上线发布待办文档

## 目标

- 将 iOS/iPadOS 发布审计、独立开发者精简方案和后续 Pro 会员方向合并为一份主执行清单。
- 明确首发阻断、可延后范围、精简三轮测试、会员预留和 GO/NO-GO 标准。
- 保留原详细任务和外部负责人清单作为可追溯附件，避免重复维护不同结论。

## 默认决策

- 只维护一个 `MasterTool` App。
- v1 免费或作为企业服务伴随端，不销售 App 内数字内容，不接 IAP。
- 后续在同一 App 内采用 `Free + Pro 会员 + Enterprise 授权`，不另做一次性付费专业版。
- 首发仅邮箱密码登录；不接第三方登录。
- Apple Pencil、AI、团队协作、多语言和 App Preview 不阻断 v1。

## 验收

- 主清单含任务 ID、优先级、执行人、工时、状态、完成证据和建议排期。
- 明确哪些步骤可以精简、哪些不可省，以及后续会员现在需要预留什么。
- 文档引用当前仓库实际状态，不把本地实现误写成生产环境已完成。

## 结果

- 2026-07-24：新增 `IOS-APP/docs/indie-developer-release-checklist.md`，并将原 `app-store-user-actions.md` 标记为外部事项附件。
- Verification：`git diff --check`。
