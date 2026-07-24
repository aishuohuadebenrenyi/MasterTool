import Foundation

public enum PlanStatus: String, Codable, CaseIterable, Hashable, Sendable {
    case draft, confirmed, delivered, reviewed

    public var title: String {
        switch self {
        case .draft: return "草稿"
        case .confirmed: return "已确认"
        case .delivered: return "已交付"
        case .reviewed: return "已复盘"
        }
    }
}

public struct SessionPhase: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var name: String
    public var durationMinutes: Int
    public var reminders: [String]
    public var activityNames: [String]
    public var activities: [PhaseActivity]

    public init(id: String = UUID().uuidString, name: String, durationMinutes: Int, reminders: [String] = [], activityNames: [String] = [], activities: [PhaseActivity] = []) {
        self.id = id
        self.name = name
        self.durationMinutes = durationMinutes
        self.reminders = reminders
        self.activityNames = activityNames
        self.activities = activities
    }
}

public struct PhaseActivity: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var name: String
    public var category: String
    public var durationMinutes: Int
    public init(id: String = UUID().uuidString, name: String, category: String = "活动", durationMinutes: Int = 10) {
        self.id = id; self.name = name; self.category = category; self.durationMinutes = durationMinutes
    }
}

public struct TrainingPlan: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var name: String
    public var type: String
    public var customerName: String
    public var participantCount: Int
    public var status: PlanStatus
    public var phases: [SessionPhase]
    public var updatedAt: Date

    public init(id: String = UUID().uuidString, name: String, type: String, customerName: String = "", participantCount: Int, status: PlanStatus, phases: [SessionPhase], updatedAt: Date = .now) {
        self.id = id
        self.name = name
        self.type = type
        self.customerName = customerName
        self.participantCount = participantCount
        self.status = status
        self.phases = phases
        self.updatedAt = updatedAt
    }
}

public struct TrainingActivity: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var name: String
    public var scenes: [String]
    public var difficulty: String
    public var durationMinutes: Int
    public var isFavorite: Bool
    public var isPinned: Bool
    public var objective: String
    public var rules: String
    public var peopleRange: String
    public var reviewQuestions: String
    public var leaderTips: String

    public init(id: String = UUID().uuidString, name: String, scene: String, durationMinutes: Int, isFavorite: Bool = false, isPinned: Bool = false, objective: String = "", rules: String = "", peopleRange: String = "", difficulty: String = "", reviewQuestions: String = "", leaderTips: String = "") {
        self.id = id
        self.name = name
        self.scenes = scene.isEmpty ? [] : [scene]
        self.difficulty = difficulty
        self.durationMinutes = durationMinutes
        self.isFavorite = isFavorite
        self.isPinned = isPinned
        self.objective = objective
        self.rules = rules
        self.peopleRange = peopleRange
        self.reviewQuestions = reviewQuestions
        self.leaderTips = leaderTips
    }

    public init(id: String = UUID().uuidString, name: String, scenes: [String], difficulty: String = "", durationMinutes: Int, isFavorite: Bool = false, isPinned: Bool = false, objective: String = "", rules: String = "", peopleRange: String = "", reviewQuestions: String = "", leaderTips: String = "") {
        self.id = id
        self.name = name
        self.scenes = scenes
        self.difficulty = difficulty
        self.durationMinutes = durationMinutes
        self.isFavorite = isFavorite
        self.isPinned = isPinned
        self.objective = objective
        self.rules = rules
        self.peopleRange = peopleRange
        self.reviewQuestions = reviewQuestions
        self.leaderTips = leaderTips
    }

    public var primaryScene: String { scenes.first ?? "" }

    public var scene: String {
        get { primaryScene }
        set { scenes = newValue.isEmpty ? [] : [newValue] }
    }

    private enum CodingKeys: String, CodingKey {
        case id = "_id"
        case name, scenes, category, difficulty, durationMinutes, isFavorite, isPinned
        case objective, rules, peopleRange, reviewQuestions, leaderTips
    }

    public init(from decoder: Decoder) throws {
        let values = try decoder.container(keyedBy: CodingKeys.self)
        id = try values.decodeIfPresent(String.self, forKey: .id) ?? UUID().uuidString
        name = try values.decodeIfPresent(String.self, forKey: .name) ?? ""
        let decodedScenes = try values.decodeIfPresent([String].self, forKey: .scenes) ?? []
        let category = try values.decodeIfPresent(String.self, forKey: .category) ?? ""
        scenes = decodedScenes.isEmpty && !category.isEmpty ? [category] : decodedScenes
        difficulty = try values.decodeIfPresent(String.self, forKey: .difficulty) ?? ""
        durationMinutes = try values.decodeIfPresent(Int.self, forKey: .durationMinutes) ?? 0
        isFavorite = try values.decodeIfPresent(Bool.self, forKey: .isFavorite) ?? false
        isPinned = try values.decodeIfPresent(Bool.self, forKey: .isPinned) ?? false
        objective = try values.decodeIfPresent(String.self, forKey: .objective) ?? ""
        rules = try values.decodeIfPresent(String.self, forKey: .rules) ?? ""
        peopleRange = try values.decodeIfPresent(String.self, forKey: .peopleRange) ?? ""
        reviewQuestions = try values.decodeIfPresent(String.self, forKey: .reviewQuestions) ?? ""
        leaderTips = try values.decodeIfPresent(String.self, forKey: .leaderTips) ?? ""
    }

    public func encode(to encoder: Encoder) throws {
        var values = encoder.container(keyedBy: CodingKeys.self)
        try values.encode(id, forKey: .id)
        try values.encode(name, forKey: .name)
        try values.encode(scenes, forKey: .scenes)
        try values.encode(primaryScene, forKey: .category)
        try values.encode(difficulty, forKey: .difficulty)
        try values.encode(durationMinutes, forKey: .durationMinutes)
        try values.encode(isFavorite, forKey: .isFavorite)
        try values.encode(isPinned, forKey: .isPinned)
        try values.encode(objective, forKey: .objective)
        try values.encode(rules, forKey: .rules)
        try values.encode(peopleRange, forKey: .peopleRange)
        try values.encode(reviewQuestions, forKey: .reviewQuestions)
        try values.encode(leaderTips, forKey: .leaderTips)
    }
}

