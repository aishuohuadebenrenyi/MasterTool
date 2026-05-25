# MasterTool

培训师工具箱项目，面向培训师的小程序工具，覆盖备课、现场带课、反馈收集、复盘分析等完整交付链路。

## 项目简介

项目当前采用前后端分离结构：

- `frontend/`：基于 `uni-app x + Vue 3 + Pinia + UTS` 的小程序前端
- `backend/`：基于 `Flask + MongoDB` 的本地开发服务，同时复用同一套业务逻辑支持云函数部署
- `prototype/`：原型页面与静态参考资源

核心业务链路为：

`首页开课 -> 备课/方案确认 -> 现场实施 -> 反馈收集 -> 复盘保存 -> 数据沉淀`

## 技术栈

### 前端

- `uni-app x`
- `Vue 3`
- `Pinia`
- `UTS`
- `Vitest`

### 后端

- `Python 3`
- `Flask`
- `Flask-CORS`
- `PyMongo`
- `MongoDB`
- `Pytest`
- `mongomock`

## 目录结构

```text
ImprovTool/
├── frontend/                 # 小程序前端
│   ├── api/                  # 请求封装
│   ├── components/           # 通用组件
│   ├── pages/                # 页面
│   ├── stores/               # Pinia 状态管理
│   ├── utils/                # 常量、导航适配、格式化、存储
│   ├── tests/                # 前端单元测试
│   ├── App.uvue              # 应用启动入口
│   ├── main.uts              # 前端主入口
│   └── pages.json            # 页面与 tabBar 配置
├── backend/                  # 后端服务
│   ├── common/               # 鉴权、数据库、响应、校验
│   ├── functions/            # 按业务域拆分的接口实现
│   ├── models/               # 数据模型与序列化
│   ├── tests/                # 后端单元/集成测试
│   ├── dev_server.py         # 本地 Flask 开发入口
│   ├── handler.py            # 云函数分发入口
│   ├── serverless.yml        # 云函数路由配置
│   └── requirements.txt      # 后端依赖
├── prototype/                # 原型文件
└── README.md
```

## 前端架构

### 分层设计

前端整体遵循：

`request -> api -> store -> pages`

各层职责如下：

- `api/request.uts`
  - 统一处理 `baseUrl`
  - 注入 `Authorization`
  - 处理 `401`
  - 区分微信联调环境错误与真实网络错误
- `api/*.uts`
  - 按领域拆分 API，例如 `plan`、`activity`、`live`、`review`
- `stores/*.uts`
  - 统一承接页面状态与业务操作
- `pages/**/*.uvue`
  - 页面渲染与交互入口
- `components/*.uvue`
  - 通用 UI 能力，如 `NavBar`、`ConfirmDialog`、`HalfSheet`

### 页面结构

一级页面通过 `tabBar` 组织：

- `首页`
- `备课`
- `我的`

二级业务页包括：

- `方案编辑`
- `方案预览`
- `活动详情 / 编辑`
- `现场页`
- `培训结束页`
- `反馈页`
- `复盘中心 / 复盘详情`
- `培训记录 / 数据详情 / 设置 / 关于`

### 关键 Store

- `stores/plan.uts`
  - 方案列表、详情、创建、更新、确认、复盘重开
- `stores/activity.uts`
  - 活动库列表、详情、收藏、编辑
- `stores/live.uts`
  - 现场 session 状态、签到、分组、积分、抽人、笔记会话态
- `stores/review.uts`
  - 复盘列表、详情、保存
- `stores/user.uts`
  - 登录态、资料、统计信息
- `stores/config.uts`
  - 全局设置与本地持久化配置

### 导航与适配

项目对微信小程序导航和安全区做了专门适配：

- `utils/navbar.uts`
  - 动态计算 `statusBarHeight`
  - 动态获取微信胶囊位置
  - 计算 `leftSafeWidth / rightSafeWidth`
- `components/NavBar.uvue`
  - 复用型子页面导航
  - 通过左右安全区实现标题真居中
- `home / prepare / mine`
  - 这三个 tab 页面采用自定义头部，不直接使用通用 `NavBar`

适配策略重点：

- 不写死顶部导航高度
- 不写死胶囊右侧避让
- 底部弹层与按钮区考虑 `safe-area-inset-bottom`
- 微信端优先保证可用性与布局稳定性

## 后端架构

### 双入口结构

后端复用同一套业务逻辑，同时支持：

- 本地开发：`backend/dev_server.py`
- 云函数部署：`backend/handler.py`

本地模式下，Flask 请求会被转换成统一的 `event` 结构，再转发给 `functions/*` 下的业务函数。这样本地开发与云端部署共用同一套处理逻辑。

### 目录职责

- `common/`
  - `auth.py`：Token 鉴权
  - `database.py`：MongoDB 连接
  - `response.py`：统一响应格式
  - `validators.py`：参数校验
- `functions/`
  - `user/`：登录、资料、统计、用户反馈
  - `plan/`：方案创建、更新、删除、列表、详情、确认
  - `activity/`：活动管理、收藏
  - `live/`：开课、签到、分组、积分、抽人、结束
  - `review/`：复盘开始、保存、详情、列表
  - `feedback/`：反馈提交、统计、列表
  - `note/`：现场笔记列表与保存
