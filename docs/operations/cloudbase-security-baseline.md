# CloudBase 安全规则基线

适用范围：`apps/wechat-cloudbase/` 小程序主链路。

## 目标

- 默认禁止客户端直接访问核心业务集合。
- 通过云函数承接培训师和参与者的核心读写。
- 将正式环境与开发环境彻底隔离。
- 对日志、存储和导出能力执行最小权限控制。

## 1. 集合权限建议

| 集合名 | 客户端直读 | 客户端直写 | 推荐访问方式 | 说明 |
| --- | --- | --- | --- | --- |
| `users` | 否 | 否 | 云函数 | 通过 OPENID 建立内部用户映射 |
| `trainer_profiles` | 否 | 否 | 云函数 | 培训师资料仅本人可通过函数读写 |
| `templates` | 否 | 否 | 云函数 | 公共模板只读，私有模板按 owner 控制 |
| `plans` | 否 | 否 | 云函数 | 方案草稿、确认、删除均由函数处理 |
| `activities` | 否 | 否 | 云函数 | 活动库收藏、置顶、删除需要鉴权 |
| `live_sessions` | 否 | 否 | 云函数 | 场次状态由状态机控制 |
| `participants` | 否 | 否 | 云函数 | 参与者签到通过 `participant-api` |
| `feedback` | 否 | 否 | 云函数 | 反馈仅允许通过公开页面调用函数写入 |
| `reviews` | 否 | 否 | 云函数 | 复盘记录仅 owner 可保存 |
| `session_notes` | 否 | 否 | 云函数 | 现场笔记仅培训师侧可访问 |
| `interactions` | 否 | 否 | 云函数 | 互动入口与关闭由培训师控制 |
| `interaction_submissions` | 否 | 否 | 云函数 | 参与者提交通过 `participant-api` |
| `support_feedback` | 否 | 否 | 云函数 | 帮助反馈仅允许受控写入 |
| `operation_logs` | 否 | 否 | 云函数 | 幂等日志严禁客户端访问 |

结论：当前项目不建议对任何业务集合开放客户端直读直写。

## 2. 云函数边界

### 培训师侧函数

- `trainer-api`
- `live-api`
- `review-api`

要求：

- 必须基于 CloudBase 小程序上下文获取 `OPENID`
- 必须把 `OPENID` 映射到内部 `userId`
- 必须校验 `ownerId`、场次归属和状态流转

### 参与者侧函数

- `participant-api`

要求：

- 通过 `sessionId`、`interactionId`、场次状态、入口码进行业务限制
- 不能依赖前端传入身份标识直接授权
- 需要保留最小必要日志，便于追查异常提交

## 3. 存储权限建议

如果正式环境启用云存储，请执行以下策略：

- 默认不开放存储桶公共写入
- 小程序码、导出文件、临时附件由云函数上传
- 客户端仅通过 `getTempFileURL` 获取临时访问链接
- 对导出文件设置生命周期或定期清理任务

## 4. 生产环境操作基线

- `prod` 环境仅限授权成员访问
- 控制台操作必须留痕，避免多人直接改规则后失控
- 每次提审前复查一次集合规则、存储规则和函数配置
- 正式环境不得导入联调样例数据
- 正式环境不得保留 `REPLACE_WITH_USER_ID` 等占位内容

## 5. 公开仓库配置基线

- `apps/wechat-cloudbase/project.config.json` 固定提交 `touristappid`，真实 AppID 仅在本地联调、预览和上传时填写。
- `apps/wechat-cloudbase/miniprogram/config/env.js` 的公开版本保持 EnvID 为空，`backend/cloudbase/cloudbaserc.json` 只保留占位 EnvID。
- `backend/cloudbase/seed/` 的可导入文件必须由包含 `REPLACE_WITH_USER_ID` 的脱敏主数据生成；本地替换后的文件不得提交。
- AppSecret、SecretId、SecretKey、访问令牌、API Key、Apple 私钥和签名材料禁止进入 Git。
- `project.private.config.json`、`.env*`、构建目录和 IDE 用户状态由 `.gitignore` 排除。

## 6. 推荐检查项

### 提审前

- 核对 `live-api/config.json` 中的 `wxacode.getUnlimited`
- 核对云函数均已部署到正确环境
- 核对小程序体验版与正式版都指向预期 `EnvId`
- 核对帮助与反馈页已接入正式联系方式

### 发布后

- 巡检云函数错误日志
- 巡检是否存在异常高频签到或互动提交
- 巡检 `operation_logs` 是否持续写入

## 7. 最低落地要求

如果暂时无法完整沉淀为自动化规则文件，至少先确保以下配置在控制台手动落地：

- 业务集合全部关闭客户端写权限
- 非必要集合全部关闭客户端读权限
- 云存储默认最小权限
- 正式环境与开发环境分离
- 管理员和开发者权限最小化

这份基线文档可作为 CloudBase 控制台手动配置和审计依据。
