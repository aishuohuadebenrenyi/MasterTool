# 历史演进

本文档集中保存 MasterTool 的历史演进背景。当前正式产品和发布说明以根目录 `README.md`、`docs/product-overview.md`、`docs/user-manual.md` 和发布类文档为准。

## 演进摘要

项目早期验证过一套跨端前端和独立后端方案，用于探索产品方向、页面结构、现场流程和数据模型。随着产品目标收敛到微信小程序现场使用，当前主线已经切换为微信原生小程序和 CloudBase 云函数。

当前主线保留的核心判断：

- 现场使用优先，交互应贴近微信小程序环境。
- 核心业务状态机放在云函数中。
- 签到、分组、积分、互动、反馈和复盘都围绕 `sessionId` 组织。
- 培训师数据按内部用户身份隔离。
- 参与者入口通过小程序码进入，并由云函数控制写入。

## 当前正式主线

- 小程序代码：`wechat-app/miniprogram/`
- 云函数代码：`wechat-app/cloudfunctions/`
- 测试与联调资料：`wechat-app-support/`
- 发布文档：`docs/wechat-app/RELEASE_GUIDE.md`
- 产品说明：`docs/product-overview.md`
- 用户手册：`docs/user-manual.md`

## 历史资料

以下资料保留用于查看演进过程，不作为当前正式实现依据：

- `docs/archive/cloudbase-deployment-migration-plan.md`
- `docs/archive/legacy-mini-program-function-flow-audit.md`
- `docs/beta-implementation-decisions.md`
- `specs/cloudbase-rebuild/requirements.md`
- `specs/cloudbase-rebuild/design.md`
- `specs/cloudbase-rebuild/tasks.md`

这些文档包含早期评估、阶段性判断、任务拆分和过渡期实现决策。阅读时请以当前正式文档为准。

## 维护规则

- 正式说明、用户手册、发布手册只描述当前真实状态。
- 过渡背景、架构取舍、已废弃路径和旧实现信息写入历史资料。
- 如果后续出现新的重大方向调整，请先更新本文，再调整正式文档入口。
