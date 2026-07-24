# iOS/iPadOS 正式发布实施任务拆解

## 目标

- 将 2026-07-22 发布准备度审计中的缺口转换为可直接进入迭代排期的任务。
- 为每项任务明确优先级、责任角色、工时、依赖、交付物和验收条件。
- 区分首发必做、条件任务和可延期项，避免把未决商业范围误当成既定需求。

## 范围与假设

- 以 `.codex/tasks/records/2026-07-22-ios-ipados-release-readiness-audit.md` 为需求与证据基线。
- 默认 v1 为免费应用或已购企业服务伴随端，不在 App 内销售数字内容；若商业模式结论不同，启动 IAP 条件任务。
- Apple Pencil 不是当前已实现核心流程，先完成产品范围决策；仅在首发承诺手写/标注时启动 PencilKit 条件任务。
- 估算沿用审计的 1 名 iOS、1 名后端、1 名 QA 全职，产品、设计、法务、安全、DevOps 兼职并行假设。

## 交付物

- `specs/ios-app-store-release/tasks.md`

## 验证

- 审计中的 27 个工作包均在任务列表中有对应任务或条件门禁。
- P0 阻断项、三轮全量测试、Internal/External TestFlight 和上线验收已形成完整依赖链。
- `git diff --check`：通过。
