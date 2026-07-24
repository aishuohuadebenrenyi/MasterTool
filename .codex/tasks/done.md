# Done Tasks

## 2026-07-24: GitHub 提交边界与公开配置脱敏

- Record: `.codex/tasks/records/2026-07-24-github-submission-hygiene.md`
- Outcome: 微信工程改用 `touristappid`，seed 导出恢复占位用户标识，个人邮箱匿名化；README、项目索引和安全基线明确公开提交、私有配置、运行与发布边界。
- Release assets: Git 只纳入最终 JPG、说明和元数据，Simulator 原始 PNG 保留本地并由 `.gitignore` 排除。
- Verification: Node Lint、41 项单测、语法与发布契约、Swift 29 项、Xcode Simulator 构建启动、93 个 Markdown 链接、JSON/占位配置、敏感信息与忽略规则检查全部通过。

## 2026-07-24: 全仓库结构拆分与索引整理

- Record: `.codex/tasks/records/2026-07-24-repository-structure-reorganization.md`
- Outcome: 建立 `apps/wechat-cloudbase`、`apps/ios-personal`、共享 `backend/cloudbase`、`tooling/verification`、分区文档、App Store 草案区和 Figma 原型索引。
- Runtime: 微信项目保持开发者工具可直接导入；iOS 从新路径完成 Xcode Simulator 构建、安装和启动。
- Verification: Node 41 项、Swift 29 项、发布契约、XcodeBuildMCP、JSON/Xcode 配置、Markdown 链接、路径映射与 `git diff --check` 全部通过。

## 2026-07-24: 独立开发者上线发布待办文档

- Record: `.codex/tasks/records/2026-07-24-indie-release-checklist.md`
- Outcome: 将发布审计、独立开发者精简策略和“单 App、v1 免费、后续 Pro 会员”方向合并为主执行清单，包含 P0/P1、精简三轮测试、会员预留、排期和 GO/NO-GO 门禁。
- Artifact: `docs/operations/ios/indie-developer-release-checklist.md`。
- Verification: `git diff --check`。

## 2026-07-23: iOS/iPadOS App Store 正式发布逐项实施

- Record: `.codex/tasks/records/2026-07-22-ios-app-store-release-implementation.md`
- Outcome: 完成仓库内可代办的方案/认证/账户/UGC 发布链路，接入图标、隐私清单、方向声明、XCUITest/CI，并生成部署、安全、性能、测试、商店材料和唯一负责人行动清单。
- Verification: Swift 29 项、Node 41 项、XCUITest 启动冒烟、UI Target build-for-testing、Simulator/iphoneos Release 编译、Xcode Analyze、plist/asset/截图规格均通过。
- Release status: NO-GO；`wx-server-sdk` 仍有 5 High/1 Moderate，且真实环境、签名真机、三轮测试、TestFlight、法务和 ASC 工作必须由外部负责人完成。
- User actions: `docs/operations/ios/app-store-user-actions.md`。

## 2026-07-22: iOS/iPadOS 正式发布实施任务拆解

- Record: `.codex/tasks/records/2026-07-22-ios-release-implementation-task-breakdown.md`
- Outcome: 将发布审计转换为 39 个基础任务和 2 个条件任务，覆盖生产业务、iPad 适配、工程发布、兼容性能安全、合规资源、三轮测试、TestFlight 和提审；每项均含优先级、角色、工时、依赖与验收标准。
- Scope gates: 默认免费/企业伴随端且 Apple Pencil 不进入首发；商业模式或 Pencil 范围变化时分别启动 IAP/PencilKit 条件任务。
- Estimate: 毛估算约 630–930 人时，排期基线沿用 600–900 人时；现实正式发布时间为 2026-10-09 至 2026-10-16。
- Verification: 审计 27 个工作包完成追溯核对，任务依赖链与三轮测试放行条件复核，`git diff --check` 通过。

## 2026-07-22: iOS/iPadOS 正式发布准备度全量审计

