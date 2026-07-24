# MasterTool CloudBase

本目录是微信小程序和 iOS 共用的 CloudBase 后端工程。

## 内容

- `functions/`：四个领域 Event Functions 与 iOS HTTPS 网关 `ios-api`。
- `seed/`：数据库联调种子和可导入 JSON Lines。
- `cloudbaserc.json`：不含密钥的公共部署结构，EnvID 使用占位值。

## 部署边界

部署前必须明确目标 EnvID，并通过 CloudBase MCP 或当前版本的 CloudBase CLI 帮助确认命令。不要依赖隐式选中的环境，也不要把密钥、令牌或真实环境配置提交到仓库。

小程序通过 `wx.cloud.callFunction` 调用领域函数；iOS 只访问 `ios-api` HTTPS 网关。目录迁移不改变 action、统一响应、`requestId` 幂等或 `sessionId` 链路。

## 验证

在 `../../tooling/verification/` 运行：

```bash
npm run verify:all
node tests/verify-release-contract.js
```
