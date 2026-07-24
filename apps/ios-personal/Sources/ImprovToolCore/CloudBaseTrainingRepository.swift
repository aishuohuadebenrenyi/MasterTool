import Foundation

public struct CloudBaseConfiguration: Sendable {
    public let endpoint: URL
    public let clientVersion: String
    private let tokenProvider: @Sendable () async throws -> String

    public init(endpoint: URL, accessToken: String, clientVersion: String) {
        self.endpoint = endpoint
        self.clientVersion = clientVersion
        tokenProvider = { accessToken }
    }

    public init(endpoint: URL, clientVersion: String, tokenProvider: @escaping @Sendable () async throws -> String) {
        self.endpoint = endpoint
        self.clientVersion = clientVersion
        self.tokenProvider = tokenProvider
    }

    func accessToken() async throws -> String { try await tokenProvider() }
}

public actor CloudBaseTrainingRepository: TrainingRepository {
    private let configuration: CloudBaseConfiguration
    private let session: URLSession

    public init(configuration: CloudBaseConfiguration, session: URLSession = .shared) {
        self.configuration = configuration; self.session = session
    }

    public func loadDashboard() async throws -> (plans: [TrainingPlan], activities: [TrainingActivity], overview: DataOverview) {
        async let plans: PlanListDTO = call(action: "trainer.listPlans", payload: EmptyPayload())
        async let activities: ActivityListDTO = call(action: "trainer.listActivities", payload: EmptyPayload())
        async let overview: DataOverviewDTO = call(action: "trainer.getDataOverview", payload: EmptyPayload())
        let data = try await (plans, activities, overview)
        return (
            try data.0.plans.map { try $0.domain() },
            data.1.activities,
            DataOverview(totalSessions: data.2.totalSessions, totalParticipants: data.2.totalParticipants, satisfaction: data.2.satisfaction, pendingReviews: data.2.pendingReviews)
        )
    }

    public func loadProfile() async throws -> TrainerProfile {
        let response: ProfileResponseDTO = try await call(action: "trainer.getProfile", payload: EmptyPayload())
        return TrainerProfile(displayName: response.profile?.displayName ?? "培训师", organization: response.profile?.organization ?? "")
    }

    public func saveProfile(_ profile: TrainerProfile) async throws -> TrainerProfile {
        let _: ProfileSaveResultDTO = try await call(action: "trainer.updateProfile", payload: ProfileSavePayload(displayName: profile.displayName, organization: profile.organization))
        return try await loadProfile()
    }

    public func submitSupportFeedback(content: String, contact: String) async throws {
        let _: SupportFeedbackResultDTO = try await call(action: "trainer.saveSupportFeedback", payload: SupportFeedbackPayload(content: content, contact: contact))
    }

    public func savePlan(_ plan: TrainingPlan) async throws -> TrainingPlan {
        let action = plan.status == .confirmed ? "trainer.confirmPlan" : "trainer.savePlanDraft"
        let result: PlanSaveResultDTO = try await call(action: action, payload: PlanSavePayload(plan))
        var saved = plan
        saved.id = result.planId
        saved.status = PlanStatus(rawValue: result.status ?? "") ?? plan.status
        saved.updatedAt = .now
        return saved
    }

    public func saveActivity(_ activity: TrainingActivity) async throws -> TrainingActivity {
        let result: ActivitySaveResultDTO = try await call(action: "trainer.saveActivity", payload: ActivitySavePayload(activity))
        let detail: ActivityDetailDTO = try await call(action: "trainer.getActivityDetail", payload: IdentifierPayload(key: "_id", value: result.activityId))
        return detail.activity
    }

    public func deleteActivity(id: String) async throws {
        let _: ActivitySaveResultDTO = try await call(action: "trainer.deleteActivity", payload: IdentifierPayload(key: "_id", value: id))
    }

    public func startSession(planID: String) async throws -> TrainingSession {
        let started: StartSessionDTO = try await call(action: "live.startSession", payload: SessionIdentifierPayload(planID: planID))
        return try await loadLiveSession(sessionID: started.sessionId)
    }

    public func loadLiveSession(sessionID: String) async throws -> TrainingSession {
        let detail: SessionDetailDTO = try await call(action: "live.getSessionDetail", payload: SessionIdentifierPayload(sessionID: sessionID))
        async let participants = loadParticipants(sessionID: sessionID)
        async let interactions = loadInteractions(sessionID: sessionID)
        async let notes = loadNotes(sessionID: sessionID)
        var result = try detail.session.domain()
        result.participants = try await participants
        result.interactions = try await interactions
        result.notes = try await notes
        return result
    }

    public func loadParticipants(sessionID: String) async throws -> [Participant] {
        let response: ParticipantListDTO = try await call(action: "live.listParticipants", payload: SessionIdentifierPayload(sessionID: sessionID))
        return response.participants.map { $0.domain() }
    }

    public func manualCheckin(sessionID: String, name: String) async throws -> Participant {
        let response: CheckinResultDTO = try await call(action: "live.manualCheckin", payload: CheckinPayload(sessionId: sessionID, name: name))
        return Participant(id: response.participantId, name: name, checkedInAt: .now)
    }

    public func loadSessionEntry(sessionID: String) async throws -> LiveEntryCode {
        let response: EntryCodeDTO = try await call(action: "live.getSessionEntryCode", payload: SessionEntryPayload(sessionId: sessionID))
        return response.domain()
    }

    public func savePhase(sessionID: String, phaseIndex: Int) async throws -> Int {
        let response: PhaseStateDTO = try await call(action: "live.savePhaseState", payload: PhaseStatePayload(sessionId: sessionID, currentPhaseIndex: phaseIndex))
        return response.currentPhaseIndex
    }

    public func saveGroups(sessionID: String, state: LiveGroupState) async throws -> LiveGroupState {
        let response: GroupStateDTO = try await call(action: "live.saveGroupState", payload: GroupStatePayload(sessionID: sessionID, state: state))
        return response.domain()
    }

    public func saveScores(sessionID: String, state: LiveScoreState) async throws -> LiveScoreState {
        let response: ScoreStateDTO = try await call(action: "live.saveScoreState", payload: ScoreStatePayload(sessionID: sessionID, state: state))
        return response.domain()
    }

    public func saveRandom(sessionID: String, state: LiveRandomState) async throws -> LiveRandomState {
        let response: RandomStateResponseDTO = try await call(action: "live.saveRandomState", payload: RandomStatePayload(sessionID: sessionID, state: state))
        return response.randomState.domain()
    }

    public func loadInteractions(sessionID: String) async throws -> [LiveInteraction] {
        let response: InteractionListDTO = try await call(action: "live.listInteractions", payload: SessionIdentifierPayload(sessionID: sessionID))
        return response.interactions.map { $0.domain() }
    }

    public func createInteraction(sessionID: String, draft: LiveInteractionDraft) async throws -> LiveInteraction {
        let response: InteractionIdentifierDTO = try await call(action: "live.createInteraction", payload: InteractionCreatePayload(sessionID: sessionID, draft: draft))
        let interactions = try await loadInteractions(sessionID: sessionID)
        guard let created = interactions.first(where: { $0.id == response.interactionId }) else {
            throw TrainingError.server("互动已创建，但未能加载详情")
        }
        return created
    }

    public func closeInteraction(sessionID: String, interactionID: String) async throws {
        let _: InteractionIdentifierDTO = try await call(action: "live.closeInteraction", payload: InteractionIdentifierPayload(interactionId: interactionID))
    }

    public func loadInteractionStats(sessionID: String, interactionID: String) async throws -> LiveInteractionStats {
        let response: InteractionStatsDTO = try await call(action: "live.getInteractionStats", payload: InteractionIdentifierPayload(interactionId: interactionID))
        return response.domain()
    }

    public func reportInteractionSubmission(submissionID: String) async throws {
        let _: ModerationResultDTO = try await call(action: "live.reportInteractionSubmission", payload: SubmissionReportPayload(submissionId: submissionID, reason: "objectionable"))
    }

    public func loadInteractionEntry(sessionID: String, interactionID: String) async throws -> LiveEntryCode {
        let response: EntryCodeDTO = try await call(action: "live.getInteractionEntryCode", payload: InteractionEntryPayload(interactionId: interactionID))
        return response.domain()
    }

    public func loadNotes(sessionID: String) async throws -> [LiveNote] {
        let response: NoteListDTO = try await call(action: "live.listNotes", payload: SessionIdentifierPayload(sessionID: sessionID))
        return response.notes.map { $0.domain() }
    }

    public func saveNote(sessionID: String, phaseName: String, content: String) async throws -> LiveNote {
        let response: NoteSaveResultDTO = try await call(action: "live.saveNote", payload: NoteSavePayload(sessionId: sessionID, phaseName: phaseName, content: content))
        return LiveNote(id: response.noteId, phaseName: phaseName, content: content, createdAt: Date(milliseconds: response.createdAt))
    }

    public func abandonSession(sessionID: String) async throws {
        let _: SessionTransitionResultDTO = try await call(action: "live.abandonSession", payload: SessionIdentifierPayload(sessionID: sessionID))
    }

    public func endSession(sessionID: String) async throws {
        let _: SessionTransitionResultDTO = try await call(action: "live.endSession", payload: SessionIdentifierPayload(sessionID: sessionID))
    }

    public func loadRecords() async throws -> [TrainingSession] {
        let response: RecordListDTO = try await call(action: "trainer.listTrainingRecords", payload: EmptyPayload())
        return response.records.map { $0.domain() }
    }

    public func saveReview(sessionID: String, framework: String, content: String) async throws {
        let _: ReviewSaveResultDTO = try await call(action: "review.saveReview", payload: ReviewSavePayload(sessionId: sessionID, framework: framework, content: content))
    }

    public func exportAccountData() async throws -> AccountDataExport {
        let response: AccountExportDTO = try await call(action: "auth.exportAccountData", payload: EmptyPayload())
        guard let url = URL(string: response.downloadURL) else { throw TrainingError.server("导出地址无效") }
        return AccountDataExport(downloadURL: url, expiresAt: Date(milliseconds: response.expiresAt))
    }

    public func deleteAccount() async throws {
        let _: AccountDeleteDTO = try await call(action: "auth.deleteAccount", payload: AccountDeletePayload(confirmation: "DELETE"))
    }

    private func call<Payload: Encodable, Value: Decodable>(action: String, payload: Payload) async throws -> Value {
        var request = URLRequest(url: configuration.endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(try await configuration.accessToken())", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder.improv.encode(IOSRequestBody(action: action, requestId: UUID().uuidString, clientVersion: configuration.clientVersion, payload: payload))
        do {
            let (body, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else { throw TrainingError.networkUnavailable }
            let envelope = try JSONDecoder.improv.decode(IOSEnvelope<Value>.self, from: body)
            guard envelope.code == 0 else { throw TrainingError.server(envelope.message) }
            guard (200...299).contains(http.statusCode), let value = envelope.data else { throw TrainingError.networkUnavailable }
            return value
        } catch let error as TrainingError {
            throw error
        } catch is DecodingError {
            throw TrainingError.server("服务数据格式不兼容（\(action)）")
        } catch {
            throw TrainingError.networkUnavailable
        }
    }
}

private struct IOSRequestBody<T: Encodable>: Encodable { let action: String; let requestId: String; let clientVersion: String; let payload: T }
private struct IOSEnvelope<T: Decodable>: Decodable { let code: Int; let message: String; let data: T? }
private struct EmptyPayload: Encodable {}
private struct ProfileSavePayload: Encodable { let displayName: String; let organization: String }
private struct SupportFeedbackPayload: Encodable { let content: String; let contact: String }
private struct ReviewSavePayload: Encodable { let sessionId: String; let framework: String; let content: String }
private struct AccountDeletePayload: Encodable { let confirmation: String }

private struct IdentifierPayload: Encodable {
    let key: String
    let value: String
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: DynamicCodingKey.self)
        try container.encode(value, forKey: DynamicCodingKey(stringValue: key)!)
    }
}
private struct DynamicCodingKey: CodingKey {
    let stringValue: String
    let intValue: Int? = nil
    init?(stringValue: String) { self.stringValue = stringValue }
    init?(intValue: Int) { return nil }
}

