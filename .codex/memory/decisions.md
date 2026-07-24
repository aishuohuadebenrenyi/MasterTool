# Decisions

## 2026-06-26: Use Git-Tracked Collaboration Rules And Memory

- Decision: Use `AGENTS.md`, `.codex/rules/`, `.codex/memory/`, and `.codex/tasks/` as the shared collaboration structure.
- Reason: The project needs stable context for AI, consistent output rules, multi-person collaboration, and sustainable iteration after long gaps.
- Scope: Applies to future development, documentation, release, and review tasks in this repository.
- Consequence: Future tasks should update task records and durable memory when they create long-lived facts, rules, or decisions.

## 2026-06-26: Track Shared `.codex/` Collaboration Subdirectories

- Decision: Keep `.codex/` ignored by default, but allow `.codex/rules/**`, `.codex/memory/**`, and `.codex/tasks/**` to be tracked.
- Reason: `.codex/` may contain local tool state, while rules, memory, and task records should be shared by the team and AI assistants.
- Scope: Applies to Git tracking and repository hygiene.
- Consequence: Do not store required collaboration rules or durable memory in ignored `.codex/` files outside those shared subdirectories.

## 2026-06-26: Use Task Indexes Plus Per-Task Records

- Decision: Use `.codex/tasks/todo.md`, `.codex/tasks/in-progress.md`, `.codex/tasks/done.md`, plus detailed files under `.codex/tasks/records/`.
- Reason: Status indexes support scanning; per-task files keep details traceable without growing a single log forever.
- Scope: Applies to future traceable project tasks.
- Consequence: Each meaningful task should have a task record with goal, assumptions, scope, verification, and final status.

## 2026-06-26: Move Historical Specs Under `docs/archive/`

- Decision: Move the historical CloudBase rebuild specs from root `specs/` to `docs/archive/cloudbase-rebuild/`.
- Reason: Root should show the current product and collaboration surfaces; historical specifications belong with archived documentation.
- Scope: Applies to historical specification documents only.
- Consequence: New current specifications should not reuse the removed root `specs/` path unless a new active spec workflow is explicitly adopted.

## 2026-06-26: Keep `wechat-app/` Publish-Only

- Decision: Keep `wechat-app/` limited to WeChat Developer Tools upload content, and move Node tooling plus unit tests to `wechat-app-support/`.
- Reason: The app directory should be easy to inspect before release and should not mix publishable files with local development scaffolding.
- Scope: Applies to test, lint, format, and release verification commands.
- Consequence: Run project verification from `wechat-app-support/`, not from `wechat-app/`.

## 2026-07-14: Isolate Native iOS Product Line And Preserve WeChat Contracts

- Decision: Keep the iOS client and iOS-specific documents under top-level `IOS-APP/`; use SwiftUI with iOS/iPadOS 16+, iPhone TabView and iPad sidebar/inspector layouts.
- Reason: The native product line must evolve without polluting WeChat upload files, while retaining the trainer workflow and CloudBase domain contracts.
- Scope: iOS work in this repository.
- Consequence: iOS calls only `ios-api` HTTP gateway with short-lived tokens; existing Mini Program actions and `OPENID` paths remain compatible. Real CloudBase mode requires deployed secrets/collections and must not fall back to direct database access.

## 2026-07-15: Keep Trainer Parity And WeChat Participant Entry Split

- Decision: iOS migrates the complete trainer workflow while participants remain on the existing WeChat check-in, feedback and interaction routes; a one-time code links historical WeChat accounts to iOS.
- Reason: This preserves the proven QR-based participant entry while keeping plans, sessions and reviews under the same backend `userId`.
- Consequence: Deployment must create `ios_account_links`, configure secrets, deploy `ios-api` and `trainer-api`, then verify the code-exchange path in a real test environment.

## 2026-07-15: Keep iOS Business Presentation To One Sheet Layer

- Decision: iPhone 半弹窗统一使用右上角圆形关闭按钮；需要进入新页面的选择操作必须先关闭 sheet，再切换 Tab 或进入所属 NavigationStack。
- Reason: 与小程序交互保持一致，并避免 sheet 内继续展示 sheet 造成退出路径和状态所有权混乱。
- Scope: `IOS-APP/` 的业务导航与半弹窗。
- Consequence: 同一页面使用单一枚举承载互斥 sheet；方案预览和活动编辑使用普通导航；iPad 现场工具继续使用检查器。

## 2026-07-16: Keep iOS Settings Native, Truthful And Supplementary

- Decision: iOS 设置页保持原生 `Form`；仅提供会真实改变行为的偏好，自动保存不可关闭，未接入服务的微信绑定只显示状态；滑动和双击始终是可见按钮之外的补充快捷操作。
- Reason: 设置项必须可预测且即时生效，不能以技术术语、无效表单或隐藏手势制造功能错觉。
- Scope: `IOS-APP/` 设置页及其直接控制的现场行为。
- Consequence: 新增设置前必须先有真实消费方；任务关键操作保留显式控件；尚未实现的离线重试或账号服务不得写成已支持能力。

## 2026-07-20: Separate Figma As-Is Baseline From iOS 27 Exploration

- Decision: Figma `Current / As-Is` 以 iOS/iPadOS 26.5 SwiftUI 运行界面为唯一验收基准；iOS 27 组件和视觉探索仅用于独立 To-Be 页面。
- Reason: 当前原型需要准确表达已实现产品，同时保留未来系统风格升级的可控空间，避免把尚未落地的系统样式混入实现基线。
- Scope: iOS/iPad 产品原型、设计评审和后续视觉同步。
- Consequence: 修改 As-Is 前先对照当前 SwiftUI 与模拟器；采用 iOS 27 风格时必须在 To-Be 中验证并经确认后再回写产品实现与 As-Is。

## 2026-07-24: Separate Runnable Clients, Shared Backend And Delivery Artifacts

- Decision: Keep directly runnable clients under `apps/wechat-cloudbase/` and `apps/ios-personal/`; move shared CloudBase functions to `backend/cloudbase/`, verification to `tooling/verification/`, App Store material to `releases/`, and prototype links to `prototypes/`.
- Reason: Each development tool needs an obvious project root, while shared backend, formal documents, generated files and submission assets require distinct ownership and release status.
- Scope: Repository structure, active documentation, CI, validation commands and future file placement.
- Consequence: The 2026-06-26 `wechat-app/` layout and 2026-07-14 top-level `IOS-APP/` document placement are superseded. Business actions, response contracts and data models remain unchanged.

## 2026-07-24: Keep Public Runtime Configuration Credential-Free

- Decision: Commit the WeChat project with `touristappid`, blank CloudBase EnvIDs and sanitized seed placeholders; keep real runtime identifiers, credentials and signing material local.
- Reason: The public repository must remain importable and reviewable without publishing environment-specific identifiers or authentication material.
- Scope: Public GitHub contents, local setup instructions, seed exports and release artifacts.
- Consequence: WeChat cloud integration, preview and upload require local AppID and EnvID replacement; iOS Debug remains credential-free through Mock data; Git history is not rewritten.
