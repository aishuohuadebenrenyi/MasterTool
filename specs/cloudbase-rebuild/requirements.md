# CloudBase 原生重构需求规格

## 背景

当前项目已经验证了培训师工具箱的核心方向，但现有 `uni-app x + Python Flask + MongoDB` 架构在微信小程序现场交互、安全区适配、CloudBase 原生能力和未来多端演进上存在长期成本。项目仍处于初期开发阶段，可以接受完全重构。

本规格定义一次 CloudBase 原生重构：先完成微信小程序 MVP，再为 H5 和 iOS 保留统一后端、数据模型和接口契约。

## 范围

### 本期范围

- 微信原生小程序前端。
- CloudBase 文档数据库。
- CloudBase Node.js 云函数。
- CloudBase 云存储。
- 培训师端主流程。
- 参与者扫码签到、反馈和互动提交。
- 方案、模板、活动、现场、复盘、数据沉淀主链路。
- 弱网、重复点击、重复提交和错误提示。
- 为 H5/iOS 预留 HTTP 云函数和统一用户身份模型。

### 非目标

- 不实现完整 H5 产品。
- 不实现 iOS App。
- 不做一套 UI 代码多端复用。
- 不迁移旧数据。
- 不保留 Python/Flask 作为生产后端。
- 不实现正式 PDF/DOCX 高级排版。
- 不实现参与者自选分组。

## 用户角色

- 培训师：创建和管理方案、现场开课、控制工具、查看数据、完成复盘。
- 参与者：扫码签到、提交反馈、参与互动。
- 未来管理员：通过 H5 管理活动库、查看运营数据和配置公共资源。

## 核心用户故事

### 1. 培训师首次使用

作为培训师，我希望第一次打开小程序时可以看到产品主入口，并在真正需要保存数据或开课时完善身份资料，以便快速理解产品而不被登录流程阻断。

### 2. 模板到方案

作为培训师，我希望模板和方案明确区分，模板可以被应用为草稿方案，以便我能复用成熟流程而不污染历史交付记录。

### 3. 方案确认与开课

作为培训师，我希望开课前选择已确认方案；如果没有已确认方案，系统引导我去处理草稿方案，以便避免未确认内容直接进入现场。

### 4. 现场签到

作为培训师，我希望参与者可以扫码签到，同时系统禁止同一场次重名和重复签到，以便现场名单准确。

### 5. 现场分组

作为培训师，我希望基于已签到参与者生成分组，并能看到每组成员姓名，以便现场组织活动。

### 6. 积分和随机

作为培训师，我希望能给队伍加减分，并从当前场次参与者中随机抽取人员，还能配置是否允许重复抽取，以便适配不同互动规则。

### 7. 培训结束与当前数据

作为培训师，我希望结束培训后查看的是当前场次数据，而不是所有历史数据，以便复盘上下文准确。

### 8. 反馈与复盘

作为培训师，我希望参与者可以提交反馈，我可以基于本场数据完成结构化复盘，以便形成可沉淀的培训记录。

### 9. 弱网和错误处理

作为现场使用者，我希望网络延迟或请求失败时得到清晰、稳定、可重试的提示，以便现场不会因为一次失败而中断。

### 10. 多端演进

作为产品维护者，我希望小程序、未来 H5 和 iOS 复用同一套后端业务模型，以便未来扩展时不重写核心业务逻辑。

## 业务规则

- 模板没有 `draft/confirmed/delivered/reviewed` 状态。
- 模板应用后生成新的草稿方案。
- 方案状态流转为 `draft -> confirmed -> delivered -> reviewed`。
- 开课必须基于已确认方案或已确认的方案快照。
- `live_session` 开始后必须保存方案快照。
- 同一 `sessionId` 下参与者姓名不能重复。
- 同一 `sessionId` 下同一 `openid` 不能重复签到。
- 分组只能使用当前 `sessionId` 已签到参与者。
- 积分流水必须绑定当前 `sessionId` 和 `groupId`。
- 随机抽取必须绑定当前 `sessionId`，默认从已签到参与者中抽取。
- 是否允许重复抽取由当前场次配置控制。
- 结束培训后查看数据必须传递当前 `sessionId`。
- 参与者端不允许自选队伍。
- 所有关键写操作必须支持幂等或重复点击保护。

