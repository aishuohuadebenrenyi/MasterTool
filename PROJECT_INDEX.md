# ImprovTool 项目索引

## 状态定义

| 状态 | 含义 |
| --- | --- |
| Git 可提交 | 文件属于版本化源码或正式资料，不含生成物、私有配置和密钥 |
| 本地可运行 | 能在对应开发工具中编译或通过自动化测试 |
| 发布候选 | 已具备候选代码或材料，但仍需真实环境、真机、品牌、法务或验收 |
| 已批准可提交 | 已通过本次发布门禁，可直接上传微信或 App Store Connect |

本地测试通过不自动等于可发布。

## 可运行项目

| 项目 | 入口 | 运行方式 | 当前状态 |
| --- | --- | --- | --- |
| 微信小程序 | `apps/wechat-cloudbase/` | 微信开发者工具直接导入；游客模式可做基础编译 | Git 可提交；真实云能力需在本地填写 AppID 和 EnvID |
| iOS/iPadOS | `apps/ios-personal/ImprovToolIOS.xcodeproj` | Xcode 选择 `ImprovToolIOS` Scheme 后运行 | Git 可提交、Debug 可运行；正式提审仍为 NO-GO |
| Swift Core | `apps/ios-personal/Package.swift` | 在目录中运行 `swift test` | Git 可提交、本地可测试 |

## 共享后端和工具

| 模块 | 路径 | 说明 |
| --- | --- | --- |
| CloudBase 函数 | `backend/cloudbase/functions/` | `trainer-api`、`live-api`、`participant-api`、`review-api`、`ios-api` |
| 数据初始化 | `backend/cloudbase/seed/` | 联调种子和数据库导入文件，不属于客户端上传包 |
| Node 校验 | `tooling/verification/` | Lint、41 项单元测试、语法和发布契约 |
| iOS CI | `.github/workflows/ios-release-checks.yml` | Node、Swift 和 Xcode Release 检查 |

## 文档、发布和原型

| 类型 | 权威入口 | 状态 |
| --- | --- | --- |
| 正式文档 | `docs/README.md` | 当前有效说明 |
| 微信发布 | `docs/operations/wechat/RELEASE_GUIDE.md` | 操作手册 |
| iOS 发布 | `docs/operations/ios/indie-developer-release-checklist.md` | 主执行清单 |
| App Store 材料 | `releases/ios-personal/` | 当前仅有 draft；公开仓库只保存最终 JPG、说明和元数据 |
| Figma 原型 | `prototypes/current/README.md` | Figma 为可编辑源 |
| 历史资料 | `docs/archive/`、`.codex/tasks/records/` | 已完成任务由 `done.md` 建立状态索引 |

## 本地私有和可再生文件

以下内容不得提交：

- `project.private.config.json`、真实 AppID、真实 EnvID、令牌、签名和环境变量。
- `node_modules/`、`.build/`、`.swiftpm/`、DerivedData、`xcuserdata/`。
- `.DS_Store`、本机 IDE/MCP 配置。
- `prototypes/source-materials/` 中的原始 PRD 和取证截图。
- App Store Simulator 原始 PNG 和临时导出文件。

## 最小验证

```bash
cd tooling/verification
npm ci
npm run verify:all

cd ../../apps/ios-personal
swift test
```

Xcode 工程检查：

```bash
xcodebuild -list -project apps/ios-personal/ImprovToolIOS.xcodeproj
```