- Record: `.codex/tasks/records/2026-07-22-ios-ipados-release-readiness-audit.md`
- Outcome: 核心界面与 Mock 主流程约 70%，真实生产闭环约 45%，整体发布准备度约 25%–35%；确认真实方案保存/确认、客户端认证、复盘/反馈/删号、签名图标隐私、三轮测试和 TestFlight 均为主要缺口。
- Verification: Swift 23 项、Node 39 项、Simulator Debug/Release、iphoneos Release 与 Xcode Analyze 通过；设备构建发现方向支持警告。未执行真机、性能和 TestFlight 验证。
- Estimate: 约 600–900 人时；在三人核心团队与账号/环境及时到位的假设下，现实发布时间为 2026-10-09 至 2026-10-16。

## 2026-07-20: iOS/iPad Figma As-Is 全量视觉一致性修正

- Record: `.codex/tasks/records/2026-07-19-ios-figma-as-is-visual-parity.md`
- Outcome: 按 iOS/iPadOS 26.5 SwiftUI 运行界面重建 Current / As-Is，包括 20 个 iPhone 正式页面、10 个原型目标状态、10 个 iPad 页面、25 个 Sheet/工具/Alert/状态画板与 Prototype Map；To-Be/iOS 27 未修改。
- Interaction: 新增 29 个 iPhone 与 16 个 iPad 关键点击跳转，覆盖主导航、方案、活动、记录/数据、设置/账户、方案预览、结束培训及 8 类现场工具。
- Verification: 四组 Figma 页面占位文本和非 SF Pro 字体均为 0；iPhone 37 个、iPad 16 个交互节点；代表性 iPhone、iPad 与 Sheet 截图复核及 `git diff --check` 通过。

## 2026-07-19: iOS/iPad As-Is 全量 Figma 原型

- Record: `.codex/tasks/records/2026-07-19-ios-as-is-figma-prototype.md`
- Outcome: 在同一 Figma 文件新增忠于当前 SwiftUI 运行界面的 As-Is 基线，包括 20 个 iPhone 页面、10 个 iPad 页面、7 个 Sheet、8 个现场工具、3 个 Alert、7 类状态与独立 Prototype Map；未覆盖 To-Be 方案。
- Runtime evidence: iPhone 17 与 iPad Pro 13-inch 的 iOS 26.5 Debug 构建运行成功，关键页面经模拟器截图取证。
- Verification: 四个新增 Figma 页面无缺失字体，iPhone 33 个交互节点、四个命名演示入口，抽样截图和 `git diff --check` 通过。

## 2026-07-19: iOS/iPad 全量可编辑 Figma 原型

- Record: `.codex/tasks/records/2026-07-17-ios-editable-figma-prototype.md`
- Outcome: 在 Figma 完成 iOS/iPadOS 27 方向、26 兼容验收的全量可编辑原型，包括 20 个 iPhone 页面、10 个 iPad 自适应页面、7 个 Sheet、8 个现场工具面板、3 个 Alert、7 类状态、设计 Token、业务组件和 Prototype Map。
- Interaction: 建立 iPhone 主流程与现场流程、iPad 主流程与现场工作区演示入口；核心 Tab、开课、方案编辑/预览、现场工具与结束路径可点击。
- Verification: 抽样截图覆盖 iPhone 首页/现场/工具箱、iPad Split View/宽屏现场、Sheet 和 Alert；字体、裁切、层级、深浅色及宽屏结构通过视觉检查，`git diff --check` 通过。

## 2026-07-16: iPad 现场页按工具类型自适应布局

- Record: `.codex/tasks/records/2026-07-16-ios-live-adaptive-workspace.md`
- Outcome: 移除固定 360pt 检查器，新增可滚动八工具条；≥1100pt 重工具进入 520–720pt 宽工作区、轻工具进入下方工具台，700–1099pt 统一纵向排列，紧凑宽度保留 iPhone Sheet。
- Tool layout: 分组/积分使用自适应卡片，互动/笔记和随机使用响应式双区，独立计时放大，音效改为 2×2 大触控板；工具容器、内容和固定动作区复用同一 `LiveToolState`。
- Verification: Swift 23 项、Node 39 项、发布契约、iPhone/iPad Debug、Simulator Release、iPhone 与 iPad 13 英寸竖屏运行态、最大辅助功能字号和 `git diff --check` 通过。
- Residual risk: 当前 Simulator 自动化未提供设备旋转能力，≥1100pt 横屏分支已编译但仍需一次人工横屏视觉复核；本次无服务端改动，不执行真实 CloudBase E2E。

