import SwiftUI
#if canImport(ImprovToolCore)
import ImprovToolCore
#endif

@main
struct ImprovToolIOSApp: App {
    @StateObject private var store: AppStore
    @StateObject private var authentication: AuthenticationController

    init() {
        let services = AppRuntime.services()
        _store = StateObject(wrappedValue: AppStore(repository: services.repository))
        _authentication = StateObject(wrappedValue: services.authentication)
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(store)
                .environmentObject(authentication)
        }
    }
}

enum AppRuntime {
    struct Services {
        let repository: any TrainingRepository
        let authentication: AuthenticationController
    }

    @MainActor
    static func services() -> Services {
        let bundle = Bundle.main
        let endpoint = bundle.object(forInfoDictionaryKey: "IMPROV_IOS_API_ENDPOINT") as? String ?? ""
        if let url = URL(string: endpoint), url.scheme == "https" {
            let client = AuthAPIClient(endpoint: url, clientVersion: "1.0.0")
            let storage = KeychainAuthTokenStorage(service: bundle.bundleIdentifier ?? "com.mastertool.ios")
            let session = AuthSession(client: client, storage: storage)
            let repository = CloudBaseTrainingRepository(configuration: .init(endpoint: url, clientVersion: "1.0.0") {
                try await session.accessToken()
            })
            return Services(repository: repository, authentication: AuthenticationController(session: session))
        }
        #if DEBUG
        return Services(repository: MockTrainingRepository(), authentication: AuthenticationController(session: nil))
        #else
        return Services(
            repository: UnavailableTrainingRepository(message: "Release 必须配置 HTTPS CloudBase 网关"),
            authentication: AuthenticationController(session: nil, configurationError: AuthError.invalidConfiguration.localizedDescription)
        )
        #endif
    }
}

@MainActor
final class AuthenticationController: ObservableObject {
    @Published private(set) var isReady = false
    @Published private(set) var isAuthenticated = false
    @Published private(set) var isWorking = false
    @Published var errorMessage: String?
    @Published var statusMessage: String?
    let requiresAuthentication: Bool
    private let session: AuthSession?
    private let configurationError: String?

    init(session: AuthSession?, configurationError: String? = nil) {
        self.session = session
        self.configurationError = configurationError
        requiresAuthentication = session != nil || configurationError != nil
    }

    func restore() async {
        guard !isReady else { return }
        if let configurationError {
            errorMessage = configurationError
            isAuthenticated = false
        } else if let session {
            isAuthenticated = await session.isAuthenticated()
        } else {
            isAuthenticated = true
        }
        isReady = true
    }

    func login(email: String, password: String) async {
        await authenticate { try await $0.login(email: email, password: password) }
    }

    func register(email: String, password: String) async {
        await authenticate { try await $0.register(email: email, password: password) }
        if isAuthenticated { statusMessage = "账户已创建，验证邮件已发送。" }
    }

