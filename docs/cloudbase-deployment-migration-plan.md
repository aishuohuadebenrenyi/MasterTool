# 腾讯 CloudBase 部署与改造方案

## 结论

项目生产环境采用 **腾讯 CloudBase 文档数据库 + HTTP 云函数 + HTTP 访问服务**。

推荐路线：

1. 前端继续使用当前 `api/request.uts` 的 HTTP 调用方式，只切换 `VITE_API_BASE_URL` 到 CloudBase HTTP 访问服务域名。
2. 后端保持现有业务接口路径和统一响应格式，新增 CloudBase 生产入口。
3. 数据层从 `PyMongo/MongoDB URI` 改为 CloudBase 文档数据库访问层，不让前端直接读写数据库。
4. 云端优先使用 HTTP 云函数承载 `/api/*`，后续用户量上来后再评估云托管。

这样可以最大限度保留当前小程序页面、Store、API 契约和测试思路，把主要改造集中在后端运行入口、数据库适配、部署配置和权限治理。

## 官方依据

- CloudBase 是内置数据库、云函数、云托管、存储、认证等能力的 Serverless 后端一体化平台，适合小程序和 Web 应用。
  - https://cloud.tencent.com/document/product/876/18431
- CloudBase 文档型数据库基于 MongoDB 的文档模型，支持文档管理、索引、聚合、事务、实时推送。
  - https://docs.cloudbase.net/database/introduce
- CloudBase 云函数支持 HTTP 请求触发，并支持 Node.js、Python、Java、Go、PHP 等语言。
  - https://docs.cloudbase.net/cloud-function/introduce
- CloudBase HTTP 访问服务可以把统一域名和路径映射到云函数、云托管、静态托管等资源。
  - https://docs.cloudbase.net/service/introduce
- 在云函数里访问 CloudBase 资源时，Node.js 可使用 `@cloudbase/node-sdk`；其他语言需要通过 HTTP API 调用 CloudBase 资源。
  - https://docs.cloudbase.net/cloud-function/resource-integration/cloudbase
- CloudBase CLI 用于管理和部署云开发资源。
  - https://docs.cloudbase.net/cli-v1/install

## 目标架构

```text
微信小程序 / H5 调试
        |
        | HTTPS
        v
CloudBase HTTP 访问服务
        |
        | /api/*
        v
HTTP 云函数 API 层
        |
        | 统一鉴权 / 路由 / 响应 / 错误处理
        v
业务服务层
        |
        | Repository
        v
CloudBase 文档数据库
```

核心原则：

- 前端只访问后端 HTTP API，不直接操作 CloudBase 文档数据库。
- 后端继续返回 `{ code, message, data }`，减少前端改造。
- 以 `userId`、`planId`、`sessionId`、`reviewId` 串起方案、现场、反馈、复盘的数据链路。
- 生产数据和体验/测试数据使用不同 CloudBase 环境或不同集合前缀，不混用。

## 当前项目与目标架构差异

| 模块 | 当前实现 | CloudBase 目标 | 改造量 |
| --- | --- | --- | --- |
| 前端请求 | `API_BASE_URL` + HTTP request | 保留 HTTP，切换域名 | 小 |
| 小程序登录 | 后端 mock `wx_{code}_openid` | 后端真实 `code2session` 或 CloudBase 认证 | 中 |
| 后端入口 | Flask 本地服务 + `handler.py` 分发 | HTTP 云函数入口承接 `/api/*` | 中 |
| 数据库 | `PyMongo` + MongoDB URI | CloudBase 文档数据库 SDK/API | 中到大 |
| 部署配置 | `serverless.yml` 偏腾讯云函数路由 | CloudBase CLI / 控制台 / HTTP 访问服务路由 | 中 |
| 权限 | 后端按 `userId` 过滤 | 后端过滤 + CloudBase 集合安全规则 | 中 |
| 监控 | 本地日志 / pytest | 云函数日志、监控、告警、灰度 | 中 |

## 后端改造方案

### 1. 保留现有接口契约

保留现有路径，例如：

- `POST /api/user/login`
- `GET /api/plan/list`
- `POST /api/plan/create`
- `POST /api/live/start`
- `POST /api/live/checkin`
- `POST /api/review/save`

原因：

- 前端 API 层已经按领域拆分，契约稳定。
- 当前测试覆盖了方案、活动、现场、反馈、复盘等主链路。
- 重写路径会带来大量无产品价值的前端改动。

### 2. 新增 CloudBase HTTP 云函数入口

建议新增生产入口，而不是删除现有本地开发入口：

