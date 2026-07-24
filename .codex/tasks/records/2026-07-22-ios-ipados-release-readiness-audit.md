# iOS/iPadOS 正式发布准备度全量审计

## 目标

- 系统梳理当前 iPhone 与 iPad 原生应用的实际开发进度。
- 对照当前 App Store 官方要求，识别正式发布前的功能、质量、合规、资源、性能、安全与测试缺口。
- 输出带优先级、工时、责任角色、依赖和发布时间估算的完整待办清单。

## 范围与判定标准

- 范围：`IOS-APP/` 客户端、相关 `ios-api` / CloudBase 契约、测试与发布文档，以及 App Store Connect 外部准备事项。
- “已完成”必须有当前代码、配置、自动化测试、运行记录或正式文档证据。
- 无法从仓库证明的崩溃率、真机性能、TestFlight 反馈、账号协议、税务和银行状态均标记为“待后台或人工确认”。
- 静态代码风险与运行态确认缺陷分级记录，不混为一谈。

## 验证计划

- 盘点工程目标、部署版本、设备族、方向、权限、资源、核心流程和 iPad 专属能力。
- 执行 Swift 测试、Debug/Release 模拟器构建及可用的运行态检查。
- 检查测试覆盖、发布配置、隐私清单、签名/IAP/账号删除与后台契约。
- 对照苹果当前官方审核、隐私、提报和 SDK 要求。
- 至少运行 `git diff --check` 验证本次任务记录。

## 当前状态

- 审计完成。当前客户端可作为 Debug/Mock 产品原型和真实接口骨架继续开发，但不满足 App Store 提交条件。

## 结论摘要

- 启发式进度：核心界面与 Mock 主流程约 70%；真实生产业务闭环约 45%；整体发布准备度约 25%–35%。比例仅用于排期，不代表测试覆盖率。
- 已完成：iPhone/iPad 单 Target、iOS/iPadOS 16 部署目标、iPad 自适应根导航、现场宽度分支、备课/活动/开课/现场八工具/结束/记录等主要界面与 Repository 骨架。
- 发布阻断：Release 没有客户端登录、令牌刷新和安全存储；方案新建/确认/活动快照的真实契约不完整；复盘保存、反馈、资料持久化、导出和删号缺失；真实 CloudBase 未部署 E2E。
- 提报阻断：签名被关闭、无 Development Team/Entitlements、无 AppIcon 资源、无隐私清单、无正式隐私政策和支持链接、无商店截图/元数据、无 TestFlight 记录。
- 质量缺口：没有 iOS App/UI Test Target、没有最低 iOS 16 或主流版本运行矩阵、没有三轮发布测试、没有真机启动/内存/卡顿数据、没有崩溃率基线。

## 关键证据

### 功能与真实数据链路

- `TrainingRepository` 已覆盖方案、活动、开课、签到、分组、积分、随机、互动、笔记、退出、结束和记录等现场主链路。
- `CloudBaseTrainingRepository.savePlan` 无论状态均调用 `trainer.savePlanDraft`，因此客户端“确认方案”不会在服务端确认。
- 新方案默认使用本地 UUID，保存 payload 始终发送 `_id`；服务端把非空 `_id` 视为更新，导致从空白或模板新建方案无法在真实环境创建。保存结果中的服务端 `planId` 也未回写。
- 方案保存 payload 只包含环节名称和分钟数，未发送活动、提醒等完整快照，保存现有方案可能丢失环节活动。
- Release 仅从 Info.plist 读取固定 endpoint/token；客户端无注册、登录、续期、退出和 Keychain。后端 token 仅有效一小时，固定 token 方案不可发布。
- 后端存在邮箱注册/登录和微信绑定骨架，但客户端没有入口；后端没有 Apple 登录处理、密码重置、邮箱验证、速率限制和账号删除。
- 资料编辑只改内存；复盘完成、支持反馈、数据导出、账户删除均为禁用占位；`FeedbackView` 未被导航引用且不能生成反馈入口。
- 记录 DTO 只保存参与者数量到 `plan.participantCount`，但 UI 读取 `session.participants.count`，真实记录页会显示 0 人。