## 2026-07-16: iOS 现场页按小程序视觉与交互收敛

- Record: `.codex/tasks/records/2026-07-16-ios-live-miniprogram-layout-parity.md`
- Outcome: iPhone 现场页改为小程序式深色信息层级、响应式四入口和两列八工具；关键 Sheet 动作固定在底部，iPad 保留共享状态的右侧检查器。
- Interaction: 主计时单击/双击互斥；退出现场以双按钮确认调用 `live.abandonSession`，成功回退方案并离场，失败保留现场。
- Verification: Swift 23 项、Node 39 项、发布契约、iPhone/iPad Debug、Simulator Release、iPhone/iPad 运行态和最大辅助功能字号检查均通过。
- Residual risk: 未提供真实 HTTPS 网关、令牌和 EnvId，未执行真实 CloudBase E2E 或部署。

## 2026-07-16: iOS 现场全链路与跨端布局收敛

- Record: `.codex/tasks/records/2026-07-16-ios-live-parity-implementation.md`
- Outcome: 现场页改为细分真实 action 数据链路，补齐签到、分组、积分、随机、互动、笔记、环节与结束状态；iPhone 收敛为全屏主现场，iPad 收敛为共享状态的主区加 inspector 双栏。
- Compatibility: Debug 保留确定性 Mock；Release 配置缺失时继续明确失败，不回退 Mock；小程序既有 action 和流程未改变。
- Verification: Swift 19 项、Node 39 项、发布契约、iPhone/iPad Debug、Simulator Release、iPhone 全工具运行态、iPad 双栏及最大辅助功能字号检查均通过。
- Residual risk: 真实 CloudBase 网关、令牌和 EnvId 未提供且本任务未部署，真实账户 E2E 仍需在部署环境完成。

## 2026-07-16: iOS 现场页数据链路与小程序差异检查

- Record: `.codex/tasks/records/2026-07-16-ios-live-data-chain-parity-audit.md`
- Outcome: 确认 Debug 现场页使用 Mock；真实开课、现场保存和结束契约存在 Release 阻断，并定位环节计时错位、半屏工具切换无效及八项工具的跨端能力差距。
- Verification: 15 项 Swift 测试通过、iPhone 17 Pro Simulator Debug 构建通过、现场工具运行态冒烟、`ios-api`/`live-api` 语法检查及 `git diff --check` 通过。
- Residual risk: 未配置 CloudBase 测试环境、HTTPS 网关和令牌，不能执行真实账户与真实数据 E2E；iPad 未启动运行态矩阵。

## 2026-07-16: iOS 导航、方案编辑与跨端色彩统一

- Record: `.codex/tasks/records/2026-07-16-ios-navigation-editor-color-parity.md`
- Outcome: iPhone 仅三个根页显示 Tab Bar；方案编辑按小程序层级重构；iOS 全局使用亮暗自适应的品牌与状态色 token。
- Interaction: 环节支持编辑、增删、排序和多活动管理；草稿、确认、保存修改和开课使用固定底部操作区。
- Verification: `swift test`（15 项通过）、iPhone/iPad Simulator Debug、Simulator Release、亮暗模式与 Accessibility Medium 人工检查、`git diff --check`。

## 2026-07-16: iOS 设置页与现场偏好真实行为收敛

- Record: `.codex/tasks/records/2026-07-16-ios-settings-live-preferences.md`
- Outcome: 设置页收敛为三个原生分组，自动保存和微信历史账户改为真实状态；现场页接入可配置的左右滑动、环节倒计时、双击与显式加时、独立计时及单次结束提醒。
- Compatibility: 保留原有偏好默认值和提醒开关存储键；未修改微信小程序、CloudBase API、数据库或登录契约。
- Verification: `swift test`（15 项通过）、iPhone 17 Pro 与 iPad Pro 11 英寸 Simulator Debug 构建、设置持久化与 Tab Bar 恢复检查、现场控件冒烟、Xcode 工程格式检查、`git diff --check`。

