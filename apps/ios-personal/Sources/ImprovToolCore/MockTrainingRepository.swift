import Foundation

public actor MockTrainingRepository: TrainingRepository {
    private var plans = MockFixtures.plans
    private var activities = MockFixtures.activities
    private var sessions = MockFixtures.sessions

    public init() {}

    public func loadDashboard() async throws -> (plans: [TrainingPlan], activities: [TrainingActivity], overview: DataOverview) {
        let people = sessions.reduce(0) { $0 + $1.participants.count }
        return (plans, activities, DataOverview(totalSessions: sessions.count, totalParticipants: people, satisfaction: sessions.isEmpty ? "--" : "4.8", pendingReviews: sessions.filter { $0.status == .ended }.count))
    }

    public func loadProfile() async throws -> TrainerProfile { TrainerProfile(displayName: "张老师", organization: "示例机构") }
    public func saveProfile(_ profile: TrainerProfile) async throws -> TrainerProfile { profile }
    public func submitSupportFeedback(content: String, contact: String) async throws {
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw TrainingError.server("请输入反馈内容") }
    }

    public func savePlan(_ plan: TrainingPlan) async throws -> TrainingPlan {
        guard !plan.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw TrainingError.server("请输入方案名称") }
        if let index = plans.firstIndex(where: { $0.id == plan.id }) { plans[index] = plan } else { plans.insert(plan, at: 0) }
        return plan
    }

    public func saveActivity(_ activity: TrainingActivity) async throws -> TrainingActivity {
        guard !activity.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw TrainingError.server("请输入活动名称") }
        if let index = activities.firstIndex(where: { $0.id == activity.id }) { activities[index] = activity } else { activities.insert(activity, at: 0) }
        return activity
    }

    public func deleteActivity(id: String) async throws { activities.removeAll { $0.id == id } }

    public func startSession(planID: String) async throws -> TrainingSession {
        guard let plan = plans.first(where: { $0.id == planID }) else { throw TrainingError.missingPlan }
        guard plan.status == .confirmed else { throw TrainingError.invalidState }
        if let running = sessions.first(where: { $0.plan.id == planID && $0.status == .running }) { return running }
        let session = TrainingSession(plan: plan)
        sessions.append(session)
        return session
    }

    public func loadLiveSession(sessionID: String) async throws -> TrainingSession {
        guard let session = sessions.first(where: { $0.id == sessionID }) else { throw TrainingError.invalidState }
        return session
    }

    public func loadParticipants(sessionID: String) async throws -> [Participant] { try session(id: sessionID).participants }

    public func manualCheckin(sessionID: String, name: String) async throws -> Participant {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw TrainingError.server("请输入参与者姓名") }
        var value = try session(id: sessionID)
        guard value.status == .running else { throw TrainingError.invalidState }
        guard !value.participants.contains(where: { $0.name.caseInsensitiveCompare(trimmed) == .orderedSame }) else { throw TrainingError.server("该姓名已签到") }
        let participant = Participant(name: trimmed, checkedInAt: .now)
        value.participants.insert(participant, at: 0)
        save(value)
        return participant
    }

    public func loadSessionEntry(sessionID: String) async throws -> LiveEntryCode {
        _ = try session(id: sessionID)
        return LiveEntryCode(path: "/pages/participant/checkin/index?sessionId=\(sessionID)", urlLink: URL(string: "https://example.invalid/checkin/\(sessionID)"), scene: sessionID)
    }

    public func savePhase(sessionID: String, phaseIndex: Int) async throws -> Int {
        var value = try session(id: sessionID)
        guard value.status == .running, value.plan.phases.indices.contains(phaseIndex) else { throw TrainingError.invalidState }
        value.currentPhaseIndex = phaseIndex
        save(value)
        return phaseIndex
    }

    public func saveGroups(sessionID: String, state: LiveGroupState) async throws -> LiveGroupState {
        guard !state.groups.isEmpty else { throw TrainingError.server("请先生成分组") }
        var value = try runningSession(id: sessionID)
        value.groups = state.groups; value.teamCount = state.teamCount; value.groupMethod = state.groupMethod; value.isGrouped = state.isGrouped; value.scoreDetails = [:]
        save(value)
        return state
    }

    public func saveScores(sessionID: String, state: LiveScoreState) async throws -> LiveScoreState {
        guard !state.groups.isEmpty else { throw TrainingError.server("请先完成分组") }
        var value = try runningSession(id: sessionID)
        value.groups = state.groups; value.scoreMode = state.scoreMode; value.scoreDetails = state.scoreDetails; value.isGrouped = true
        save(value)
        return state
    }

    public func saveRandom(sessionID: String, state: LiveRandomState) async throws -> LiveRandomState {
        var value = try runningSession(id: sessionID)
        value.randomState = state
        save(value)
        return state
    }

    public func loadInteractions(sessionID: String) async throws -> [LiveInteraction] { try session(id: sessionID).interactions }

    public func createInteraction(sessionID: String, draft: LiveInteractionDraft) async throws -> LiveInteraction {
        guard !draft.title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw TrainingError.server("请输入互动标题") }
        guard draft.type != "vote" || draft.options.count >= 2 else { throw TrainingError.server("投票至少需要 2 个选项") }
        var value = try runningSession(id: sessionID)
        let interaction = LiveInteraction(title: draft.title, type: draft.type, options: draft.options, createdAt: .now)
        value.interactions.insert(interaction, at: 0)
        save(value)
        return interaction
    }

    public func closeInteraction(sessionID: String, interactionID: String) async throws {
        var value = try runningSession(id: sessionID)
        guard let index = value.interactions.firstIndex(where: { $0.id == interactionID }) else { throw TrainingError.invalidState }
        value.interactions[index].status = "closed"
        save(value)
    }

    public func loadInteractionStats(sessionID: String, interactionID: String) async throws -> LiveInteractionStats {
        let value = try session(id: sessionID)
        guard value.interactions.contains(where: { $0.id == interactionID }) else { throw TrainingError.invalidState }
        return LiveInteractionStats()
    }

    public func reportInteractionSubmission(submissionID: String) async throws {}

    public func loadInteractionEntry(sessionID: String, interactionID: String) async throws -> LiveEntryCode {
        _ = try await loadInteractionStats(sessionID: sessionID, interactionID: interactionID)
        return LiveEntryCode(path: "/pages/participant/interaction/index?interactionId=\(interactionID)", urlLink: URL(string: "https://example.invalid/interaction/\(interactionID)"), scene: interactionID)
    }

    public func loadNotes(sessionID: String) async throws -> [LiveNote] { try session(id: sessionID).notes }

    public func saveNote(sessionID: String, phaseName: String, content: String) async throws -> LiveNote {
        let trimmed = content.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw TrainingError.server("请输入笔记") }
        var value = try session(id: sessionID)
        let note = LiveNote(phaseName: phaseName, content: trimmed)
        value.notes.insert(note, at: 0)
        save(value)
        return note
    }

    public func abandonSession(sessionID: String) async throws {
        let value = try runningSession(id: sessionID)
        sessions.removeAll { $0.id == sessionID }
        if let index = plans.firstIndex(where: { $0.id == value.plan.id }) {
            plans[index].status = .confirmed
        }
    }

    public func endSession(sessionID: String) async throws {
        var value = try runningSession(id: sessionID)
        value.status = .ended
        save(value)
        if let index = plans.firstIndex(where: { $0.id == value.plan.id }) { plans[index].status = .delivered }
    }

    public func loadRecords() async throws -> [TrainingSession] { sessions.sorted { $0.startedAt > $1.startedAt } }

    public func saveReview(sessionID: String, framework: String, content: String) async throws {
        guard !content.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { throw TrainingError.server("请填写复盘内容") }
        var value = try session(id: sessionID)
        guard value.status == .ended else { throw TrainingError.invalidState }
        value.status = .reviewed
        value.plan.status = .reviewed
        save(value)
    }

    public func exportAccountData() async throws -> AccountDataExport {
        AccountDataExport(downloadURL: URL(string: "https://example.invalid/account-export.json")!, expiresAt: .now.addingTimeInterval(3600))
    }

    public func deleteAccount() async throws {
        plans = []
        activities = []
        sessions = []
    }

    private func session(id: String) throws -> TrainingSession {
        guard let value = sessions.first(where: { $0.id == id }) else { throw TrainingError.invalidState }
        return value
    }

    private func runningSession(id: String) throws -> TrainingSession {
        let value = try session(id: id)
        guard value.status == .running else { throw TrainingError.invalidState }
        return value
    }

    private func save(_ session: TrainingSession) {
        if let index = sessions.firstIndex(where: { $0.id == session.id }) { sessions[index] = session } else { sessions.append(session) }
    }
}