private struct SessionIdentifierPayload: Encodable {
    let sessionId: String?
    let planId: String?
    init(sessionID: String) { sessionId = sessionID; planId = nil }
    init(planID: String) { sessionId = nil; planId = planID }
}
private struct SessionEntryPayload: Encodable { let sessionId: String; let entryType = "checkin" }
private struct InteractionEntryPayload: Encodable { let interactionId: String }
private struct InteractionIdentifierPayload: Encodable { let interactionId: String }
private struct SubmissionReportPayload: Encodable { let submissionId: String; let reason: String }
private struct CheckinPayload: Encodable { let sessionId: String; let name: String }
private struct PhaseStatePayload: Encodable { let sessionId: String; let currentPhaseIndex: Int }
private struct NoteSavePayload: Encodable { let sessionId: String; let phaseName: String; let content: String }

private struct GroupPayload: Encodable {
    let groupId: String; let name: String; let color: String; let score: Int; let members: [String]
    init(_ group: TrainingGroup) { groupId = group.id; name = group.name; color = group.color; score = group.score; members = group.members }
}
private struct GroupStatePayload: Encodable {
    let sessionId: String; let teamCount: Int; let groupMethod: String; let groups: [GroupPayload]; let isGrouped: Bool
    init(sessionID: String, state: LiveGroupState) {
        sessionId = sessionID; teamCount = state.teamCount; groupMethod = state.groupMethod; groups = state.groups.map(GroupPayload.init); isGrouped = state.isGrouped
    }
}
private struct ScoreEntryPayload: Encodable { let delta: Int; let reason: String; let createdAt: Int64 }
private struct ScoreStatePayload: Encodable {
    let sessionId: String; let groups: [GroupPayload]; let scoreMode: String; let scoreDetails: [String: [ScoreEntryPayload]]
    init(sessionID: String, state: LiveScoreState) {
        sessionId = sessionID; groups = state.groups.map(GroupPayload.init); scoreMode = state.scoreMode
        scoreDetails = state.scoreDetails.mapValues { items in items.map { ScoreEntryPayload(delta: $0.delta, reason: $0.reason, createdAt: $0.createdAt.milliseconds) } }
    }
}
private struct RandomPickPayload: Encodable { let id: String; let name: String; let type: String; let pickedAt: Int64 }
private struct RandomStatePayload: Encodable {
    let sessionId: String; let randomTab: String; let allowRepeatPick: Bool; let pickedIds: [String]; let pickedName: String; let pickedParticipantId: String; let pickHistory: [RandomPickPayload]
    init(sessionID: String, state: LiveRandomState) {
        sessionId = sessionID; randomTab = state.randomTab; allowRepeatPick = state.allowRepeatPick; pickedIds = state.pickedIDs; pickedName = state.pickedName; pickedParticipantId = state.pickedParticipantID
        pickHistory = state.pickHistory.map { RandomPickPayload(id: $0.id, name: $0.name, type: $0.type, pickedAt: $0.pickedAt.milliseconds) }
    }
}
private struct InteractionCreatePayload: Encodable {
    let sessionId: String; let title: String; let type: String; let options: [String]
    init(sessionID: String, draft: LiveInteractionDraft) { sessionId = sessionID; title = draft.title; type = draft.type; options = draft.options }
}

