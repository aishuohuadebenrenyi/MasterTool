# wechat-app 发布、交接与版本管理完整步骤

本文档是微信小程序的主运行与发布文档，面向当前真实运行与发布场景，适用于：

- 只有一个 CloudBase 环境
- `1.0.0` 已正式上线，后续按补丁版、小版本和大版本管理
- 先发体验版验证，再提交正式审核
- 当前运行主链路为小程序前端 + 4 个 CloudBase 云函数

## 1. 工程结构与交接边界

### 1.1 发布工程根目录

- `project.config.json`
  - 微信开发者工具工程配置入口。
- `miniprogram/`
  - 小程序前端运行目录。
- `cloudfunctions/`
  - CloudBase 云函数目录。

### 1.2 支持目录

- `tooling/verification/package.json`
  - 本地校验、Lint、格式化、单测脚本入口。
- `tooling/verification/tests/unit/`
  - Node 单元测试目录。
- `tooling/verification/tests/verify-wechat-app.js`
  - 小程序语法与发布契约检查入口。
- `backend/cloudbase/seed/`
  - 联调和手动导入数据。
- `docs/operations/wechat/RELEASE_GUIDE.md`
  - 当前主文档，覆盖发布、交接、内测与正式审核。
- `docs/archive/wechat-directory-cleanup-report.md`
  - 当前附录，记录目录边界与已删除内容。

### 1.3 前端目录

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

### 1.4 云函数目录

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

## 2. 当前项目事实

### 2.1 工程入口

- 微信开发者工具导入目录：`apps/wechat-cloudbase/`
- 本地测试和发布校验目录：`tooling/verification/`
- 工程配置文件：`project.config.json`
- 小程序代码目录：`miniprogram/`
- 云函数目录：`cloudfunctions/`

### 2.2 当前环境配置

当前 `EnvId` 配置在：

- `miniprogram/config/env.js`

公开仓库中的 `EnvId` 使用占位配置。发布前请按实际环境填写：

- `develop.envId`：开发环境。
- `trial.envId`：体验版使用环境。
- `release.envId`：正式版使用环境。

如果当前只准备了一个 CloudBase 环境，也可以让开发版、体验版和正式版临时指向同一环境；这种模式适合内测，不建议长期用于正式运营。

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

- `backend/cloudbase/seed/importable-jsonl/direct-import/`
- `backend/cloudbase/seed/importable-jsonl/need-user-id/`

规则：

- `direct-import/` 可直接导入
- `need-user-id/` 需要先替换 `REPLACE_WITH_USER_ID`

## 4. 版本管理规则

`1.0.0` 是已上线正式版，后续本地改动不再归入 `1.0.0`。

- `1.0.x`：补丁版，只修线上问题、稳定性、文案和小范围体验问题，不引入新主流程。
- `1.x.0`：小版本，新增向后兼容功能或明显体验增强。
- `2.0.0`：大版本，涉及主流程重构、数据结构不兼容、用户操作方式明显变化或旧行为移除。

每次发布前必须同步确认：

- `docs/changelog.md` 已写入本次版本条目。
- `miniprogram/config/version.js` 中的 `appVersion` 与微信开发者工具上传版本号一致。
- Git tag 使用 `vX.Y.Z` 格式，例如 `v1.0.0`、`v1.0.1`。
- 当前线上补丁版为 `1.0.1`；后续紧急修复进入 `1.0.2`。

## 5. 本地发布前检查

在 `tooling/verification/` 目录执行：

```bash
npm install
npm run verify:all
```

当前通过标准：

- `npm run lint` 通过
- `npm test` 通过
- `npm run syntax-check` 输出 `release contract ok`

如果这里不过，不要先上传。

## 6. 微信开发者工具上传步骤

### 6.1 导入工程

在微信开发者工具中：

1. 点击“导入项目”
2. 目录选择 `apps/wechat-cloudbase/`
3. 确认使用的 `AppID` 正确

当前工程配置应为：