### iPad 专属能力

- 已有 `NavigationSplitView`、regular size class、700/1100pt 宽度分支、响应式工具工作区和动态字体下工具列调整。
- 没有 PencilKit、`UIPencilInteraction`、hover 或 Apple Pencil 手写/标注逻辑；若产品要求 Pencil，这是未开发模块。若无明确业务价值，可作为非首发能力。
- 没有独立多窗口 scene；Stage Manager 单窗口缩放可依赖现有宽度布局，但尚无运行态验收。
- 设备 Release 构建警告“除非要求全屏，否则必须支持全部方向”；Info.plist 没有方向声明。当前不能证明 Split View/Stage Manager 合规。

### 构建、测试、性能与安全

- `swift test`：23 项通过；这是 SwiftPM Core 测试，不是 iOS App/UI 测试。
- `npm run verify:all`：39 项 Node 测试、Lint、语法和发布契约通过。
- iOS Simulator Debug、Simulator Release、iphoneos Release 编译通过；Xcode `analyze` 通过。
- 当前使用 Xcode 26.6 / iOS 26.5 SDK 构建，满足 2026-04-28 起 iOS/iPadOS 26 SDK 的上传基线；部署目标为 iOS/iPadOS 16.0。
- 未启动模拟器，未新增运行态检查；本机只有 26.3–26.5 runtime，不能证明 iOS 16/17/18 最低与主流版本兼容。
- 未签名 device Release `.app` 约 5.1 MB，无当前包体风险；仍需以 Archive/App Store thinning 后数据为准。
- 无启动时间、hang、帧率、内存峰值、泄漏或能耗数据，不能确认“启动低于 2 秒”。
- 无 TestFlight/App Store 指标，不能确认崩溃率低于 0.1%。
- iOS 客户端无第三方 Swift 依赖；但 `ios-api` 使用未锁定的 `wx-server-sdk: latest` 且无 lockfile。未完成 SAST/DAST、依赖漏洞扫描、渗透测试或隐私报告。
- 仓库未发现硬编码真实 secret，但把生产 access token 放入 Info.plist 的设计会把凭证打包进客户端，必须移除。

### 提报资源与合规

- 工程设置引用 `AppIcon`，但仓库没有 Asset Catalog/AppIcon；也没有 `PrivacyInfo.xcprivacy`、entitlements、StoreKit 配置或本地化资源。
- 应用内隐私页面仍显示“发布前替换”；无正式隐私政策、服务条款、数据保留、支持联系方式和隐私选择 URL。
- 互动/反馈属于 UGC；当前未发现服务端敏感内容过滤、举报、屏蔽、处置 SLA 和公开联系信息。
- 无截图、预览视频、产品描述、关键词、Subtitle、Support URL、版权证明和审核备注材料。
- 无法从仓库核实 Developer Program、App Store Connect App Record、协议、税务、银行、DSA trader、出口合规或中国大陆 ICP 状态。
- 当前没有 IAP。若 v1 完全免费或仅作为已购企业服务的伴随端，可在确认商业模式后标记不适用；若向个人销售 App 内数字功能/订阅，则必须设计 StoreKit/IAP。
- 产品不是面向儿童的 Kids App；仍需完成年龄分级问卷。若实际用于未成年人培训，还需法律评估监护同意、数据最小化和 UGC 保护。

## 发布前工作包

