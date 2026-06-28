# CloudBase 原生重构与多端演进计划

> 历史文档：保留迁移决策背景，当前规范以 `docs/archive/cloudbase-rebuild/` 和 `docs/release-checklist.md` 为准。

## 结论

项目当前仍处于早期开发阶段，可以接受完全改造。因此生产路线从“保留现有 `uni-app x + Python Flask + MongoDB + HTTP API` 并适配 CloudBase”调整为：

```text
微信原生小程序 JavaScript
  + CloudBase 文档数据库
  + CloudBase Node.js 云函数
  + CloudBase 云存储
  + 后续 H5/iOS 共用同一套业务后端
```

推荐原则：

- 当前优先把小程序做成微信生态原生体验，保障现场使用稳定性。
- 后端和数据模型从第一天按多端复用设计，避免未来 H5/iOS 返工。
- 小程序端不再保留 Python/Flask/MongoDB 生产路径。
- 小程序主链路优先使用 `wx.cloud.callFunction`，不把 HTTP API 作为小程序内部主调用方式。
- HTTP 云函数/HTTP 访问服务保留给未来 H5、iOS、开放接口、导出下载和外部分享页。

## 官方依据

- CloudBase 是内置数据库、云函数、云托管、存储、认证等能力的 Serverless 后端一体化平台，适合小程序和 Web 应用。
  - https://cloud.tencent.com/document/product/876/18431
- CloudBase 文档型数据库基于 MongoDB 的文档模型，支持文档管理、索引、聚合、事务、实时推送。
  - https://docs.cloudbase.net/database/introduce
- CloudBase 云函数支持事件触发、HTTP 请求触发和定时触发，适合承载业务动作和后台任务。
  - https://docs.cloudbase.net/cloud-function/introduce
- CloudBase HTTP 访问服务可以把统一域名和路径映射到云函数、云托管、静态托管等资源，适合 H5/iOS/外部入口。
  - https://docs.cloudbase.net/service/introduce
- CloudBase 小程序身份可以在云函数中获取可信 `OPENID`，不需要 Web 风格 OAuth 登录。
  - 当前项目使用已安装的 `cloudbase` skill 中 `auth-wechat`、`miniprogram-development`、`cloud-functions`、`no-sql-wx-mp-sdk` 作为开发约束。

## 产品交互特点

这个小程序不是普通列表表单产品，而是培训师现场控制台：

- 培训师在现场高频操作：
  - 开课、切换环节、签到、分组、积分、随机抽取、计时、音效、笔记、结束培训。
- 参与者扫码轻量提交：
  - 签到、反馈、互动提交，不能要求复杂登录。
- 现场网络不可控：
  - 必须处理弱网、重复点击、提交中、失败重试、幂等和离线/半离线体验。
- 数据链路强状态：
  - 方案/模板 -> 现场 session -> 参与者 -> 分组 -> 积分/抽取/互动/反馈 -> 复盘 -> 数据沉淀。
- 多端会逐步分化：
  - 小程序负责现场即时使用。
  - H5 负责报告、分享、管理后台和运营页。
  - iOS 负责重度培训师长期使用、离线能力和更完整的工作台。

因此长期最重要的是：

- 微信端原生体验。
- CloudBase 身份和数据权限。
- 云端状态机一致性。
- 业务模型多端复用。
- UI 规范稳定，避免跨端抽象带来的布局漂移。

## 技术栈决策

### 当前小程序

采用：

- `微信小程序原生 + JavaScript`
- `WXML + WXSS`
- `wx.cloud.init`
- `wx.cloud.callFunction`
- `wx.cloud.database`
- `miniprogram-ci` 用于预览/上传自动化

不继续采用：

- `uni-app x + UTS` 作为长期小程序主框架
- Python Flask 作为生产后端
- MongoDB URI 生产数据库

原因：

- 当前问题集中在安全区、胶囊、底部弹窗、工具按钮、弱网交互等小程序细节，原生小程序更可控。
- 现场控制页需要更稳定的运行表现和更少的跨端抽象层。
- CloudBase 小程序原生身份、函数、数据库调用链更短。

### 后端

采用：

