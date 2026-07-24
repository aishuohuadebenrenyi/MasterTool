import SwiftUI
#if canImport(ImprovToolCore)
import ImprovToolCore
#endif

struct MineView: View {
    @EnvironmentObject private var store: AppStore
    @State private var editingProfile = false
    var body: some View { NavigationStack { List {
        Section { Button { editingProfile = true } label: { HStack { Text(String(store.profile.displayName.prefix(1))).font(.title2.bold()).foregroundStyle(.white).frame(width: 52, height: 52).background(ImprovStyle.blue, in: Circle()); VStack(alignment: .leading) { Text(store.profile.displayName).font(.headline); Text("认证培训师").foregroundStyle(.secondary) }; Spacer(); Text("编辑").foregroundStyle(.secondary) } }.buttonStyle(.plain) }
        Section { HStack { Metric(value: "\(store.overview.totalSessions)", label: "培训场次"); Metric(value: store.overview.satisfaction, label: "平均满意度"); Metric(value: "\(store.overview.totalParticipants)", label: "参与人数") } }
        Section("数据") { NavigationLink { RecordsView() } label: { Label("培训记录", systemImage: "clock.arrow.circlepath") }; NavigationLink { DataOverviewView() } label: { Label("数据详情", systemImage: "chart.bar") } }
        Section("支持") { NavigationLink { SettingsView() } label: { Label("设置", systemImage: "gearshape") }; NavigationLink { HelpView() } label: { Label("帮助与反馈", systemImage: "questionmark.circle") }; NavigationLink { AboutView() } label: { Label("关于", systemImage: "info.circle") }; NavigationLink { LegalView() } label: { Label("隐私与账户", systemImage: "hand.raised") } }
    }.toolbar(.hidden, for: .navigationBar).refreshable { await store.refresh() }.sheet(isPresented: $editingProfile) { ProfileEditor(profile: store.profile) { await store.save(profile: $0) } } } }
}

private struct ProfileEditor: View { @Environment(\.dismiss) private var dismiss; @State var profile: TrainerProfile; @State private var isSaving = false; let save: (TrainerProfile) async -> Bool
    var body: some View { NavigationStack { Form { TextField("请输入昵称", text: $profile.displayName).onChange(of: profile.displayName) { value in if value.count > 20 { profile.displayName = String(value.prefix(20)) } }; TextField("机构（选填）", text: $profile.organization) }.navigationTitle("编辑资料").toolbar { ToolbarItem(placement: .topBarTrailing) { SheetCloseButton() } }.safeAreaInset(edge: .bottom) { SheetPrimaryActionBar(title: isSaving ? "保存中…" : "保存", isDisabled: isSaving || profile.displayName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) { Task { isSaving = true; profile.displayName = profile.displayName.trimmingCharacters(in: .whitespacesAndNewlines); if await save(profile) { dismiss() }; isSaving = false } } } }.improvSheetStyle(.compact) }
}

struct RecordsView: View { @EnvironmentObject private var store: AppStore; @State private var pendingOnly = false
    var body: some View { List { Section { Picker("筛选", selection: $pendingOnly) { Text("全部").tag(false); Text("待复盘").tag(true) }.pickerStyle(.segmented) }; ForEach(store.records.filter { !pendingOnly || $0.status == .ended }) { session in NavigationLink { ReviewDetailView(session: session) } label: { VStack(alignment: .leading) { Text(session.plan.name).font(.headline); Text("\(session.status == .reviewed ? "已复盘" : "待复盘") · \(session.participants.count) 人").font(.caption).foregroundStyle(.secondary) } } } }.navigationTitle("培训记录").overlay { if store.records.isEmpty { EmptyState(title: "暂无培训记录", symbol: "clock", fillsAvailableSpace: true) } }.improvSecondaryScreen() }
}

struct DataOverviewView: View { @EnvironmentObject private var store: AppStore
    var body: some View { ScrollView { VStack(spacing: 16) { HStack { Metric(value: "\(store.overview.totalSessions)", label: "总培训场次"); Metric(value: "\(store.overview.totalParticipants)", label: "累计参与人数") }; Card { VStack(alignment: .leading) { Text("反馈与满意度").font(.headline); Text(store.overview.satisfaction).font(.system(size: 40, weight: .bold)).foregroundStyle(ImprovStyle.blue); Text("平均满意度").foregroundStyle(.secondary) } }; Card { VStack(alignment: .leading) { Text("数据说明").font(.headline); Text("场次详情、反馈分布与 NPS 按 sessionId 从 CloudBase 聚合读取。") .foregroundStyle(.secondary) } } }.padding() }.background(ImprovStyle.surface).navigationTitle("数据详情").improvSecondaryScreen() }
}

