# wechat-app 发布、交接与内测完整步骤

本文档作为 `docs/wechat-app/` 下的主文档，面向当前真实运行与发布场景，适用于：

- 只有一个 CloudBase 环境
- 先发体验版内测，再提交正式审核
- 当前运行主链路为小程序前端 + 4 个 CloudBase 云函数

## 1. 工程结构与交接边界

### 1.1 工程根目录

- `project.config.json`
  - 微信开发者工具工程配置入口。
- `package.json`
  - 本地校验、Lint、格式化、单测脚本入口。
- `docs/wechat-app/RELEASE_GUIDE.md`
  - 当前主文档，覆盖发布、交接、内测与正式审核。
- `docs/wechat-app/CLEANUP_REPORT.md`
  - 当前附录，记录目录边界与已删除内容。

### 1.2 前端目录

- `miniprogram/app.js`
  - 小程序启动入口，负责初始化 `wx.cloud`。
- `miniprogram/app.json`
  - 页面注册、窗口配置、TabBar 配置。
- `miniprogram/pages/`
  - 页面目录，当前都已在 `app.json` 注册。
- `miniprogram/components/`
  - 可复用小程序组件。
- `miniprogram/services/cloud.js`
  - 统一云函数调用入口。
- `miniprogram/config/env.js`
  - 小程序 `develop / trial / release` 对应的 CloudBase 环境映射。
- `miniprogram/utils/`
  - 页面跳转、场次、计划、参与者入口等工具函数。
- `miniprogram/static/`
  - 图标、音效等静态资源。
- `miniprogram/styles/`
  - 页面公共样式。

### 1.3 云函数目录

- `cloudfunctions/trainer-api`
  - 培训师主页、资料、方案、活动、数据统计。
- `cloudfunctions/live-api`
  - 开课、签到、分组、积分、随机、互动、现场笔记、小程序码。
- `cloudfunctions/participant-api`
  - 参与者签到、反馈、互动提交。
- `cloudfunctions/review-api`
  - 复盘列表、详情、保存。
- `cloudfunctions/*/_shared.js`
  - 各云函数目录下的本地共享文件，负责封装云开发初始化、身份、幂等、请求解析与响应格式。

### 1.4 测试目录

- `tests/unit/`
  - Node 单元测试，当前仍被 `npm test` 使用。

## 2. 当前项目事实

### 2.1 工程入口

- 微信开发者工具导入目录：`wechat-app/`
- 工程配置文件：`project.config.json`
- 小程序代码目录：`miniprogram/`
- 云函数目录：`cloudfunctions/`

### 2.2 当前环境配置

当前 `EnvId` 配置在：

- `miniprogram/config/env.js`

当前代码状态：

- `trial.envId` 已指向正式使用环境
- `release.envId` 已指向正式使用环境
- `develop.envId` 为空时会自动回退到默认环境

这意味着你现在实际上是“单 CloudBase 环境”模式：

- 开发版写这一套环境
- 体验版写这一套环境
- 正式版也写这一套环境

### 2.3 当前需要上传的云函数

当前运行中的云函数只有 4 个：

- `trainer-api`
- `live-api`
- `participant-api`
- `review-api`

其中：

- `live-api/config.json` 已声明 `wxacode.getUnlimited`

## 3. 发布前准备

### 3.1 微信公众平台准备

先确认以下内容已经准备好：

- 小程序主体已认证
- 小程序名称、头像、简介已配置
- 服务类目已选择正确
- 已添加开发成员和体验者
- 隐私政策已准备
- 用户协议已准备
- 客服联系方式已准备

当前小程序内法律文档入口：

- `pages/mine/about/index`
- `pages/mine/legal/index?type=privacy`
- `pages/mine/legal/index?type=terms`

### 3.2 CloudBase 环境准备

因为你当前只有一个环境，先确认这一个环境里已经具备下面资源：

#### 数据库集合

- `users`
- `trainer_profiles`
- `templates`
- `plans`
- `activities`
- `live_sessions`
- `participants`
- `feedback`
- `reviews`
- `session_notes`
- `interactions`
- `interaction_submissions`
- `support_feedback`
- `operation_logs`

#### 数据库索引

建议至少建立：

- `ownerId`
- `status`
- `updatedAt`
- `startedAt`
- `sessionId`
- `openid`
- `interactionId`

#### 安全规则

推荐最小规则：

- 业务集合默认不允许客户端直读直写
- 培训师和参与者写入都通过云函数
- `operation_logs` 仅允许云函数写入
- 云存储仅通过临时链接暴露

### 3.3 测试数据准备

如果要先进入内测，建议导入联调用数据。

测试数据位置：

- `wechat-app-support/test-data/importable-jsonl/direct-import/`
- `wechat-app-support/test-data/importable-jsonl/need-user-id/`

规则：

- `direct-import/` 可直接导入
- `need-user-id/` 需要先替换 `REPLACE_WITH_USER_ID`

## 4. 本地发布前检查

在 `wechat-app/` 目录执行：

```bash
npm install
npm run verify:all
```

