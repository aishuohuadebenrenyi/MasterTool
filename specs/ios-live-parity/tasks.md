# iOS 现场全链路与跨端布局收敛 Implementation Plan

## 阶段一：契约与数据基线

- [x] 1. 建立实现前基线并锁定变更范围
  - 记录当前工作区相关文件状态，避免覆盖无关修改。
  - 运行现有 Swift tests、iOS Debug 构建和相关云函数语法检查，记录实现前已存在的失败。
  - 确认 Debug Mock 与 Release 配置失败行为保持现状。
  - 验证：基线命令、结果和残余环境限制写入任务记录。
  - _Requirements: R1, R14_

- [x] 2. 扩展现场 Domain 模型并补充纯模型测试
  - 增加参与者签到时间、分组颜色、积分流水、随机状态、结构化笔记、入口码和互动统计模型。
  - 扩展 `TrainingSession` 的可恢复字段，为现有 Mock fixture 提供明确默认值。
  - 将模型变化限制在现场链路，不修改无关方案和活动语义。
  - 验证：Swift 模型构造、Codable/Equatable 和缺省字段测试通过。
  - _Requirements: R2, R5, R6, R7, R8, R9, R11_

- [x] 3. 定义细分 Repository 契约和真实 API DTO
  - 用现场细分方法替换不存在的 `live.saveSession` 依赖。
  - 为 `_id`、`planSnapshot`、phase `minutes`、`groupId`、日期和缺省值建立显式 DTO 映射。
  - 注入可测试的 HTTP session，统一 action、业务和解码错误。
  - 验证：URLProtocol 契约测试覆盖 action 名、payload、响应映射和错误转换。
  - _Requirements: R2, R3, R5, R6, R7, R8, R9, R11, R12, R14_

- [x] 4. 实现开课、完整加载与 Mock 同构行为
  - 真实仓库按 `startSession -> getSessionDetail -> 附属列表` 组装完整场次。
  - 实现已有运行中场次恢复以及无效快照失败。
  - Mock Repository 实现同一细分契约和确定性内存状态。
  - 删除现场路径中的整体 `saveSession` 调用和协议方法。
  - 验证：请求顺序、恢复数据、失败不返回半初始化对象和 Mock 状态测试通过。
  - _Requirements: R1, R2, R3, R14_

## 阶段二：服务端最小闭环

- [x] 5. 实现并测试 `live.savePhaseState`
  - 校验场次所有权、running 状态、整数 index 和方案快照边界。
  - 保存 `currentPhaseIndex` 与更新时间并返回标准化结果。
  - 将 action 注册到现有 `live-api` 分派表，不改变小程序既有 action。
  - 验证：成功、越界、非 running 和非所有者测试及 Node 语法检查通过。
  - _Requirements: R3, R4, R14_

- [x] 6. 实现并测试 `live.listNotes`
  - 校验场次所有权，按创建时间倒序读取最多 200 条笔记。
  - 标准化输出 ID、环节、内容和时间。
  - 确认 `ios-api` 现有 `live.*` 转发可承载新 action；只有测试证明受限时才最小修改。
  - 验证：所有权、排序、上限、字段映射和转发契约检查通过。
  - _Requirements: R1, R11, R14_

## 阶段三：场次状态和时序

- [x] 7. 将 AppStore 改为显式现场命令
  - 增加加载、当前写操作和可展示错误状态。
  - 实现开课/恢复、签到、分组、积分、随机、互动、笔记、环节和结束的 async 命令。
  - 移除任意 session 变化触发的 fire-and-forget 整体保存。
  - 验证：命令成功采用服务端状态，失败可见，同类并发写入被串行化或拒绝。
  - _Requirements: R2, R3, R12_

- [x] 8. 修复环节切换、主计时和结束培训时序
  - 环节按钮与滑动统一传递目标 index，并使用目标 phase 时长重置计时。
  - 环节保存失败时恢复旧 index 和计时快照；提醒只触发一次。
  - 结束培训等待 `live.endSession` 成功后再离场和刷新数据。
  - 验证：连续 15/45 分钟环节切换、保存失败回滚、结束失败留场测试通过。
  - _Requirements: R3, R4, R12, R14_

## 阶段四：现场工具逐项闭环

- [x] 9. 接通签到和参与者入口
  - 加载真实参与者与签到统计，支持手动补录的空值/重复校验。
  - 调用 `manualCheckin` 后使用服务端参与者 ID 回显。
  - 加载并展示小程序码、路径和可复制链接。
  - 验证：加载、补录、重复、失败重试和入口展示逐项测试/冒烟通过。
  - _Requirements: R3, R5_

