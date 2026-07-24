# iOS 现场页数据链路与小程序差异检查

## 目标

- 核对 iOS 现场页主流程与八项工具的数据读写链路。
- 以当前小程序实现为基准，列出能力、展示、布局和交互差距。
- 使用当前 iPhone Simulator 运行态验证可见状态，不修改产品代码。

## 范围与成功标准

- 范围：开课进入、环节切换、主计时、签到、分组、积分、随机、互动、独立计时、音效、笔记、结束培训。
- 成功标准：每项能力标记数据源、写入目标、回显方式、持久化结果及跨端差异；区分确定缺陷与未完成真实环境验证。

## 当前发现

### 总结

- 当前 iPhone Simulator 的 Debug 构建没有配置 `IMPROV_IOS_API_ENDPOINT` 和 `IMPROV_IOS_ACCESS_TOKEN`，实际使用 `MockTrainingRepository`。
- Mock 下分组、积分、互动、独立计时、签到和笔记等本地操作可触发，但这不能证明真实 CloudBase 链路。
- 真实链路存在 Release 阻断：开课响应模型不匹配，现场保存 action 不存在，结束培训没有调用后端的事务型 `endSession`。

### 数据链路问题

| 优先级 | 范围 | 结论 | 证据 |
| --- | --- | --- | --- |
| P0 | 开课 | `CloudBaseTrainingRepository.startSession` 把 `live.startSession` 的 data 直接解码成 `TrainingSession`；后端实际只返回 `{ sessionId }`，真实请求会解码失败。 | `CloudBaseTrainingRepository.swift` 与 `live-api/startSession` |
| P0 | 现场保存 | iOS 所有 `updateActiveSession` 最终调用 `live.saveSession`；`live-api` 路由没有 `saveSession`，只有 `saveGroupState`、`saveScoreState`、`saveRandomState`、`saveNote` 等细分 action。 | `ImprovToolIOSApp.swift`、`CloudBaseTrainingRepository.swift`、`live-api/index.js` 路由表 |
| P0 | 结束培训 | iOS 仅把本地 status 改为 `ended` 并异步执行不存在的 `saveSession`，没有调用后端 `endSession`，因此不会完成场次结束与方案 `delivered` 的事务更新。 | `finishActiveSession` 与 `live-api/endSession` |
| P1 | 保存时序 | 每次本地修改都会启动一个无序 Task；即使补出 `saveSession`，多个响应也可能逆序覆盖 `activeSession`。结束流程也没有等待本次持久化便先 `refresh()`。 | `updateActiveSession`、`persistActiveSession`、`finishActiveSession` |
| P1 | 环节切换 | 运行态从 15 分钟的第 1 环节进入 45 分钟的第 2 环节，仍显示 15:00；返回第 1 环节后显示 45:00。`onChange` 使用了切换前捕获的 session。 | iPhone 17 Pro Simulator 冒烟与 `LiveView.onChange` |
| P1 | iPhone 半屏切换 | 半屏顶部 8 项 Picker 可见但不能切换，因 sheet 内传入 `.constant(tool)`。必须关闭半屏再从主页面入口打开另一个工具。 | Simulator 点击与 `LiveView` sheet 绑定 |

### 八项工具对比

