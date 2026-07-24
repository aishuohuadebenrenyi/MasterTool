# Todo Tasks

## iOS/iPadOS App Store 正式发布工作包

- 来源：2026-07-22 iOS/iPadOS 正式发布准备度全量审计。
- 目标：修复真实方案与认证链路，补齐反馈/复盘/删号/UGC 合规、签名图标隐私和商店材料，完成兼容性能安全及三轮测试、Internal/External TestFlight 与上线验收。
- 阻塞点：需要 CloudBase 测试/生产入口与密钥、Apple Developer/App Store Connect 后台状态、商业模式与 Apple Pencil 首发范围决策，以及法务/隐私/设计/QA 资源。
- 实施清单：`specs/ios-app-store-release/tasks.md`。
- 审计详情：`.codex/tasks/records/2026-07-22-ios-ipados-release-readiness-audit.md`。

## iOS 现场真实 CloudBase E2E

- 来源：2026-07-16 iOS 现场全链路与跨端布局收敛。
- 目标：部署更新后的 `live-api`，配置 iOS HTTPS 网关、有效令牌和 EnvId，并用真实账户逐项验证开课/恢复、环节、签到、分组、积分、随机、互动、笔记和结束链路。
- 阻塞点：当前仓库没有可用的测试环境入口、鉴权令牌和 EnvId；本次范围明确不执行 CloudBase 部署，不能用 Debug Mock 代替真实 E2E。
- 详情：`specs/ios-live-parity/tasks.md`、`.codex/tasks/records/2026-07-16-ios-live-parity-implementation.md`。

## iOS 账户与业务链路真实环境验收

- 来源：2026-07-15 iOS 按钮与导航层级审计。
- 目标：部署并验收微信绑定码兑换、反馈提交、复盘保存、数据导出、账户删除、认证邮件和 UGC 处置的真实 CloudBase 服务。
- 阻塞点：代码与客户端契约已完成；仍需要测试/生产 CloudBase、邮件服务、密钥、索引/TTL、法务保留策略和真实环境 E2E。
- 详情：`docs/reports/ios-interaction-navigation-audit.md`。

新增待办时记录：

- 任务标题
- 来源或日期
- 预期目标
- 阻塞点或依赖
- 对应详情文件路径