## 2026-07-16: iOS 备课开课按钮无响应修复

- Record: `.codex/tasks/records/2026-07-16-ios-prepare-start-session-navigation.md`
- Outcome: 开课成功后进入现场页，请求期间禁用重复点击；失败时保留备课页并显示既有错误提示。
- Runtime fix: 现场页使用独立布尔导航，避免 iOS 26 的 `AnyNavigationPath comparisonTypeMismatch`；开课锁保持到现场页退出。
- Verification: `swift test`（10 项通过）、iPhone 17 Pro Simulator Debug 构建与启动、场次创建/首页返回入口验证、最新运行日志无导航 Fatal Error、`git diff --check`。

## 2026-07-15: iOS 空状态、半弹窗操作与模拟数据优化

- Record: `.codex/tasks/records/2026-07-15-ios-empty-sheet-mock-optimization.md`
- Outcome: 空状态统一居中；编辑资料、绑定账户、添加环节和结束培训的主操作移至底部安全区；Debug 提供固定方案、活动与历史场次。
- Runtime fix: 为 Xcode Debug 配置补充 `DEBUG` 编译条件，修复模拟器误入 Release 数据源分支的问题；Release 配置保持不变。
- Verification: `swift test`（10 项通过）、iPhone 17 Pro 与 iPad Pro 11 英寸 Simulator Debug 构建、iPhone 安装启动与 Mock 数据冒烟、Xcode 工程格式检查、sheet 静态审计、`git diff --check`。

## 2026-07-15: iOS 备课“全部”误显示模板修复

- Record: `.codex/tasks/records/2026-07-15-ios-prepare-template-filter-fix.md`
- Outcome: 备课来源为“全部”或“我的方案”时只显示方案；个人模板和公共模板仅在对应来源筛选中展示。
- Compatibility: 新建方案模板选择弹窗、模板数据、导航和小程序均未修改。
- Verification: `swift test`（8 项通过）、iOS Simulator Debug `xcodebuild`、`git diff --check`。

## 2026-07-15: iOS 培训师表单与新建活动流程全量对齐

- Record: `.codex/tasks/records/2026-07-15-ios-trainer-form-parity.md`
- Outcome: 新建活动直接进入普通编辑页；活动、方案、资料、帮助、复盘、设置和现场工具字段按小程序收敛；活动保存与删除接入现有 CloudBase action。
- Compatibility: 参与者端、小程序业务代码、CloudBase action 与 `sessionId` 主链路未修改；未接入的提交能力继续显式禁用。
- Verification: `swift test`（8 项通过）、iOS Simulator Debug `xcodebuild`、`npm run verify:all`（37 项通过）、字段与 sheet 静态检查、`git diff --check`。
- Follow-up: 仍需在标准/Max iPhone 与 iPad 上完成人工点击、键盘、动态字体和分屏矩阵，并在取得测试环境配置后完成真实活动保存 E2E。

## 2026-07-15: iOS 半弹窗与页面跳转层级收敛

- Record: `.codex/tasks/records/2026-07-15-ios-navigation-sheet-convergence.md`
- Outcome: 半弹窗统一右上角圆形关闭按钮；首页按小程序逻辑切换备课筛选；模板选择先关闭再进入普通导航；现场 sheet 合并为单一状态。
- Interaction fixes: 修复筛选常量、方案卡按钮嵌套、活动写入错误环节、活动编辑不回写及假成功占位操作。
- Verification: `swift test`（5 项通过）、iOS Simulator Debug `xcodebuild`、iPhone 17 Pro 启动冒烟、sheet 层级静态检查、`git diff --check`。
- Follow-up: 标准/Max iPhone 与 iPad 的逐项人工点击矩阵，以及绑定、反馈、导出、删号的真实 CloudBase 服务仍待完成。

## 2026-07-15: iOS 半弹窗高度统一优化

