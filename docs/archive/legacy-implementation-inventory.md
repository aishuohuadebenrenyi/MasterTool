# 旧实现清单

本文记录已从项目根目录移除的旧实现资料。当前正式实现以 `wechat-app/`、`wechat-app-support/` 和正式文档为准。

## 移除范围

### `archive/frontend-uniapp-x/`

- 类型：历史跨端前端实现。
- 技术栈：uni-app x、UTS、UVUE、SCSS。
- 历史用途：迁移期用于参考页面结构、交互方式和部分业务模型。
- 移除原因：当前主线已经收敛到微信原生小程序和 CloudBase 云函数；该目录包含 `node_modules`、`unpackage`、本地环境文件和私有项目配置，不适合作为根目录长期保留内容。

### `archive/prototype-web/`

- 类型：历史 Web 原型。
- 技术栈：静态 HTML、CSS、JavaScript。
- 历史用途：用于早期产品方向和交互原型验证。
- 移除原因：不属于当前生产主线，保留代码会增加根目录噪音。

## 当前参考入口

- 当前小程序主线：`wechat-app/`
- 联调与发布检查：`wechat-app-support/`
- 历史演进说明：`docs/archive/history-evolution.md`
- 历史 CloudBase 重构规格：`docs/archive/cloudbase-rebuild/`

后续如需恢复旧代码，应从外部备份或版本历史中查找，不在当前根目录长期保留旧实现目录。
