# CloudBase 正式上线操作手册

适用项目：`wechat-app/` 微信原生小程序 + CloudBase 云函数架构。

## 1. 发布前提

- 小程序主体已完成微信认证。
- 小程序 `AppID` 与当前工程一致：见 `wechat-app/project.config.json`。
- CloudBase 已准备至少两个环境：`dev`、`prod`。
- 审核资料已准备：版本说明、测试路径、测试账号、隐私政策、用户协议、客服电话或客服邮箱。

## 2. 微信公众平台配置

### 2.1 基础信息

在微信公众平台完成以下配置：

- 小程序名称、简称、头像、简介。
- 服务类目与经营范围保持一致。
- 成员管理中为研发、测试、运营配置对应权限。
- 设置体验者名单，便于体验版验收。

### 2.2 合规信息

提审前至少补齐以下内容：

- 隐私政策
- 用户协议
- 个人信息收集清单
- 第三方共享说明
- 客服联系方式

小程序内正式展示入口已放在：

- `pages/mine/about/index`
- `pages/mine/legal/index?type=privacy`
- `pages/mine/legal/index?type=terms`

### 2.3 审核填写建议

- 功能简介：培训方案管理、现场签到、互动收集、反馈统计、复盘分析。
- 测试路径：首页 -> 备课 -> 开课 -> 现场签到/互动 -> 反馈 -> 复盘。
- 审核说明：参与者通过扫码进入签到、反馈、互动页；培训师在“我的”页查看数据、记录和设置。

## 3. CloudBase 控制台配置

### 3.1 环境规划

建议使用如下环境策略：

- `develop` 对应 `dev` 环境
- `trial` 对应 `prod` 环境的体验版
- `release` 对应 `prod` 环境的正式版

当前工程环境解析入口：

- `wechat-app/miniprogram/config/env.js`
- `wechat-app/miniprogram/app.js`

上线前请将 `develop` 的 `envId` 替换成真实开发环境，避免开发版误写正式数据。

### 3.2 数据库集合

先在 CloudBase 文档数据库中创建以下集合：

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

### 3.3 数据库索引

建议先创建以下高频索引：

- `ownerId`
- `status`
- `updatedAt`
- `startedAt`
- `sessionId`
- `openid`
- `interactionId`

### 3.4 安全规则

安全基线参考文档：

- `docs/cloudbase-security-baseline.md`

执行原则：

- 默认关闭客户端直接读写业务集合。
- 培训师、参与者数据写入均通过云函数完成。
- `operation_logs` 仅允许云函数写入。
- 云存储默认最小权限，只向客户端下发临时链接。

### 3.5 云函数部署

正式环境需部署以下函数：

- `trainer-api`
- `live-api`
- `participant-api`
- `review-api`

特殊检查：

- `live-api/config.json` 已声明 `wxacode.getUnlimited`
- 重新上传 `live-api` 后，需等待微信侧 OpenAPI 权限生效

### 3.6 日志与告警

建议在 CloudBase 控制台中启用以下监控：

- 云函数调用失败告警
- 错误日志关键字检索
- 小程序码生成失败告警

## 4. 微信开发者工具操作

### 4.1 导入工程

导入目录：

```text
wechat-app/
```

确认配置：

- `miniprogramRoot = miniprogram/`
- `cloudfunctionRoot = cloudfunctions/`

### 4.2 环境确认

在开发者工具中确认：

- 当前云开发环境为目标环境
- 开发版使用 `dev`
- 体验版/正式版使用 `prod`

### 4.3 云函数上传

依次上传并测试：

- `trainer-api`
- `live-api`
- `participant-api`
- `review-api`

### 4.4 数据准备

联调数据目录：

- `wechat-app-support/test-data/importable-jsonl/direct-import/`
- `wechat-app-support/test-data/importable-jsonl/need-user-id/`

导入前确认：

- 正式环境不要导入联调用测试数据
- 所有 `REPLACE_WITH_USER_ID` 已替换或不再出现在正式环境数据中

## 5. 体验版验收

### 5.1 培训师侧

- 首页统计正常显示
- 方案创建、保存草稿、确认方案正常
- 开课后可进入现场控制页
- 分组、积分、随机、计时、现场笔记可持久化
- 结束培训后可进入反馈和复盘

### 5.2 参与者侧

- 真机扫码进入签到页
- 真机扫码进入反馈页
- 真机扫码进入互动页
- 重复签到拦截生效
- 互动统计更新正常

### 5.3 小程序码

必须真机验证以下能力：

- `getSessionEntryCode`
- `getInteractionEntryCode`
- 生成的小程序码可直接打开正确页面

## 6. 提审发布

### 6.1 提审前

- 执行 `node wechat-app-support/tests/verify-wechat-app.js`
- 使用体验版完成完整业务演练
- 确认关于页可打开正式版隐私政策和服务条款
- 确认弱网、云函数失败时页面有明确错误提示

### 6.2 提交审核

建议版本说明重点写清：

- 服务对象
- 培训师和参与者的使用路径
- 收集的数据类型及用途
- 是否存在付费、登录、外链、用户生成内容

### 6.3 审核通过后

- 先灰度给内部团队
- 观察 1 到 3 天日志和错误率
- 再执行全量发布

## 7. 发布后巡检

建议首周每天检查：

- 云函数错误日志
- `support_feedback` 是否有异常反馈
- 小程序码生成是否失败
- 正式环境数据是否混入测试样例
