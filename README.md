# MasterTool

MasterTool 是面向培训师的微信小程序工具，覆盖备课、现场带课、参与者互动、反馈收集、复盘分析和数据沉淀。

## 当前产品与运行状态

- 小程序端：微信原生小程序、JavaScript、WXML、WXSS。
- 后端：CloudBase Node.js 云函数。
- 数据库：CloudBase 文档数据库。
- 存储：CloudBase 云存储。
- iOS/iPadOS 端：SwiftUI 原生培训师应用，最低支持 iOS/iPadOS 16。

| 项目 | 打开方式 | 无私有配置时 | 真实环境要求 |
| --- | --- | --- | --- |
| 微信小程序 | 微信开发者工具导入 `apps/wechat-cloudbase/` | `touristappid` 可用于导入和基础编译 | 本地填写自己的 AppID、CloudBase EnvID，并部署共享云函数 |
| iOS/iPadOS | Xcode 打开 `apps/ios-personal/ImprovToolIOS.xcodeproj` | Debug 使用固定 Mock 数据，可编译运行 | Release 配置 HTTPS API Endpoint、签名团队和正式服务 |
| Swift Core | 在 `apps/ios-personal/` 运行 `swift test` | 可直接测试 | 无 |

本地测试通过不代表已经可以发布。微信上传、CloudBase 生产部署和 App Store 提审仍须分别通过对应发布门禁。

## 核心业务链路

```text
模板
  -> 应用为草稿方案
  -> 确认方案
  -> 开始培训
  -> 签到
  -> 分组
  -> 积分 / 随机 / 互动 / 笔记
  -> 反馈
  -> 结束培训
  -> 查看当前场次数据
  -> 复盘
  -> 数据沉淀
```

现场数据以 `sessionId` 为主键，所有签到、分组、积分、随机、反馈、复盘都绑定当前场次。

## 目录结构

```text
ImprovTool/
├── apps/
│   ├── wechat-cloudbase/     # 可导入、可编译的微信客户端项目
│   └── ios-personal/         # 可打开、可编译的 Xcode 项目
├── backend/cloudbase/        # 需单独部署的跨端共享后端
├── tooling/verification/     # 不进入客户端发布包的校验工具
├── docs/                     # 正式产品、架构、运维和历史文档
├── releases/                 # 草案或已批准的发布材料
├── prototypes/               # 非生产代码的 Figma 原型索引
├── specs/                    # 当前仍有效的规格
├── .codex/                   # AI 协作规则、记忆和任务流水
├── PROJECT_INDEX.md          # 全仓库唯一总索引
└── AGENTS.md                 # AI 协作入口规则
```

各目录的 Git 提交状态、运行入口和发布状态以 [项目总索引](PROJECT_INDEX.md) 为准。

## 正式文档

- [AI 协作入口规则](AGENTS.md)
- [项目总索引](PROJECT_INDEX.md)
- [正式文档索引](docs/README.md)
- [产品说明](docs/product/product-overview.md)
- [用户手册](docs/product/user-manual.md)
- [发布、交接与内测完整步骤](docs/operations/wechat/RELEASE_GUIDE.md)
- [CloudBase 正式上线操作手册](docs/operations/cloudbase-prod-launch-runbook.md)
- [CloudBase 安全规则基线](docs/operations/cloudbase-security-baseline.md)
- [发布检查清单](docs/operations/release-checklist.md)
- [历史演进](docs/archive/history-evolution.md)

## 协作记忆

本项目使用 Git 可追踪的协作结构，帮助人和 AI 共享同一套项目规则：

- `AGENTS.md`：AI 协作入口，规定先读上下文、执行边界和验证要求。
- `.codex/rules/`：Codex 专用规则，包括通用协作、编码风格、文档同步和验证命令。
- `.codex/memory/`：长期项目记忆、决策和经验，只记录未来仍有价值的信息。
- `.codex/tasks/`：任务状态索引和一任务一文件的详情记录。

`docs/` 仍是正式产品、用户、发布和安全文档根目录；`.codex/memory/` 和 `.codex/tasks/` 是协作辅助，不替代正式文档。

## 首次运行

### 微信小程序

