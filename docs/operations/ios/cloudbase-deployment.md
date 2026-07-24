# iOS CloudBase 部署与回滚清单

本文是 `ios-api`、领域函数和 iOS Release 网关的可复现部署清单。仓库只保存变量名，不保存生产密钥。

## 1. 云函数

- 部署 `backend/cloudbase/functions/ios-api` 为 HTTPS HTTP 云函数；公网入口仅接受 TLS。
- 部署 `trainer-api`、`live-api`、`review-api`、`participant-api`；四个领域函数配置同一 `IMPROV_IOS_ASSERTION_SECRET`。
- 保留小程序原调用方式。领域函数仅在内部 HMAC 断言合法且 60 秒内时接受 iOS 身份，其他请求继续使用微信 `OPENID`。
- 测试与生产环境使用不同 EnvId、密钥、域名、集合和存储桶；禁止 Debug/Mock 配置进入 Release。

## 2. 新增集合与访问控制

以下集合均禁止小程序和 iOS 客户端直接读写，只允许云函数服务端访问：

| 集合 | 用途 | 建议索引/生命周期 |
| --- | --- | --- |
| `ios_accounts` | 邮箱账号和密码派生值 | `email` 唯一索引；`linkedUserId` 普通索引 |
| `ios_account_links` | 微信账号一次性绑定码 | `token` 唯一；`expiresAt` TTL；`accountId` 普通索引 |
| `ios_refresh_tokens` | Refresh Token 哈希与撤销状态 | `tokenHash + revokedAt`、`accountId + revokedAt`；过期记录 TTL/定时清理 |
| `ios_revoked_access_tokens` | 注销后的短期 Access Token 哈希 | `tokenHash` 唯一、`accountId`；`expiresAt` TTL |
| `ios_auth_rate_limits` | 注册、登录、验证、重置限流桶 | `_id`；`expiresAt` TTL |
| `ios_email_tokens` | 邮箱验证/密码重置令牌哈希 | `type + tokenHash + consumedAt`、`accountId`；`expiresAt` TTL |
| `ios_email_outbox` | 待发送验证/重置邮件 | `status + createdAt`、`expiresAt`；发送成功后清除明文 token |
| `ugc_reports` | UGC 举报工单 | `status + createdAt`、`reporterId`、`sessionId` |
| `ugc_blocks` | 场次内参与者屏蔽 | `sessionId + openid` 唯一、`ownerId` |
| `account_deletion_audit` | 不可逆哈希删号审计 | `accountHash`、`deletedAt`；设置法务确认的保留期 |

对象存储 `account-exports/` 配置不超过 24 小时的自动删除规则；接口返回的临时 URL 有效期为 2 小时。

## 3. 环境变量和密钥

| 变量 | 位置 | 要求 |
| --- | --- | --- |
| `IMPROV_IOS_TOKEN_SECRET` | `ios-api` | 至少 32 个随机字节；测试/生产不同；按季度轮换 |
| `IMPROV_IOS_ASSERTION_SECRET` | 网关及四个领域函数 | 至少 32 个随机字节；同步轮换并留短暂双密钥窗口 |
| `IMPROV_UGC_BLOCKED_TERMS` | `participant-api` | 逗号分隔首发词表；变更需内容安全负责人审批 |
| `IMPROV_IOS_API_ENDPOINT` | iOS Release Build Setting | 生产 HTTPS URL；不得包含 token 或密钥 |

邮件发送 Worker 轮询 `ios_email_outbox.status=pending`，构造自有 HTTPS 验证/重置链接，发送成功后将状态改为 `sent` 并删除明文 `token`。失败须指数退避、告警和最终死信；不得在日志输出收件地址、token、密码或 Authorization。

## 4. 部署顺序与冒烟

1. 创建集合、索引、TTL、对象存储生命周期和最小权限策略。
2. 配置密钥并先部署四个领域函数，再部署 `ios-api` 和邮件 Worker。
3. 调用注册、邮箱验证、登录、15 分钟访问令牌、Refresh Token 轮换、注销、忘记密码和重置密码；确认旧 Refresh Token 不可复用。
4. 绑定微信账号后验证 `trainer.getHomeSummary` 只能读取本人数据。
5. 执行“登录 → 模板/方案 → 确认 → 开课 → 扫码参与 → 八工具 → 结束 → 复盘 → 导出 → 删除账户”全链路，并保存 requestId 与脱敏日志。
6. 验证 UGC 命中词拦截、承诺内容举报后立即隐藏、同场次屏蔽和 `ugc_reports` 工单闭环。
7. 验证删除账户后访问/刷新令牌失效，业务数据不可查询，导出文件按生命周期清理，仅剩不可逆审计哈希。

## 5. 回滚

- 发布前保留上一版本云函数；异常时先切回上一函数版本，不回滚已执行的删号或密码重置。
- 数据结构变更先向后兼容，再发布客户端；索引和新集合不作为紧急回滚对象删除。
- 密钥泄露时立即轮换两类密钥、撤销全部 Refresh Token，并通知安全负责人；不得把旧密钥重新启用。
