# MasterTool

培训师工具箱项目，面向培训师的小程序工具，覆盖备课、现场带课、反馈收集、复盘分析等完整交付链路。

## 当前方向

项目已切换为 **CloudBase 原生重构路线**：

- 小程序端：微信原生小程序 + JavaScript + WXML/WXSS
- 后端：CloudBase Node.js 云函数
- 数据库：CloudBase 文档数据库
- 存储：CloudBase 云存储
- 未来多端：H5 和 iOS 复用同一套 CloudBase 后端业务模型

不再保留 Python/Flask/MongoDB 作为生产后端。

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

现场数据以 `sessionId` 为主键，所有签到、分组、积分、随机、反馈、复盘都必须绑定当前场次。

## 目录结构

```text
ImprovTool/
├── wechat-app/               # 微信开发者工具导入目录
│   ├── project.config.json
│   ├── miniprogram/          # 微信原生小程序
│   └── cloudfunctions/       # CloudBase 云函数
├── wechat-app-support/       # 联调导数、测试脚本、部署辅助资料
│   ├── test-data/
│   └── tests/
├── docs/
│   ├── archive/              # 历史迁移与审计记录
│   ├── source-materials/     # PRD、截图等原始资料
│   └── *.md
├── specs/                    # 重构规格文档
├── archive/
│   ├── frontend-uniapp-x/    # 已归档的旧 uni-app x 实现
│   └── prototype-web/        # 已归档的交互原型
└── ...
```

当前正式维护目录为 `wechat-app/`、`wechat-app-support/`、`docs/` 和 `specs/`。旧前端与原型已归档到 `archive/`，避免和当前生产目录混淆。

## 项目文档

- [wechat-app 发布、交接与内测完整步骤](docs/wechat-app/RELEASE_GUIDE.md)
- [wechat-app 清理报告](docs/wechat-app/CLEANUP_REPORT.md)
- [内测期实现决策记录](docs/beta-implementation-decisions.md)
- [CloudBase 正式上线操作手册](docs/cloudbase-prod-launch-runbook.md)
- [CloudBase 安全规则基线](docs/cloudbase-security-baseline.md)
- [CloudBase 原生重构需求规格](specs/cloudbase-rebuild/requirements.md)
- [CloudBase 原生重构技术设计](specs/cloudbase-rebuild/design.md)
- [CloudBase 原生重构任务计划](specs/cloudbase-rebuild/tasks.md)
- [发布检查清单](docs/release-checklist.md)
- [历史迁移计划](docs/archive/cloudbase-deployment-migration-plan.md)
- [历史功能审计](docs/archive/legacy-mini-program-function-flow-audit.md)

## CloudBase 开发约束

- 小程序主链路优先使用 `wx.cloud.callFunction`。
- H5/iOS 未来通过 HTTP 云函数或 HTTP 访问服务接入。
- 业务状态机必须在云函数中实现，不能散落在页面里。
- 关键写操作必须携带 `requestId`，用于幂等和重复点击保护。
- 小程序用户身份通过 CloudBase 小程序上下文获取 `OPENID`，并映射到内部 `userId`。
- 未来 H5/iOS 不能依赖小程序 `OPENID`，必须使用统一 `userId`。

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

当前小程序在 `wechat-app/miniprogram/app.js` 中会根据 `envVersion` 自动读取 `config/env.js`。
公开仓库中的 `appid` 和 `envId` 使用占位配置；正式联调或发布前，请在本地私有配置中填入自己的微信小程序 AppID 和 CloudBase 环境 ID。

然后使用微信开发者工具打开：

```text
wechat-app/
```

这个目录只包含微信开发者工具需要识别的小程序、云函数和共享代码；联调种子数据与测试脚本已移到 `wechat-app-support/`，避免混入正式部署目录。

当前小程序基座包含：

- `首页`
- `备课`
- `我的`
- `现场控制`
- `参与者签到`

后续页面按 `specs/cloudbase-rebuild/tasks.md` 分阶段补齐。

## 云函数开发

云函数按领域拆分：

- `trainer-api`：培训师资料、首页统计、方案、模板、活动。
- `live-api`：开课、签到、分组、积分、随机抽取、结束培训。
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

## 未来多端

- 小程序：现场即时使用，优先原生体验。
- H5：报告、分享、管理后台、运营页。
- iOS：重度培训师工作台、离线缓存、更完整资料管理。

多端复用优先发生在 CloudBase 后端、接口契约与业务模型层，不强行复用同一套 UI 代码。
