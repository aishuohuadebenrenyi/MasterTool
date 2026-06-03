# 微信开发者工具可直接导入的种子数据

这份 README 是当前唯一保留的导入说明；原 `SETUP.md` 已合并删除，避免重复维护。

这些文件已从 `wechat-app/` 中移出，并统一为 `JSON Lines` 格式，可在微信开发者工具的数据库面板中按集合逐个导入，用来完成 CloudBase 小程序的部署初始化、联调和验收。

## 文件分类

### 1. 需要先替换用户 ID 的文件

目录：`need-user-id/`

- `templates.json`
- `plans.json`
- `activities.json`
- `live_sessions.json`
- `interactions.json`

这 5 个文件里包含 `REPLACE_WITH_USER_ID`，导入前需要替换成当前测试用户在 `users` 集合中的真实 `_id`。

### 2. 可直接导入的文件

目录：`direct-import/`

- `participants.json`
- `interaction_submissions.json`
- `feedback.json`

这 3 个业务文件不需要替换用户 `_id`，但依赖前面的场次和互动数据先建立好。

## 导入前处理

- `need-user-id/templates.json` 中 `visibility = public` 的公共模板保持原样，不需要替换 `ownerId`
- `need-user-id/templates.json` 中私有模板的 `ownerId = REPLACE_WITH_USER_ID` 需要替换成当前测试用户的 `_id`
- `need-user-id/plans.json`、`need-user-id/activities.json`、`need-user-id/live_sessions.json`、`need-user-id/interactions.json` 里的 `REPLACE_WITH_USER_ID` 也需要一并替换
- `direct-import/participants.json`、`direct-import/interaction_submissions.json`、`direct-import/feedback.json` 不需要替换用户 `_id`
- `users` 集合里的当前测试用户会在首次访问云函数后自动写入，不需要导空文件
- 微信开发者工具导入时，格式请选择 `JSON Lines`

## 首次初始化推荐顺序

1. 先在数据库中创建全部集合
2. 启动小程序并访问首页，让云函数自动生成当前测试用户到 `users`
3. 回到 `users` 集合复制当前测试用户的 `_id`
4. 把 `need-user-id/` 目录中 5 个文件的 `REPLACE_WITH_USER_ID` 替换成真实 `_id`
5. 先导入 `need-user-id/` 目录中的文件：
   - `templates.json`
   - `plans.json`
   - `activities.json`
   - `live_sessions.json`
   - `interactions.json`
6. 再导入 `direct-import/` 里可直接使用的业务数据：
   - `participants.json`
   - `interaction_submissions.json`
   - `feedback.json`

## 最小导入顺序

如果你只是想先让小程序不报集合不存在，至少先创建这些空集合：

- `users`
- `trainer_profiles`
- `reviews`
- `session_notes`
- `support_feedback`
- `operation_logs`

如果你要继续联调，再补充导入：

- `need-user-id/templates.json`
- `need-user-id/plans.json`
- `need-user-id/activities.json`
- `need-user-id/live_sessions.json`
- `need-user-id/interactions.json`
- `direct-import/participants.json`
- `direct-import/interaction_submissions.json`
- `direct-import/feedback.json`

## 说明

- 这些数据仅用于联调和验收
- `cloudbase-seed.json` 仍是总维护文件，`importable-jsonl/` 是面向微信开发者工具的导入产物
- 如果你后续修改了 `cloudbase-seed.json`，建议运行 `python3 wechat-app-support/test-data/generate-jsonl-imports.py` 重新生成这组文件