## 验收标准

### R1：项目架构

- When 项目完成 CloudBase 重构，the system shall 不依赖 Python Flask 或 MongoDB URI 作为生产运行路径。
- When 小程序启动，the system shall 使用 `wx.cloud.init` 初始化明确的 CloudBase 环境。
- When 后端执行业务动作，the system shall 通过 CloudBase Node.js 云函数访问数据库。

### R2：身份与权限

- When 小程序用户调用云函数，the system shall 通过 CloudBase 小程序上下文识别 `OPENID`。
- When 培训师首次保存业务数据，the system shall 创建或更新内部 `userId` 和培训师资料。
- When 用户访问方案、场次、反馈或复盘数据，the system shall 只返回当前用户有权访问的数据。

### R3：模板和方案

- When 培训师查看备课页，the system shall 分开展示“方案”和“个人模板”。
- When 培训师点击模板应用，the system shall 创建一个新的草稿方案。
- When 培训师编辑模板，the system shall 不展示草稿、已确认、已交付或已复盘状态。
- When 培训师确认方案，the system shall 将方案状态从 `draft` 更新为 `confirmed`。

### R4：开课链路

- When 培训师点击“我要开课”，the system shall 优先引导选择模板或已确认方案。
- When 培训师选择已确认方案开始培训，the system shall 创建 `live_session` 并写入方案快照。
- When 当前没有已确认方案，the system shall 以可读时长展示提示，并引导到草稿方案筛选结果。

### R5：签到链路

- When 参与者扫码进入签到页，the system shall 只要求输入姓名即可签到。
- When 同一场次出现重复姓名，the system shall 拒绝签到并提示“该姓名已签到”。
- When 同一微信用户重复签到同一场次，the system shall 拒绝签到并提示“你已签到”。
- When 签到成功，the system shall 更新当前场次参与者列表和签到人数。

### R6：分组链路

- When 培训师打开分组工具，the system shall 读取当前场次已签到参与者。
- When 培训师生成分组，the system shall 展示每组成员姓名。
- When 没有参与者，the system shall 禁止生成分组并提示先完成签到。
- When 培训师确认分组，the system shall 保存当前场次分组结果。

### R7：积分和随机

- When 培训师给队伍加减分，the system shall 保存积分流水并更新当前积分榜。
- When 培训师打开随机工具，the system shall 从当前场次参与者池读取数据。
- When 配置不允许重复抽取，the system shall 自动排除已抽中过的人。
- When 可抽取人数不足，the system shall 给出明确提示。

### R8：反馈和复盘

- When 培训师结束培训，the system shall 将当前 `live_session` 状态更新为 `ended`。
- When 培训师点击查看数据，the system shall 打开当前 `sessionId` 的数据详情。
- When 培训师开始复盘，the system shall 基于当前场次生成复盘上下文。
- When 培训师保存复盘，the system shall 将方案状态推进到 `reviewed` 或记录已复盘标记。

### R9：错误和弱网

- When 请求超过预期时间，the system shall 显示加载状态和可取消/可重试提示。
- When 云函数返回业务错误，the system shall 展示简洁中文提示，不暴露原始堆栈。
- When 用户重复点击关键按钮，the system shall 阻止重复提交或通过幂等请求返回同一结果。
- When 网络不可用，the system shall 保留当前页面上下文并提示稍后重试。

### R10：多端演进

- When 未来 H5 接入，the system shall 能通过 HTTP 云函数复用核心业务动作。
- When 未来 iOS 接入，the system shall 能通过统一 `userId` 识别用户，而不是依赖小程序 `openid`。
- When 新端接入，the system shall 复用 shared types、错误码和状态枚举。

## 验收方式

- 云函数单元测试覆盖核心状态机。
- 数据访问层测试覆盖权限和过滤。
- 小程序真机测试覆盖多尺寸、安全区、弱网、重复点击。
- 现场主链路走查：
  - 模板应用为草稿方案
  - 确认方案
  - 开始培训
  - 扫码签到
  - 防重复签到
  - 分组并展示成员
  - 积分
  - 随机抽取
  - 提交反馈
  - 结束培训
  - 查看当前场次数据
  - 保存复盘
