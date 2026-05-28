# MasterTool

培训师工具箱项目，面向培训师的小程序工具，覆盖备课、现场带课、反馈收集、复盘分析等完整交付链路。

## 项目简介

项目当前采用前后端分离结构：

- `frontend/`：基于 `uni-app x + Vue 3 + Pinia + UTS` 的小程序前端
- `backend/`：基于 `Flask + MongoDB` 的本地开发服务，同时复用同一套业务逻辑支持云函数部署
- `prototype/`：原型页面与静态参考资源

核心业务链路为：

`首页开课 -> 备课/方案确认 -> 现场实施 -> 反馈收集 -> 复盘保存 -> 数据沉淀`

现场数据链路以 `sessionId` 为主键：

`live/start -> 签到 participants -> 分组 groups -> 积分 scores -> 随机抽取 -> live/end -> 反馈/复盘/本场数据`

当前产品主范围对应 3 个 tab 与若干二级业务页：

- `首页`
  - 快速开课
  - 待处理任务
  - 复盘入口
- `备课`
  - 我的方案
  - 活动库
  - 方案编辑 / 方案预览 / 活动详情
- `我的`
  - 数据详情
  - 培训记录
  - 设置 / 帮助与反馈 / 关于
- 核心二级页
  - `现场页`
  - `反馈收集`
  - `复盘中心 / 复盘详情`

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
  - 现场 session 状态、签到、分组、积分、随机抽取、笔记会话态
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

### 共享组件与运行时工具

近期项目已经把微信端兼容和界面规范收敛到一组共享组件/工具中：

- `components/AppIcon.uvue`
  - 统一承接正式图标资源
  - 运行时根据平台切换 `svg/png`
  - 微信端加载失败时自动回退同名 `png`
- `components/NavBar.uvue`
  - 二级页统一导航
  - 返回按钮与微信胶囊左右对位
  - 标题保持真居中
- `components/HalfSheet.uvue`
  - 统一底部半弹窗表现与安全区处理
- `components/SearchBar.uvue`
  - 统一搜索框尺寸、圆角、图标与清空行为
- `utils/runtime.uts`
  - 平台/宿主探测
  - 避免继续依赖 `getSystemInfoSync`
- `utils/navbar.uts`
  - 微信胶囊与导航安全区测量
  - 输出 `leftSafeWidth / rightSafeWidth / contentTopOffset`
- `utils/viewport.uts`
  - 安全区、视口高度、桌面端最大宽度
- `utils/icons.uts`
  - 图标名到资源路径的统一映射

## 产品发布状态

从产品专家视角，当前版本已经具备内测基础：方案状态链路、现场核心工具、反馈、复盘和本场数据都已打通；首页、备课、我的三个主 tab 也具备未登录/已登录基础体验。

正式发布前仍需补齐：

- 正式小程序码图片生成，覆盖签到、反馈和互动入口。
- 小程序合法域名、appid、登录授权、隐私协议、用户协议和后台配置。
- 真机弱网验收，覆盖慢请求、超时、401、后端不可达等提示。
- 数据权限复查，确保方案、活动、现场、反馈、复盘只能读写当前用户数据。
- 多尺寸视觉验收，重点检查微信胶囊、安全区、底部弹窗、工具按钮和列表左滑。

建议后置到 v1.1：

- PDF/DOCX 正式导出和培训报告排版。
- 指令面板与高级手势。
- 扩展音效资源包与 CDN/后台配置。
- 随机题库后台配置、按组/按角色抽取、多人批量抽取。

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

## 微信适配策略

项目当前已经将微信小程序适配收敛为以下规则：

- 导航规则
  - 二级页统一使用 `NavBar.uvue`
  - 返回按钮放在与微信原始右上角胶囊对应的左侧
  - 标题以胶囊左右安全区为基准做真正居中
- 顶部布局规则
  - 页面首屏内容整体位于胶囊下一行
  - `首页 / 备课 / 我的` 使用自定义头部，但复用同一套导航测量结果
- 运行时规则
  - 使用 `getWindowInfo / getDeviceInfo / getAppBaseInfo`
  - 避免使用已废弃的 `getSystemInfoSync`
- 图标规则
  - tabBar 图标仅使用 `png`
  - 页面正式图标通过 `AppIcon + icons.uts` 统一管理
  - 微信端优先走 `png`，其他端可保留 `svg`