- `models/`
  - 核心业务模型与序列化逻辑

### 统一响应格式

后端统一返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 数据库

默认使用本地 MongoDB：

- `MONGO_URI=mongodb://localhost:27017`
- `DB_NAME=trainer_toolbox`

测试环境使用：

- `MONGO_URI=mongodb://localhost:27017`
- `DB_NAME=trainer_toolbox_test`

主要集合包括：

- `users`
- `plans`
- `activities`
- `live_sessions`
- `participants`
- `reviews`
- `feedback`
- `notes`
- `user_feedback`

## 核心业务状态机

### 方案状态

方案主状态流转：

```text
draft -> confirmed -> delivered -> reviewed
```

语义如下：

- `draft`
  - 草稿，允许编辑
- `confirmed`
  - 已确认，允许开课
- `delivered`
  - 现场结束，允许进入反馈和复盘
- `reviewed`
  - 复盘已完成

### 现场状态

`live_session` 的运行状态包括：

```text
not_started -> in_progress -> paused -> ended
```

### 关键链路

完整链路如下：

1. 首页或备课页发起开课
2. 后端 `live/start` 创建 `sessionId`
3. `sessionId` 回写到 `plan`
4. 现场页基于 `sessionId` 执行签到、分组、积分、抽人、笔记
5. `live/end` 结束后将方案推进到 `delivered`
6. `review/start` 创建复盘
7. `review/save` 保存复盘并把方案推进到 `reviewed`

这条链路中最关键的主键有：

- `planId`
- `sessionId`
- `reviewId`

## 主要接口分组

### 用户

- `/user/login`
- `/user/profile`
- `/user/stats`
- `/user/feedback`

### 方案

- `/plan/create`
- `/plan/update/{planId}`
- `/plan/delete/{planId}`
- `/plan/list`
- `/plan/detail/{planId}`
- `/plan/confirm/{planId}`

### 活动

- `/activity/create`
- `/activity/update/{activityId}`
- `/activity/delete/{activityId}`
- `/activity/list`
- `/activity/detail/{activityId}`
- `/activity/favorite/{activityId}`

### 现场

- `/live/start`
- `/live/end`
- `/live/checkin`
- `/live/checkin/list`
- `/live/group`
- `/live/score`
- `/live/pick`

### 复盘

- `/review/start`
- `/review/save/{reviewId}`
- `/review/detail/{reviewId}`
- `/review/list`

### 反馈与笔记

- `/feedback/submit`
- `/feedback/stats`
- `/feedback/list`
- `/note/list`
- `/note/save`

## 本地开发

### 1. 启动 MongoDB

确保本地 MongoDB 已运行：

```bash
mongodb://localhost:27017
```

### 2. 启动后端

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 dev_server.py
```

默认监听：

- `http://localhost:8080`
- `http://0.0.0.0:8080`

健康检查：

- `GET /`
- `GET /health`

### 3. 配置前端接口地址

开发环境变量文件：

- [frontend/.env.development](file:///Users/leehuyoo/Desktop/onework/activate_tool/ImprovTool/frontend/.env.development)

当前示例：

```env
VITE_API_BASE_URL=http://192.168.31.92:8080
```

如果在微信开发者工具联调：

- 不要使用 `localhost`
- 应改为电脑局域网 IP
- 电脑和开发设备需处于同一局域网

### 4. 启动前端

前端通常通过以下方式运行：

- `HBuilderX`
- `微信开发者工具`

前端工程目录：

```bash
cd frontend
npm install
```

## 测试

### 前端测试

```bash
cd frontend
npm test
```

可选命令：

```bash
npm run test:run
npm run test:coverage
```

### 后端测试

```bash
cd backend
pytest
```

后端测试使用 `mongomock`，不依赖真实 MongoDB 数据。

## 微信小程序联调注意事项

- 微信端不能直接请求 `localhost`
- 需要改成局域网 IP，例如 `http://192.168.x.x:8080`
- 微信开发者工具调试阶段通常需要关闭“合法域名校验”
- 自定义导航必须动态获取：
  - `statusBarHeight`
  - 胶囊按钮位置
  - 底部安全区
- 底部弹层和底部按钮区要考虑 `safe-area-inset-bottom`

## 当前工程重点

项目当前重点关注以下几个方面：

- 前后端契约统一
- 方案到现场到复盘的状态机完整性
- 微信开发者工具兼容
- 页面结构和交互贴近原型
- 请求错误处理与日志可追踪

## 后续维护建议

- 新增接口时，同时检查：
  - `backend/dev_server.py`
  - `backend/handler.py`
  - `backend/serverless.yml`
- 新增页面时，优先复用：
  - `components/NavBar.uvue`
  - `utils/navbar.uts`
- 涉及现场链路的修改时，注意不要打断：
  - `planId`
  - `sessionId`
  - `reviewId`
- 微信端布局问题优先通过“动态测量安全区”解决，不建议继续写死高度