- [x] 10. 接通分组和积分
  - 支持均分/随机本地预览，确认时保存完整标准化分组状态。
  - 支持简化/详细积分、原因流水、加减分和二次确认重置。
  - 为两类写入保存旧快照并在失败时回滚。
  - 验证：分组确认、积分流水、重置、服务端标准化结果和失败回滚通过。
  - _Requirements: R3, R6, R7_

- [x] 11. 接通随机和互动
  - 随机参与者/题目、重复策略、当前结果和历史均通过 `saveRandomState` 持久化。
  - 实现词云、投票、承诺互动的创建、列表、入口、统计和关闭。
  - 阻止空数据、无效投票选项和请求中的重复提交。
  - 验证：随机空状态/历史/回滚及三种互动完整状态流转通过。
  - _Requirements: R3, R8, R9_

- [x] 12. 接通笔记、独立计时与音效
  - 笔记保存使用当前环节，成功后显示服务端时间，失败保留草稿，并支持重新加载历史。
  - 独立计时支持正计时、常用倒计时、暂停、重置和加时，关闭 sheet 后不丢状态。
  - 将项目已有四类音频加入 iOS 资源，播放失败时使用触感降级。
  - 验证：笔记恢复/失败草稿、计时生命周期、一次性提醒和四类音效逐项冒烟通过。
  - _Requirements: R3, R10, R11_

## 阶段五：页面与设备布局收敛

- [x] 13. 提取 iPhone/iPad 共用现场组件
  - 提取 header、主计时、高频动作、环节导航和工具内容组件。
  - 保持 AppStore 和 `LiveToolState` 单一来源，不为设备复制业务状态。
  - 删除 iPhone sheet 内不可工作的八项 segmented Picker。
  - 验证：组件状态来源审查和 Swift tests/build 通过。
  - _Requirements: R4, R10, R13_

- [x] 14. 收敛 iPhone 现场布局与交互状态
  - 固定顶部状态、中心计时、底部签到/分组/积分/工具箱和环节导航。
  - 工具箱使用 item-driven sheet，关键动作固定在底部安全区。
  - 为加载、空、保存、失败和动态字体提供明确布局。
  - 验证：目标 iPhone Simulator 在默认及大字体下完成主流程和八项工具截图/冒烟检查。
  - _Requirements: R3, R5-R13_

- [x] 15. 收敛 iPad 双栏布局
  - 使用主现场区和约 360pt inspector，共享 iPhone 的工具内容与状态。
  - 校验横竖屏压缩下主计时、工具和环节导航不遮挡。
  - 验证：目标 iPad Simulator 构建、旋转、工具切换和跨容器状态一致性通过。
  - _Requirements: R10, R13, R14_

## 阶段六：整体回归与交付

- [x] 16. 执行全链路验证矩阵
  - 运行全部 Swift tests、iPhone/iPad Debug 构建和现场逐工具冒烟。
  - 运行云函数语法/契约检查、`tooling/verification/npm run verify:all` 和发布契约检查（如适用）。
  - 运行 `git diff --check`、敏感信息扫描和改动范围审查。
  - 验证：逐项记录通过、失败、环境阻塞和残余风险，不以 Mock 替代真实 E2E。
  - _Requirements: R1-R14_

- [x] 17. 同步正式文档和任务状态
  - 更新 iOS 当前实现、数据 action、Debug/Release 边界和部署后验证说明。
  - 将完成项和验证证据写入本任务记录，更新 `.codex/tasks/in-progress.md` 与 `done.md`。
  - 真实网关/令牌/EnvId 缺失导致的 E2E 项写入 `todo.md`，不声明已完成。
  - 验证：文档与代码事实复核，`git diff --check` 通过。
  - _Requirements: R1, R14_

## 完成定义

- 所有 17 项任务均已完成或明确标注为外部环境阻塞。
- iOS 现场页不存在对 `live.saveSession` 的调用。
- 签到、分组、积分、随机、互动、笔记、环节和结束均有对应真实 action 或明确本地边界。
- iPhone 与 iPad 共用业务状态且完成各自运行态校验。
- Release 配置缺失时不会回退 Mock。
- 最终报告逐项区分自动化测试、Simulator 冒烟和未执行的真实 CloudBase E2E。
