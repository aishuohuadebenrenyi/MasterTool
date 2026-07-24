# GitHub 提交边界与公开配置脱敏

## 目标

- 公开提交中不包含真实微信 AppID、CloudBase EnvID、用户标识、个人邮箱、密钥、令牌或签名材料。
- 微信项目保持可导入，iOS Debug 保持可编译运行。
- README 和项目索引明确源码、共享后端、工具、原型、文档及发布材料的边界。
- App Store 草案只保留最终 JPG、说明和元数据。

## 假设与范围

- `project.config.json` 提交 `touristappid`，真实 AppID 仅在本地联调时临时填写。
- 不重写 Git 历史；历史中已经出现的 AppID 和测试用户标识不在本任务中清除。
- 截图中的人物和业务数据均为虚构演示数据。
- 不修改产品 API、CloudBase 数据结构、权限、部署状态或线上数据。

## 验证

- 公开配置与暂存区敏感信息扫描。
- `npm run verify:all` 和发布契约检查。
- `swift test` 和 Xcode Simulator Debug 构建运行。
- 忽略规则、Markdown 链接和 `git diff --check`。

## 状态

- 2026-07-24：任务开始，实施边界已由用户确认。
- 2026-07-24：公开配置、seed 导出、个人信息、README、安全基线和发布素材边界整理完成。

## 实际修改

- 微信公开工程使用 `touristappid`，真实 AppID 和 EnvID 的本地操作边界写入根 README 与模块 README。
- 从脱敏主数据重新生成 JSON Lines，所有需要用户归属的记录恢复为 `REPLACE_WITH_USER_ID`。
- 历史任务记录中的个人邮箱改为通用账号描述。
- App Store 草案只纳入最终 JPG、说明和元数据，原始 PNG 作为本地取证文件忽略。
- 根 README、`PROJECT_INDEX.md`、安全基线、Changelog 和长期决策同步更新。

## 验证结果

- `npm run verify:all`：Lint、41 项 Node 单测和语法检查通过。
- `node tests/verify-release-contract.js`：通过。
- `swift test`：29 项通过。
- XcodeBuildMCP：iPhone 17 Pro Max Simulator Debug 构建、安装、启动和首页快照通过，无警告和错误。
- 93 个 Markdown 文件链接、公开 JSON 配置、占位值、敏感信息扫描、忽略规则和 `git diff --check` 通过。

## 说明

- 未部署 CloudBase、未上传微信版本、未执行 App Store 提审。
- 按用户选择不重写 Git 历史；历史中已经公开的 AppID 和测试用户标识仍可能被检索。
