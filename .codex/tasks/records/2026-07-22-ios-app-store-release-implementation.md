# iOS/iPadOS App Store 正式发布逐项实施

## 目标

- 按 `specs/ios-app-store-release/tasks.md` 的依赖顺序逐项实现并校验。
- 仓库内可完成项必须提供代码、测试或文档证据，不以 Mock 或静态检查代替真实环境验收。
- 需要用户账号、凭证、外部审批、真机或业务/法务签字的事项集中归档，最终单独交付。

## 假设与边界

- 默认 v1 免费或作为企业服务伴随端，不实现 IAP；该结论仍需用户签字。
- 默认 Apple Pencil 不纳入首发；该结论仍需用户签字。
- 不修改或覆盖工作区中既有的用户改动；与本任务重叠时先识别其意图后做最小增量修改。
- 未提供真实 CloudBase 环境、Apple Developer/App Store Connect 权限前，不声明部署、E2E、TestFlight、签名上传或审核完成。

## 成功标准

- 所有仓库内可完成任务达到各自验收标准并更新任务状态。
- Swift、Node、Debug/Release 构建、发布契约、安全/资源静态检查按改动范围通过。
- 未完成项均有明确阻塞原因、风险、责任人与下一步，并汇总到单一用户处理清单。

## 执行日志

- 2026-07-22：任务开始，建立基线。
- 2026-07-22～23：修正方案草稿/确认契约和服务端 ID 回写；实现邮箱认证、Keychain、令牌刷新/撤销、资料/反馈/复盘、导出/删号和 UGC 举报屏蔽。
- 2026-07-23：接入 AppIcon、Privacy Manifest、方向/窗口声明、商店截图、元数据/隐私/条款草案；补充 XCUITest Target、共享 Scheme 和 CI。
- 2026-07-23：完成部署、UGC、安全、性能、三轮测试文档，并把账号/真机/法务/TestFlight 等外部事项归档到 `IOS-APP/docs/app-store-user-actions.md`。

## 实际交付

- 方案链路：本地 UUID 不再作为服务端 `_id`，草稿与确认 action 分离，完整 phase/activity/reminder payload 有契约测试。
- 认证链路：15 分钟 Access Token、30 天轮换 Refresh Token、当前 Access Token 注销撤销、密码重置全会话失效、Keychain 存储和动态 token provider。
- 账户与内容：资料持久化、客服反馈、复盘保存、数据导出、App 内删号、UGC 过滤/举报/立即隐藏/场次屏蔽。
- 发布工程：1024 不透明 AppIcon、PrivacyInfo、iPhone/iPad 方向、XCUITest、共享 Scheme、CI、iPhone/iPad 最低截图与商店材料草案。
- 正式文档：CloudBase 部署/回滚、安全评估、性能基线、UGC Runbook、三轮测试矩阵和负责人行动清单。

## 验证结果

- `swift test`：29/29 通过。
- `npm run verify:all`：lint、41/41 Node 单测和发布契约通过。
- XCUITest：iPhone 17 Pro 模拟器启动首页冒烟通过；UI Test Target `build-for-testing` 通过。
- Xcode：Release Simulator 构建、未签名 iphoneos Release 编译、Analyze 均通过。
- 资源：Info.plist/PrivacyInfo lint、Asset JSON、AppIcon 1024×1024 无 Alpha、iPhone 1206×2622 与 iPad 2064×2752 JPEG 无 Alpha均通过。
- 安全：`npm audit` 仍报告 `wx-server-sdk@4.0.2` 间接依赖 5 High、1 Moderate，按 P0 阻断保留，未强制降级到漏洞更多的 2.5.3。

## 结论与后续

- 仓库内可代办的实现、测试骨架和发布材料已交付；任务实施阶段完成。
- 产品仍为 **NO-GO**：真实 CloudBase/邮件、签名 Archive、依赖 High 清零、真机兼容/性能、安全 DAST、三轮测试、TestFlight、法务/品牌和 App Store Connect 均需要外部负责人完成。
- 完整状态见 `specs/ios-app-store-release/tasks.md` 第 13 节；唯一人工清单见 `IOS-APP/docs/app-store-user-actions.md`。
