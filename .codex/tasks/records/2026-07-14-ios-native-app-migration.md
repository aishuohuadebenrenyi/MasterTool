# iOS 原生应用迁移

- 日期：2026-07-14
- 状态：已完成（基础实现）
- 目标：建立 iPhone/iPad 兼容的 SwiftUI 培训师端，并在不改变小程序客户端调用契约的前提下提供 CloudBase iOS 受控入口。

## 成功标准

- `IOS-APP/` 独立承载 iOS 工程、正式 iOS 文档与验证。
- SwiftUI 工程可编译，且以 Mock 数据完整演示模板到复盘主链路。
- 四个既有云函数继续支持微信 `OPENID` 调用；新增 iOS 令牌断言仅由 HTTP 网关传入。
- 小程序静态/单元验证通过。

## 验证计划

- `swift test`（`IOS-APP/`）
- `xcodebuild` Debug 构建（iOS 模拟器）
- `npm run verify:all`（`wechat-app-support/`）
- `git diff --check`

## 实际修改

- 建立 `IOS-APP/`：Swift Package 测试目标、可打开的 Xcode 工程、iOS 16+ SwiftUI 自适应导航、Mock Repository 和培训师主链路页面。
- iPhone 使用底部三 Tab 和现场 sheet；iPad 使用侧栏和现场检查器。Mock 数据支持方案保存、已确认方案开课、签到/笔记、结束和复盘状态。
- 新增 `ios-api` HTTP 云函数：邮箱账号、短期令牌、受控领域函数转发和一次性微信账户绑定契约。
- 四个既有云函数保持原 action 路径，并在有效内部 HMAC 断言存在时解析 iOS 内部身份；微信 `OPENID` 路径未改。
- iOS 专属文档记录架构、CloudBase 部署、审核风险和测试矩阵。

## 验证结果

- `swift test`：3 项核心状态机测试通过。
- `xcodebuild -project ImprovToolIOS.xcodeproj -scheme ImprovToolIOS -sdk iphonesimulator ... build`：通过。
- `node --check`：`ios-api` 与四个共享身份模块通过。
- `npm run verify:all`：lint、37 项小程序单元测试和发布契约检查通过。
- `git diff --check`：通过。

## 后续事项

- 部署 `ios-api`、集合、索引和环境变量后，才能将客户端从 Mock Repository 切换到真实 CloudBase。
- Sign in with Apple 的服务端 JWK 验签、账户删除真实删除流程，以及 UGC 审核/举报/屏蔽运营闭环需在 App Store 提交前完成。
- 由于不改动小程序客户端，微信历史账户的一次性绑定码目前只定义了服务端契约；需另行批准后在小程序或运营后台增加生成入口。