public struct TrainingTemplate: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var name: String
    public var type: String
    public var tag: String
    public var flowText: String
    public var phases: [SessionPhase]
    public init(id: String = UUID().uuidString, name: String, type: String, tag: String, flowText: String, phases: [SessionPhase]) {
        self.id = id; self.name = name; self.type = type; self.tag = tag; self.flowText = flowText; self.phases = phases
    }
}

public extension TrainingTemplate {
    static let starterCatalog = [
        TrainingTemplate(id: "template-corporate", name: "企业培训模板", type: "企业培训", tag: "5段式", flowText: "开场 -> 活动 -> 复盘 -> 提炼 -> 承诺", phases: [SessionPhase(name: "开场连接", durationMinutes: 15), SessionPhase(name: "主题导入", durationMinutes: 20), SessionPhase(name: "实践应用", durationMinutes: 45)]),
        TrainingTemplate(id: "template-team", name: "团建活动模板", type: "团建活动", tag: "三段式", flowText: "破冰 -> 团队挑战 -> 轻松复盘", phases: [SessionPhase(name: "破冰", durationMinutes: 20), SessionPhase(name: "团队挑战", durationMinutes: 50), SessionPhase(name: "轻松复盘", durationMinutes: 15)]),
        TrainingTemplate(id: "template-show", name: "即兴演出模板", type: "即兴演出", tag: "游戏轮", flowText: "暖场 -> 即兴表演 -> 观众互动 -> 谢幕", phases: [SessionPhase(name: "暖场", durationMinutes: 15), SessionPhase(name: "即兴表演", durationMinutes: 45)]),
        TrainingTemplate(id: "template-training", name: "即兴训练模板", type: "即兴培训", tag: "自由组合", flowText: "热身 -> 技能训练 -> 综合练习", phases: [SessionPhase(name: "热身", durationMinutes: 15), SessionPhase(name: "技能训练", durationMinutes: 45)])
    ]
}

public enum SessionStatus: String, Codable, Sendable { case running, ended, reviewed }

public struct Participant: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var name: String
    public var groupName: String?
    public var checkedInAt: Date?
    public init(id: String = UUID().uuidString, name: String, groupName: String? = nil, checkedInAt: Date? = nil) {
        self.id = id; self.name = name; self.groupName = groupName; self.checkedInAt = checkedInAt
    }
}

public struct TrainingGroup: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var name: String
    public var color: String
    public var members: [String]
    public var score: Int
    public init(id: String = UUID().uuidString, name: String, color: String = "#4A7CF7", members: [String] = [], score: Int = 0) {
        self.id = id; self.name = name; self.color = color; self.members = members; self.score = score
    }
}

public struct ScoreEntry: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var groupID: String
    public var delta: Int
    public var reason: String
    public var createdAt: Date
    public init(id: String = UUID().uuidString, groupID: String, delta: Int, reason: String, createdAt: Date = .now) {
        self.id = id; self.groupID = groupID; self.delta = delta; self.reason = reason; self.createdAt = createdAt
    }
}

