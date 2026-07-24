# iOS App Privacy 申报矩阵

本表用于 App Store Connect 的 App Privacy 页面，最终提交前须由隐私负责人按真实生产数据复核。

| 数据类型 | 是否收集 | 是否关联身份 | 用途 | 是否追踪 | 证据 |
| --- | --- | --- | --- | --- | --- |
| Name | 是 | 是 | App Functionality | 否 | 培训师资料、参与者签到姓名 |
| Email Address | 是 | 是 | App Functionality | 否 | 邮箱注册、验证与密码重置 |
| User ID | 是 | 是 | App Functionality | 否 | iOS accountId、CloudBase userId |
| Other User Content | 是 | 是 | App Functionality | 否 | 方案、活动、现场笔记、互动、反馈、复盘 |
| Customer Support | 是 | 是 | App Functionality | 否 | 帮助与反馈表单 |
| Product Interaction | 否 | 不适用 | 不适用 | 否 | 当前未接入行为分析 SDK |
| Crash/Performance Data | 否（当前） | 不适用 | 不适用 | 否 | 当前未接入第三方崩溃或性能 SDK；若接入须更新 |
| Device ID/Location/Contacts/Photos/Audio | 否 | 不适用 | 不适用 | 否 | 客户端未请求相关系统权限 |

## 数据边界

- 不接入广告 SDK，不进行跨应用或跨网站追踪。
- Access Token 和 Refresh Token 仅保存在 Keychain；服务端只保存 Refresh Token 哈希。
- 账户导出文件使用短期临时 URL；需配置生命周期规则自动删除 `account-exports/` 文件。
- 删除账户时移除账户、资料、方案、活动、场次、参与者、互动、反馈、笔记和复盘；仅保留不可逆哈希的删除审计记录。
- UGC 过滤词表通过 `IMPROV_UGC_BLOCKED_TERMS` 配置，举报记录进入 `ugc_reports`，屏蔽记录进入 `ugc_blocks`。

## 必须同步更新的场景

- 接入 Analytics、Crash、Performance、广告、推送、Apple 登录或任何第三方 SDK。
- 新增位置、照片、相机、麦克风、通讯录或蓝牙权限。
- 改变数据保留、共享、营销或追踪用途。