private enum MockFixtures {
    static let plans = [
        TrainingPlan(id: "plan-workshop", name: "团队协作工作坊", type: "企业培训", customerName: "示例客户", participantCount: 24, status: .confirmed, phases: [
            SessionPhase(name: "开场破冰", durationMinutes: 15, reminders: ["说明本场目标", "邀请所有人参与"], activityNames: ["名字接龙"]),
            SessionPhase(name: "协作练习", durationMinutes: 45, reminders: ["记录小组观察"], activityNames: ["即兴共创"]),
            SessionPhase(name: "总结复盘", durationMinutes: 20, reminders: ["收集行动承诺"], activityNames: ["一页复盘"])
        ]),
        TrainingPlan(id: "plan-draft", name: "新培训方案", type: "团建活动", participantCount: 16, status: .draft, phases: [SessionPhase(name: "活动设计", durationMinutes: 30)]),
        TrainingPlan(id: "plan-leadership", name: "新任管理者领导力训练", type: "企业培训", customerName: "星河科技", participantCount: 12, status: .delivered, phases: [
            SessionPhase(name: "领导力热身", durationMinutes: 15, activityNames: ["立场光谱"]),
            SessionPhase(name: "授权练习", durationMinutes: 40, activityNames: ["盲区协作"]),
            SessionPhase(name: "行动复盘", durationMinutes: 20, activityNames: ["关键一问"])
        ]),
        TrainingPlan(id: "plan-innovation", name: "创新思维共创营", type: "即兴培训", customerName: "远山设计", participantCount: 18, status: .reviewed, phases: [
            SessionPhase(name: "打开想象", durationMinutes: 20, activityNames: ["是的，而且"]),
            SessionPhase(name: "快速共创", durationMinutes: 45, activityNames: ["限制创新"]),
            SessionPhase(name: "提炼洞察", durationMinutes: 25, activityNames: ["情绪温度计"])
        ])
    ]

