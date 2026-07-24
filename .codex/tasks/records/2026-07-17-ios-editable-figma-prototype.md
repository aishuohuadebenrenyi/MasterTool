# iOS/iPad 可编辑 Figma 原型试制

## 目标

- 从 `IOS-APP/` 当前 SwiftUI 实现提取完整页面、子页面、Sheet、Alert、现场工具与关键状态。
- 建立可手动编辑的 Figma 文件，使用 Auto Layout、组件、变量和原型连线，而不是扁平截图。
- 先完成代表性 iPhone/iPad 页面，确认视觉方向后再展开全量页面。

## 范围与边界

- 本阶段只创建和检查 Figma 设计资产以及协作任务记录。
- 不修改 SwiftUI、CloudBase、小程序代码或业务契约。
- SwiftUI 继续以 iOS/iPadOS 16 为最低兼容基线；Figma 以前向的 iOS/iPadOS 27 设计语言为长期方向，并以 iOS/iPadOS 26.5 作为当前生产验收基线。
- 现有代码是功能与数据状态事实来源；Figma 在确认后作为视觉设计来源。

## 成功标准

- Figma 文件可由用户直接编辑文字、布局、颜色、组件和交互。
- iPhone 与 iPad 使用符合平台习惯的独立自适应结构，不做简单等比拉伸。
- Light/Dark、语义颜色、SF Pro、SF Symbols 和主要间距/圆角有明确映射。
- 代表性页面包含 iPhone 首页、方案编辑、现场页，iPad 首页、现场控制台及典型 Sheet/Alert。
- 每个创建阶段均通过 Figma 元数据和截图验证。

## 当前状态

- 2026-07-17：Phase 0 discovery 已完成代码盘点和空白 Figma 文件创建。
- Current Figma file: `https://www.figma.com/design/ClXuJuzwH7XYAvHAoeBG50`
- Superseded inaccessible file: `https://www.figma.com/design/uLPV9GFjQ9DeMyguWNf2e5`
- 2026-07-19：Figma 调用额度已恢复，但当前连接的 Figma 账号对上述文件没有编辑权限；`get_metadata` 和 `get_libraries` 均返回 access error。需由文件所有者向该账号授予 Editor 权限后继续。按 Figma 错误恢复规则未立即重试，也未另建文件造成版本分叉。
- 2026-07-19：用户确认已授权后再次复核，Figma 仍以新的 Debug UUID 返回同一 edit access error；Phase 0.b 保持阻塞，等待确认邀请已被该账号接受且权限为 `Can edit`。
- 2026-07-19：用户授权重新创建。新文件已创建在当前连接账号的 Drafts，并通过 `get_metadata`、`get_libraries` 和 `use_figma` 验证可读写。Apple `iOS and iPadOS 27` UI Kit 可用。
- 2026-07-19：Phase 1 Foundations 完成：4 个变量集合、72 个变量、10 个 SF Pro/SF Pro Rounded 文字样式、1 个卡片层级效果；作用域、iOS Code Syntax 和 23 个 Light/Dark alias 均验证通过。
- 2026-07-19：用户已在 Assets 启用 `iOS and iPadOS 26` 与 `iOS and iPadOS 27`。重新导入 Apple 27 Body 样式后 SF Pro 正常渲染；Cover、Getting Started、Foundations 均通过截图验证，Phase 2 完成。
- 2026-07-19：进入 Phase 3。组件范围收敛为业务高复用组件；系统导航、Tab、Sidebar、Sheet、Alert 优先复用 Apple 27 Library，Apple 26 仅用于兼容验收。
- 2026-07-19：已创建 `MasterTool/Content Card`、`MasterTool/List Row`、`MasterTool/Live Tool Tile` 三个可编辑组件。组件截图发现当前页面语义色模式存在白底白字，准备检查并修正时 Figma MCP 服务端连续返回 `Transport send error`；`whoami` 与只读 `get_metadata` 同样失败，确认是连接器传输故障而非文件权限。任务保留在 Phase 3，待连接恢复后从颜色修正继续。
- 2026-07-19：连接恢复后修正组件语义色绑定（变量全名需包含 `color/` 前缀），组件页截图验证通过，并补充现场工具深色上下文预览。
- 2026-07-19：Phase 4–6 完成：20 个 iPhone 页面、10 个 iPad 自适应页面、7 个 Sheet、8 个现场工具面板、3 个 Alert、7 类关键状态、Prototype Map 与关键点击路径均已写入。iPhone 提供主流程与现场流程两个演示入口；iPad 提供主流程与现场工作区两个入口。
- 2026-07-19：最终抽样截图覆盖 iPhone 首页/现场/工具箱、iPad Split View/宽屏现场、开课 Sheet 与现场错误 Alert；字体、裁切、层级、深浅色及宽屏结构均通过视觉检查。
- 2026-07-19：最终结构审计：iPhone 页面含 30 个顶层 Frame（20 个正式页面 + 10 个同页原型目标）、456 个文本节点、31 个交互节点；iPad 10 个顶层 Frame、193 个文本节点；弹窗/状态 25 个顶层 Frame、164 个文本节点；所有范围 `missingFonts=[]`。清理自动生成的 `Flow 1` 后仅保留 4 个命名演示入口。

## Phase 0 代码盘点

### 页面与导航