struct ReviewListView: View { @EnvironmentObject private var store: AppStore
    var body: some View { List(store.records.filter { $0.status != .running }) { session in NavigationLink { ReviewDetailView(session: session) } label: { VStack(alignment: .leading) { Text(session.plan.name); Text(session.status == .reviewed ? "已复盘" : "待复盘").font(.caption).foregroundStyle(.secondary) } } }.navigationTitle("复盘中心").overlay { if store.records.isEmpty { EmptyState(title: "暂无待复盘场次", symbol: "checkmark.circle", fillsAvailableSpace: true) } }.improvSecondaryScreen() }
}

private enum ReviewFramework: String, CaseIterable {
    case orid = "ORID"
    case fourF = "4F"
    case ssc = "SSC"

    var questions: [String] {
        switch self {
        case .orid:
            return ["O-客观：刚才的活动中，你观察到了什么？", "R-感受：哪些瞬间让你有情绪或能量变化？", "I-诠释：这些现象说明了什么？", "D-决定：下一次你会调整什么？"]
        case .fourF:
            return ["Facts：现场发生了什么？", "Feelings：参与者和你分别有什么感受？", "Findings：你发现了哪些模式？", "Future：下一场如何优化？"]
        case .ssc:
            return ["Start：下次应该开始做什么？", "Stop：哪些做法应该停止？", "Continue：哪些做法应该继续？"]
        }
    }
}

struct ReviewDetailView: View {
    @EnvironmentObject private var store: AppStore
    let session: TrainingSession
    @State private var framework = ReviewFramework.orid
    @State private var questionIndex = 0
    @State private var answers = [String: String]()
    @State private var isSaving = false

    private var question: String { framework.questions[questionIndex] }
    private var answer: Binding<String> {
        Binding(get: { answers[question, default: ""] }, set: { answers[question] = $0 })
    }

    var body: some View {
        Form {
            Section("本场培训") {
                Text(session.plan.name)
                Text("签到 \(session.participants.count) 人")
                Text("满意度与反馈按场次数据加载").foregroundStyle(.secondary)
            }
            Section("结构化反思") {
                Picker("复盘框架", selection: $framework) {
                    ForEach(ReviewFramework.allCases, id: \.self) { Text($0.rawValue).tag($0) }
                }
                .pickerStyle(.segmented)
                Text("\(questionIndex + 1)/\(framework.questions.count)").font(.caption).foregroundStyle(.secondary)
                Text(question).font(.headline)
                TextEditor(text: answer).frame(minHeight: 130)
                HStack {
                    Button("‹ 上一题") { questionIndex = max(0, questionIndex - 1) }.disabled(questionIndex == 0)
                    Spacer()
                    Button("下一题 ›") { questionIndex = min(framework.questions.count - 1, questionIndex + 1) }.disabled(questionIndex == framework.questions.count - 1)
                }
            }
            Section {
                Button(isSaving ? "保存中…" : "完成复盘") {
                    Task {
                        isSaving = true
                        let content = framework.questions.compactMap { question in
                            let value = answers[question, default: ""].trimmingCharacters(in: .whitespacesAndNewlines)
                            return value.isEmpty ? nil : "\(question)\n\(value)"
                        }.joined(separator: "\n\n")
                        _ = await store.saveReview(sessionID: session.id, framework: framework.rawValue, content: content)
                        isSaving = false
                    }
                }
                .disabled(isSaving || answers.values.allSatisfy { $0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty })
            }
        }
        .navigationTitle("复盘详情")
        .onChange(of: framework) { _ in questionIndex = 0 }
        .improvSecondaryScreen()
    }
}

struct SettingsView: View {
    @AppStorage(AppPreferenceKey.swipeForwardEnabled) private var swipeForwardEnabled = true
    @AppStorage(AppPreferenceKey.swipeBackEnabled) private var swipeBackEnabled = true
    @AppStorage(AppPreferenceKey.doubleTapDelayEnabled) private var doubleTapDelayEnabled = true
    @AppStorage(AppPreferenceKey.timerAlertEnabled) private var timerAlertEnabled = true

