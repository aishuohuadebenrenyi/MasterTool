# CloudBase 原生重构任务计划

## 0. 规格与项目准备

- [x] 0.1 生成 CloudBase 原生重构需求文档
  - 输出 `specs/cloudbase-rebuild/requirements.md`
  - 明确 MVP 范围、非目标和验收标准
  - _Requirement: R1-R10_

- [x] 0.2 生成 CloudBase 原生重构技术设计
  - 输出 `specs/cloudbase-rebuild/design.md`
  - 明确技术栈、数据模型、云函数边界和多端演进方案
  - _Requirement: R1, R10_

- [x] 0.3 生成实施任务计划
  - 输出 `specs/cloudbase-rebuild/tasks.md`
  - 将任务绑定到需求编号
  - _Requirement: R1-R10_

## 1. CloudBase 基座

- [x] 1.1 创建新项目目录结构
  - 新建 `wechat-app/` 作为微信开发者工具导入目录
  - 新建 `wechat-app/miniprogram/`
  - 新建 `wechat-app/cloudfunctions/`
  - 移除旧 Python `backend/`
  - 旧 `archive/frontend-uniapp-x/` 仅作为迁移期参考
  - _Requirement: R1_

- [x] 1.2 建立基础领域约束和常量
  - 定义 `User`、`Template`、`Plan`、`LiveSession`、`Participant`、`Group`
  - 定义状态枚举、错误码、方案类型中文标签
  - _Requirement: R1, R10_

- [x] 1.3 初始化微信原生小程序
  - 配置 `app.js`、`app.json`、`app.wxss`
  - 接入 `wx.cloud.init`
  - 配置 tabBar 和基础页面
  - _Requirement: R1_

- [x] 1.4 初始化 CloudBase 云函数工程
  - 创建 `trainer-api`
  - 创建 `live-api`
  - 创建 `participant-api`
  - 创建 `review-api`
  - _Requirement: R1_

- [x] 1.5 建立统一云函数响应与错误处理
  - 实现 `ApiResponse`
  - 实现错误码
  - 实现参数校验失败、权限失败、状态冲突、服务异常的统一输出
  - _Requirement: R1, R9_

## 2. 数据库与权限

- [ ] 2.1 创建 CloudBase 文档数据库集合
  - 创建 `users`、`trainer_profiles`、`templates`、`plans`
  - 创建 `activities`、`live_sessions`、`participants`、`groups`
  - 创建 `score_events`、`picks`、`interactions`、`feedback`
  - 创建 `reviews`、`notes`、`exports`、`analytics_snapshots`、`operation_logs`
  - _Requirement: R1-R8_

- [ ] 2.2 配置索引
  - 配置 `ownerId/status/updatedAt` 类索引
  - 配置 `sessionId/name` 和 `sessionId/openid` 唯一语义索引或后端校验
  - 配置现场数据高频查询索引
  - _Requirement: R5-R8_

- [ ] 2.3 建立数据访问层
  - 封装集合访问
  - 封装 owner 权限过滤
  - 封装分页、排序、状态筛选
  - _Requirement: R2, R10_

- [x] 2.4 建立幂等操作日志
  - 设计 `operation_logs`
  - 写入前检查 `requestId`
  - 重复请求返回第一次结果
  - _Requirement: R9_

## 3. 身份与用户资料

- [x] 3.1 实现小程序用户识别
  - 云函数通过 CloudBase 小程序上下文获取 `OPENID`
  - 映射或创建内部 `userId`
  - _Requirement: R2_

- [ ] 3.2 实现培训师资料
  - 获取资料
  - 更新昵称、组织、角色
  - 未完善资料时给出引导
  - _Requirement: R2_

- [ ] 3.3 预留多端身份映射
  - `users` 支持 `openid`、`webUid`、`phone`
  - 后端统一使用 `userId`
  - _Requirement: R10_

## 4. 小程序 UI 基础设施

- [ ] 4.1 实现基础布局组件
  - `NavBar`
  - `HalfSheet`
  - `BottomActionBar`
  - `Toast`
  - `ConfirmDialog`
  - _Requirement: R9_

- [ ] 4.2 实现列表和筛选组件
  - `SearchBar`
  - `FilterBar`
  - `SwipeAction`
  - `EmptyState`
  - `LoadingState`
  - _Requirement: R3, R9_

- [ ] 4.3 实现现场工具组件
  - `ToolGrid`
  - `ToolButton`
  - 双列布局
  - 工具按钮居中且尺寸统一
  - _Requirement: R6, R7_

- [x] 4.4 建立统一样式 token
  - 颜色
  - 字号
  - 圆角
  - 间距
  - 按钮尺寸
  - 安全区变量
  - _Requirement: R9_

## 5. 模板、方案和活动

- [ ] 5.1 实现模板列表
  - 个人模板独立标签
  - 支持编辑、删除、收藏
  - 不展示方案状态
  - _Requirement: R3_