- Record: `.codex/tasks/records/2026-07-15-ios-sheet-height-optimization.md`
- Outcome: iPhone 端统一为紧凑、内容、可滚动三类半弹窗，默认减少底部空白并保留上拉全屏；iPad 沿用原有呈现行为。
- Coverage: 开课入口、方案选择、模板选择、活动选择、方案预览、活动编辑、现场八工具、结束培训、编辑资料和微信账户绑定。
- Verification: `swift test`（5 项通过）、iOS Simulator Debug `xcodebuild`、sheet 调用点静态覆盖检查、`git diff --check`。

## 2026-07-15: iOS 根页标题与资料入口收敛

- Record: `.codex/tasks/records/2026-07-15-ios-root-navigation-cleanup.md`
- Outcome: 首页、备课、我的三个 Tab 根页隐藏导航栏并释放顶部空间；资料卡保留“编辑”文字并移除重复箭头。
- Verification: iOS Simulator Debug `xcodebuild`、`git diff --check`。

## 2026-07-15: iOS 培训师端全量对齐

- Record: `.codex/tasks/records/2026-07-15-ios-trainer-parity.md`
- Outcome: 在 `IOS-APP/` 补齐小程序调研/差异文档、首页/备课/方案活动/现场八工具/结束反馈/复盘/个人中心的 SwiftUI 主链路，并以 Release 不回退 Mock 的运行时配置约束真实数据边界。
- Compatibility: 小程序设置页仅新增一次性 iOS 绑定码；`trainer-api.createIOSBindingCode` 与既有 action、OPENID 流程并存。
- Verification: `swift test`（5 项通过）、iOS Simulator Debug `xcodebuild`、`node --check`、`npm run verify:all`（37 项通过）、`git diff --check`。
- Follow-up: 尚未取得 CloudBase 测试环境 ID、HTTPS 入口和密钥，故 `ios-api` / 集合 / 索引尚未部署，也未完成真机或真实数据端到端联调。

## 2026-07-14: iOS 原生应用迁移基础实现

- Record: `.codex/tasks/records/2026-07-14-ios-native-app-migration.md`
- Outcome: 新建隔离的 `IOS-APP/` SwiftUI iPhone/iPad 工程、Mock 主链路、架构/合规/部署文档，并加入受控 `ios-api` HTTP 网关与四个既有云函数的 iOS 内部身份解析。
- Verification: `swift test`（3 项通过）、iOS Simulator Debug `xcodebuild`、`npm run verify:all`（37 项通过）、`node --check`、`git diff --check`。

## 2026-06-28: 同步 1.0.1 发布内容到 GitHub

- Record: `.codex/tasks/records/2026-06-28-sync-1.0.1-to-github.md`
- Outcome: 将 `1.0.1` 版本说明标记为已发布，补充实际修复项，并准备提交推送到 `origin/main`。
- Verification: `npm run verify:all`, `git diff --check`

## 2026-06-28: 小程序上线反馈逐项修复与验证

- Record: `.codex/tasks/records/2026-06-28-wechat-app-feedback-verification.md`
- Outcome: 修复首页昵称和“我的”页资料不一致，补充本地资料缓存与 `getProfile` 兜底，并逐项验证上线反馈修复点。
- Verification: `npm test`, `npm run verify:all`, `git diff --check`

## 2026-06-26: 建立协作记忆、规则与任务流水体系

- Record: `.codex/tasks/records/2026-06-26-collaboration-memory-rules.md`
- Outcome: 新增 `AGENTS.md`、`.codex/rules/`、`.codex/memory/`、`.codex/tasks/`，并更新 `.gitignore` 和 `README.md`。
- Verification: `git diff --check`

## 2026-06-26: 精简根目录并合并协作与历史资料

- Record: `.codex/tasks/records/2026-06-26-root-directory-consolidation.md`
- Outcome: 将协作记忆和任务流水合并到 `.codex/`，将历史规格合并到 `docs/archive/`，并记录旧实现清单。
- Verification: `git diff --check`

## 2026-06-26: 瘦身 wechat-app 发布目录

- Record: `.codex/tasks/records/2026-06-26-wechat-app-publish-directory-slimming.md`
- Outcome: 将 Node 工具链和单元测试迁到 `wechat-app-support/`，让 `wechat-app/` 只保留发布上传需要的工程文件。
- Verification: `npm run lint`, `npm test`, `npm run syntax-check`, `git diff --check`
