# 2026-07-15 iOS 培训师端全量对齐

## 目标

以当前微信小程序为唯一产品与视觉基线，补齐 iOS 培训师端的备课、现场、反馈、复盘和个人中心；参与者继续使用微信小程序码。

## 边界与假设

- iOS/iPadOS 16+，iPhone 与 iPad 同步首发。
- iOS 真实请求仅经 `ios-api`，不直接读写 CloudBase 数据库。
- 现有测试环境 ID、HTTP 访问地址与密钥由部署阶段以受控配置提供，不能写入仓库。
- 小程序只增加一次性 iOS 绑定码入口；既有页面路径、action 和 `OPENID` 调用语义保持不变。

## 验证

- `swift test` 与 Simulator Debug 构建。
- `node --check` 检查新增/修改云函数。
- `npm run verify:all` 回归小程序。
- `git diff --check`。

## 实际完成

- 新增 `IOS-APP/docs/miniprogram-parity-research.md`，固化 21 条路由、培训师 18 页范围、页面数据链路、视觉规范和差异矩阵。
- 扩展 SwiftUI 培训师端：首页待处理与模板开课、方案/活动编辑、现场八工具状态、结束/反馈、复盘、记录、设置、帮助、关于和法律页。
- iOS Release 未配置 HTTPS 网关与令牌时不再静默使用 Mock。
- 小程序设置页与 `trainer-api` 新增短期、单次的 iOS 绑定码闭环。

## 验证结果

- `swift test`：5 项通过。
- Simulator Debug `xcodebuild`：通过。
- `node --check`：`ios-api`、`trainer-api`、设置页通过。
- `npm run verify:all`：lint、37 项单元测试、发布契约通过。
- `git diff --check`：通过。

## 外部前置

测试环境的 CloudBase `EnvId`、HTTPS 访问地址、函数部署权限和密钥尚未提供；在其完成前，真实账户绑定与真实数据端到端联调不能宣称完成。