- `CloudBase Node.js 云函数`
- 普通事件云函数作为小程序主入口
- HTTP 云函数作为 H5/iOS/外部入口
- CloudBase 文档数据库
- CloudBase 云存储
- 定时云函数做统计沉淀、清理和导出任务

云函数拆分：

- `trainer-api`：培训师资料、首页统计、方案、模板、活动。
- `live-api`：开课、签到、分组、积分、随机抽取、结束培训。
- `participant-api`：参与者签到、反馈、互动提交。
- `review-api`：复盘列表、复盘详情、保存复盘。
- `export-api`：导出 Markdown/HTML/PDF 任务与文件。
- `scheduled-jobs`：数据沉淀、过期临时口令清理、统计预聚合。

### 未来 H5

采用：

- `Vue 3 或 React + Vite`
- `@cloudbase/js-sdk`
- CloudBase Web Auth
- CloudBase 静态托管
- 通过 HTTP 云函数访问同一套业务动作

H5 主要场景：

- 方案报告展示。
- 数据报告分享。
- 运营/管理后台。
- 大屏或桌面端复盘分析。

### 未来 iOS

优先路线：

- `Flutter + CloudBase HTTP API/HTTP 云函数`

后续高成熟度再评估：

- `SwiftUI` 原生重写。

原因：

- 独立开发者前期 Flutter 性价比更高。
- iOS 端会更偏长期工作台和离线能力，交互不应被小程序页面结构限制。
- 业务逻辑复用应发生在 CloudBase 后端和 shared types，而不是强行复用小程序 UI 代码。

## 目标架构

```text
                 ┌──────────────────────┐
                 │   CloudBase 后端能力   │
                 │ 数据库 / 函数 / 存储 / 权限 │
                 └──────────┬───────────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          v                 v                 v
 微信原生小程序          H5 Web            iOS App
 现场即时使用        报告/后台/分享       重度工作台
 wx.cloud SDK       Web SDK/HTTP API     HTTP API/Flutter SDK
```

核心边界：

- 业务状态机在云函数中实现。
- 数据权限在云函数和数据库规则两层控制。
- 小程序页面只负责交互呈现和轻量状态，不承载关键一致性逻辑。
- 多端共享 `shared/types`、业务常量、状态枚举、错误码和接口契约。

## 数据链路

主链路：

```text
模板 template
  -> 应用为草稿方案 plan:draft
  -> 确认方案 plan:confirmed
  -> 开始培训 live_session:running
  -> 签到 participants
  -> 分组 groups
  -> 积分 score_events
  -> 随机 picks
  -> 互动 interactions
  -> 反馈 feedback
  -> 结束培训 live_session:ended
  -> 复盘 review
  -> 数据沉淀 analytics_snapshot
```

关键约束：

- 模板不是方案，不进入草稿/确认/交付/复盘状态。
- 模板点击应用后创建一个新的草稿方案。
- 方案开始培训时必须写入方案快照，历史 session 不受后续方案编辑影响。
- 签到同一场次不允许同名，不允许同一 `openid` 重复签到。
- 分组必须基于当前场次已签到参与者。
- 随机抽取默认从当前场次参与者池取人，并支持是否允许重复抽取。
- 培训结束后的查看数据必须进入当前 `sessionId` 数据。

## 数据集合

建议集合：

- `users`
- `trainer_profiles`
- `templates`
- `plans`
- `activities`
- `live_sessions`
- `participants`
- `groups`
- `score_events`
- `picks`
- `interactions`
- `feedback`
- `reviews`
- `notes`
- `exports`
- `analytics_snapshots`
- `operation_logs`

建议核心索引：

| 集合 | 索引 | 用途 |
| --- | --- | --- |
| `users` | `openid` | 小程序用户身份 |
| `trainer_profiles` | `userId` | 培训师资料 |
| `templates` | `ownerId + updatedAt` | 个人模板列表 |
| `plans` | `ownerId + status + updatedAt` | 方案状态筛选 |
| `plans` | `ownerId + favorite + updatedAt` | 收藏方案 |
| `activities` | `ownerId + scene + difficulty + updatedAt` | 活动库筛选 |
| `live_sessions` | `ownerId + status + startedAt` | 待开课/待复盘/培训记录 |
| `participants` | `sessionId + name` | 防重名 |
| `participants` | `sessionId + openid` | 防重复签到 |
| `groups` | `sessionId + groupNo` | 当前场次分组 |
| `score_events` | `sessionId + groupId + createdAt` | 积分流水 |
| `feedback` | `sessionId + createdAt` | 当前场次反馈 |
| `reviews` | `sessionId + ownerId` | 当前场次复盘 |
| `notes` | `sessionId + phaseId + updatedAt` | 环节笔记 |