    func requestPasswordReset(email: String) async {
        guard let session else {
            errorMessage = configurationError ?? AuthError.invalidConfiguration.localizedDescription
            return
        }
        isWorking = true
        errorMessage = nil
        statusMessage = nil
        defer { isWorking = false }
        do {
            try await session.requestPasswordReset(email: email)
            statusMessage = "如果邮箱已注册，重置邮件将很快送达。"
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    func logout() async {
        await session?.logout()
        isAuthenticated = session == nil && configurationError == nil
    }

    private func authenticate(_ operation: (AuthSession) async throws -> Void) async {
        guard let session else {
            errorMessage = configurationError ?? AuthError.invalidConfiguration.localizedDescription
            return
        }
        isWorking = true
        errorMessage = nil
        statusMessage = nil
        defer { isWorking = false }
        do {
            try await operation(session)
            isAuthenticated = true
        } catch {
            isAuthenticated = false
            errorMessage = error.localizedDescription
        }
    }
}

@MainActor
final class AppStore: ObservableObject {
    @Published private(set) var plans = [TrainingPlan]()
    @Published private(set) var activities = [TrainingActivity]()
    @Published private(set) var overview = DataOverview()
    @Published private(set) var templates = [TrainingTemplate]()
    @Published var profile = TrainerProfile()
    @Published var activeSession: TrainingSession?
    @Published var records = [TrainingSession]()
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published private(set) var liveMutation: String?
    let repository: any TrainingRepository

    init(repository: any TrainingRepository) { self.repository = repository }

    func refresh() async {
        isLoading = true
        defer { isLoading = false }
        do {
            let dashboard = try await repository.loadDashboard()
            plans = dashboard.plans; activities = dashboard.activities; overview = dashboard.overview
            records = try await repository.loadRecords()
            profile = try await repository.loadProfile()
        } catch { errorMessage = error.localizedDescription }
    }

    func save(profile value: TrainerProfile) async -> Bool {
        do {
            profile = try await repository.saveProfile(value)
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func submitSupportFeedback(content: String, contact: String) async -> Bool {
        let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { errorMessage = "请输入反馈内容"; return false }
        do {
            try await repository.submitSupportFeedback(content: trimmed, contact: contact.trimmingCharacters(in: .whitespacesAndNewlines))
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func save(plan: TrainingPlan) async -> Bool {
        do {
            let saved = try await repository.savePlan(plan)
            if saved.id != plan.id { plans.removeAll { $0.id == plan.id } }
            upsert(saved)
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func save(activity: TrainingActivity) async -> TrainingActivity? {
        do {
            let saved = try await repository.saveActivity(activity)
            update(activity: saved)
            return saved
        } catch {
            errorMessage = error.localizedDescription
            return nil
        }
    }

    func delete(activity: TrainingActivity) async -> Bool {
        do {
            try await repository.deleteActivity(id: activity.id)
            activities.removeAll { $0.id == activity.id }
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    @discardableResult
    func start(plan: TrainingPlan) async -> Bool {
        do {
            activeSession = try await repository.startSession(planID: plan.id)
            await refresh()
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func plan(from template: TrainingTemplate) -> TrainingPlan {
        TrainingPlan(name: template.name, type: template.type, participantCount: 20, status: .draft, phases: template.phases)
    }

    func update(activity: TrainingActivity) {
        if let index = activities.firstIndex(where: { $0.id == activity.id }) {
            activities[index] = activity
        } else {
            activities.insert(activity, at: 0)
        }
    }

    var isLiveMutating: Bool { liveMutation != nil }

    func restoreLiveSession(sessionID: String) async -> Bool {
        guard beginLiveMutation("恢复现场") else { return false }
        defer { liveMutation = nil }
        do {
            activeSession = try await repository.loadLiveSession(sessionID: sessionID)
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func changePhase(to phaseIndex: Int) async -> Bool {
        guard var current = activeSession, current.plan.phases.indices.contains(phaseIndex), beginLiveMutation("保存环节") else { return false }
        let previous = current
        current.currentPhaseIndex = phaseIndex
        activeSession = current
        defer { liveMutation = nil }
        do {
            let savedIndex = try await repository.savePhase(sessionID: current.id, phaseIndex: phaseIndex)
            activeSession?.currentPhaseIndex = savedIndex
            return true
        } catch {
            activeSession = previous
            errorMessage = error.localizedDescription
            return false
        }
    }

    func refreshParticipants() async -> Bool {
        guard let sessionID = activeSession?.id, beginLiveMutation("加载签到") else { return false }
        defer { liveMutation = nil }
        do {
            activeSession?.participants = try await repository.loadParticipants(sessionID: sessionID)
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func manualCheckin(name: String) async -> Bool {
        let value = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { errorMessage = "请输入参与者姓名"; return false }
        guard let sessionID = activeSession?.id, !(activeSession?.participants.contains { $0.name.caseInsensitiveCompare(value) == .orderedSame } ?? false), beginLiveMutation("补录签到") else {
            if activeSession?.participants.contains(where: { $0.name.caseInsensitiveCompare(value) == .orderedSame }) == true { errorMessage = "该姓名已签到" }
            return false
        }
        defer { liveMutation = nil }
        do {
            let participant = try await repository.manualCheckin(sessionID: sessionID, name: value)
            activeSession?.participants.insert(participant, at: 0)
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func sessionEntry() async -> LiveEntryCode? {
        guard let sessionID = activeSession?.id, beginLiveMutation("生成签到入口") else { return nil }
        defer { liveMutation = nil }
        do { return try await repository.loadSessionEntry(sessionID: sessionID) }
        catch { errorMessage = error.localizedDescription; return nil }
    }

    func confirmGroups(_ state: LiveGroupState) async -> Bool {
        guard let sessionID = activeSession?.id, beginLiveMutation("保存分组") else { return false }
        let previous = activeSession
        activeSession?.groups = state.groups; activeSession?.teamCount = state.teamCount; activeSession?.groupMethod = state.groupMethod; activeSession?.isGrouped = state.isGrouped
        defer { liveMutation = nil }
        do {
            let saved = try await repository.saveGroups(sessionID: sessionID, state: state)
            activeSession?.groups = saved.groups; activeSession?.teamCount = saved.teamCount; activeSession?.groupMethod = saved.groupMethod; activeSession?.isGrouped = saved.isGrouped; activeSession?.scoreDetails = [:]
            return true
        } catch {
            activeSession = previous; errorMessage = error.localizedDescription; return false
        }
    }

    func updateScores(_ state: LiveScoreState) async -> Bool {
        guard let sessionID = activeSession?.id, beginLiveMutation("保存积分") else { return false }
        let previous = activeSession
        activeSession?.groups = state.groups; activeSession?.scoreMode = state.scoreMode; activeSession?.scoreDetails = state.scoreDetails
        defer { liveMutation = nil }
        do {
            let saved = try await repository.saveScores(sessionID: sessionID, state: state)
            activeSession?.groups = saved.groups; activeSession?.scoreMode = saved.scoreMode; activeSession?.scoreDetails = saved.scoreDetails
            return true
        } catch {
            activeSession = previous; errorMessage = error.localizedDescription; return false
        }
    }

    func updateRandom(_ state: LiveRandomState) async -> Bool {
        guard let sessionID = activeSession?.id, beginLiveMutation("保存随机结果") else { return false }
        let previous = activeSession?.randomState
        activeSession?.randomState = state
        defer { liveMutation = nil }
        do {
            activeSession?.randomState = try await repository.saveRandom(sessionID: sessionID, state: state)
            return true
        } catch {
            if let previous { activeSession?.randomState = previous }
            errorMessage = error.localizedDescription
            return false
        }
    }

    func createInteraction(_ draft: LiveInteractionDraft) async -> Bool {
        guard let sessionID = activeSession?.id, beginLiveMutation("创建互动") else { return false }
        defer { liveMutation = nil }
        do {
            let created = try await repository.createInteraction(sessionID: sessionID, draft: draft)
            activeSession?.interactions.removeAll { $0.id == created.id }
            activeSession?.interactions.insert(created, at: 0)
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func closeInteraction(_ interactionID: String) async -> Bool {
        guard let sessionID = activeSession?.id, beginLiveMutation("关闭互动") else { return false }
        defer { liveMutation = nil }
        do {
            try await repository.closeInteraction(sessionID: sessionID, interactionID: interactionID)
            if let index = activeSession?.interactions.firstIndex(where: { $0.id == interactionID }) { activeSession?.interactions[index].status = "closed" }
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func interactionStats(_ interactionID: String) async -> LiveInteractionStats? {
        guard let sessionID = activeSession?.id, beginLiveMutation("加载互动统计") else { return nil }
        defer { liveMutation = nil }
        do { return try await repository.loadInteractionStats(sessionID: sessionID, interactionID: interactionID) }
        catch { errorMessage = error.localizedDescription; return nil }
    }

    func reportInteractionSubmission(_ submissionID: String) async -> Bool {
        guard beginLiveMutation("举报内容") else { return false }
        defer { liveMutation = nil }
        do {
            try await repository.reportInteractionSubmission(submissionID: submissionID)
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func interactionEntry(_ interactionID: String) async -> LiveEntryCode? {
        guard let sessionID = activeSession?.id, beginLiveMutation("生成互动入口") else { return nil }
        defer { liveMutation = nil }
        do { return try await repository.loadInteractionEntry(sessionID: sessionID, interactionID: interactionID) }
        catch { errorMessage = error.localizedDescription; return nil }
    }

    func saveLiveNote(content: String) async -> Bool {
        let value = content.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !value.isEmpty else { errorMessage = "请输入笔记"; return false }
        guard let session = activeSession, beginLiveMutation("保存笔记") else { return false }
        defer { liveMutation = nil }
        do {
            let note = try await repository.saveNote(sessionID: session.id, phaseName: session.currentPhase.name, content: value)
            activeSession?.notes.insert(note, at: 0)
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func abandonActiveSession() async -> Bool {
        guard let sessionID = activeSession?.id, beginLiveMutation("退出现场") else { return false }
        defer { liveMutation = nil }
        do {
            try await repository.abandonSession(sessionID: sessionID)
            activeSession = nil
            await refresh()
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func finishActiveSession() async -> Bool {
        guard let sessionID = activeSession?.id, beginLiveMutation("结束培训") else { return false }
        defer { liveMutation = nil }
        do {
            try await repository.endSession(sessionID: sessionID)
            activeSession?.status = .ended
            await refresh()
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func saveReview(sessionID: String, framework: String, content: String) async -> Bool {
        do {
            try await repository.saveReview(sessionID: sessionID, framework: framework, content: content)
            await refresh()
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func exportAccountData() async -> AccountDataExport? {
        do { return try await repository.exportAccountData() }
        catch { errorMessage = error.localizedDescription; return nil }
    }

    func deleteAccount() async -> Bool {
        do {
            try await repository.deleteAccount()
            plans = []; activities = []; records = []; activeSession = nil; overview = DataOverview(); profile = TrainerProfile(displayName: "培训师")
            return true
        } catch {
            errorMessage = error.localizedDescription
            return false
        }
    }

    func clearError() { errorMessage = nil }

    private func beginLiveMutation(_ name: String) -> Bool {
        guard liveMutation == nil else { errorMessage = "正在\(liveMutation ?? "处理现场操作")，请稍候"; return false }
        errorMessage = nil
        liveMutation = name
        return true
    }

    private func upsert(_ plan: TrainingPlan) { if let index = plans.firstIndex(where: { $0.id == plan.id }) { plans[index] = plan } else { plans.insert(plan, at: 0) } }
}