private struct StartSessionDTO: Decodable { let sessionId: String }
private struct SessionDetailDTO: Decodable { let session: LiveSessionDTO }
private struct CheckinResultDTO: Decodable { let participantId: String }
private struct PhaseStateDTO: Decodable { let currentPhaseIndex: Int }
private struct InteractionIdentifierDTO: Decodable { let interactionId: String }
private struct SessionTransitionResultDTO: Decodable { let sessionId: String; let planId: String }
private struct NoteSaveResultDTO: Decodable { let noteId: String; let createdAt: Int64 }
private struct DataOverviewDTO: Decodable { let totalSessions: Int; let totalParticipants: Int; let satisfaction: String; let pendingReviews: Int }
private struct ProfileDTO: Decodable { let displayName: String?; let organization: String? }
private struct ProfileResponseDTO: Decodable { let profile: ProfileDTO? }
private struct ProfileSaveResultDTO: Decodable { let profileId: String }
private struct SupportFeedbackResultDTO: Decodable { let feedbackId: String }
private struct ReviewSaveResultDTO: Decodable { let reviewId: String }
private struct AccountExportDTO: Decodable { let downloadURL: String; let expiresAt: Int64 }
private struct AccountDeleteDTO: Decodable { let deleted: Bool }
private struct ActivityListDTO: Decodable { let activities: [TrainingActivity] }
private struct ActivityDetailDTO: Decodable { let activity: TrainingActivity }
private struct ActivitySaveResultDTO: Decodable { let activityId: String }
private struct PlanSaveResultDTO: Decodable { let planId: String; let status: String? }
private struct PlanListDTO: Decodable { let plans: [PlanDTO] }

