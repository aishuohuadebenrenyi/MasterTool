# MasterTool iOS

本目录是与微信小程序隔离的 iPhone/iPad 原生培训师端，最低支持 iOS/iPadOS 16。

## 本地运行

```bash
swift test
open ImprovToolIOS.xcodeproj
```

Debug 未配置 HTTPS 网关时使用固定 Mock 数据，覆盖各状态方案、五类活动、开课、现场八工具、结束、历史数据和复盘。模拟器内的新增、编辑和现场操作在当前运行期间有效；App 冷启动后恢复固定种子。配置 `IMPROV_IOS_API_ENDPOINT` 后，用户通过邮箱注册/登录，凭证保存在 Keychain，`CloudBaseTrainingRepository` 自动取得和刷新短期访问令牌；Release 不会读取静态 token 或回退到 Mock。

## 边界

- 培训师端为原生 iOS；参与者继续使用微信小程序码。
- iOS 不直连 CloudBase 数据库或存储；仅调用 `ios-api` HTTP 云函数。
- 小程序现有 action、`requestId` 幂等语义与 `sessionId` 链路保持不变。
- 真实开课先取得 `sessionId`，再加载场次详情、参与者、互动和笔记；不存在 `live.saveSession` 整体保存接口。
- 主计时、独立计时和音效属于本地能力；当前环节、签到、分组、积分、随机、互动、笔记、放弃和结束属于服务端能力。
- 现场退出与结束语义分离：确认退出调用 `live.abandonSession` 并把方案回退为已确认，结束培训调用 `live.endSession` 并进入待复盘链路。

正式架构、发布、法务和审计文档统一位于仓库根目录 `docs/`；App Store 草案位于 `releases/ios-personal/draft/`。
