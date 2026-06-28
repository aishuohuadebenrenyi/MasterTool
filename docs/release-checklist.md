# 上线发布检查清单

## 版本管理

- `1.0.0` 已作为正式上线版本，后续本地修改不得继续归入 `1.0.0`。
- 补丁版使用 `1.0.x`，仅修线上问题、稳定性、文案和小范围体验问题。
- 小版本使用 `1.x.0`，用于向后兼容的新功能或明显体验增强。
- 大版本使用 `2.0.0` 起，必须单独评估主流程、数据结构和用户操作变化。
- `CHANGELOG.md` 已记录本次版本，补丁项放在 `Fixed` 下。
- `miniprogram/config/version.js` 的 `appVersion`、关于页显示、微信开发者工具上传版本号保持一致。
- 正式发布对应的 Git tag 使用 `vX.Y.Z` 格式；`1.0.0` 对应 `v1.0.0`，`1.0.1` 对应 `v1.0.1`。

## 数据准备

- 已在 CloudBase 创建集合：`users`、`trainer_profiles`、`templates`、`plans`、`activities`、`live_sessions`、`participants`、`feedback`、`reviews`、`session_notes`、`interactions`、`interaction_submissions`、`support_feedback`、`operation_logs`。
- 仅需先创建空集合即可避免运行时报错：`users`、`trainer_profiles`、`reviews`、`session_notes`、`support_feedback`、`operation_logs`；这些集合不需要再导入空文件。
- 建议导入样例业务数据以便联调：`templates`、`plans`、`activities`、`live_sessions`、`participants`、`feedback`、`interactions`、`interaction_submissions`。
- 微信开发者工具可直接导入的拆分文件位于 `wechat-app-support/test-data/importable-jsonl/`，其中 `direct-import/` 可直接导入，`need-user-id/` 需先替换 `REPLACE_WITH_USER_ID`。
- 已为常用查询字段建立索引：`ownerId`、`status`、`updatedAt`、`startedAt`、`sessionId`、`openid`、`interactionId`。
- 已按需导入 `wechat-app-support/test-data/cloudbase-seed.json` 或 `wechat-app-support/test-data/importable-jsonl/direct-import/*.json`、`wechat-app-support/test-data/importable-jsonl/need-user-id/*.json`；`templates` 中公共模板保留 `visibility = public`，私有模板与用户联调数据的 `ownerId` 已替换为当前测试用户 `_id`。
- 当前测试用户应在首次访问云函数后自动写入 `users`，不需要手动导入空数据。

## 权限策略

- 业务集合建议默认关闭客户端直读直写，通过云函数访问。
- `participants`、`feedback` 允许参与者经 `participant-api` 写入，不暴露集合写权限。
- `operation_logs` 仅云函数可写，用于幂等记录。
- `session_notes`、`reviews` 仅场次 owner 可通过云函数写入。
- `templates` 支持 `visibility = public/private`；公共模板只读，不允许删除或修改收藏/置顶。
- 导入测试数据后，应确认没有遗留 `REPLACE_WITH_USER_ID`。

## 云函数

- 已部署：`trainer-api`、`live-api`、`participant-api`、`review-api`。
- `live-api/config.json` 已声明 `wxacode.getUnlimited`，重新上传云函数后需等待微信侧权限生效。
- 已验证 `trainer-api` 动作：`getHomeSummary`、`listPlans`、`getPlanDetail`、`savePlanDraft`、`confirmPlan`、`deletePlan`、`updatePlanFlags`、`savePlanAsTemplate`、`listTrainingRecords`、`getDataOverview`。
- 已验证 `live-api` 动作：`startSession`、`getSessionDetail`、`manualCheckin`、`listParticipants`、`saveGroupState`、`saveScoreState`、`saveRandomState`、`saveNote`、`endSession`。
- 已验证 `live-api` 互动动作：`createInteraction`、`listInteractions`、`getInteractionStats`、`closeInteraction`。
- 已验证 `live-api` 小程序码动作：`getSessionEntryCode`、`getInteractionEntryCode`。
- 已验证 `participant-api` 动作：`getSessionPublicInfo`、`checkin`、`submitFeedback`、`getInteractionPublicInfo`、`submitInteraction`。
- 已验证 `review-api` 动作：`listReviews`、`saveReview`。

## 核心业务流

- 首页能显示真实待开课、草稿、待复盘数量。
- 备课页能加载真实方案、个人模板、公共模板、活动。
- 新建方案、保存草稿、确认方案、方案预览、另存模板均能持久化。
- 私有方案、个人模板的删除/收藏/置顶刷新后仍然生效；公共模板不可删除，且只出现在“公共模板”筛选下。
- 开课后能进入现场页，现场页读取真实 `planSnapshot.phases`。
- 手动签到、参与者扫码签到、重复签到拦截均正常。
- 分组、积分、抽取、计时能在现场页稳定操作，刷新后仍能恢复已确认分组、积分和抽取历史。
- 词云、投票、承诺能创建入口，参与者能提交，培训师能查看统计并关闭互动。
- 签到、反馈、互动支持生成正式小程序码，而不是只复制页面路径。
- 音效入口能播放本地音频资源；播放失败时应退回震动/视觉反馈。
- 现场笔记能保存到 `session_notes`。
- 结束培训后能进入反馈、复盘、本场数据。
- 参与者反馈提交后，反馈页和数据详情能展示真实统计。
- 复盘保存后，场次状态变为 `reviewed`。
- 培训记录页展示真实历史场次。
- 帮助与反馈提交后写入 `support_feedback`。
- 设置页更新后本地持久化，重新进入仍保留。

## 发布前验证

- 运行 `npm run verify:all` 通过，工作目录为 `wechat-app-support/`。
- 运行 `node tests/verify-wechat-app.js` 通过，工作目录为 `wechat-app-support/`。
- 使用微信开发者工具完成一次完整端到端演练。
- 使用真机扫码完成参与者签到和反馈。
- 使用真机验证 `wxacode.getUnlimited` 生成的小程序码能直接进入签到、反馈、互动页面。
- 从公共模板进入方案编辑后，确认方案与开始培训都会先落一条当前用户自己的 `plan`。
- 关闭网络或删除云函数权限时，页面出现明确错误提示，不出现假成功。
- 小程序隐私、用户数据、反馈数据说明已准备。

## 发布后巡检

- 检查 4 个云函数日志，确认没有新增高频错误。
- 检查帮助与反馈入口，确认线上用户反馈能写入 `support_feedback`。
- 确认正式版关于页显示本次版本号。
- 记录是否需要继续开 `1.0.2` 紧急补丁。