- iPhone 根导航：`首页`、`备课`、`我的` 三个 Tab。
- iPad 根导航：三项侧栏与详情栏，不使用放大的 iPhone Tab 布局。
- 首页链路：首页、选择开课入口 Sheet、方案编辑、复盘中心、返回当前培训。
- 备课链路：方案/活动双模式、来源/状态/类型/场景筛选、模板选择 Sheet、方案编辑、方案预览、活动详情、活动编辑。
- 方案编辑弹层：添加环节、从活动库添加；重复活动使用 Alert。
- 我的链路：编辑资料 Sheet、培训记录、数据详情、复盘中心、复盘详情、设置、帮助与反馈、关于、隐私与账户。
- 现场链路：全屏现场、工具箱、八项工具详情、结束培训 Sheet、现场错误 Alert、退出确认 Alert、反馈数据页。

### 现场工具与自适应形态

- 八项工具：签到、分组、积分、随机、互动、计时、音效、笔记。
- iPhone/紧凑宽度：主现场 + 工具 Sheet。
- iPad 700–1099pt：现场与工具纵向排列。
- iPad ≥1100pt：签到/分组/积分/互动/笔记进入 520–720pt 工作区；随机/计时/音效进入下方 dock。

### 关键状态矩阵

- 通用：正常、加载、空数据、错误、禁用、保存中。
- 方案：草稿、已确认、开课中；编辑字段、环节排序、活动重复。
- 现场：未开课、进行中、写入中、工具空状态/有数据、结束、退出确认、写入失败。
- 复盘：待复盘、已复盘、三个框架及问题翻页、保存未接入。
- 账户/服务：自动保存、即将支持、服务未接入禁用态。

### Token 与组件来源

- 字体：SwiftUI 系统字体，即 SF Pro / SF Pro Rounded；SF Symbols 按名称映射。
- 亮暗语义色：brand、surface、card、input、divider、primary/secondary text、success、warning、danger。
- 现场专用色：live background、primary/secondary text、surface、reminder surface。
- 环节色：8 色循环；当前包含系统紫色，属于业务识别色而非全局品牌主色。
- 当前代码没有统一 spacing/radius token；常用圆角为 12、14、16、18、20、24，间距分散在各 View 中，这是 Figma 需要先收敛的主要 gap。
- 现有可复用组件：Card、Metric、EmptyState、ChoiceChipGroup、CountedTextEditor、SheetCloseButton、SheetPrimaryActionBar、PlanCard、ActivityCard、PhaseEditorCard、LiveToolContainer、LiveResponsivePair。

## Phase 0 设计基线

- Purpose: 为培训师提供备课与现场控场工作台，优先保证快速扫描、低误触和现场压力下的可预测操作。
- Aesthetic direction: 工业/工具型，叠加 Apple 原生信息层级；不追求装饰性卡片堆叠。
- Palette: 品牌蓝 `#4A7CF7`、背景 `#F5F5F7`、主文字 `#1A1A2E`、成功 `#34C759`、警告 `#FF9500`、危险 `#E5484D`；Dark 使用代码现有自适应值。
- Typography: SF Pro、SF Pro Rounded；这是原生平台约束，覆盖通用 UI 设计规则中避免系统字体的默认建议。
- Layout: iPhone 使用原生 Tab/NavigationStack/Sheet；iPad 使用 Split View、工作区和 dock；内部统一 Auto Layout，不把 iPhone 页面等比拉伸。

## Phase 0 Gap Analysis

- Code-only: 全部页面、业务状态和现有 SwiftUI 组件尚未进入 Figma。
- Figma-only: 新文件为空；因 MCP 配额阻断，尚无法检查可添加的 Apple UI Kit。
- Conflict: 当前代码视觉已被用户判定不符合习惯，因此代码只作为功能与状态事实来源，不作为最终视觉来源。
- Resolution: 先用 Apple 原生导航、控件与自适应布局建立 Foundations 和代表性页面；用户确认后再展开全量，并最后回写 SwiftUI。
- Platform resolution: iOS/iPadOS 27 作为长期设计方向；26.5 作为当前真机/模拟器验收基线；Liquid Glass 仅用于系统导航、工具栏和浮层等适合位置，内容卡片保持克制，并在 SwiftUI 中以可用性检查做渐进增强。
- Not in v1: 不生成参与者微信小程序端、不修改业务数据契约、不提高 SwiftUI 最低部署版本。

## 验证计划

- Figma `get_metadata`：页面、组件、变量、Auto Layout 与命名结构。
- Figma `get_screenshot`：逐页检查字体、裁切、重叠、设备结构和视觉层级。
- 仓库仅文档变更时运行 `git diff --check`。

## 最终交付清单

- iPhone：20 个顶层页面，覆盖首页、备课、我的、方案与活动、记录与数据、复盘、设置与账户、现场主屏、工具箱、反馈和结束结果。
- iPad：10 个顶层页面，覆盖三类 Split View、方案/活动工作区、834pt 纵向现场、1194pt 宽屏现场与 Dock、记录数据和复盘。
- 弹层与状态：7 个 Sheet、8 个现场工具面板、3 个 Alert、7 个通用/服务/现场状态。
- 原型：iPhone 主流程、iPhone 现场流程、iPad 主流程、iPad 现场工作区；核心 Tab、编辑、预览、工具和结束路径可点击。
- 设计系统：4 个变量集合、72 个变量、10 个文字样式、1 个效果样式及 3 个本地业务组件；系统视觉以 iOS/iPadOS 27 为主，26 作为兼容验收参考。