public struct LiveGroupState: Codable, Hashable, Sendable {
    public var teamCount: Int
    public var groupMethod: String
    public var groups: [TrainingGroup]
    public var isGrouped: Bool
    public init(teamCount: Int = 2, groupMethod: String = "average", groups: [TrainingGroup] = [], isGrouped: Bool = false) {
        self.teamCount = teamCount; self.groupMethod = groupMethod; self.groups = groups; self.isGrouped = isGrouped
    }
}

public struct LiveScoreState: Codable, Hashable, Sendable {
    public var groups: [TrainingGroup]
    public var scoreMode: String
    public var scoreDetails: [String: [ScoreEntry]]
    public init(groups: [TrainingGroup] = [], scoreMode: String = "simple", scoreDetails: [String: [ScoreEntry]] = [:]) {
        self.groups = groups; self.scoreMode = scoreMode; self.scoreDetails = scoreDetails
    }
}

public struct RandomPickRecord: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var name: String
    public var type: String
    public var pickedAt: Date
    public init(id: String = UUID().uuidString, name: String, type: String, pickedAt: Date = .now) {
        self.id = id; self.name = name; self.type = type; self.pickedAt = pickedAt
    }
}

public struct LiveRandomState: Codable, Hashable, Sendable {
    public var randomTab: String
    public var allowRepeatPick: Bool
    public var pickedIDs: [String]
    public var pickedName: String
    public var pickedParticipantID: String
    public var pickHistory: [RandomPickRecord]
    public init(randomTab: String = "actor", allowRepeatPick: Bool = false, pickedIDs: [String] = [], pickedName: String = "", pickedParticipantID: String = "", pickHistory: [RandomPickRecord] = []) {
        self.randomTab = randomTab; self.allowRepeatPick = allowRepeatPick; self.pickedIDs = pickedIDs; self.pickedName = pickedName; self.pickedParticipantID = pickedParticipantID; self.pickHistory = pickHistory
    }
}

public struct LiveNote: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var phaseName: String
    public var content: String
    public var createdAt: Date
    public init(id: String = UUID().uuidString, phaseName: String = "", content: String, createdAt: Date = .now) {
        self.id = id; self.phaseName = phaseName; self.content = content; self.createdAt = createdAt
    }
}

public struct LiveEntryCode: Codable, Hashable, Sendable {
    public var imageURL: URL?
    public var path: String
    public var urlLink: URL?
    public var scene: String
    public init(imageURL: URL? = nil, path: String = "", urlLink: URL? = nil, scene: String = "") {
        self.imageURL = imageURL; self.path = path; self.urlLink = urlLink; self.scene = scene
    }
}

public struct LiveInteractionDraft: Codable, Hashable, Sendable {
    public var title: String
    public var type: String
    public var options: [String]
    public init(title: String, type: String, options: [String] = []) { self.title = title; self.type = type; self.options = options }
}

public struct LiveOptionStat: Codable, Hashable, Sendable {
    public var label: String
    public var count: Int
    public init(label: String, count: Int) { self.label = label; self.count = count }
}

public struct LiveWordStat: Codable, Hashable, Sendable {
    public var text: String
    public var count: Int
    public init(text: String, count: Int) { self.text = text; self.count = count }
}

public struct LiveInteractionStats: Codable, Hashable, Sendable {
    public var count: Int
    public var optionStats: [LiveOptionStat]
    public var words: [LiveWordStat]
    public var submissions: [LiveSubmission]
    public init(count: Int = 0, optionStats: [LiveOptionStat] = [], words: [LiveWordStat] = [], submissions: [LiveSubmission] = []) {
        self.count = count; self.optionStats = optionStats; self.words = words; self.submissions = submissions
    }
}

public struct LiveSubmission: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var content: String
    public init(id: String, content: String) { self.id = id; self.content = content }
}

public struct LiveInteraction: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var title: String
    public var type: String
    public var status: String
    public var options: [String]
    public var createdAt: Date?
    public init(id: String = UUID().uuidString, title: String, type: String, status: String = "open", options: [String] = [], createdAt: Date? = nil) {
        self.id = id; self.title = title; self.type = type; self.status = status; self.options = options; self.createdAt = createdAt
    }
}

public struct TrainingSession: Identifiable, Codable, Hashable, Sendable {
    public var id: String
    public var plan: TrainingPlan
    public var status: SessionStatus
    public var currentPhaseIndex: Int
    public var participants: [Participant]
    public var notes: [LiveNote]
    public var groups: [TrainingGroup]
    public var interactions: [LiveInteraction]
    public var isGrouped: Bool
    public var teamCount: Int
    public var groupMethod: String
    public var scoreMode: String
    public var scoreDetails: [String: [ScoreEntry]]
    public var randomState: LiveRandomState
    public var startedAt: Date