## 前端改造范围

新建：

```text
wechat-app/
├── project.config.json
├── miniprogram/
│   ├── app.js
│   ├── app.json
│   ├── app.wxss
│   ├── pages/
│   ├── components/
│   ├── services/
│   ├── stores/
│   ├── styles/
│   └── utils/
├── cloudfunctions/
└── shared/
```

核心页面：

- 首页
- 备课首页
- 方案列表
- 模板列表
- 方案编辑
- 方案预览
- 活动库
- 活动编辑
- 现场控制页
- 参与者签到页
- 参与者反馈页
- 培训结束页
- 复盘中心
- 复盘详情
- 我的/设置/帮助/关于

UI 规范：

- 所有二级页统一 `NavBar` 和安全区算法。
- 所有底部弹窗统一 `HalfSheet`，header/footer/body 滚动规则固定。
- 所有现场工具使用统一 `ToolGrid`。
- 所有按钮统一尺寸、圆角、色彩和文案节奏。
- 所有网络状态统一加载、失败、重试、空态、提交中和成功提示。

## 后端改造范围

新建：

```text
wechat-app/cloudfunctions/
├── trainer-api/
├── live-api/
├── participant-api/
├── review-api/
├── export-api/
└── scheduled-jobs/

wechat-app/shared/
├── types/
├── constants/
├── validators/
├── errors/
└── domain/
```

需要迁移的能力：

- 登录/用户识别。
- 首页统计。
- 方案、模板、活动。
- 开课和现场 session。
- 签到、分组、积分、随机抽取。
- 反馈和互动提交。
- 笔记和复盘。
- 导出和数据沉淀。

## 登录与权限

小程序端：

- 不做 Web 风格登录页。
- 首次进入可展示首页，但涉及备课/开课/数据时要求完善培训师资料。
- 云函数通过 `OPENID` 获取身份，并映射到内部 `userId`。
- 参与者扫码只需要填写姓名，不强制授权头像昵称。

H5 端：

- 使用 CloudBase Web Auth。
- 优先手机号验证码登录。
- 管理后台可使用用户名密码或手机号登录。

iOS 端：

- 通过 HTTP 云函数/CloudBase Auth 建立用户会话。
- 不直接使用小程序 `openid`，统一映射到 `userId`。

## 实施阶段

### Phase 0：规格冻结

- 输出 `docs/archive/cloudbase-rebuild/requirements.md`。
- 输出 `docs/archive/cloudbase-rebuild/design.md`。
- 输出 `docs/archive/cloudbase-rebuild/tasks.md`。
- 明确 MVP 范围、非目标和验收标准。

### Phase 1：CloudBase 基座

- 建立 CloudBase dev/prod 环境。
- 建立云函数目录、shared 类型、统一错误码。
- 建立数据库集合、索引、安全规则。
- 接入 `wx.cloud.init` 和基础调用封装。

### Phase 2：业务主链路

- 模板/方案/活动。
- 选择模板开课。
- 开始培训。
- 签到、分组、积分、随机。
- 结束培训、查看当前数据、复盘。

### Phase 3：体验打磨

- 多尺寸适配。
- 弱网提示。
- 重复点击和幂等。
- 现场工具按钮、弹窗、手势。
- 真机验收。

### Phase 4：H5/iOS 预留

- 为 H5 暴露 HTTP 云函数入口。
- 建立 Web Auth 策略。
- 建立 shared API contract。
- 为 iOS 预留 HTTP API 和用户身份映射。

## 当前不做

- 不做一套 UI 代码同时跑小程序、H5、iOS。
- 不做 Python Flask 生产后端。
- 不做 MongoDB URI 生产数据库。
- 不做参与者自选队伍。
- 不做复杂 CDN/后台配置音效资源。
- 不做正式 PDF/DOCX 高级排版，MVP 保留 Markdown/HTML 导出优先。