private struct PhaseActivityDTO: Decodable {
    let activityId: String?; let name: String?; let category: String?; let durationMinutes: Int?
    func domain() -> PhaseActivity { PhaseActivity(id: activityId ?? UUID().uuidString, name: name ?? "活动", category: category ?? "活动", durationMinutes: durationMinutes ?? 0) }
}
private struct PhaseDTO: Decodable {
    let id: String?; let name: String?; let duration: Int?; let minutes: Int?; let durationMinutes: Int?; let reminders: [String]?; let activityNames: [String]?; let activities: [PhaseActivityDTO]?
    func domain() -> SessionPhase {
        let mappedActivities = (activities ?? []).map { $0.domain() }
        return SessionPhase(id: id ?? UUID().uuidString, name: name ?? "未命名环节", durationMinutes: duration ?? minutes ?? durationMinutes ?? 0, reminders: reminders ?? [], activityNames: activityNames ?? mappedActivities.map(\.name), activities: mappedActivities)
    }
}
private struct PlanDTO: Decodable {
    let _id: String?; let planId: String?; let name: String?; let type: String?; let customerName: String?; let participantCount: Int?; let status: String?; let phases: [PhaseDTO]?; let updatedAt: Int64?; let confirmedAt: Int64?
    func domain(status overrideStatus: SessionStatus? = nil) throws -> TrainingPlan {
        let mappedPhases = (phases ?? []).map { $0.domain() }
        guard !mappedPhases.isEmpty else { throw TrainingError.server("方案快照缺少环节") }
        let planStatus: PlanStatus
        if let overrideStatus { planStatus = overrideStatus == .running ? .confirmed : (overrideStatus == .reviewed ? .reviewed : .delivered) }
        else { planStatus = PlanStatus(rawValue: status ?? "") ?? .draft }
        return TrainingPlan(id: _id ?? planId ?? UUID().uuidString, name: name ?? "未命名培训", type: type ?? "企业培训", customerName: customerName ?? "", participantCount: participantCount ?? 0, status: planStatus, phases: mappedPhases, updatedAt: Date(milliseconds: updatedAt ?? confirmedAt ?? 0))
    }
}

