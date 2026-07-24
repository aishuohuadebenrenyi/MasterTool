# MasterTool 微信小程序

本目录是微信开发者工具可直接导入的小程序客户端工程。

## 运行

1. 使用微信开发者工具导入当前目录。
2. 仅浏览界面时可保留公开配置中的 `touristappid`；联调、预览或上传前，在本地将 `project.config.json` 的 `appid` 替换为自己的真实 AppID。
3. 在 `miniprogram/config/env.js` 中配置对应 CloudBase EnvID。
4. 编译、预览或上传小程序。

`project.config.json` 通过 `miniprogramRoot` 定位客户端源码。共享云函数已独立到 `../../backend/cloudbase/functions/`，不属于小程序上传包。

真实 AppID 和 EnvID 都属于本地运行配置。提交代码前应确认 `appid` 已恢复为 `touristappid`、三个 `envId` 仍为空；`project.private.config.json` 只保存微信开发者工具的本机偏好，不能代替公开工程中的 AppID。

## 边界

- `miniprogram/`：可上传的小程序客户端源码。
- `project.config.json`：可提交的公开工程配置，固定使用 `touristappid`。
- `project.private.config.json`：本机配置，禁止提交。
- CloudBase 部署和初始化数据：见 `../../backend/cloudbase/README.md`。
- 自动化校验：见 `../../tooling/verification/README.md`。
