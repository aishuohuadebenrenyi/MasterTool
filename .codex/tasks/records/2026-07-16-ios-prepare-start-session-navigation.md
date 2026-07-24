# iOS 备课开课按钮无响应修复

## Status

已完成。

## Root Cause

备课页“开课”只调用 `AppStore.start` 创建场次，没有在成功后向 `NavigationStack` 写入现场页路由，因此数据已更新但界面没有反馈。

## Scope

- 开课成功后从备课导航栈进入现场页。
- 请求期间显示“开课中”并禁止重复点击。
- 请求失败保留当前页面，沿用全局错误提示。
- 不修改 Repository、CloudBase action、payload 或小程序代码。

## Verification

- `swift test`：10 项通过。
- iPhone 17 Pro Simulator Debug 构建与启动：通过。
- 开课数据链路：Mock 返回 running session，`activeSession` 写入成功，首页出现“返回当前培训”。
- 导航回归：现场页改为独立布尔导航；最新运行日志不再出现 `comparisonTypeMismatch` 或 Fatal Error。
- `git diff --check`：通过。

## Actual Changes

- `AppStore.start` 返回明确成功状态，失败继续写入全局错误提示。
- 备课页在开课期间显示“开课中”并禁用按钮，避免重复创建或重复导航。
- 成功后通过 `navigationDestination(isPresented:)` 进入 `LiveView`，不再把现场页混入方案/活动模型路由数组。
- 现场页退出后解除开课锁，允许重新进入当前场次。
