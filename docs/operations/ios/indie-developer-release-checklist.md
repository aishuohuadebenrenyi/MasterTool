# MasterTool 独立开发者上线发布待办清单

更新日期：2026-07-24
文档负责人：独立开发者 / Apple Account Holder
当前结论：**NO-GO**
建议首发模式：**单一 App；v1 免费或企业伴随端；后续在同一 App 增加 Pro 会员**

本文是当前发布工作的主执行清单。详细技术任务见 `specs/ios-app-store-release/tasks.md`，必须由账号、法务、真机或外部测试完成的事项见 `docs/operations/ios/app-store-user-actions.md`。

## 1. 首发范围锁定

### v1 包含

- 邮箱注册、验证、登录、密码重置、会话恢复、注销和账户删除。
- 模板、活动、方案新建/编辑/确认。
- 开课、签到、分组、积分、随机、互动、计时、音效和笔记。
- 结束培训、记录、反馈、复盘和账户数据导出。
- iPhone 与 iPad；iPad 支持全屏、横竖屏、Split View 和 Stage Manager 的基本适配。
- 自由文本 UGC 保留时，同时保留过滤、举报、隐藏、屏蔽、公开联系方式和运营 SLA。

### v1 不包含

- StoreKit、IAP、付费墙、会员商品或 App 内外部购买引导。
- Apple Pencil/PencilKit、hover、手写标注。
- AI 方案生成或 AI 复盘。
- 团队协作、SSO、组织后台和企业数据看板。
- 多语言、本地化营销页面和 App Preview 视频。
- 独立的 `MasterTool Pro` 付费下载 App。

范围变化时必须重新评估排期；不得在提审前临时增加上述能力。

## 2. 已完成的仓库工作

| 项目 | 当前证据 | 状态 |
| --- | --- | --- |
| 方案服务端契约、草稿/确认和服务端 ID 回写 | Swift 契约测试 | 完成 |
| 邮箱认证、Keychain、Access/Refresh Token、刷新和撤销 | Swift 测试及 Node 语法/契约校验 | 代码完成，待真实环境 |
| 资料、反馈、复盘、导出、删号和 UGC 举报屏蔽 | 客户端/云函数代码 | 代码完成，待真实环境 |
| AppIcon、Privacy Manifest、方向和窗口声明 | plist、asset、构建校验 | 完成，待品牌/ASC 复核 |
| Swift 单元/契约测试、XCUITest Target、共享 Scheme、CI | Swift 29 项、Node 41 项、UI 启动冒烟 | 完成 |
| iPhone/iPad 最低截图和商店元数据草案 | releases/ios-personal/draft、metadata 文档 | 草案完成，待最终 RC |
| 部署、安全、性能、UGC、三轮测试文档 | `apps/ios-personal/docs/` | 完成 |

本地完成不等于生产放行。签名 Archive、真实 CloudBase、真机性能、TestFlight 和 App Store Connect 仍须单独验收。

## 3. P0：提交测试前必须完成

