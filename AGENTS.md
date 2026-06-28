# AGENTS.md

本文件是人和 AI 协作开发 `ImprovTool` 时的入口规则。所有 AI 助手进入项目后，先读本文件，再读相关规则、记忆和正式文档。

## 先读上下文

每次任务开始前，按需读取：

- `README.md`：当前产品、目录和校验入口。
- `.codex/memory/project-context.md`：长期项目上下文、架构边界和常见坑位。
- `.codex/rules/*.md`：协作、编码、文档同步和验证规则。
- `.codex/tasks/`：当前任务状态和历史任务记录。
- `docs/`：正式产品、用户、发布、安全和历史文档。

不要只凭历史对话或记忆判断当前实现。涉及代码、架构、发布或数据契约时，先读取当前仓库文件。

## 执行原则

- 先说明假设、范围、成功标准和验证方式。
- 不确定时明确指出，不隐藏困惑。
- 多种解释并存时先说明取舍，不静默选择高风险方案。
- 使用能解决问题的最小改动，不做未请求的抽象、重构或功能扩展。
- 只触碰任务必需文件；发现无关问题时记录或告知，不顺手修改。
- 匹配现有代码和文档风格，即使有更偏好的写法。

## 任务记录

每次可追踪任务都需要更新 `.codex/tasks/`：

- 开始时在 `.codex/tasks/in-progress.md` 建立索引，并在 `.codex/tasks/records/` 新建任务文件。
- 完成后移动到 `.codex/tasks/done.md`，补充实际修改、验证结果和后续事项。
- 暂不做的事项写入 `.codex/tasks/todo.md`，不要混在正式文档里。

## 记忆沉淀

长期有效的信息写入 `.codex/memory/`：

- 项目事实和上下文写入 `.codex/memory/project-context.md`。
- 会影响未来开发的决定写入 `.codex/memory/decisions.md`。
- 踩坑、修复经验和复盘结论写入 `.codex/memory/lessons-learned.md`。

`.codex/memory/` 不保存完整聊天记录，只保存未来开发仍需要复用的事实、规则和经验。

## 文档边界

- `docs/` 是正式文档根目录，描述当前产品、发布、安全和用户操作。
- 历史架构、迁移过程和旧方案放入 `docs/archive/`。
- `.codex/memory/` 和 `.codex/tasks/` 是协作辅助，不替代正式文档。
- 修改产品、发布、安全、数据契约或长期协作规则时，同步更新对应文档。

## 验证要求

按变更范围选择验证：

- 文档和规则变更：至少运行 `git diff --check`。
- 小程序代码变更：在 `wechat-app-support/` 运行 `npm run lint`、`npm test` 或 `npm run syntax-check`。
- 发布前或跨模块变更：在 `wechat-app-support/` 运行 `npm run verify:all`，并视情况运行 `node tests/verify-release-contract.js`。

验证无法执行时，在最终说明中明确原因和残余风险。