private struct ParticipantDTO: Decodable {
    let _id: String?; let name: String?; let checkedInAt: Int64?
    func domain() -> Participant { Participant(id: _id ?? UUID().uuidString, name: name ?? "未命名参与者", checkedInAt: checkedInAt.map(Date.init(milliseconds:))) }
}
private struct ParticipantListDTO: Decodable { let participants: [ParticipantDTO] }

private struct GroupDTO: Decodable {
    let groupId: String?; let name: String?; let color: String?; let score: Int?; let members: [String]?
    func domain() -> TrainingGroup { TrainingGroup(id: groupId ?? UUID().uuidString, name: name ?? "未命名组", color: color ?? "#4A7CF7", members: members ?? [], score: score ?? 0) }
}
private struct ScoreEntryDTO: Decodable {
    let delta: Int?; let reason: String?; let createdAt: Int64?
    func domain(groupID: String) -> ScoreEntry { ScoreEntry(groupID: groupID, delta: delta ?? 0, reason: reason ?? "现场积分", createdAt: Date(milliseconds: createdAt ?? 0)) }
}
private struct GroupStateDTO: Decodable {
    let teamCount: Int; let groupMethod: String; let groups: [GroupDTO]; let isGrouped: Bool
    func domain() -> LiveGroupState { LiveGroupState(teamCount: teamCount, groupMethod: groupMethod, groups: groups.map { $0.domain() }, isGrouped: isGrouped) }
}
private struct ScoreStateDTO: Decodable {
    let groups: [GroupDTO]; let scoreMode: String; let scoreDetails: [String: [ScoreEntryDTO]]
    func domain() -> LiveScoreState { LiveScoreState(groups: groups.map { $0.domain() }, scoreMode: scoreMode, scoreDetails: scoreDetails.mapValuesWithKey { key, value in value.map { $0.domain(groupID: key) } }) }
}
private struct RandomPickDTO: Decodable {
    let id: String?; let name: String?; let type: String?; let pickedAt: Int64?
    func domain() -> RandomPickRecord { RandomPickRecord(id: id ?? UUID().uuidString, name: name ?? "", type: type ?? "participant", pickedAt: Date(milliseconds: pickedAt ?? 0)) }
}
private struct RandomStateDTO: Decodable {
    let randomTab: String?; let allowRepeatPick: Bool?; let pickedIds: [String]?; let pickedName: String?; let pickedParticipantId: String?; let pickHistory: [RandomPickDTO]?
    func domain() -> LiveRandomState { LiveRandomState(randomTab: randomTab ?? "actor", allowRepeatPick: allowRepeatPick ?? false, pickedIDs: pickedIds ?? [], pickedName: pickedName ?? "", pickedParticipantID: pickedParticipantId ?? "", pickHistory: (pickHistory ?? []).map { $0.domain() }) }
}
private struct RandomStateResponseDTO: Decodable { let randomState: RandomStateDTO }