    var body: some View {
        Form {
            Section("现场操作") {
                setting("左滑进入下一环节", "在培训进行页向左滑动", $swipeForwardEnabled)
                setting("右滑返回上一环节", "在培训进行页向右滑动", $swipeBackEnabled)
                setting("双击延长 5 分钟", "双击环节计时器快速加时", $doubleTapDelayEnabled)
            }
            Section("计时提醒") {
                setting("计时结束提醒", "倒计时结束时播放提示音并提供触感", $timerAlertEnabled)
            }
            Section {
                status("现场进度", detail: "环节、分组、积分与笔记变更后自动保存", value: "自动保存")
                status("微信历史账户", detail: "账户互通服务开放后可在这里完成绑定", value: "即将支持")
            } header: {
                Text("数据与账户")
            } footer: {
                Text("保存失败时会立即提示；当前不承诺离线自动重试。")
            }
        }
        .navigationTitle("设置")
        .navigationBarTitleDisplayMode(.inline)
        .improvSecondaryScreen()
    }

    private func setting(_ title: String, _ detail: String, _ value: Binding<Bool>) -> some View {
        Toggle(isOn: value) { VStack(alignment: .leading) { Text(title); Text(detail).font(.caption).foregroundStyle(.secondary) } }
    }

    private func status(_ title: String, detail: String, value: String) -> some View {
        HStack(alignment: .firstTextBaseline, spacing: 12) {
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                Text(detail).font(.caption).foregroundStyle(.secondary)
            }
            Spacer()
            Text(value).font(.subheadline).foregroundStyle(.secondary)
        }
        .accessibilityElement(children: .combine)
    }
}

struct HelpView: View { @EnvironmentObject private var store: AppStore; @State private var feedback = ""; @State private var contact = ""; @State private var isSubmitting = false; @State private var submitted = false
    var body: some View { Form { Section("使用说明") { Text("从备课确认方案后开课；现场工具均绑定当前场次；结束后收集反馈并完成复盘。") }; Section("常见问题") { Text("参与者如何进入？使用现场签到、反馈或互动二维码进入微信小程序。"); Text("弱网怎么办？保存失败时会明确提示，请保留当前页面并在网络恢复后重试。") }; Section("联系与反馈") { TextField("微信 / 手机号 / 邮箱（选填）", text: $contact); CountedTextEditor(placeholder: "描述你遇到的问题或建议", text: $feedback, limit: 500); Button(isSubmitting ? "提交中…" : "提交反馈") { Task { isSubmitting = true; if await store.submitSupportFeedback(content: feedback, contact: contact) { feedback = ""; submitted = true }; isSubmitting = false } }.disabled(isSubmitting || feedback.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty); if submitted { Text("反馈已提交，我们会尽快处理。") .font(.footnote).foregroundStyle(.green) } } }.navigationTitle("帮助与反馈").improvSecondaryScreen() }
}

struct AboutView: View { var body: some View { List { Section { Text("MasterTool").font(.headline); Text("培训师的备课、现场带课、反馈和复盘工具。") .foregroundStyle(.secondary) }; Section("法律") { NavigationLink { LegalView() } label: { Text("隐私政策与服务条款") } } }.navigationTitle("关于").improvSecondaryScreen() } }

struct LegalView: View {
    @EnvironmentObject private var store: AppStore
    @EnvironmentObject private var authentication: AuthenticationController
    @State private var dataExport: AccountDataExport?
    @State private var isWorking = false
    @State private var confirmDeletion = false

    var body: some View {
        List {
            Section("账户") {
                Button(isWorking ? "处理中…" : "生成数据导出") { Task { isWorking = true; dataExport = await store.exportAccountData(); isWorking = false } }.disabled(isWorking)
                if let dataExport { ShareLink(item: dataExport.downloadURL) { Label("分享或下载导出文件", systemImage: "square.and.arrow.up") }; Text("链接有效至 \(dataExport.expiresAt.formatted())").font(.caption).foregroundStyle(.secondary) }
                Button("删除账户与业务数据", role: .destructive) { confirmDeletion = true }.disabled(isWorking)
                Button("退出登录") { Task { await authentication.logout() } }
            }
            Section("隐私") {
                Link("隐私政策", destination: URL(string: "https://mastertool.example/privacy")!)
                Link("服务条款", destination: URL(string: "https://mastertool.example/terms")!)
                Text("正式发布前须将示例域名替换为已审核并稳定可访问的正式链接。")
                    .font(.footnote).foregroundStyle(.secondary)
            }
        }
        .navigationTitle("隐私与账户")
        .confirmationDialog("删除后无法恢复", isPresented: $confirmDeletion, titleVisibility: .visible) {
            Button("永久删除账户与业务数据", role: .destructive) { Task { isWorking = true; if await store.deleteAccount() { await authentication.logout() }; isWorking = false } }
            Button("取消", role: .cancel) {}
        } message: { Text("将删除方案、活动、场次、互动、反馈、复盘和账户资料。") }
        .improvSecondaryScreen()
    }
}
