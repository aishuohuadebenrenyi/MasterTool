# CloudBase 测试数据

当前目录已从 `wechat-app/` 中移出，专门存放正式部署不需要、但联调和验收仍要保留的辅助数据文件。

`cloudbase-seed.json` 是联调用数据集，不会被小程序运行时代码读取。

导入步骤：

1. 先运行小程序一次，让 `users` 集合自动生成当前微信用户记录。
2. 在 CloudBase 控制台打开 `users` 集合，复制当前用户的 `_id`。
3. 将 `cloudbase-seed.json` 中所有 `REPLACE_WITH_USER_ID` 替换为该 `_id`。
4. 使用 `importable-jsonl/` 下的 `JSON Lines` 文件按集合导入：`templates`、`plans`、`activities`、`live_sessions`、`interactions`、`participants`、`interaction_submissions`、`feedback`。

注意事项：

- `plans` 中的 `seed-plan-confirmed` 用于测试“从备课页开课”。
- `live_sessions` 中的 `seed-session-ended` 用于测试“待复盘/数据详情”类入口。
- 这些数据只用于开发和验收；生产环境应通过正常业务流程产生数据。
