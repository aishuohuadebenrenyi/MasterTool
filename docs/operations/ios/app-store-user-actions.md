# App Store 发布：需要项目负责人处理的清单

> 本文作为外部账号、法务、真机和外部验收事项的详细附件保留。当前主执行清单为 `docs/operations/ios/indie-developer-release-checklist.md`。

更新日期：2026-07-23。此清单只包含无法由当前仓库和本地环境代办的账号、决策、法务、真实环境或外部验收事项。完成后请在“证据/链接”列补充材料，并将状态改为 `完成`。

| Pri | ID | 负责人 | 需要处理 | 预计投入/等待 | 完成证据 | 状态 |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | U-001 | 产品/法务/财务 | 签字确认 v1 为免费或企业服务伴随端、不销售 App 内数字内容；否则立即启动 StoreKit 2/IAP | 2–4h | 商业模式签字记录 | 待处理 |
| P0 | U-002 | 产品/设计 | 签字确认 Apple Pencil 不属于 v1 承诺，并从商店文案/截图移除；否则启动 PencilKit 专项 | 1–2h | 范围签字与素材复核 | 待处理 |
| P0 | U-003 | 产品/法务 | 确认仅邮箱密码登录、发行国家/地区、年龄分级、未成年人、UGC、中国大陆 ICP/备案适用性 | 4–8h + 外部等待 | 法务结论与年龄分级答案 | 待处理 |
| P0 | U-004 | Account Holder | 提供有效 Apple Developer/App Store Connect 团队权限，创建 App Record，确认正式 Bundle ID、Team、证书和 Provisioning | 4–8h + 外部等待 | 签名 Archive 与 ASC 校验通过 | 待处理 |
| P0 | U-005 | 后端/运维 | 准备测试/生产 CloudBase、HTTPS 域名/证书，按部署清单创建集合/索引/TTL/权限/存储生命周期并配置两类随机密钥 | 8–16h | 脱敏配置单与部署日志 | 待处理 |
| P0 | U-006 | 后端/运维 | 部署邮箱发送 Worker 和验证/重置 HTTPS 落地页，发送后清除 outbox 明文 token | 12–20h | 注册验证及密码重置 E2E | 待处理 |
| P0 | U-007 | 安全/后端 | 处理 `wx-server-sdk@4.0.2` 的 5 High/1 Moderate：升级到官方修复版，或完成可达性分析与有到期日的书面风险接受 | 8–24h + 供应商等待 | `npm audit` Critical/High=0 或批准的例外 | 待处理 |
| P0 | U-008 | QA/后端/iOS | 在真实 CloudBase 执行登录至删号的完整 E2E，验证跨账号越权、弱网/回滚、UGC、导出与删除范围 | 20–32h | 用例、requestId、脱敏日志 | 待处理 |
| P0 | U-009 | 法务/运维 | 审核并发布隐私政策、服务条款、数据保留/删除、支持和 UGC 联系页面；替换 App 中 `mastertool.example` 占位 URL | 12–20h | 公网 HTTPS URL 与法务批准 | 待处理 |
| P0 | U-010 | 内容运营 | 指定 UGC 当班人、公开联系方式和 S0/S1/S2 SLA，建立 `ugc_reports` 工单处理与升级流程 | 4–8h | 演练记录与值班表 | 待处理 |
| P1 | U-011 | 设计/品牌/法务 | 确认新 AppIcon 品牌使用；归档 WAV、模板、字体、图标、截图和品牌授权 | 6–12h | 授权台账与品牌签字 | 待处理 |
| P1 | U-012 | QA/iOS | 补齐 iOS/iPadOS 16、主流及最新版本真机/设备云；验证 iPhone 三尺寸、iPad mini/11/13、Split View、Stage Manager、旋转和外接键盘 | 24–36h | 完整兼容矩阵和缺陷回归 | 待处理 |
| P1 | U-013 | QA/iOS | 在 Release 真机完成 ≥10 次冷启动、ETTrace/Instruments、memgraph/Leaks、能耗、帧率、CPU/内存和包体测量；确认 P95 <2s | 16–24h | 性能报告与原始 trace | 待处理 |
| P1 | U-014 | 安全/QA | 在隔离真实环境完成 SAST、DAST、鉴权越权、重放、限流、TLS、日志/PII 和删除/导出测试，关闭所有 Critical/High | 24–40h | 安全报告和复测证据 | 待处理 |
| P1 | U-015 | QA/产品/开发 | 按测试矩阵完成 R1、R2、Internal TestFlight R3，所有责任人对同一 RC build 签字 | 88–128h + 5–7天 | 三轮报告与上线签字 | 待处理 |
| P1 | U-016 | QA/外测用户 | 完成 External TestFlight 10–14 天，关闭关键反馈并证明 crash-free sessions ≥99.9% | 32–48h + 10–14天 | TestFlight/Organizer 指标 | 待处理 |
| P1 | U-017 | 设计/ASO/产品 | 基于最终 RC 制作并复核 5 张左右 iPhone/iPad 截图；完成名称、描述、关键词、版权、支持/营销 URL、审核说明和演示账号 | 20–32h | ASC 元数据无缺项 | 待处理 |
| P1 | U-018 | 隐私/Account Holder | 在 ASC 填写 App Privacy、年龄分级、出口合规、DSA trader、地区；若涉及中国大陆完成所需许可 | 8–12h + 外部等待 | ASC 无红色阻断 | 待处理 |
| P1 | U-019 | Account Holder/财务 | 完成协议、税务和银行；若免费且不适用，归档不适用结论 | 4–8h + 外部等待 | Agreements 状态与结论 | 待处理 |
| P1 | U-020 | Account Holder/产品/QA | 用最终签名 Archive 上传、校验、选择 build、提交审核并安排审核值守和分阶段发布 | 8–12h + 苹果审核 | ASC 提交记录与发布监控 | 待处理 |

在 U-001～U-010 任一项未完成时保持 **NO-GO**；U-011～U-020 全部关闭且测试门禁满足后才能提交审核。若外部条件在 2026-07-31 前到位、团队按原计划并行，当前现实目标仍为 2026-10-09～2026-10-16 正式发布；任一 P0 延迟会顺延关键路径。
