# 仓库结构整理设计

## 结构

- `apps/wechat-cloudbase/`：微信开发者工具直接导入的小程序项目。
- `apps/ios-personal/`：Xcode 工程、Swift Package、单元测试和 UI 测试。
- `backend/cloudbase/`：五个共享云函数和数据库联调数据。
- `tooling/verification/`：Node 校验工具、单元测试和发布契约。
- `docs/`：当前有效产品、架构、发布、运维、法务与历史文档。
- `releases/ios-personal/`：App Store 草案和未来正式提交材料。
- `prototypes/`：Figma 原型索引和本地忽略的源材料。

## 运行边界

- 小程序目录包含 `project.config.json` 和 `miniprogram/`，客户端可直接编译；共享云函数独立部署。
- iOS 目录整体保留现有相对布局，Xcode 的 `../Sources/ImprovToolCore` 引用不变。
- 正式文档不再存放在客户端源码目录，客户端只保留运行 README。

## 兼容性

- 迁移后更新 Node tests、CI、README、AGENTS、memory、tasks 和文档中的有效路径。
- 历史文档可保留旧路径，但必须明确为历史内容。
- 业务接口和数据契约保持不变。
