# iOS 架构与 CloudBase 契约

## 客户端

- `App`：认证、依赖装配和自适应根导航；Release 未配置 HTTPS 网关与登录令牌时拒绝回退到 Mock。
- `Features`：首页、备课、方案/活动、现场八工具、结束/反馈、数据/复盘、我的。
- `Domain`：方案、模板、活动、场次、参与者、分组、互动、随机记录、笔记、统计和复盘状态机。
- `Data`：Repository、HTTP 客户端、显式 DTO 映射和 Mock 同构实现。
- `DesignSystem`：颜色、间距、卡片、错误态和可访问性标识。

iPhone 使用三 Tab；iPad 使用三项侧栏与详情栏。开课后由根容器全屏呈现深色现场：iPhone 固定签到、分组、积分、工具箱和环节导航，工具箱以两列网格提供全部八项工具并在同一 `NavigationStack` Sheet 内进入详情；iPad 在导航栏下常驻可滚动的八工具条，并按真实窗口宽度与工具类型选择布局。宽度不小于 1100pt 时，签到、分组、积分、互动和笔记使用 520–720pt 宽工作区，随机、独立计时和音效使用提醒区下方工具台；700–1099pt 时现场与工具纵向排列；低于 700pt 或紧凑尺寸类回退 iPhone Sheet。所有形态共享 `AppStore.activeSession`、同一 `LiveToolState` 和同一组工具内容组件。

## 现场状态

- `live.startSession` 只返回 `sessionId`；Repository 随后调用 `live.getSessionDetail`，并并行加载参与者、互动和笔记，全部映射成功后才进入现场。
- 现场不使用整体 `saveSession`。环节、签到、分组、积分、随机、互动、笔记、放弃和结束分别调用对应细分 action。
- `AppStore` 同一时间只允许一个现场写操作。分组、积分、随机和环节允许乐观展示，但失败会恢复旧快照；结束培训必须等待服务端事务成功。
- “退出现场”二次确认后调用 `live.abandonSession`；成功后清空活动场次并刷新方案，失败时保留现场。结束培训继续调用 `live.endSession`，两种状态转换不混用。
- 主计时和独立计时为 iOS 本地状态；环节 index 通过 `live.savePhaseState` 保存，历史笔记通过 `live.listNotes` 恢复。

## CloudBase 边界

iOS 仅请求 `ios-api` HTTP 云函数：`Authorization: Bearer <short-lived-token>`、`requestId`、`clientVersion` 与业务 `action/payload`。网关验证令牌后调用既有领域函数，并附加 HMAC 签名的内部身份断言。领域函数仅信任签名正确的断言；其他请求仍按微信 `OPENID` 解析。

原 action、响应 `{ code, message, data, requestId }`、幂等日志和 `sessionId` 状态机不变。`live-api` 新增 `savePhaseState` 与 `listNotes` 两个最小 action；`ios-api` 的通用 `live.*` 转发无需专用分支。业务集合继续禁止客户端直接读写。

## 账号

首发实现邮箱密码认证：Access Token 有效期 15 分钟，Refresh Token 有效期 30 天并在每次刷新时轮换；客户端只在 Keychain 保存凭证，服务端只保存 Refresh Token 哈希。注册会生成邮箱验证邮件，密码重置会撤销该账户的活动 Refresh Token。微信历史用户由小程序“我的 - 设置”生成 10 分钟、单次使用的绑定码；iOS 调用 `auth.bindWechatAccount` 后与微信共用同一 `userId`。

首发未实现第三方或社交登录。若产品决定增加 Sign in with Apple 或其他第三方登录，须同时实现 Apple 服务端 JWK 验签、凭证撤销、账号合并和隐私申报，不得只在界面增加按钮。