当前通过标准：

- `npm run lint` 通过
- `npm test` 通过
- `npm run syntax-check` 输出 `release contract ok`

如果这里不过，不要先上传。

## 5. 微信开发者工具上传步骤

### 5.1 导入工程

在微信开发者工具中：

1. 点击“导入项目”
2. 目录选择 `wechat-app/`
3. 确认使用的 `AppID` 正确

当前工程配置应为：

- `miniprogramRoot = miniprogram/`
- `cloudfunctionRoot = cloudfunctions/`

### 5.2 选择云开发环境

打开开发者工具中的“云开发”面板：

1. 选择你当前唯一的 CloudBase 环境
2. 确认环境 ID 与 `env.js` 中保持一致

因为当前只有一个环境，所以开发、体验、正式都共用同一套数据。

### 5.3 重新编译并做上传前检查

在开发者工具中执行：

1. 重新编译
2. 代码质量重新扫描
3. 确认当前没有阻塞上传的问题

当前项目已启用：

- `lazyCodeLoading = requiredComponents`

## 6. 云函数上传步骤

需要上传的云函数：

- `trainer-api`
- `live-api`
- `participant-api`
- `review-api`

建议操作：

1. 在开发者工具左侧找到云函数目录
2. 逐个右键云函数
3. 选择“上传并部署：云端安装依赖”

建议顺序：

1. `trainer-api`
2. `live-api`
3. `participant-api`
4. `review-api`

上传后重点确认：

- `live-api` 的 OpenAPI 权限已生效
- 小程序码能力可正常调用

## 7. 小程序代码上传步骤

### 7.1 本地预览

在上传体验版前，先在开发者工具中跑一遍主流程：

- 首页加载
- 备课页加载
- 创建方案
- 保存草稿
- 开课
- 手动签到
- 扫码签到
- 反馈提交
- 互动提交
- 复盘保存

### 7.2 上传体验版

开发者工具顶部点击“上传”：

建议填写：

- 版本号：`0.1.x`
- 备注：明确写清本次上传内容

示例：

- 版本号：`0.1.1`
- 备注：`内测版：主链路联调与体验版配置修复`

上传成功后，该版本会进入微信公众平台的“开发版本/体验版”。

## 8. 体验版发放步骤

### 8.1 添加体验者

进入微信公众平台：

1. 打开小程序后台
2. 进入成员管理或体验者管理
3. 添加体验者微信号

### 8.2 让体验者进入

体验者不能像正式版那样面向所有用户公开搜索。

体验者进入方式：

- 被添加为体验者后，在微信里搜索小程序名称
- 扫体验版码
- 打开你发出的体验版小程序卡片

建议你直接发给体验者：

- 小程序名称
- 体验说明
- 测试重点

## 9. 内测重点验证项

建议真机重点验证下面内容：

- 首页待开课、草稿、待复盘统计
- 方案创建、保存、确认
- 开课后进入现场页
- 手动签到与扫码签到
- 重复签到拦截
- 分组、积分、抽取、计时
- 互动创建、提交、关闭
- 现场笔记保存
- 反馈提交
- 复盘保存后状态更新
- 小程序码跳转签到、反馈、互动页面

## 10. 正式提审步骤

当体验版验证稳定后，再做正式审核：

1. 再执行一次 `npm run verify:all`
2. 确认云函数为最新版本
3. 确认数据库与规则无误
4. 确认隐私政策、用户协议、客服信息完整
5. 在微信开发者工具重新上传正式提交版本
6. 到微信公众平台填写版本说明并提交审核

## 11. 单环境模式的额外风险

因为你现在只有一个 CloudBase 环境，发布和内测要额外注意：

- 内测数据会进入正式库
- 体验版联调会影响正式数据
- 测试用户可能写入真实业务集合
- 真机调试日志和真实运行日志混在一起

所以建议你在每次内测前后都做：

- 清理明显测试数据
- 检查 `templates`、`plans`、`live_sessions`
- 检查是否残留测试用户或测试互动数据

## 12. 这次实际建议顺序

按你现在的项目状态，最适合的顺序是：

1. `npm run verify:all`
2. 在微信开发者工具中重新编译
3. 选择唯一 CloudBase 环境
4. 确认集合、索引、规则齐全
5. 导入联调用数据
6. 上传 4 个云函数
7. 本地预览主链路
8. 上传体验版
9. 在微信公众平台添加体验者
10. 真机内测
11. 内测稳定后再提交正式审核

## 13. 文档结构说明

当前项目内与 `wechat-app` 相关的操作文档已集中到 `docs/wechat-app/`，并整理为“1 主文档 + 1 附录”：

- 主文档：`docs/wechat-app/RELEASE_GUIDE.md`
  - 用于发布、交接、内测、正式审核。
- 附录：`docs/wechat-app/CLEANUP_REPORT.md`
  - 用于记录目录边界、已删除内容和清理结论。

后续如果目录结构长期稳定，可以继续保持这套 `docs/wechat-app/` 结构，不需要再放回代码目录。