| ID | 待办 | 执行人 | 净工时 | 完成证据 | 状态 |
| --- | --- | --- | ---: | --- | --- |
| L-001 | 书面确认 v1 免费/企业伴随端、无 IAP；确认后续采用同 App Pro 会员 | 独立开发者 | 1h | 决策记录 | 待办 |
| L-002 | 确认 Apple Pencil、AI、团队版、多语言、预览视频均延期 | 独立开发者 | 1h | 范围冻结记录 | 待办 |
| L-003 | 确认首发国家/地区、年龄分级、未成年人和中国大陆适用条件 | 独立开发者 + 法务 | 3–6h | 法务/合规结论 | 待办 |
| L-004 | 开通 Apple Developer/ASC，创建 App Record，确认 Bundle ID、Team、证书和 Provisioning | 独立开发者 | 4–8h + 等待 | 签名 Archive | 待办 |
| L-005 | 建立测试/生产 CloudBase、HTTPS 域名、集合、索引、TTL、权限和密钥 | 独立开发者 | 8–16h | 脱敏部署记录 | 待办 |
| L-006 | 部署邮箱发送 Worker及验证/重置 HTTPS 页面 | 独立开发者 | 12–20h | 注册验证、密码重置 E2E | 待办 |
| L-007 | 解决 `wx-server-sdk@4.0.2` 的 5 High/1 Moderate；不得直接使用漏洞更多的强制降级版本 | 独立开发者 + 安全顾问 | 8–24h + 供应商等待 | Critical/High=0，或有期限的正式风险接受 | 阻断 |
| L-008 | 替换 App 中 `mastertool.example`，发布隐私、条款、支持、删除和 UGC 联系页面 | 独立开发者 + 法务 | 8–14h | 公网 HTTPS URL | 待办 |
| L-009 | 指定 UGC 联系邮箱和当班人，演练过滤、举报即隐藏、屏蔽和工单关闭 | 独立开发者 | 4–6h | 演练记录 | 待办 |
| L-010 | 用真实账号完成登录→方案→开课→扫码→八工具→结束→复盘→导出→删号 E2E | 独立开发者 | 16–24h | 用例、requestId、脱敏日志 | 待办 |

P0 任一项未完成时保持 **NO-GO**。

## 4. P1：Release Candidate 前必须完成

### 4.1 精简兼容矩阵

独立开发者不需要覆盖所有历史机型，采用代表矩阵：

| 设备/系统 | 主要验证 |
| --- | --- |
| 最低支持 iOS 16 的一台 iPhone 真机或可信设备云 | 安装、启动、登录、主流程和 API 可用性 |
| 当前主流标准尺寸 iPhone | 完整功能、弱网、动态字体、VoiceOver |
| 最新正式 iOS 的 Max iPhone | 大屏布局、性能和最终 RC |
| iPad 11 英寸 | 横竖屏、Split View 窄/中/宽、键盘 |
| iPad 13 英寸或模拟器 + 一次真机抽样 | Stage Manager、宽屏现场、旋转和恢复 |

没有 iOS 16 本地运行时，可以使用一条可信设备云证据代替购买旧设备；最低版本不能只靠“编译成功”判定。

### 4.2 精简三轮测试

| 轮次 | 范围 | 建议投入 | 放行条件 | 状态 |
| --- | --- | ---: | --- | --- |
| R1 功能/真实数据 | 在测试 CloudBase 跑一遍完整业务链路；覆盖失败、重试和删号 | 20–28h | Blocker/Critical=0；P0/P1 缺陷回归 | 待办 |
| R2 兼容/非功能 | 代表设备矩阵、弱网、性能、安全、可访问性 | 24–36h | 安全 High=0；无持续卡顿/内存增长 | 待办 |
| R3 TestFlight RC | 全新安装、升级、登录恢复、审核账号、隐私链接、后台恢复 | 16–24h + 5–7天 | 同一 RC build 冻结；关键反馈关闭 | 待办 |

三轮共用同一套核心冒烟用例，不维护三套重复用例；每轮增加自己的专项检查。修复后只回归受影响范围加核心冒烟。

### 4.3 性能、安全和资源

| ID | 待办 | 建议投入 | 完成证据 | 状态 |
| --- | --- | ---: | --- | --- |
| L-011 | 最终 Release 真机冷启动 ≥10 次，记录 P50/P95；目标 P95 <2s | 6–10h | 原始数据和汇总 | 待办 |
| L-012 | Instruments/ETTrace/Leaks 抽查首页、方案长列表和现场高频互动 | 8–12h | trace、截图和结论 | 待办 |
| L-013 | 聚焦安全测试：鉴权、IDOR、Token 重放、限流、TLS、日志/PII、导出和删号 | 12–20h | 安全报告；Critical/High=0 | 待办 |
| L-014 | Xcode Privacy Report 与 ASC App Privacy 对照 | 2–4h | 对照表 | 待办 |
| L-015 | 最终 Archive 检查签名、调试资源、敏感配置、包体和出口合规 | 4–6h | Archive/Validate 成功 | 待办 |

## 5. P1：商店材料与 App Store Connect