1. 使用微信开发者工具导入 `apps/wechat-cloudbase/`。
2. 仅检查界面和基础编译时保留 `project.config.json` 中的 `touristappid`。
3. 联调、预览或上传前，在本地将 `appid` 替换为自己的真实 AppID。
4. 在 `apps/wechat-cloudbase/miniprogram/config/env.js` 中填写对应 CloudBase EnvID。
5. 按 [CloudBase 部署说明](backend/cloudbase/README.md) 单独部署共享云函数。

配置 CloudBase 环境：

```js
// apps/wechat-cloudbase/miniprogram/config/env.js
const ENV_CONFIGS = {
  develop: { envId: 'your-dev-env-id' },
  trial: { envId: 'your-prod-env-id' },
  release: { envId: 'your-prod-env-id' }
}
```

真实 AppID 和 EnvID 只用于本地或部署环境。提交代码前必须将 `appid` 恢复为 `touristappid`，并确认三个 `envId` 为空。

### iOS/iPadOS

```bash
cd apps/ios-personal
swift test
open ImprovToolIOS.xcodeproj
```

选择 `ImprovToolIOS` Scheme 和目标 Simulator 后运行。Debug 未配置服务时使用 Mock 数据；Release 不会回退 Mock，必须配置 `IMPROV_IOS_API_ENDPOINT` 和有效签名。

## 配置与密钥

| 配置或文件 | GitHub | 说明 |
| --- | --- | --- |
| `project.config.json` | 提交 | `appid` 固定为 `touristappid` |
| `project.private.config.json` | 不提交 | 微信开发者工具本机偏好 |
| 小程序 EnvID、CloudBase 目标环境 | 不提交真实值 | 公开文件保持空值或 `your-cloudbase-env-id` |
| AppSecret、SecretId、SecretKey、API Key、Token | 禁止提交 | 只放在平台密钥或部署环境中 |
| iOS API Endpoint | 公开模板为空 | 正式地址通过 Release Build Setting 配置，不得内含令牌 |
| Bundle ID、Package 清单、依赖锁文件 | 提交 | 不是认证密钥 |
| Apple 证书、私钥、`.p12`、`.mobileprovision` | 禁止提交 | 由 Xcode、钥匙串或 CI 密钥管理 |
| `.env*`、构建目录、IDE 用户状态 | 不提交 | 已由 `.gitignore` 排除 |

CloudBase seed 只包含虚构演示数据和 `REPLACE_WITH_USER_ID` 占位符。导入前可在本地替换，替换后的导入文件不得提交。

## 云函数

当前云函数按领域拆分：

- `trainer-api`：培训师资料、首页统计、方案、模板、活动。
- `live-api`：开课、签到、分组、积分、随机抽取、互动、现场笔记、小程序码。
- `participant-api`：参与者签到、反馈、互动提交。
- `review-api`：复盘列表、复盘详情、保存复盘。
- `ios-api`：iOS 邮箱认证、令牌轮换、账户导出/删除及领域函数 HTTPS 网关。

调用格式：

```js
wx.cloud.callFunction({
  name: 'live-api',
  data: {
    action: 'startSession',
    requestId: 'client-generated-id',
    payload: {}
  }
})
```

统一响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {},
  "requestId": "client-generated-id"
}
```

## 校验

在 `tooling/verification/` 下执行：

```bash
npm ci
npm run lint
npm test
npm run syntax-check
npm run verify:all
```

发布契约检查：

```bash
node tests/verify-release-contract.js
```

iOS 校验：

```bash
cd apps/ios-personal
swift test
xcodebuild -list -project ImprovToolIOS.xcodeproj
```

## 发布材料

- 微信发布流程见 [微信发布指南](docs/operations/wechat/RELEASE_GUIDE.md)。
- iOS 发布主清单见 [独立开发者发布清单](docs/operations/ios/indie-developer-release-checklist.md)。
- `releases/ios-personal/draft/` 只保存最终 JPG、文案和元数据；draft 不代表已经通过品牌、法务、真机或 App Store Connect 验收。
- `releases/ios-personal/submission/` 只允许放入基于最终 RC 且已经批准的提审材料。
