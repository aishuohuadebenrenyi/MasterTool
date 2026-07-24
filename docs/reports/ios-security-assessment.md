# iOS/API 发布安全评估

## 已实施控制

- iOS Release 仅接受 HTTPS 网关；未配置端点时不回退 Mock。
- Access Token 15 分钟，Refresh Token 30 天、服务端哈希保存并轮换；注销写入 Access Token 撤销哈希，密码重置通过凭证生效时间使旧令牌立即失效。
- iOS 使用 Keychain `AfterFirstUnlockThisDeviceOnly`，仓库未保存生产令牌或密钥。
- 网关至领域函数使用短期 HMAC 身份断言；领域函数继续执行资源所有权检查。
- 注册、登录、邮箱验证和密码重置按邮箱/时间桶限流；错误响应不暴露账号是否存在。
- UGC 写入前限制长度并过滤，举报后立即隐藏和场次内屏蔽。
- Privacy Manifest、隐私申报矩阵、数据导出和 App 内删号入口已加入工程。

## 仍未放行的风险

| 风险 | 等级 | 当前证据 | 关闭条件 |
| --- | --- | --- | --- |
| `wx-server-sdk@4.0.2` 依赖审计仍有 5 High、1 Moderate | P0 | `npm audit`；降到 2.5.3 反而出现 3 Critical | 腾讯提供修复版，或经隔离/可达性分析后由安全负责人书面接受；发布标准要求 Critical/High=0 |
| 尚未在生产网关做越权、重放、TLS、限流绕过与 DAST | P0 | 仅代码审计与单元/契约测试 | 在隔离测试环境完成测试并关闭全部 High |
| 邮件 Worker、验证/重置落地页尚未部署 | P0 | 后端只生成 outbox | 部署发送器，确保发送后移除明文 token，并验证完整流程 |
| 未取得 Release 真机内存图、泄漏、能耗和启动性能证据 | P1 | 模拟器构建/截图通过；memgraph 捕获环境失败 | 真机 Instruments/Organizer 报告通过并归档 |
| 账户导出对象存储生命周期和删除范围未在真实数据验证 | P0 | 代码与文档定义 | 生产同构环境验证并保存删除前后查询证据 |

## RC 安全门禁

1. SAST/敏感信息扫描、`npm audit`、Xcode Analyze 和 Release Archive 全部留证。
2. 覆盖无 token、过期 token、伪造签名、跨账户 IDOR、Refresh Token 重放、暴力登录、超长/恶意 UGC、导出 URL 越权、删号重放。
3. 日志抽样确认不含密码、邮件 token、Authorization、UGC 原文或未脱敏邮箱。
4. Critical/High 为 0；任何例外必须包含可达性证据、补偿控制、责任人和到期日，并由安全/产品共同签字。
