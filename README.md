# MasterTool

MasterTool 是面向培训师的微信小程序工具，覆盖备课、现场带课、参与者互动、反馈收集、复盘分析和数据沉淀。

## 当前产品

- 小程序端：微信原生小程序、JavaScript、WXML、WXSS。
- 后端：CloudBase Node.js 云函数。
- 数据库：CloudBase 文档数据库。
- 存储：CloudBase 云存储。
- 当前入口：微信开发者工具导入 `wechat-app/`。

后续可扩展 H5 管理后台或移动端工作台；正式文档只以当前微信小程序主线为准。

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
├── wechat-app/               # 微信开发者工具导入目录
│   ├── project.config.json
│   ├── miniprogram/          # 微信原生小程序
│   └── cloudfunctions/       # CloudBase 云函数
├── wechat-app-support/       # 联调数据和发布校验脚本
│   ├── package.json
│   ├── test-data/
│   └── tests/
├── docs/                     # 正式产品、用户、发布和安全文档
├── .codex/                   # AI 协作规则、记忆和任务流水
│   ├── rules/
│   ├── memory/
│   └── tasks/
└── AGENTS.md                 # AI 协作入口规则
```

## 正式文档

- [AI 协作入口规则](AGENTS.md)
- [产品说明](docs/product-overview.md)
- [用户手册](docs/user-manual.md)
- [发布、交接与内测完整步骤](docs/wechat-app/RELEASE_GUIDE.md)
- [CloudBase 正式上线操作手册](docs/cloudbase-prod-launch-runbook.md)
- [CloudBase 安全规则基线](docs/cloudbase-security-baseline.md)
- [发布检查清单](docs/release-checklist.md)
- [历史演进](docs/archive/history-evolution.md)

## 协作记忆

本项目使用 Git 可追踪的协作结构，帮助人和 AI 共享同一套项目规则：

- `AGENTS.md`：AI 协作入口，规定先读上下文、执行边界和验证要求。
- `.codex/rules/`：Codex 专用规则，包括通用协作、编码风格、文档同步和验证命令。
- `.codex/memory/`：长期项目记忆、决策和经验，只记录未来仍有价值的信息。
- `.codex/tasks/`：任务状态索引和一任务一文件的详情记录。

`docs/` 仍是正式产品、用户、发布和安全文档根目录；`.codex/memory/` 和 `.codex/tasks/` 是协作辅助，不替代正式文档。

## 小程序开发

配置 CloudBase 环境：

```js
// wechat-app/miniprogram/config/env.js
const ENV_CONFIGS = {
  develop: { envId: 'your-dev-env-id' },
  trial: { envId: 'your-prod-env-id' },
  release: { envId: 'your-prod-env-id' }
}
```

公开仓库中的 `appid` 和 `envId` 使用占位配置；联调或发布前，请在本地填入自己的微信小程序 AppID 和 CloudBase 环境 ID。

使用微信开发者工具打开：

```text
wechat-app/
```

## 云函数

当前云函数按领域拆分：

- `trainer-api`：培训师资料、首页统计、方案、模板、活动。
- `live-api`：开课、签到、分组、积分、随机抽取、互动、现场笔记、小程序码。
- `participant-api`：参与者签到、反馈、互动提交。
- `review-api`：复盘列表、复盘详情、保存复盘。

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

在 `wechat-app-support/` 下执行：

```bash
npm run lint
npm test
npm run syntax-check
```

发布契约检查：

```bash
node tests/verify-release-contract.js
```
