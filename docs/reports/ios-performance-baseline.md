# iOS 性能基线与待测项

## 代码优先审计结果

2026-07-23 按 SwiftUI 性能审计口径检查状态所有权、视图身份、集合 key、几何布局、主线程副作用和格式化热点。根级 `AppStore`/认证控制器由 `@StateObject` 持有，子页面使用环境注入；现场工具状态由 `LiveView` 单点持有。列表中可变方案环节使用稳定 `phase.id` 的位置已有稳定 key；未发现 `AnyView`、在 `body` 内执行网络/同步 I/O、循环创建 `DateFormatter` 或全局隐式动画。

`LiveView` 仍是最大风险面：它包含自适应 `GeometryReader`、八个工具和大量现场状态。代码审计未证明真实运行帧率，必须用 ETTrace/Instruments 在窄/中/宽 iPad 窗口和高频互动数据下复核。当前不为没有 profile 证据的热点做推测性重构。

## 当前本地证据

- Release iOS Simulator 构建、未签名 iPhoneOS 编译和 Xcode Analyze 通过。
- Release 模拟器 `.app` 约 14 MB，其中主可执行文件约 12.3 MB；该数字不是 App Store 压缩下载体积。
- iPhone 与 iPad 模拟器可启动并完成首页渲染；XCUITest 启动冒烟通过。
- 本机 memgraph 捕获因 CoreSimulator 会话状态异常未形成可用证据；未用模拟器结果替代真机结论。

## Release 真机门禁

每类代表设备使用最终签名 Release build 冷启动至少 10 次，记录 P50/P95，目标均小于 2 秒；同时归档热启动、hang、滚动帧率、CPU、峰值/稳态内存、泄漏、能耗和最终 Archive 压缩/安装体积。任何持续内存增长、主线程 hang 或核心页面明显掉帧均阻断 RC。执行责任与证据要求见 U-013。