| 优先级 | 工作包 | 估算 | 责任角色 | 完成标准 |
| --- | --- | ---: | --- | --- |
| P0 | 修复方案新建 ID、确认 action、完整 phase/activity payload 与响应回写 | 24–40h | iOS + 后端 | 真实环境新建、编辑、确认、开课全通过且有契约测试 |
| P0 | 完成客户端认证、令牌刷新/注销、Keychain；后端邮箱验证/重置/限流；决定是否接入 Apple 登录 | 56–88h | iOS + 后端 + 安全 | Release 不含固定 token，登录跨冷启动、过期和撤销场景通过 |
| P0 | 部署 `ios-api` 与领域函数、集合/索引/密钥，完成真实 CloudBase 全链路 E2E | 32–48h | 后端 + DevOps + QA | 模板到复盘、参与者扫码、弱网/失败回滚全部留证 |
| P0 | 补齐资料持久化、反馈入口/统计、复盘保存、支持反馈 | 40–64h | iOS + 后端 | 不再存在面向用户的禁用占位或无效入口 |
| P0 | 实现账户删除与数据导出、保留规则、删除审计和 Apple token 撤销（如适用） | 32–56h | iOS + 后端 + 法务 | App 内可发起完整删号，关联数据按政策处理 |
| P0 | UGC 过滤、举报、屏蔽、处置后台/SLA 与公开联系方式 | 40–72h | 后端 + 运营 + 法务 + iOS | 满足审核指南 1.2，演示账号可验证 |
| P0 | 配置正式 Bundle ID、Team、签名、Entitlements、Archive/上传流水线 | 16–24h | iOS + DevOps + Account Holder | 可生成签名 Archive 并通过 App Store Connect 校验 |
| P0 | 制作并接入 AppIcon，添加隐私清单并生成 Xcode Privacy Report | 16–24h | 设计 + iOS + 隐私负责人 | Archive 包含有效图标/manifest，隐私报告与申报一致 |
| P0 | 修复方向声明并验证 iPad Split View/Stage Manager | 24–40h | iOS + QA | iPad mini/11/13、横竖屏及窄宽窗口无阻断 |
| P1 | 建立 iOS Unit/Integration/UI Test Target 与核心冒烟自动化 | 40–64h | iOS + QA | 登录、备课、开课、八工具、结束、复盘可自动回归 |
| P1 | 最低与主流 OS/设备矩阵：iOS 16、17、18、26；紧凑/标准/Max iPhone 与三类 iPad | 32–56h | QA + iOS | 每个发布支持版本至少一台真机或可信设备云记录 |
| P1 | 性能基线与优化：冷/热启动、hang、帧率、CPU、内存、泄漏、能耗 | 32–56h | iOS + QA | Release 真机 P50/P95 冷启动 <2s，无持续掉帧/泄漏 |
| P1 | 安全基线：SAST、依赖锁定/审计、API 限流、鉴权越权、日志/PII、TLS、重放和 DAST | 40–72h | 安全 + 后端 + iOS | Critical/High 为 0，中危有处置计划和复测记录 |
| P1 | Accessibility、动态字体、VoiceOver、对比度、键盘和本地化检查 | 24–40h | iOS + QA + 设计 | 核心路径在最大字号和 VoiceOver 下可完成 |
| P1 | 正式隐私政策、条款、数据保留/删除、支持页、隐私标签和出口合规 | 24–40h | 法务/隐私 + 产品 + Account Holder | App 内与 App Store Connect 链接有效且口径一致 |
| P1 | 商业模式/IAP 决策；个人数字订阅则接入 StoreKit，企业/免费则准备审核说明 | 6–12h；若 IAP 再加 48–80h | 产品 + 法务 + iOS + 财务 | 商业模式与审核指南 3.1 一致 |
| P1 | 版权与未成年人评估：WAV、模板、品牌、截图素材授权；年龄分级/Kids 判定 | 16–32h | 法务 + 产品 + 设计 | 权利证明归档，年龄分级问卷完成 |
| P1 | 制作商店资源：1–10 张 iPhone/iPad 截图、可选预览视频、图标与审核附件 | 32–48h | 设计 + 产品 + QA | 尺寸、内容真实性、虚构数据和版权均通过检查 |
| P1 | 完成元数据：名称/副标题、描述、关键词、分类、版权、Support/Marketing URL、审核账号与备注 | 16–24h | 产品 + ASO + 法务 | App Store Connect 所有必填项完成且与版本一致 |
| P1 | Developer/App Store Connect 后台核验：会员、App Record、角色、协议、DSA、区域、ICP（中国大陆条件项） | 8–16h + 外部等待 | Account Holder + 法务 | 后台无红色阻断状态 |
| P1 | 税务与银行：仅付费 App/IAP/收款需要；免费 v1 记录“不适用”依据 | 4–12h + 审核等待 | Account Holder + 财务 | Paid Apps Agreement/税表/银行为 Active，或确认免费不需要 |
| P1 | 第 1 轮全量测试：功能与真实数据回归 | 40–64h | QA + 产品 + 开发 | P0/P1 缺陷闭环，完整矩阵报告 |
| P1 | 第 2 轮全量测试：兼容、性能、安全、弱网与恢复 | 40–64h | QA + 安全 + 开发 | 关键指标达标，Critical/High 为 0 |
| P1 | Internal TestFlight + 第 3 轮 RC 验收 | 32–48h + 5–7天 | QA + 产品 + 内测用户 | RC 无 blocker，产品/开发/测试签字 |
| P1 | External TestFlight、反馈闭环与稳定性观察 | 40–80h + 10–14天 | QA + 产品 + 外测用户 + 开发 | crash-free sessions ≥99.9%，关键反馈全部处理 |
| P1 | 最终 Archive、上传、审核备注、提交与拒审预案 | 8–16h + 苹果审核时间 | iOS + 产品 + Account Holder | App Store Review 提交成功，后端与演示账号持续可用 |
| P2 | Apple Pencil 首发范围决策；若要求手写笔记/标注，再实现 PencilKit、hover 与误触测试 | 决策 4h；实现 32–64h | 产品 + 设计 + iOS + QA | 明确不做并从宣发移除，或完成真机 Pencil 验收 |