| ID | 待办 | 执行人 | 净工时 | 完成证据 | 状态 |
| --- | --- | --- | ---: | --- | --- |
| L-016 | 品牌确认 AppIcon，归档 WAV、字体、模板、图标和截图授权 | 独立开发者 + 品牌/法务 | 4–8h | 授权台账 | 待办 |
| L-017 | 最终 RC 制作每种设备 3–5 张截图；不制作视频 | 独立开发者 | 8–12h | ASC 预览无裁切/Alpha | 待办 |
| L-018 | 完成名称、副标题、描述、关键词、分类、版权和版本说明 | 独立开发者 | 4–6h | ASC 元数据无空项 | 待办 |
| L-019 | 准备稳定审核账号、演示数据和逐步审核说明 | 独立开发者 | 3–5h | 非开发人员可按说明完成主流程 | 待办 |
| L-020 | 填写 App Privacy、年龄分级、出口合规、DSA trader、地区和中国大陆条件 | 独立开发者 + 法务 | 6–10h + 等待 | ASC 无红色阻断 | 待办 |
| L-021 | 处理协议、税务和银行；免费版不适用时归档结论 | 独立开发者 | 2–6h + 等待 | Agreements 状态/不适用记录 | 待办 |

## 6. External TestFlight 精简方案

- 邀请 5–10 名真实培训师，不追求大量普通体验用户。
- 至少包含：低频个人培训师、高频职业培训师、iPad 用户、弱网/企业网络用户。
- 测试 7–10 天；每位测试者至少创建方案并完成一场模拟培训。
- 收集五类问题：无法完成任务、崩溃、数据丢失、现场卡顿、理解困难。
- 小样本阶段不把 `99.9%` 当作统计上充分的市场证明；提审门禁是无已知可复现崩溃、Organizer/TestFlight 无未关闭严重崩溃，发布后继续观察 crash-free sessions。
- 体验建议或低优先级功能请求可以进入后续版本，不阻断 RC；数据丢失、认证、删号、付费误导、现场不可用必须关闭。

## 7. 后续 Pro 会员：现在预留，v1 不上线

预计预留投入：**12–24h**。目标是防止未来重写账户和全部页面，不是现在创建商品或付费墙。

| ID | 现在要做 | 验收标准 | 状态 |
| --- | --- | --- | --- |
| M-001 | 确定单 App 模式：`Free + Pro + Enterprise` | 不规划独立付费 Pro App | 决策待签字 |
| M-002 | 定义统一 `Entitlement`：tier、features、source、status、startsAt、expiresAt | 页面不直接依赖 StoreKit 商品 ID | 待办 |
| M-003 | 使用能力门禁而不是散落 `isPro`：如无限方案、高级导出、高级复盘、品牌模板 | 所有付费能力可由同一权益服务查询 | 待办 |
| M-004 | 预留服务端权益/交易/事件集合和幂等键 | 支持 Apple、Enterprise、Legacy 多来源 | 待办 |
| M-005 | 保证账户有稳定 UUID，未来可作为 StoreKit `appAccountToken` | Apple 交易可映射 MasterTool 用户 | 待办 |
| M-006 | 定义现有用户迁移和 grandfather 策略 | 会员上线不删除、隐藏或突然收回历史数据 | 待办 |
| M-007 | 定义免费版和 Pro 边界 | 免费用户可完整完成一场小型培训 | 待办 |
| M-008 | 加入不含敏感内容的产品事件：首次建方案、首次开课、30天复用、触达方案上限、导出意向 | 能判断是否具备付费需求 | 待办 |

建议免费版保持：最多 3 个可编辑方案、基础现场工具、有限历史记录和基础复盘。Pro 候选能力：无限方案/历史、高级模板、PDF/PPT/Excel 导出、自定义品牌、高级分析、长期云同步和未来 AI。

不要按参与人数在现场临时设付费墙；不要在培训进行中中断用户。额度提示和升级决策应发生在开课前、方案数量达到上限时，或使用高级导出时。

### 会员版本正式开发时再做

