# 全仓库校验工具

本目录负责微信客户端、共享 CloudBase 函数、种子数据和跨端发布契约的本地校验。

```bash
npm ci
npm run verify:all
node tests/verify-release-contract.js
```

`format` 会改写源码，只在明确需要格式化时运行；常规检查使用 `format:check`。
