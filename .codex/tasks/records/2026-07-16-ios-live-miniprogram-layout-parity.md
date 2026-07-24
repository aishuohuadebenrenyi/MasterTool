# iOS 现场页按小程序视觉与交互收敛

## 目标

- iPhone 现场页采用小程序的深色信息层级、四个固定高频入口和八项工具箱。
- iPad 保留右侧工具检查器，与 iPhone 共享现场业务状态和工具内容。
- “退出现场”二次确认后调用 `live.abandonSession`，成功回退方案并离场，失败保留当前现场。

## 范围与边界

- 修改 `IOS-APP/` 中现场 SwiftUI、Repository/AppStore、Swift 测试和 iOS 文档。
- 不修改小程序页面、现有 CloudBase action 或部署环境。
- 保留 Release 不回退 Mock、参与者继续使用微信入口及现有无关工作区修改。

## 成功标准

- 主计时单击与双击互斥；双击只增加 5 分钟，显式控制仍可用。
- iPhone 固定签到、分组、积分、工具箱与环节导航；工具箱以两列网格展示全部八项工具。
- 签到、分组、积分、独立计时和笔记的关键动作固定在 Sheet 底部安全区。
- 放弃场次 HTTP/Mock/AppStore 状态链路有自动化测试。
- Swift 测试、iPhone/iPad Debug、Simulator Release、小程序回归、发布契约和差异检查通过。

## 当前状态

- 2026-07-16：实现、自动化验证与 iPhone/iPad Simulator 运行态验收完成。

## 实际修改

- 现场主画布固定为 `#1A1A2E`，环节进度、标题、活动、主计时和关键提醒分层展示。
- iPhone 固定四个高频入口与环节导航；普通字号四列，辅助功能字号两列。工具箱以不透明系统内容面的两列网格展示全部八项工具。
- 工具详情继续使用单一 item-driven Sheet 和内部 `NavigationStack`；签到、分组、积分、独立计时和笔记操作固定在底部安全区。
- 主计时使用互斥单击/双击手势，并将动作规则放入 `LivePreferences` 以便单元测试；新安装默认启用双击加时。
- `TrainingRepository`、CloudBase/Mock/Unavailable Repository 与 `AppStore` 补齐放弃场次命令；服务端继续复用现有 `live.abandonSession`，未修改云函数。
- iPad 保留主现场区与右侧检查器；检查器工具标题不再覆盖方案导航标题。
- 同步 iOS README、架构与小程序对齐基线。

## 验证记录

- `swift test`：23 项通过；新增放弃场次 HTTP/Mock 契约及计时点击互斥测试。
- iPhone 17 Pro（iOS 26.5）Debug：深色首屏、四入口、八工具箱、固定工具动作、退出取消/确认与方案恢复通过。
- iPad Air 13-inch（iOS 26.5）Debug：主区 + 右侧检查器、方案标题和固定检查器动作通过。
- 通用 iOS Simulator Release：构建通过，Release 边界未改动。
- 最大辅助功能字号：四入口切换为 2×2，计时与环节导航仍可达；验证后恢复 Medium。
- `wechat-app-support/npm run verify:all`：lint、39 项单元测试、syntax-check 通过。
- `node tests/verify-release-contract.js`：通过。
- `git diff --check`：通过。
- 未执行真实 CloudBase E2E：缺少测试环境 HTTPS 网关、有效令牌与 EnvId，且本任务不部署云函数。