    static let activities = [
        TrainingActivity(id: "activity-team", name: "名字接龙", scenes: ["团队融合"], difficulty: "简单", durationMinutes: 10, isFavorite: true, objective: "快速记住彼此姓名并建立安全感", rules: "依次说出前面成员姓名，再介绍自己。", peopleRange: "6-30人", reviewQuestions: "哪种记忆方式最有效？", leaderTips: "人数较多时分两组进行。"),
        TrainingActivity(id: "activity-collaboration", name: "即兴共创", scenes: ["协作沟通", "创新思维"], difficulty: "中等", durationMinutes: 30, objective: "练习倾听、接纳与共同推进", rules: "每人必须以“是的，而且”承接上一位。", peopleRange: "8-24人", reviewQuestions: "什么行为让共创更顺畅？", leaderTips: "及时指出否定式表达并邀请重新承接。"),
        TrainingActivity(id: "activity-leadership", name: "立场光谱", scenes: ["领导力"], difficulty: "中等", durationMinutes: 25, objective: "识别不同领导风格及其适用场景", rules: "根据题目选择站位并说明判断依据。", peopleRange: "6-20人", reviewQuestions: "你的默认领导方式带来了什么影响？", leaderTips: "避免评价站位对错，追问背后的情境。"),
        TrainingActivity(id: "activity-innovation", name: "限制创新", scenes: ["创新思维"], difficulty: "困难", durationMinutes: 35, objective: "利用限制条件激发新的解决思路", rules: "每轮增加一个限制，并在三分钟内提出方案。", peopleRange: "6-18人", reviewQuestions: "哪个限制反而帮助了创新？", leaderTips: "限制要具体且逐轮增加。"),
        TrainingActivity(id: "activity-emotion", name: "情绪温度计", scenes: ["情绪管理"], difficulty: "简单", durationMinutes: 15, objective: "觉察并准确表达当下情绪", rules: "用0到10分描述情绪强度，并说出一个身体信号。", peopleRange: "4-20人", reviewQuestions: "觉察情绪后你的选择发生了什么变化？", leaderTips: "允许参与者跳过，不追问私人经历。")
    ]