- 弹层规则
  - 底部弹窗统一使用 `HalfSheet.uvue`
  - 按钮区、二维码区、滚动区统一考虑底部安全区

## UI 基础约定

为避免页面风格和交互再次分叉，当前项目遵循以下 UI 规则：

- 导航
  - 二级页统一左上返回
  - tab 页不显示返回按钮
- 图标
  - 不再使用 emoji 或纯字符作为正式图标
  - 元信息图标、区块标题图标、流程图标分别使用分层尺寸
- 搜索
  - 搜索框使用正式圆角输入区
  - 搜索图标位于右侧
  - 搜索与筛选按页面数据实时过滤
- 弹层
  - 使用统一圆角、手柄、底部按钮和白底内容区
  - `HalfSheet.uvue` 仅保留一处底部安全区来源，避免 footer 与底部填充重复占位
  - 弹窗优先使用尺寸语义：`compact / standard / large`
- 布局
  - 页面内容优先保证微信端稳定，再兼顾 H5/桌面宽度增强

## UI 框架策略

当前项目不采用“整包接入第三方 UI 框架”的路线，而是采用：

- 主方案
  - 项目内建设计系统
  - 公共壳层组件复用
  - 页面模板化治理
- 候选增强
  - 仅评估 `uni-ui` 这类更贴近 `uni-app` 生态的低风险基础件
  - 只允许按需试点，不接管整个页面骨架

明确边界如下：

- 保留自定义组件
  - `NavBar.uvue`
  - `SearchBar.uvue`
  - `HalfSheet.uvue`
  - `AppIcon.uvue`
- 不建议替换的能力
  - 微信胶囊避让
  - 页面顶部安全区计算
  - 页面图标兼容策略
  - 底部工具栏和半弹窗壳层
- 可试点的低风险基础件
  - 折叠面板：适合活动详情这类展开/收起区块
  - 分段选择 / 标签选择：适合筛选栏和轻量切换器
  - 数字输入器：适合人数、计数类输入
  - 轻量表单子件：可嵌入现有弹窗，但不替换 `HalfSheet.uvue`

原因：

- 全部页面均使用 `navigationStyle: custom`
- 项目大量依赖 `UTS + .uvue` 与微信胶囊测量结果
- 当前主要痛点是“模板与布局规则不统一”，不是简单缺少组件库

## 页面模板约定

为兼容微信小程序与 H5，并减少页面重复修样式，页面统一按以下模板组织：

- tab 页模板
  - 适用：`首页 / 备课 / 我的`
  - 规则：顶部内容整体位于胶囊下一行，支持最大宽度与水平居中
- 二级页模板
  - 规则：统一 `NavBar + page content + card surface`
  - 返回按钮始终与微信胶囊对应左侧对位
- 搜索筛选列表模板
  - 规则：统一 `SearchBar + filter chips + list stack`
  - 搜索图标固定在右侧，列表卡片和空态遵循统一节奏

## HalfSheet 验收基线

为避免底部弹窗再次出现“改了几次仍不稳定”的情况，后续调整 `HalfSheet.uvue` 时至少验收以下规则：

- 短内容弹窗
  - 不应因为默认高度过大而出现明显底部留白
- 长内容弹窗
  - 仅 body 区滚动，header 与 footer 保持稳定
- 底部安全区
  - 有 footer 时由 footer 承担底部安全区
  - 无 footer 时由 body 末尾承担底部安全区
- 尺寸约定
  - 短列表与简单选择用 `compact`
  - 常规表单与两步选择用 `standard`
  - 工具箱、现场管理等复杂场景用 `large`
- 抽检页面
  - `首页`
  - `备课`
  - `方案编辑`
  - `活动详情`
  - `培训现场`

## 图标资源策略

正式图标系统已经从“文本符号/emoji”切换为统一资源方案：

- 图标资源目录：`frontend/static/icons/`
- 图标入口：
  - `frontend/utils/icons.uts`
  - `frontend/components/AppIcon.uvue`
- 资源约束：
  - tabBar 图标必须使用 `png`
  - 页面图标保持同名 `svg/png` 配对，便于跨端切换
- 使用约束：
  - 页面和组件优先传 `name`
  - 不再直接散落写死图标路径

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