private struct InteractionDTO: Decodable {
    let _id: String?; let title: String?; let type: String?; let status: String?; let options: [String]?; let createdAt: Int64?
    func domain() -> LiveInteraction { LiveInteraction(id: _id ?? UUID().uuidString, title: title ?? "现场互动", type: type ?? "wordcloud", status: status ?? "open", options: options ?? [], createdAt: createdAt.map(Date.init(milliseconds:))) }
}
private struct InteractionListDTO: Decodable { let interactions: [InteractionDTO] }
private struct LiveOptionStatDTO: Decodable { let label: String; let count: Int }
private struct LiveWordStatDTO: Decodable { let text: String; let count: Int }
private struct PromiseSubmissionDTO: Decodable { let id: String; let content: String }
private struct InteractionStatsDTO: Decodable {
    let count: Int; let optionStats: [LiveOptionStatDTO]; let words: [LiveWordStatDTO]; let submissions: [PromiseSubmissionDTO]
    func domain() -> LiveInteractionStats { LiveInteractionStats(count: count, optionStats: optionStats.map { LiveOptionStat(label: $0.label, count: $0.count) }, words: words.map { LiveWordStat(text: $0.text, count: $0.count) }, submissions: submissions.map { LiveSubmission(id: $0.id, content: $0.content) }) }
}
private struct ModerationResultDTO: Decodable { let submissionId: String; let hidden: Bool; let blocked: Bool }

private struct NoteDTO: Decodable {
    let _id: String?; let id: String?; let phaseName: String?; let content: String?; let createdAt: Int64?
    func domain() -> LiveNote { LiveNote(id: _id ?? id ?? UUID().uuidString, phaseName: phaseName ?? "", content: content ?? "", createdAt: Date(milliseconds: createdAt ?? 0)) }
}
private struct NoteListDTO: Decodable { let notes: [NoteDTO] }
private struct EntryCodeDTO: Decodable {
    let tempFileURL: String?; let path: String?; let urlLink: String?; let scene: String?
    func domain() -> LiveEntryCode { LiveEntryCode(imageURL: tempFileURL.flatMap(URL.init(string:)), path: path ?? "", urlLink: urlLink.flatMap(URL.init(string:)), scene: scene ?? "") }
}

