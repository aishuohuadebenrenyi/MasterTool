import SwiftUI
#if canImport(ImprovToolCore)
import ImprovToolCore
#endif

enum AppTab: String, CaseIterable, Identifiable { case home, prepare, mine; var id: String { rawValue }
    var title: String { switch self { case .home: return "首页"; case .prepare: return "备课"; case .mine: return "我的" } }
    var symbol: String { switch self { case .home: return "house"; case .prepare: return "square.and.pencil"; case .mine: return "person" } }
}

struct RootView: View {
    @EnvironmentObject private var authentication: AuthenticationController

    var body: some View {
        Group {
            if !authentication.isReady {
                ProgressView("正在恢复登录状态")
            } else if authentication.requiresAuthentication && !authentication.isAuthenticated {
                LoginView()
            } else {
                AuthenticatedRootView()
            }
        }
        .task { await authentication.restore() }
    }
}

private struct AuthenticatedRootView: View {
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @EnvironmentObject private var store: AppStore
    @State private var selection: AppTab = .home
    @State private var prepareEntry = PrepareEntry()
    @State private var showingLiveSession = false
    var body: some View {
        Group {
            if horizontalSizeClass == .regular {
                NavigationSplitView { List { ForEach(AppTab.allCases) { tab in Button { selection = tab } label: { Label(tab.title, systemImage: tab.symbol) }.foregroundStyle(selection == tab ? ImprovStyle.blue : .primary) } }.navigationTitle("MasterTool") } detail: { tabContent(selection).id(selection) }
            } else {
                TabView(selection: $selection) { ForEach(AppTab.allCases) { tab in tabContent(tab).tabItem { Label(tab.title, systemImage: tab.symbol) }.tag(tab) } }
            }
        }
        .tint(ImprovStyle.brand)
        .task { await store.refresh() }
        .onChange(of: store.activeSession?.id) { sessionID in if sessionID != nil { showingLiveSession = true } }
        .fullScreenCover(isPresented: $showingLiveSession) { LiveView() }
        .alert("操作未完成", isPresented: Binding(get: { store.errorMessage != nil }, set: { if !$0 { store.errorMessage = nil } })) { Button("知道了", role: .cancel) {} } message: { Text(store.errorMessage ?? "") }
    }
    @ViewBuilder private func tabContent(_ tab: AppTab) -> some View {
        switch tab {
        case .home:
            HomeView(
                onOpenPrepare: { entry in prepareEntry = entry.resolved(using: store.plans); selection = .prepare },
                onResumeLive: { showingLiveSession = true }
            )
        case .prepare:
            PrepareView(entry: $prepareEntry, onStartLive: { showingLiveSession = true })
        case .mine:
            MineView()
        }
    }
}

private struct LoginView: View {
    @EnvironmentObject private var authentication: AuthenticationController
    @State private var email = ""
    @State private var password = ""
    @State private var isRegistering = false

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    TextField("邮箱", text: $email)
                        .textInputAutocapitalization(.never)
                        .keyboardType(.emailAddress)
                        .textContentType(.username)
                    SecureField("密码（至少 8 位）", text: $password)
                        .textContentType(isRegistering ? .newPassword : .password)
                } header: {
                    Text(isRegistering ? "创建培训师账户" : "登录 MasterTool")
                }
                if let message = authentication.errorMessage {
                    Section { Text(message).foregroundStyle(.red).accessibilityLabel("错误：\(message)") }
                }
                if let message = authentication.statusMessage {
                    Section { Text(message).foregroundStyle(.green) }
                }
                Section {
                    Button(isRegistering ? "注册并登录" : "登录") {
                        Task {
                            if isRegistering { await authentication.register(email: email, password: password) }
                            else { await authentication.login(email: email, password: password) }
                        }
                    }
                    .disabled(authentication.isWorking || email.isEmpty || password.count < 8)
                    Button(isRegistering ? "已有账户，返回登录" : "没有账户，立即注册") { isRegistering.toggle() }
                        .disabled(authentication.isWorking)
                    if !isRegistering {
                        Button("忘记密码") { Task { await authentication.requestPasswordReset(email: email) } }
                            .disabled(authentication.isWorking || !email.contains("@"))
                    }
                }
            }
            .navigationTitle("MasterTool")
            .overlay { if authentication.isWorking { ProgressView().controlSize(.large) } }
        }
    }
}
