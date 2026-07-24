# 全仓库结构拆分与索引整理

## 目标

- 微信小程序能够从 `apps/wechat-cloudbase/` 直接导入微信开发者工具。
- iOS/iPadOS 能够从 `apps/ios-personal/ImprovToolIOS.xcodeproj` 直接在 Xcode 打开和编译。
- CloudBase 云函数作为微信和 iOS 的共享后端独立存放。
- 正式文档、发布材料、原型和历史资料具有唯一入口。
- 生成物、本机配置和可提交源码边界明确。

## 范围

- 迁移现有目录并更新路径引用、测试、CI、协作文档和发布说明。
- 保留当前工作区的所有业务修改，不顺手调整业务行为。
- 删除或忽略可再生生成物和本机元数据。

## 验证

- `npm run verify:all`
- `swift test`
- Xcode 工程与 scheme 检查
- 微信项目配置与发布契约检查
- Markdown 路径检查
- `git diff --check`

## 状态

- 2026-07-24：任务开始，结构和迁移边界已由用户确认。
- 2026-07-24：完成客户端、共享后端、校验工具、正式文档、发布材料和原型索引迁移。

## 实际修改

- 微信项目迁入 `apps/wechat-cloudbase/`，保留可直接导入的 `project.config.json` 和 `miniprogram/`。
- iOS 工程整体迁入 `apps/ios-personal/`，保留 Xcode 工程、Swift Package、Tests 和 UITests 相对布局。
- 五个 CloudBase 函数迁入 `backend/cloudbase/functions/`，种子数据迁入 `backend/cloudbase/seed/`。
- Node 校验工程迁入 `tooling/verification/`，同步单测路径和 GitHub Actions。
- 正式文档按 product、architecture、operations、research、reports、legal、archive 分类。
- App Store 草案迁入 `releases/ios-personal/draft/`，建立空的 submission 门禁。
- 建立 `PROJECT_INDEX.md`、各模块 README 和 Figma 原型索引。
- 清理并忽略 SwiftPM、Node、Xcode、macOS 和本机私有配置。

## 验证结果

- `npm run verify:all`：通过，Lint、41 项 Node 单测、语法检查全部通过。
- `node tests/verify-release-contract.js`：通过。
- `swift test`：29 项测试通过。
- XcodeBuildMCP：从新路径构建、安装并启动 iPhone Simulator 成功，无警告或错误。
- Xcode project plist、四个 JSON 配置、56 个当前 Markdown 文件链接检查通过。
- 300 个原已跟踪文件均能映射到现有新路径。
- `git diff --check`：通过。

## 说明

- 未部署真实 CloudBase，也未执行微信上传或 App Store 提审。
- `.codex/tasks/records/` 继续按现有协作约定保存历史证据，由 `done.md` 和 `todo.md` 区分状态。