    static var sessions: [TrainingSession] {
        let pendingPlan = plans.first { $0.id == "plan-leadership" }!
        let reviewedPlan = plans.first { $0.id == "plan-innovation" }!
        return [
            TrainingSession(
                id: "session-pending-review",
                plan: pendingPlan,
                status: .ended,
                currentPhaseIndex: 2,
                participants: ["李可", "陈晨", "王雪", "赵宁", "周航", "孙悦"].enumerated().map { Participant(id: "pending-participant-\($0.offset)", name: $0.element) },
                notes: [LiveNote(phaseName: "授权练习", content: "授权练习中，第二组对目标边界的讨论最充分。"), LiveNote(phaseName: "行动复盘", content: "结束前收集了三项行动承诺。")],
                groups: [
                    TrainingGroup(id: "pending-group-1", name: "第1组", members: ["李可", "王雪", "周航"], score: 8),
                    TrainingGroup(id: "pending-group-2", name: "第2组", members: ["陈晨", "赵宁", "孙悦"], score: 10)
                ],
                interactions: [LiveInteraction(id: "pending-interaction", title: "最需要加强的领导动作", type: "vote", status: "closed", options: ["明确目标", "充分授权", "及时反馈"])],
                randomState: LiveRandomState(pickedIDs: ["pending-participant-1"]),
                startedAt: .now.addingTimeInterval(-86_400)
            ),
            TrainingSession(
                id: "session-reviewed",
                plan: reviewedPlan,
                status: .reviewed,
                currentPhaseIndex: 2,
                participants: ["林岚", "韩梅", "许哲", "吴桐", "郑一"].enumerated().map { Participant(id: "reviewed-participant-\($0.offset)", name: $0.element) },
                notes: [LiveNote(phaseName: "快速共创", content: "限制条件显著提升了第三轮创意数量。")],
                groups: [TrainingGroup(id: "reviewed-group", name: "共创组", members: ["林岚", "韩梅", "许哲", "吴桐", "郑一"], score: 12)],
                interactions: [LiveInteraction(id: "reviewed-interaction", title: "今天最有价值的发现", type: "wordcloud", status: "closed")],
                startedAt: .now.addingTimeInterval(-604_800)
            )
        ]
    }
}

public struct UnavailableTrainingRepository: TrainingRepository {
    private let message: String
    public init(message: String) { self.message = message }
    public func loadDashboard() async throws -> (plans: [TrainingPlan], activities: [TrainingActivity], overview: DataOverview) { throw TrainingError.server(message) }
    public func loadProfile() async throws -> TrainerProfile { throw TrainingError.server(message) }
    public func saveProfile(_ profile: TrainerProfile) async throws -> TrainerProfile { throw TrainingError.server(message) }
    public func submitSupportFeedback(content: String, contact: String) async throws { throw TrainingError.server(message) }
    public func savePlan(_ plan: TrainingPlan) async throws -> TrainingPlan { throw TrainingError.server(message) }
    public func saveActivity(_ activity: TrainingActivity) async throws -> TrainingActivity { throw TrainingError.server(message) }
    public func deleteActivity(id: String) async throws { throw TrainingError.server(message) }
    public func startSession(planID: String) async throws -> TrainingSession { throw TrainingError.server(message) }
    public func loadLiveSession(sessionID: String) async throws -> TrainingSession { throw TrainingError.server(message) }
    public func loadParticipants(sessionID: String) async throws -> [Participant] { throw TrainingError.server(message) }
    public func manualCheckin(sessionID: String, name: String) async throws -> Participant { throw TrainingError.server(message) }
    public func loadSessionEntry(sessionID: String) async throws -> LiveEntryCode { throw TrainingError.server(message) }
    public func savePhase(sessionID: String, phaseIndex: Int) async throws -> Int { throw TrainingError.server(message) }
    public func saveGroups(sessionID: String, state: LiveGroupState) async throws -> LiveGroupState { throw TrainingError.server(message) }
    public func saveScores(sessionID: String, state: LiveScoreState) async throws -> LiveScoreState { throw TrainingError.server(message) }
    public func saveRandom(sessionID: String, state: LiveRandomState) async throws -> LiveRandomState { throw TrainingError.server(message) }
    public func loadInteractions(sessionID: String) async throws -> [LiveInteraction] { throw TrainingError.server(message) }
    public func createInteraction(sessionID: String, draft: LiveInteractionDraft) async throws -> LiveInteraction { throw TrainingError.server(message) }
    public func closeInteraction(sessionID: String, interactionID: String) async throws { throw TrainingError.server(message) }
    public func loadInteractionStats(sessionID: String, interactionID: String) async throws -> LiveInteractionStats { throw TrainingError.server(message) }
    public func reportInteractionSubmission(submissionID: String) async throws { throw TrainingError.server(message) }
    public func loadInteractionEntry(sessionID: String, interactionID: String) async throws -> LiveEntryCode { throw TrainingError.server(message) }
    public func loadNotes(sessionID: String) async throws -> [LiveNote] { throw TrainingError.server(message) }
    public func saveNote(sessionID: String, phaseName: String, content: String) async throws -> LiveNote { throw TrainingError.server(message) }
    public func abandonSession(sessionID: String) async throws { throw TrainingError.server(message) }
    public func endSession(sessionID: String) async throws { throw TrainingError.server(message) }
    public func loadRecords() async throws -> [TrainingSession] { throw TrainingError.server(message) }
    public func saveReview(sessionID: String, framework: String, content: String) async throws { throw TrainingError.server(message) }
    public func exportAccountData() async throws -> AccountDataExport { throw TrainingError.server(message) }
    public func deleteAccount() async throws { throw TrainingError.server(message) }
}