| 功能 | iOS 当前行为 | 小程序当前行为 | 判断 |
| --- | --- | --- | --- |
| 签到 | Mock 中手动追加到本地 session；无预计人数、真实签到列表轮询、二维码或链接。 | `listParticipants`、`manualCheckin`、`getSessionEntryCode`，显示预计人数、最近签到、码和链接。 | 真实链路缺失 |
| 分组 | 本地直接“生成并确认”，以姓名数组写入 session；未调用 `saveGroupState`。 | 先生成再确认，按 `sessionId` 保存分组方式、队伍数、颜色、成员与分组状态。 | 契约与交互均有差距 |
| 积分 | 本地改分；详细模式原因提交后被清空但不保存流水；没有重置入口。 | `saveScoreState` 保存模式、积分和流水，失败回滚，支持重置。 | 真实链路与核心能力缺失 |
| 随机 | 本地抽人/固定题目并记录已抽 ID；不显示历史。 | `saveRandomState` 持久化类型、重复策略、结果和最近 20 条历史。 | 持久化与展示缺失 |
| 互动 | 只在本地追加一条 `LiveInteraction`，二维码图标无操作。 | 创建/加载/关闭互动，生成小程序码和链接，查看词云/投票/承诺统计。 | 参与者闭环未实现 |
| 计时 | 主倒计时与独立正/倒计时可运行，结束提醒可播放；环节切换存在时长错位。 | 同类本地计时，环节切换立即按新环节时长重置。 | 独立计时可用，主计时有缺陷 |
| 音效 | 四个按钮都只触发同一种成功触感，没有播放对应音频。 | 四个 WAV 音效，失败时按类型震动降级。 | 功能未对齐 |
| 笔记 | Mock 中追加纯字符串；无环节名、时间结构；真实端未调用 `saveNote`。 | 按 `sessionId + phaseName` 保存到 `session_notes`，显示环节、内容和时间。 | 数据模型与真实链路缺失 |

### 展示和布局差距

- 主页面：小程序固定显示“签到、分组、积分、工具箱”四个高频入口；iOS 一次展示八项 4 x 2 网格，功能更直达但压缩了现场信息区，也偏离高频/低频分层。
- 信息层级：小程序将环节标题、活动、计时和关键提醒分成独立区块；iOS 把标题、活动、计时、按钮和提醒塞进同一白色 Card，信息密度更高，现场扫读层级更弱。
- 对比度：iOS 在深色现场背景上使用系统 `.secondary` 显示“环节 1/3”等文本，截图中接近不可见；小程序为深色背景显式使用白色透明度色值。
- 半屏：小程序为不透明白色、最高 86vh、独立滚动区和固定底部动作；iOS 使用 medium/360pt 起始 detent，并额外放置 8 项分段控件。当前半屏透出大量背景内容，分组/签到空列表形成大块无语义灰区。
- 操作位置：小程序主导航按钮与 sheet 的确认/重置/保存动作固定在底部安全区；iOS 多数动作位于滚动内容内，不同工具的关键动作位置不一致。
- 工具内容：小程序签到有入口卡与人数目标、分组有成员数量和颜色、积分有流水、随机有历史、互动有统计和入口预览、笔记有环节标签；iOS 均为简化字段或占位图标。
- iPad：代码采用主页面 + 360pt 右侧工具栏，与小程序没有对应形态；本轮未启动 iPad Simulator，未验证分屏、动态字体和实际可滚动高度。

## 建议修复顺序

1. 先按小程序现有细分 action 建立 iOS DTO/Repository，完成 `startSession -> getSessionDetail`、各工具写入和 `endSession`，不要新增一个覆盖全 session 的 `saveSession` 大接口。
2. 为 Repository 增加真实响应契约测试，并串行化/版本化现场写入，禁止旧响应覆盖新状态。
3. 修复环节计时使用新 index 重置、移除或改活 iPhone sheet 的 8 项 Picker。
4. 补齐签到与互动参与者入口、积分流水、随机历史、环节笔记和真实音效。
5. 最后按小程序的信息层级和底部动作区收敛 iPhone 布局，再补 iPad 运行态矩阵。

## 验证

- iPhone 17 Pro（iOS 26.5）现有 Debug 运行态：逐个打开八项工具；Mock 下验证签到、分组、积分、互动、独立计时、笔记、环节切换与结束确认页。
- `swift test`：15 项通过；现有测试未覆盖 HTTP action/DTO 契约。
- XcodeBuildMCP Simulator Debug 构建：通过，无 warning/error。
- `node --check wechat-app/cloudfunctions/ios-api/index.js`：通过。
- `node --check wechat-app/cloudfunctions/live-api/index.js`：通过。
- `git diff --check`：通过。
- 未执行真实 CloudBase E2E：仓库和 Debug 构建未配置测试环境 HTTPS 网关与登录令牌。