- 在一个订阅组内创建月度、年度两个同权益商品。
- StoreKit 2 购买、恢复购买和管理订阅。
- App Store Server API、Server Notifications V2、JWS 验证和通知幂等。
- 退款、撤销、续订失败、Billing Grace Period、升级/降级和跨设备恢复。
- Paid Apps Agreement、税务、银行和 Small Business Program。

## 8. 建议排期

以下按一名独立开发者全职、外部法务/安全按需协助估算：

| 阶段 | 建议周期 | 目标 |
| --- | --- | --- |
| W1 | 2026-07-24～07-31 | 冻结范围、Apple 账号、域名/法务、CloudBase 基础环境 |
| W2–W3 | 2026-08-01～08-14 | 部署生产同构环境、邮件、真实 E2E、关闭 P0 |
| W4 | 2026-08-15～08-21 | R1 功能测试及修复 |
| W5 | 2026-08-22～08-28 | R2 兼容/性能/安全及修复 |
| W6 | 2026-08-29～09-04 | Internal/External TestFlight RC |
| W7 | 2026-09-05～09-11 | 最终截图、元数据、Archive、ASC 校验和提交 |
| 审核/发布 | 2026-09-12～10-02 | 审核值守、一次拒审修复窗口、分阶段发布 |

剩余净投入约 **120–200 人时**，不含供应商修复、法务、税务、Apple 审核和测试者等待。`wx-server-sdk` High 漏洞、真实环境或签名权限每延迟一周，提交时间相应顺延。

## 9. 最终 GO/NO-GO 清单

只有以下全部勾选才能提交审核：

- [ ] v1 范围和免费/企业伴随端模式已冻结，App 内无购买或外部购买引导。
- [ ] 生产 CloudBase、邮件和审核账号持续可用。
- [ ] 注册、登录、刷新、注销、重置、导出和删号真实 E2E 通过。
- [ ] UGC 过滤、举报、隐藏、屏蔽、联系方式和处置 SLA 可演示。
- [ ] 依赖、安全扫描 Critical/High 为 0，或例外有正式批准和到期日。
- [ ] 最低 iOS、最新 iOS、代表 iPhone/iPad 和窗口矩阵通过。
- [ ] Release 真机启动 P95 <2s，无已知崩溃、数据丢失或持续内存增长。
- [ ] R1、R2、R3 与 External TestFlight 的阻断问题全部关闭。
- [ ] 隐私政策、服务条款、支持和删除页面为真实 HTTPS URL。
- [ ] App Privacy、Privacy Manifest 和实际生产请求一致。
- [ ] AppIcon、截图、版权、年龄分级、出口合规和审核说明完成。
- [ ] 最终签名 Archive 上传并通过 App Store Connect Validate。

全部完成后状态改为 **GO**，提交审核并开启发布后崩溃、API、邮件、UGC 和用户反馈监控。

## 10. 关联文档

- 详细实施任务：`specs/ios-app-store-release/tasks.md`
- 外部负责人事项：`docs/operations/ios/app-store-user-actions.md`
- 三轮测试矩阵：`docs/operations/ios/release-test-matrix.md`
- CloudBase 部署：`docs/operations/ios/cloudbase-deployment.md`
- 安全评估：`docs/reports/ios-security-assessment.md`
- 性能基线：`docs/reports/ios-performance-baseline.md`
- UGC Runbook：`docs/operations/ios/ugc-moderation-runbook.md`
- App Store 元数据：`releases/ios-personal/draft/app-store-metadata-zh-CN.md`
- App Privacy 申报：`releases/ios-personal/draft/app-privacy-disclosure.md`

## 11. Apple 官方参考

- App Review Guidelines：https://developer.apple.com/app-store/review/guidelines/
- Auto-renewable Subscriptions：https://developer.apple.com/app-store/subscriptions/
- StoreKit 2：https://developer.apple.com/storekit/
- Account Deletion：https://developer.apple.com/support/offering-account-deletion-in-your-app/
- App Store Small Business Program：https://developer.apple.com/app-store/small-business-program/
