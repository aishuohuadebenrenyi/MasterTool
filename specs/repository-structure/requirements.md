# 仓库结构整理需求

## 用户故事

- 作为小程序开发者，我需要直接导入一个独立目录并编译微信小程序。
- 作为 iOS 开发者，我需要直接打开 Xcode 工程并运行 iPhone/iPad App。
- 作为发布负责人，我需要区分可提交源码、可运行工程、发布草案和正式提交材料。
- 作为维护者，我需要从一个索引找到共享后端、正式文档、原型和历史记录。

## 验收条件

- 当微信开发者工具导入 `apps/wechat-cloudbase/` 时，系统应从其项目配置定位小程序源码。
- 当 Xcode 打开 `apps/ios-personal/ImprovToolIOS.xcodeproj` 时，工程应保留现有 targets、scheme 和相对源码引用。
- 当维护者查找云函数时，五个函数应统一位于共享 CloudBase 后端目录。
- 当生成依赖或本机工程状态时，Git 应忽略这些可再生或私有文件。
- 当查找项目入口和交付状态时，`PROJECT_INDEX.md` 应给出唯一导航和状态定义。

## 非目标

- 不修改产品行为、CloudBase action、请求响应、数据模型或发布状态。
- 不部署真实 CloudBase 环境，不提交 App Store 或微信审核。