- `miniprogramRoot = miniprogram/`
- `cloudfunctionRoot = cloudfunctions/`

### 6.2 选择云开发环境

打开开发者工具中的“云开发”面板：

1. 选择你当前唯一的 CloudBase 环境
2. 确认环境 ID 与 `env.js` 中保持一致

因为当前只有一个环境，所以开发、体验、正式都共用同一套数据。

### 6.3 重新编译并做上传前检查

在开发者工具中执行：

1. 重新编译
2. 代码质量重新扫描
3. 确认当前没有阻塞上传的问题

当前项目已启用：

- `lazyCodeLoading = requiredComponents`

## 7. 云函数上传步骤

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

## 8. 小程序代码上传步骤

### 8.1 本地预览

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

### 8.2 上传体验版

开发者工具顶部点击“上传”：

建议填写：

- 版本号：与 `miniprogram/config/version.js` 的 `appVersion` 一致
- 备注：明确写清本次上传内容，并对应 `docs/changelog.md`

示例：

- 版本号：`1.0.1`
- 备注：`补丁版：修复 1.0.0 上线后发现的问题`

上传成功后，该版本会进入微信公众平台的“开发版本/体验版”。

## 9. 体验版发放步骤

### 9.1 添加体验者

进入微信公众平台：

1. 打开小程序后台
2. 进入成员管理或体验者管理
3. 添加体验者微信号

### 9.2 让体验者进入

体验者不能像正式版那样面向所有用户公开搜索。

体验者进入方式：

- 被添加为体验者后，在微信里搜索小程序名称
- 扫体验版码
- 打开你发出的体验版小程序卡片

建议你直接发给体验者：

- 小程序名称
- 体验说明
- 测试重点

## 10. 体验版重点验证项

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

## 11. 正式提审步骤

当体验版验证稳定后，再做正式审核：

1. 在 `tooling/verification/` 再执行一次 `npm run verify:all`
2. 确认 `docs/changelog.md`、`appVersion`、微信上传版本号一致
3. 确认云函数为最新版本
4. 确认数据库与规则无误
5. 确认隐私政策、用户协议、客服信息完整
6. 在微信开发者工具重新上传正式提交版本
7. 到微信公众平台填写版本说明并提交审核
8. 审核发布后在对应提交上打 `vX.Y.Z` tag

## 12. 单环境模式的额外风险

因为你现在只有一个 CloudBase 环境，发布和内测要额外注意：

- 内测数据会进入正式库
- 体验版联调会影响正式数据
- 测试用户可能写入真实业务集合
- 真机调试日志和真实运行日志混在一起

所以建议你在每次内测前后都做：

- 清理明显测试数据
- 检查 `templates`、`plans`、`live_sessions`
- 检查是否残留测试用户或测试互动数据

## 13. 这次实际建议顺序

按当前 `1.0.1` 已发布状态，后续补丁最适合的顺序是：

1. 在 `tooling/verification/` 执行 `npm run verify:all`
2. 确认 `docs/changelog.md` 已写入新补丁版本
3. 确认关于页显示新补丁版本
4. 在微信开发者工具中重新编译
5. 选择唯一 CloudBase 环境
6. 确认集合、索引、规则齐全
7. 上传 4 个云函数
8. 本地预览主链路
9. 上传新补丁版本号的体验版
10. 真机验证补丁影响范围和主链路
11. 验证稳定后提交正式审核
12. 正式发布后打对应 `vX.Y.Z` tag

## 14. 文档结构说明

当前微信相关操作文档已整理为“1 主文档 + 1 历史附录”：

- 主文档：`docs/operations/wechat/RELEASE_GUIDE.md`
  - 用于发布、交接、内测、正式审核。
- 历史附录：`docs/archive/wechat-directory-cleanup-report.md`
  - 用于记录目录边界、已删除内容和清理结论。

后续继续保持正式文档与客户端源码分离，不要把发布说明放回 `apps/wechat-cloudbase/`。