- [ ] 5.2 实现模板应用为草稿方案
  - 点击应用创建新草稿方案
  - 保留模板来源
  - 跳转方案编辑
  - _Requirement: R3_

- [ ] 5.3 实现方案列表
  - 支持草稿、已确认、已交付、已复盘筛选
  - 支持收藏、置顶、删除
  - 支持左滑操作
  - _Requirement: R3, R4_

- [ ] 5.4 实现方案编辑和确认
  - 基础信息编辑
  - 环节编辑
  - 环节上下调整
  - 方案确认
  - _Requirement: R3, R4_

- [ ] 5.5 实现活动库
  - 活动列表
  - 活动新增/编辑
  - 场景、难度、人数、时长、规则、复盘问题
  - _Requirement: R3_

## 6. 开课和现场控制

- [ ] 6.1 实现首页开课入口
  - 点击“我要开课”进入模板/方案选择
  - 优先选择模板或已确认方案
  - 无已确认方案时提示并筛选草稿
  - _Requirement: R4_

- [ ] 6.2 实现开始培训
  - 创建 `live_session`
  - 写入方案快照
  - 初始化现场配置
  - _Requirement: R4_

- [ ] 6.3 实现现场控制页
  - 当前环节
  - 进度条
  - 上一环节/下一环节
  - 工具箱
  - 设置
  - _Requirement: R4, R9_

- [ ] 6.4 实现现场笔记
  - 按 `sessionId + phaseId` 保存
  - 支持自动保存
  - 弱网失败提示
  - _Requirement: R8, R9_

## 7. 签到、分组、积分、随机

- [ ] 7.1 实现参与者扫码签到页
  - 读取公开场次信息
  - 输入姓名签到
  - 成功态和重复态
  - _Requirement: R5_

- [ ] 7.2 实现签到后端校验
  - 同场次姓名不可重复
  - 同场次 openid 不可重复
  - 手动补录也要校验姓名
  - _Requirement: R5_

- [ ] 7.3 实现分组工具
  - 读取已签到参与者
  - 按人数均分或随机分组
  - 展示每组成员姓名
  - 确认保存分组
  - _Requirement: R6_

- [ ] 7.4 实现积分工具
  - 显示队伍分数
  - 加减分
  - 保存积分流水
  - _Requirement: R7_

- [ ] 7.5 实现随机抽取工具
  - 从当前场次参与者池抽取
  - 支持是否允许重复
  - 不足人数提示
  - _Requirement: R7_

## 8. 反馈、结束和复盘

- [ ] 8.1 实现参与者反馈提交
  - 通过场次口令进入
  - 提交满意度和文本反馈
  - 防重复提交
  - _Requirement: R8, R9_

- [ ] 8.2 实现结束培训
  - 更新 `live_session` 状态
  - 汇总参与人数、时长、反馈数量
  - 进入培训结束页
  - _Requirement: R8_

- [ ] 8.3 实现当前场次数据详情
  - 只展示当前 `sessionId` 数据
  - 包含签到、分组、积分、反馈、互动
  - _Requirement: R8_

- [ ] 8.4 实现复盘中心和复盘详情
  - 待复盘只显示待复盘场次
  - 复盘问题
  - 保存复盘
  - 完成复盘
  - _Requirement: R8_

## 9. H5/iOS 预留

- [ ] 9.1 建立 HTTP 云函数入口
  - 复用 shared 业务动作
  - 面向 H5/iOS 返回统一响应
  - _Requirement: R10_

- [ ] 9.2 建立 Web Auth 预留设计
  - 预留 `webUid`
  - 预留手机号登录绑定
  - _Requirement: R10_

- [ ] 9.3 建立接口契约文档
  - 输出 action 列表
  - 输出请求/响应类型
  - 输出错误码
  - _Requirement: R10_

## 10. 测试、部署和验收

- [ ] 10.1 云函数测试
  - 单元测试
  - 状态机测试
  - 权限测试
  - 幂等测试
  - _Requirement: R1-R9_

- [ ] 10.2 小程序真机验收
  - iPhone 刘海屏
  - 小屏设备
  - Android 常见机型
  - 微信开发者工具模拟器
  - _Requirement: R9_

- [ ] 10.3 弱网和异常验收
  - 慢请求
  - 云函数失败
  - 重复点击
  - 页面返回后重入
  - _Requirement: R9_

- [ ] 10.4 完整主链路验收
  - 模板应用
  - 方案确认
  - 开课
  - 签到
  - 分组
  - 积分
  - 随机
  - 反馈
  - 结束
  - 当前数据
  - 复盘
  - _Requirement: R3-R8_

- [ ] 10.5 CloudBase 发布准备
  - dev/prod 环境
  - 集合和索引
  - 安全规则
  - 云函数日志
  - 小程序隐私协议和合法域名
  - _Requirement: R1, R2_
