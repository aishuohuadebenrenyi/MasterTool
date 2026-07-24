# iPad 现场页按工具类型自适应布局

## 目标

- 移除固定 360pt iPad 工具检查器和狭长菜单。
- 以工具复杂度和真实窗口宽度选择宽工作区、下方工具台或紧凑 Sheet。
- 保持现场上下文、环节导航和同一份 `LiveToolState` 始终有效。

## 范围

- 修改 `IOS-APP/ImprovToolIOS/Features/LiveView.swift`。
- 同步 `IOS-APP/docs/architecture.md` 与 `.codex/tasks/`。
- 不修改 iPhone 业务交互、Repository、CloudBase、数据模型和小程序。

## 成功标准

- iPad ≥1100pt：签到、分组、积分、互动、笔记使用 520–720pt 宽工作区；随机、计时、音效进入现场下方工具台。
- iPad 700–1099pt：现场区在上、工具区在下；<700pt 或紧凑尺寸类保持 iPhone Sheet。
- 顶部八工具条具备明确选中态并可横向滚动。
- 八工具内容自适应利用空间，工具动作与环节导航互不遮挡，切换工具不重置状态。

## 状态

- 2026-07-16：实现与自动化验证完成。

## 实际修改

- 新增内部 `LiveToolLayoutKind`，将签到、分组、积分、互动、笔记归为宽工作区，将随机、独立计时、音效归为下方工具台。
- iPad 改用真实窗口宽度判断：≥1100pt 的重工具使用 520–720pt 右侧工作区；其余 iPad 宽度使用现场在上、工具在下的纵向布局；<700pt 或紧凑尺寸类保持 iPhone Sheet。
- 导航栏下增加八工具横向滚动条和明确选中态；工具切换复用同一个 `LiveToolState`，并将当前工具锚点滚入可视区，避免长短工具切换后遗留空白。
- 将工具内容、固定动作和容器壳拆开复用；下方工具台轻工具至少 300pt、重工具至少 380pt，重工具动作固定在工具台底部。
- 分组和积分改为自适应卡片网格；随机、互动和笔记使用可分栏/上下排列的响应式双区；独立计时放大数字；音效使用 2×2 大触控板。
- iPhone 快捷入口、工具箱、item-driven Sheet、退出/结束语义和所有 Repository/CloudBase 契约保持不变。

## 验证

- `swift test`：23 项通过。
- iPhone 17 Pro Debug、iPad Pro 13 英寸 Debug 与通用 iOS Simulator Release 构建通过；最终通用 Debug 构建通过。
- iPhone 运行态确认仍显示四个固定入口和现有 Sheet 路径。
- iPad Pro 13 英寸竖屏确认八工具条、纵向工作区、工具切换与固定环节导航；笔记切随机后无残留空白。
- 最大辅助功能字号确认八工具可达、标题未截断、主计时和环节导航仍可操作；验证后恢复 Medium。
- `wechat-app-support/npm run verify:all`：lint、39 项单元测试和 syntax-check 通过。
- `node tests/verify-release-contract.js` 与 `git diff --check` 通过。
- Simulator 自动化当前未暴露设备旋转能力；≥1100pt 横屏分支已通过编译，仍保留一次人工横屏视觉复核。
- 本次未改变服务端契约，也未执行真实 CloudBase E2E 或部署。