```text
backend/
├── dev_server.py              # 保留：本地 Flask 调试
├── handler.py                 # 保留/收敛：现有云函数分发参考
├── cloudbase_entry.py         # 新增：CloudBase HTTP 云函数入口
└── common/
    └── database.py            # 改造为可切换数据库适配器
```

如果继续使用 Python HTTP 云函数：

- 优点：能复用当前 Python 业务函数，初期代码迁移少。
- 风险：CloudBase 文档数据库在云函数内的直接 SDK 体验以 Node.js 为主，Python 需要通过 HTTP API 访问 CloudBase 资源，签名、临时密钥、错误处理会更繁琐。

如果改为 Node.js / TypeScript HTTP 云函数：

- 优点：`@cloudbase/node-sdk` 在云函数环境里无需额外密钥，访问数据库最顺；长期维护更贴合 CloudBase 文档。
- 风险：需要把现有 Python 业务函数迁移到 TypeScript，短期工作量更大。

产品早期建议：

- **第一阶段先保留 Python 业务代码，抽象数据库访问层和云函数入口。**
- **如果 CloudBase Python + HTTP API 的数据库访问复杂度过高，再迁移为 Node.js / TypeScript API 层。**
- 不建议让前端直接调用数据库，因为当前业务有较多状态机、去重、权限、现场数据一致性逻辑，应集中在后端。

### 3. 抽象数据库访问层

当前 `backend/common/database.py` 直接返回 MongoDB client。需要改为：

```text
common/database.py
common/repositories/
├── users.py
├── plans.py
├── activities.py
├── live_sessions.py
├── participants.py
├── feedback.py
├── reviews.py
└── notes.py
```

Repository 只暴露业务需要的方法，例如：

- `find_plan_by_id(user_id, plan_id)`
- `list_plans(user_id, status, is_template)`
- `create_session(user_id, plan_id, snapshot)`
- `checkin_participant(session_id, name, openid)`
- `save_group_result(session_id, groups)`

这样后续从 MongoDB 切到 CloudBase 文档数据库时，不需要在每个业务函数里处理 SDK 差异。

### 4. 需要重点保证的数据一致性

现场链路必须重点处理：

- 签到时同一 `sessionId` 下姓名不能重复。
- 同一 `openid` 同一场活动不能重复签到。
- 分组必须基于当前 `sessionId` 的已签到参与者。
- 积分必须绑定当前 `sessionId` 和队伍。
- 随机抽取默认从当前已签到参与者中取人，并支持是否允许重复抽取。
- 活动结束后查看数据必须进入当前 `sessionId` 数据，不进入全局数据。

CloudBase 文档数据库需要为这些约束建立索引和后端校验，不能只依赖前端判断。

## 数据库集合与索引

继续沿用当前集合名：

- `users`
- `plans`
- `activities`
- `live_sessions`
- `participants`
- `feedback`
- `reviews`
- `notes`
- `user_feedback`

建议索引：

| 集合 | 索引 | 用途 |
| --- | --- | --- |
| `users` | `openid` 唯一 | 登录定位用户 |
| `plans` | `userId + isTemplate + status + updatedAt` | 备课列表、模板列表、状态筛选 |
| `plans` | `userId + favorite + updatedAt` | 收藏筛选 |
| `activities` | `userId + scene + difficulty + updatedAt` | 活动库筛选 |
| `activities` | `userId + favorite + updatedAt` | 活动收藏 |
| `live_sessions` | `userId + status + startedAt` | 首页待开课/现场记录 |
| `live_sessions` | `planId + status` | 方案关联现场 |
| `participants` | `sessionId + name` 唯一语义 | 防重名签到 |
| `participants` | `sessionId + openid` 唯一语义 | 防重复签到 |
| `feedback` | `sessionId + createdAt` | 当前活动反馈 |
| `reviews` | `sessionId + userId` | 当前活动复盘 |
| `notes` | `sessionId + phaseId + updatedAt` | 现场笔记 |

CloudBase 如果某些唯一约束不能直接配置，需要后端在写入前查询并在并发写入时做事务或幂等处理。

## 前端改造方案

### 1. 保持 HTTP API 封装

现有前端 `frontend/api/request.uts` 已经集中处理：

- `baseUrl`
- `Authorization`
- `401`
- 网络错误
- 微信联调环境错误

生产部署只需要配置：

```text
VITE_API_BASE_URL=https://{custom-domain-or-env-domain}/api
```

如果使用 CloudBase 默认域名，只用于开发测试。生产建议绑定已备案自定义域名，并添加到微信小程序合法请求域名。

### 2. 登录流程

小程序首次打开：