## 三轮测试定义

1. 功能轮：真实环境覆盖从登录、模板/方案、开课、参与者扫码、八工具、反馈、结束、记录到复盘。
2. 兼容与非功能轮：最低/主流 OS、iPhone/iPad 尺寸、横竖屏、Split View、Stage Manager、动态字体、VoiceOver、弱网、性能和安全。
3. RC/TestFlight 轮：冻结候选版本，Internal TestFlight 冒烟后进入 External TestFlight，观察 10–14 天并完成正式验收。

三轮必须在缺陷修复后分别执行，不能把同一套单测连续运行三次视为三轮全量测试。

## 发布时间估算

- 估算总量：约 600–900 人时；若 v1 必须同时完成 IAP 和 Apple Pencil，增加约 80–140 人时。
- 团队假设：1 名 iOS、1 名后端、1 名 QA 全职，产品/设计/法务/安全/DevOps 兼职并行；测试环境和开发者账号在一周内可用。
- 最早可提交：2026-09-24 左右；无拒审时最早 2026-10-02 左右发布。
- 现实目标：2026-10-09 至 2026-10-16 正式发布，预留一次审核反馈和修复窗口。
- 若真实 CloudBase/账号资料继续阻塞，或中国大陆 ICP、税务银行、IAP 审核需要补办，发布日期按外部处理时间顺延，当前无法给出硬日期。

## 本次验证

- `swift test`：23 项通过。
- Simulator Debug / Simulator Release / iphoneos Release：通过；iphoneos 报方向支持警告。
- Xcode `analyze`：通过。
- `npm run verify:all`：39 项通过，Lint、语法和发布契约通过。
- 五个相关云函数入口 `node --check`：通过。
- 未执行运行态、真机、性能、内存或 TestFlight 验证：没有已启动模拟器，也没有 App Store Connect/真实环境凭据。
