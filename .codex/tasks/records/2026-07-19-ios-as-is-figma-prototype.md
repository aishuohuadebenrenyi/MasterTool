# iOS/iPad As-Is 全量 Figma 原型

## 目标

- 在 `MasterTool iOS & iPadOS Editable Prototype` 中新增独立 As-Is 页面。
- 页面、内容、状态、导航和视觉样式忠于当前 `IOS-APP/` SwiftUI 实现。
- 保留现有 To-Be iOS/iPadOS 27 原型，不覆盖、不混用。

## 成功标准

- 新增 iPhone As-Is、iPad As-Is、As-Is Modals & States、As-Is Prototype Map 四组页面。
- 覆盖现有全部页面、子页面、Sheet、Alert、现场工具和关键状态。
- 使用 Figma 原生图层、Auto Layout、变量和交互，可由用户手动编辑。
- 通过模拟器截图对照、Figma 元数据、抽样截图和 `git diff --check` 验证。

## 运行态取证

- iPhone 17 / iOS 26.5：首页、备课、我的、开课 Sheet、方案编辑、现场页。
- iPad Pro 13-inch / iOS 26.5：首页 Split View。
- 当前视觉：浅灰背景、白色圆角卡片、品牌蓝主操作、胶囊 Tab、紧凑筛选 Chip；现场使用紫黑背景、半透明深色卡、蓝色关键提醒和底部工具区。

## 边界

- 仅修改 Figma 与协作任务记录，不修改 SwiftUI、CloudBase、小程序或数据契约。
- As-Is 表示当前实现基线；既有 To-Be 页面继续作为未来设计方向。

## 完成结果

- Figma 新增 `20 iPhone As-Is`、`21 iPad As-Is`、`22 As-Is Modals & States`、`23 As-Is Prototype Map`。
- iPhone：20 个正式页面 + 10 个同页原型目标，469 个文本节点，33 个交互节点。
- iPad：10 个正式页面，包含 13 英寸竖屏 Split View、834pt 纵向现场、1194pt 宽屏工作区和 Dock。
- 弹层与状态：7 个 Sheet、8 个现场工具面板、3 个 Alert、7 类关键状态，共 25 个顶层 Frame。
- 演示入口：As-Is iPhone 主流程、As-Is iPhone 现场流程、As-Is iPad 主流程、As-Is iPad 现场工作区。

## 验证

- 模拟器：iPhone 17 / iOS 26.5 与 iPad Pro 13-inch / iOS 26.5 构建运行成功，并抽取首页、备课、我的、开课 Sheet、方案编辑、现场和 iPad Split View 作为视觉依据。
- Figma：抽样检查 iPhone 首页/现场、iPad 首页/宽屏现场、开课 Sheet 和现场错误 Alert；修复宽屏现场容器默认白色填充后复验通过。
- 结构审计：四个新增页面 `missingFontIds=[]`；iPhone 33 个交互节点；`git diff --check` 通过。