private struct LiveSessionDTO: Decodable {
    let _id: String?; let planId: String?; let planSnapshot: PlanDTO?; let status: String?; let currentPhaseIndex: Int?; let groups: [GroupDTO]?; let isGrouped: Bool?; let teamCount: Int?; let groupMethod: String?; let scoreMode: String?; let scoreDetails: [String: [ScoreEntryDTO]]?; let randomState: RandomStateDTO?; let allowRepeatPick: Bool?; let startedAt: Int64?
    func domain() throws -> TrainingSession {
        let sessionStatus = SessionStatus(rawValue: status ?? "") ?? .running
        let plan = try planSnapshot?.domain(status: sessionStatus) ?? { throw TrainingError.server("场次缺少方案快照") }()
        let groupValues = (groups ?? []).map { $0.domain() }
        let scoreValues = (scoreDetails ?? [:]).mapValuesWithKey { key, value in value.map { $0.domain(groupID: key) } }
        var random = randomState?.domain() ?? LiveRandomState(allowRepeatPick: allowRepeatPick ?? false)
        random.allowRepeatPick = randomState?.allowRepeatPick ?? allowRepeatPick ?? false
        return TrainingSession(id: _id ?? UUID().uuidString, plan: plan, status: sessionStatus, currentPhaseIndex: min(max(currentPhaseIndex ?? 0, 0), plan.phases.count - 1), groups: groupValues, isGrouped: isGrouped ?? !groupValues.isEmpty, teamCount: teamCount ?? max(groupValues.count, 2), groupMethod: groupMethod ?? "average", scoreMode: scoreMode ?? "simple", scoreDetails: scoreValues, randomState: random, startedAt: Date(milliseconds: startedAt ?? 0))
    }
}

private struct RecordListDTO: Decodable { let records: [RecordDTO] }
private struct RecordDTO: Decodable {
    let _id: String; let name: String; let category: String; let participants: Int; let status: String
    func domain() -> TrainingSession {
        let sessionStatus: SessionStatus = status == "已复盘" ? .reviewed : .ended
        let plan = TrainingPlan(id: "record-plan-\(_id)", name: name, type: category, participantCount: participants, status: sessionStatus == .reviewed ? .reviewed : .delivered, phases: [SessionPhase(name: "已完成", durationMinutes: 0)])
        return TrainingSession(id: _id, plan: plan, status: sessionStatus)
    }
}

struct ActivitySavePayload: Encodable {
    let _id: String; let name: String; let scenes: [String]; let difficulty: String; let peopleRange: String; let durationMinutes: Int; let objective: String; let rules: String; let reviewQuestions: String; let leaderTips: String
    init(_ activity: TrainingActivity) {
        _id = activity.id; name = activity.name; scenes = activity.scenes; difficulty = activity.difficulty; peopleRange = activity.peopleRange; durationMinutes = activity.durationMinutes; objective = activity.objective; rules = activity.rules; reviewQuestions = activity.reviewQuestions; leaderTips = activity.leaderTips
    }
}
private struct PlanActivitySavePayload: Encodable {
    let activityId: String
    let name: String
    let category: String
    let durationMinutes: Int

    init(_ activity: PhaseActivity) {
        activityId = activity.id
        name = activity.name
        category = activity.category
        durationMinutes = activity.durationMinutes
    }
}
private struct PlanPhaseSavePayload: Encodable {
    let id: String
    let name: String
    let minutes: Int
    let reminders: [String]
    let activityNames: [String]
    let activities: [PlanActivitySavePayload]

    init(_ phase: SessionPhase) {
        id = phase.id
        name = phase.name
        minutes = phase.durationMinutes
        reminders = phase.reminders
        activityNames = phase.activityNames
        activities = phase.activities.map(PlanActivitySavePayload.init)
    }
}
struct PlanSavePayload: Encodable {
    let id: String?
    let name: String
    let type: String
    let customerName: String
    let participantCount: Int
    fileprivate let phases: [PlanPhaseSavePayload]

    private enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, type, customerName, participantCount, phases
    }

    init(_ plan: TrainingPlan) {
        id = UUID(uuidString: plan.id) == nil ? plan.id : nil
        name = plan.name
        type = plan.type
        customerName = plan.customerName
        participantCount = plan.participantCount
        phases = plan.phases.map(PlanPhaseSavePayload.init)
    }
}

private extension Dictionary {
    func mapValuesWithKey<T>(_ transform: (Key, Value) -> T) -> [Key: T] {
        Dictionary<Key, T>(uniqueKeysWithValues: map { ($0.key, transform($0.key, $0.value)) })
    }
}
private extension Date {
    init(milliseconds: Int64) { self = milliseconds > 0 ? Date(timeIntervalSince1970: Double(milliseconds) / 1000) : .now }
    var milliseconds: Int64 { Int64(timeIntervalSince1970 * 1000) }
}
private extension JSONEncoder { static let improv: JSONEncoder = JSONEncoder() }
private extension JSONDecoder { static let improv: JSONDecoder = JSONDecoder() }