    public init(id: String = UUID().uuidString, plan: TrainingPlan, status: SessionStatus = .running, currentPhaseIndex: Int = 0, participants: [Participant] = [], notes: [LiveNote] = [], groups: [TrainingGroup] = [], interactions: [LiveInteraction] = [], isGrouped: Bool = false, teamCount: Int = 2, groupMethod: String = "average", scoreMode: String = "simple", scoreDetails: [String: [ScoreEntry]] = [:], randomState: LiveRandomState = LiveRandomState(), startedAt: Date = .now) {
        self.id = id; self.plan = plan; self.status = status; self.currentPhaseIndex = currentPhaseIndex; self.participants = participants; self.notes = notes; self.groups = groups; self.interactions = interactions; self.isGrouped = isGrouped; self.teamCount = teamCount; self.groupMethod = groupMethod; self.scoreMode = scoreMode; self.scoreDetails = scoreDetails; self.randomState = randomState; self.startedAt = startedAt
    }

    public var currentPhase: SessionPhase { plan.phases[min(currentPhaseIndex, max(plan.phases.count - 1, 0))] }
    public var pickedParticipantIDs: [String] {
        get { randomState.pickedIDs }
        set { randomState.pickedIDs = newValue }
    }
}

public struct DataOverview: Sendable {
    public var totalSessions: Int
    public var totalParticipants: Int
    public var satisfaction: String
    public var pendingReviews: Int
    public init(totalSessions: Int = 0, totalParticipants: Int = 0, satisfaction: String = "--", pendingReviews: Int = 0) {
        self.totalSessions = totalSessions; self.totalParticipants = totalParticipants; self.satisfaction = satisfaction; self.pendingReviews = pendingReviews
    }
}

public struct TrainerProfile: Codable, Hashable, Sendable {
    public var displayName: String
    public var organization: String
    public init(displayName: String = "张老师", organization: String = "") {
        self.displayName = displayName
        self.organization = organization
    }
}

public struct AccountDataExport: Codable, Hashable, Sendable {
    public var downloadURL: URL
    public var expiresAt: Date
    public init(downloadURL: URL, expiresAt: Date) {
        self.downloadURL = downloadURL
        self.expiresAt = expiresAt
    }
}

public protocol TrainingRepository: Sendable {
    func loadDashboard() async throws -> (plans: [TrainingPlan], activities: [TrainingActivity], overview: DataOverview)
    func loadProfile() async throws -> TrainerProfile
    func saveProfile(_ profile: TrainerProfile) async throws -> TrainerProfile
    func submitSupportFeedback(content: String, contact: String) async throws
    func savePlan(_ plan: TrainingPlan) async throws -> TrainingPlan
    func saveActivity(_ activity: TrainingActivity) async throws -> TrainingActivity
    func deleteActivity(id: String) async throws
    func startSession(planID: String) async throws -> TrainingSession
    func loadLiveSession(sessionID: String) async throws -> TrainingSession
    func loadParticipants(sessionID: String) async throws -> [Participant]
    func manualCheckin(sessionID: String, name: String) async throws -> Participant
    func loadSessionEntry(sessionID: String) async throws -> LiveEntryCode
    func savePhase(sessionID: String, phaseIndex: Int) async throws -> Int
    func saveGroups(sessionID: String, state: LiveGroupState) async throws -> LiveGroupState
    func saveScores(sessionID: String, state: LiveScoreState) async throws -> LiveScoreState
    func saveRandom(sessionID: String, state: LiveRandomState) async throws -> LiveRandomState
    func loadInteractions(sessionID: String) async throws -> [LiveInteraction]
    func createInteraction(sessionID: String, draft: LiveInteractionDraft) async throws -> LiveInteraction
    func closeInteraction(sessionID: String, interactionID: String) async throws
    func loadInteractionStats(sessionID: String, interactionID: String) async throws -> LiveInteractionStats
    func reportInteractionSubmission(submissionID: String) async throws
    func loadInteractionEntry(sessionID: String, interactionID: String) async throws -> LiveEntryCode
    func loadNotes(sessionID: String) async throws -> [LiveNote]
    func saveNote(sessionID: String, phaseName: String, content: String) async throws -> LiveNote
    func abandonSession(sessionID: String) async throws
    func endSession(sessionID: String) async throws
    func loadRecords() async throws -> [TrainingSession]
    func saveReview(sessionID: String, framework: String, content: String) async throws
    func exportAccountData() async throws -> AccountDataExport
    func deleteAccount() async throws
}

public enum TrainingError: LocalizedError, Sendable {
    case missingPlan, invalidState, networkUnavailable, server(String)
    public var errorDescription: String? {
        switch self {
        case .missingPlan: return "方案不存在"
        case .invalidState: return "当前状态无法完成该操作"
        case .networkUnavailable: return "网络开小差，请稍后再试"
        case .server(let message): return message
        }
    }
}