```text
App 启动 -> 读取本地 token -> 无 token 显示未登录/试用态 -> 用户点击登录 -> wx.login -> /api/user/login -> 后端换 openid/session_key -> 返回 token 和用户信息
```

登录后：

```text
App 启动 -> token 可用 -> 拉取用户资料和首页统计 -> 首页展示真实待办
```

需要改造点：

- `backend/functions/user/login.py` 不能再使用 mock openid。
- 后端需要配置 `WECHAT_APPID`、`WECHAT_SECRET`。
- 前端登录失败要保持当前统一 toast 和空态，不要出现原始 `400/500`。

### 3. 小程序平台配置

需要在微信公众平台配置：

- request 合法域名：CloudBase HTTP 访问服务域名或自定义域名。
- 业务域名：如后续有 H5 页面再配置。
- 隐私协议与用户协议。
- 小程序类目和接口权限。

## 部署改造清单

### CloudBase 环境

- 创建 `dev` 环境：日常联调。
- 创建 `prod` 环境：线上发布。
- 开启文档数据库。
- 创建集合和索引。
- 配置 HTTP 访问服务路由：
  - `/api/* -> HTTP 云函数 api`
- 生产绑定自定义域名。

### 云函数配置

环境变量：

```text
TCB_ENV_ID=
WECHAT_APPID=
WECHAT_SECRET=
TRAINER_TOOLBOX_SECRET_KEY=
TOKEN_EXPIRES_IN=604800
ALLOW_ORIGINS=
```

函数建议：

- 单个 HTTP API 函数承载当前 `/api/*`，便于早期维护。
- 内存从 `256MB` 或 `512MB` 起步。
- 超时时间从 `10s` 起步。
- 关闭不必要的公网外呼。
- 后续高频现场接口如签到、互动提交，可拆独立函数。

### 本地开发

保留：

```bash
cd backend
python3 dev_server.py
```

新增：

```bash
tcb login
tcb functions deploy api -e {envId}
tcb service deploy -e {envId}
```

具体命令以最终 CloudBase 配置文件为准。

## 测试与验收

上线前必须跑：

- 后端单元/集成测试。
- 前端 Vitest。
- 微信开发者工具真机预览。
- 弱网和超时测试。
- 未登录、登录过期、接口 401、接口 500、CloudBase 域名不可达。
- 现场完整链路：
  - 选择已确认方案开课
  - 签到
  - 防重名/防重复签到
  - 分组
  - 积分
  - 随机抽取
  - 反馈
  - 结束培训
  - 查看当前活动数据
  - 开始复盘
  - 保存复盘

## 分阶段执行计划

### Phase 1：部署骨架

- 新增 CloudBase 改造文档和环境变量说明。
- 建立 CloudBase dev/prod 环境。
- 配置 HTTP 访问服务和合法域名。
- 新增云函数入口，不影响本地 Flask 调试。

### Phase 2：数据库适配

- 抽象 Repository 层。
- 将所有 `collection.find/update/insert` 从业务函数中收拢。
- 接入 CloudBase 文档数据库。
- 补齐索引和并发写入保护。

### Phase 3：登录与权限

- 替换 mock 登录。
- token 与用户资料接入真实 openid。
- 所有集合读写都校验 `userId` 或 `sessionId` 归属。
- 参与者端提交使用短期口令或 session token，避免裸写。

### Phase 4：生产发布

- 接入生产自定义域名。
- 发布小程序体验版。
- 完成真机多尺寸和弱网验收。
- 配置云函数日志、错误告警和基础用量监控。

## 发布前风险

| 风险 | 影响 | 处理 |
| --- | --- | --- |
| Python 访问 CloudBase 文档数据库复杂 | 后端改造变慢 | 先抽象 Repository，必要时迁移 API 层到 Node.js |
| 默认域名生产限制 | 小程序正式版不稳定或不可用 | 生产绑定备案自定义域名 |
| 现场高并发签到 | 重复签到或写入冲突 | 后端唯一语义校验、事务/幂等处理、重试提示 |
| 冷启动 | 第一次请求慢 | 首页接口轻量化，必要时预热或拆高频函数 |
| 权限规则缺失 | 数据串用户 | 后端强校验 + CloudBase 安全规则 |
| 成本失控 | 调用量异常增加 | 日志采样、告警、限制参与者端提交频率 |

## 当前不建议做的事

- 不建议前端直接读写 CloudBase 文档数据库。
- 不建议一次性把所有后端业务改成全新接口。
- 不建议内测期引入复杂 CDN/后台配置音效资源。
- 不建议现在接 PDF/DOCX 高级导出，当前 Markdown 导出更适合 MVP。

