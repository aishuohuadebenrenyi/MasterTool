# iOS 现场全链路与跨端布局收敛

## 目标

- 修复审计记录中的全部 iOS 现场数据链路、状态时序、运行态交互和跨端布局问题。
- 以小程序现有细分 action 和当前数据模型为事实基线，保持 Release 不回退 Mock。
- 按 Requirements -> Design -> Tasks -> 分阶段实现与验证执行。

## 当前状态

- 已完成：Requirements、Design、Tasks 确认，产品代码实现、自动化验证及 iPhone/iPad Simulator 运行态验收。
- 外部阻塞：更新后的 CloudBase 函数尚未部署，且缺少测试环境 HTTPS 网关、有效令牌和 EnvId，因此真实账户 E2E 已单独进入 `todo.md`。

## 变更边界

- 预计涉及：`IOS-APP/`、必要的 `wechat-app/cloudfunctions/ios-api/` 契约适配、测试及协作记录。
- 不修改小程序既有用户流程和 action 语义；不部署 CloudBase；不触碰无关工作区修改。

## 验证计划

- Swift 单元/契约测试。
- iPhone 与现有可用 iPad Simulator 构建和运行态逐工具验证。
- 云函数语法与小程序 `verify:all` 回归。
- `git diff --check` 与变更范围检查。

## 规格确认记录

- 2026-07-16：Requirements 已由用户确认。
- 2026-07-16：Design 已由用户确认。
- 2026-07-16：Tasks 已由用户确认。

## 实施记录

### 阶段一基线

- 2026-07-16：Tasks 已由用户确认，进入 Execution。
- `swift test`：15 项通过。
- `node --check wechat-app/cloudfunctions/live-api/index.js`：通过。
- `wechat-app-support/npm run verify:all`：lint、37 项单元测试、syntax-check 全部通过。
- iPhone 17 Pro（iOS 26.5）Debug 构建：通过。
- iPad（A16，iOS 26.5）Debug 构建：串行重跑后通过；并行构建会争用相同 DerivedData build database，后续设备构建必须串行执行。
- 工作区存在大量本任务之外的既有修改与未跟踪文件；本任务仅触碰规格声明范围。

### 实际实现

- Domain 与 Repository：补齐现场结构化状态，以签到、入口、环节、分组、积分、随机、互动、笔记和结束等细分方法替代不存在的 `live.saveSession`。
- 真实数据适配：显式映射 CloudBase `_id`、`planSnapshot`、phase `minutes`、`groupId` 和日期字段；开课按 `startSession -> getSessionDetail -> 附属列表` 恢复完整场次。
- 服务端：新增并注册 `live.savePhaseState`、`live.listNotes`；复用 `ios-api` 既有 `live.*` 转发，不扩展无关网关逻辑。
- 状态时序：AppStore 统一 async 命令、错误展示、同类写入锁、失败回滚和结束成功后刷新；修复 15/45 分钟目标环节计时错位。
- 页面与工具：iPhone 使用全屏现场页、固定高频动作和 item-driven 工具箱；iPad 使用主现场区加约 360pt inspector，二者共享同一 session 和工具状态。
- 资源与文档：加入欢呼、鼓掌、铃声、主题四类音频，更新 iOS 架构、CloudBase 部署、iOS README 和根 README 当前事实。

### 最终验证

- `swift test`：19 项通过，包含 URLProtocol action/payload 契约、Mock 全工具状态和 15/45 分钟目标环节测试。
- `wechat-app-support/npm run verify:all`：lint、39 项 Node 单元测试、syntax-check 全部通过。
- `node --check wechat-app/cloudfunctions/live-api/index.js`：通过；`node tests/verify-release-contract.js`：通过。
- Xcode：iPhone 17 Pro Debug、iPad A16 Debug、通用 iOS Simulator Release 均构建通过；Release 配置缺失不会回退 Mock。
- iPhone 运行态：实际完成开课、15 -> 45 分钟环节切换、手动签到、分组保存、积分、随机持久化、互动创建、独立计时、四类音效入口、笔记保存和结束确认；结束后全屏正确退出且刷新列表。
- iPad 运行态：全屏主现场区加 inspector 双栏展示通过，无根导航第三栏；工具切换共享同一场次状态。
- 辅助功能：在 `accessibility-extra-extra-extra-large` 下核心计时、高频动作和环节导航仍可达，验证后已恢复 Simulator 为 medium。
- 工程与范围：Xcode 工程 plist 格式通过，`git diff --check` 和敏感信息扫描通过；未发现代码中的 `live.saveSession`。

### 残余风险

- 真实 CloudBase E2E 未执行，不声明为已验证。部署更新后的 `live-api` 并提供测试环境网关、令牌和 EnvId 后，需按任务 16 的相同矩阵复验真实账户与真实数据。
- 未修改或清理工作区中与本任务无关的既有改动。
