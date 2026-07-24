# iOS 空状态、半弹窗操作与模拟数据优化

## Status

已完成。

## Scope

- 统一 iOS 空状态的水平居中；全页空状态同时垂直居中。
- 半弹窗右上角仅保留关闭按钮，弹窗级主操作固定到底部安全区。
- 扩充 Debug Mock 方案、活动和历史场次，冷启动恢复固定种子。
- 不修改 CloudBase 契约、小程序业务逻辑或 Release 数据源边界。

## Verification

- `swift test`：10 项通过。
- iPhone 17 Pro Simulator Debug 构建：通过；安装启动后首页显示固定 Mock 统计和待处理数据。
- iPad Pro 11 英寸 Simulator Debug 构建：通过。
- `plutil -lint IOS-APP/ImprovToolIOS.xcodeproj/project.pbxproj`：通过。
- sheet 调用点静态检查：顶部主操作已清除，4 个弹窗使用底部操作栏。
- `git diff --check`：通过。

## Actual Changes

- `EmptyState` 增加全宽居中和可选全页填充模式。
- 新增 `SheetPrimaryActionBar`，通过底部安全区承载弹窗级主操作。
- Mock 增加 4 种状态方案、5 类活动、待复盘和已复盘历史场次。
- Xcode Debug 配置增加 `DEBUG` 编译条件；Release 仍不回退 Mock。
- 更新 `IOS-APP/README.md`，说明演示数据生命周期与 Release 边界。
