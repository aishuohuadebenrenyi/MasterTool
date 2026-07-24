import XCTest
@testable import ImprovToolCore

final class ImprovToolCoreTests: XCTestCase {
    func testCountdownTimerStartPauseResetAndAddTime() {
        var timer = LiveTimerState(mode: .countDown, durationSeconds: 60)
        XCTAssertEqual(timer.displaySeconds, 60)
        timer.toggleRunning()
        XCTAssertFalse(timer.tick())
        XCTAssertEqual(timer.displaySeconds, 59)
        timer.pause()
        XCTAssertFalse(timer.tick())
        XCTAssertEqual(timer.displaySeconds, 59)
        timer.add(seconds: 300)
        XCTAssertEqual(timer.displaySeconds, 359)
        timer.reset()
        XCTAssertEqual(timer.displaySeconds, 360)
        XCTAssertFalse(timer.isRunning)
    }

    func testCountdownCompletesOnlyOnce() {
        var timer = LiveTimerState(mode: .countDown, durationSeconds: 1)
        timer.toggleRunning()
        XCTAssertTrue(timer.tick())
        XCTAssertFalse(timer.tick())
        XCTAssertEqual(timer.displaySeconds, 0)
        XCTAssertFalse(timer.isRunning)
    }

    func testCountUpTimerNeverCompletes() {
        var timer = LiveTimerState(mode: .countUp)
        timer.toggleRunning()
        XCTAssertFalse(timer.tick())
        XCTAssertEqual(timer.displaySeconds, 1)
    }

    func testTimerSingleAndDoubleTapActionsAreMutuallyExclusive() {
        var timer = LiveTimerState(mode: .countDown, durationSeconds: 900)

        applyLiveTimerTap(.primary, doubleTapDelayEnabled: true, timer: &timer)
        XCTAssertTrue(timer.isRunning)
        XCTAssertEqual(timer.durationSeconds, 900)

        applyLiveTimerTap(.delay, doubleTapDelayEnabled: true, timer: &timer)
        XCTAssertTrue(timer.isRunning)
        XCTAssertEqual(timer.durationSeconds, 1_200)
    }

    func testDisabledDoubleTapDoesNotChangeTimer() {
        var timer = LiveTimerState(mode: .countDown, durationSeconds: 900)

        applyLiveTimerTap(.delay, doubleTapDelayEnabled: false, timer: &timer)

        XCTAssertFalse(timer.isRunning)
        XCTAssertEqual(timer.durationSeconds, 900)
    }

    func testHorizontalSwipeRequiresDistanceAndHorizontalDominance() {
        XCTAssertEqual(horizontalSwipeAction(horizontalDistance: -100, verticalDistance: 20), .next)
        XCTAssertEqual(horizontalSwipeAction(horizontalDistance: 100, verticalDistance: 20), .previous)
        XCTAssertNil(horizontalSwipeAction(horizontalDistance: 70, verticalDistance: 5))
        XCTAssertNil(horizontalSwipeAction(horizontalDistance: 100, verticalDistance: 90))
    }

    func testPhaseSwipeStopsAtFirstAndLastPhase() {
        XCTAssertNil(phaseIndex(after: .previous, currentIndex: 0, phaseCount: 3))
        XCTAssertEqual(phaseIndex(after: .next, currentIndex: 0, phaseCount: 3), 1)
        XCTAssertEqual(phaseIndex(after: .previous, currentIndex: 2, phaseCount: 3), 1)
        XCTAssertNil(phaseIndex(after: .next, currentIndex: 2, phaseCount: 3))
    }

    func testPhaseDurationUsesTargetPhaseInsteadOfPreviousPhase() {
        let phases = [SessionPhase(name: "开场", durationMinutes: 15), SessionPhase(name: "练习", durationMinutes: 45)]
        XCTAssertEqual(phaseDurationSeconds(at: 0, phases: phases), 900)
        XCTAssertEqual(phaseDurationSeconds(at: 1, phases: phases), 2700)
        XCTAssertNil(phaseDurationSeconds(at: 2, phases: phases))
    }

    func testStarterTemplatesCreateEditableDraftPlans() {
        let template = TrainingTemplate.starterCatalog[0]
        let plan = TrainingPlan(name: template.name, type: template.type, participantCount: 20, status: .draft, phases: template.phases)
        XCTAssertEqual(plan.status, .draft)
        XCTAssertFalse(plan.phases.isEmpty)
    }

    func testLiveSessionKeepsToolState() {
        let plan = TrainingPlan(name: "测试", type: "企业培训", participantCount: 4, status: .confirmed, phases: [SessionPhase(name: "开场", durationMinutes: 15)])
        var session = TrainingSession(plan: plan)
        session.participants.append(Participant(name: "甲"))
        session.groups.append(TrainingGroup(name: "第1组", members: ["甲"], score: 1))
        session.interactions.append(LiveInteraction(title: "投票", type: "投票"))
        session.notes.append(LiveNote(phaseName: "开场", content: "现场观察"))
        XCTAssertEqual(session.groups[0].score, 1)
        XCTAssertEqual(session.interactions.count, 1)
        XCTAssertEqual(session.notes.count, 1)
    }

    func testConfirmedPlanStartsAndReturnsSameRunningSession() async throws {
        let repository = MockTrainingRepository()
        let dashboard = try await repository.loadDashboard()
        let plan = try XCTUnwrap(dashboard.plans.first(where: { $0.status == .confirmed }))
        let first = try await repository.startSession(planID: plan.id)
        let second = try await repository.startSession(planID: plan.id)
        XCTAssertEqual(first.id, second.id)
        XCTAssertEqual(first.status, .running)
    }

    func testDraftPlanCannotStart() async throws {
        let repository = MockTrainingRepository()
        let dashboard = try await repository.loadDashboard()
        let plan = try XCTUnwrap(dashboard.plans.first(where: { $0.status == .draft }))
        do { _ = try await repository.startSession(planID: plan.id); XCTFail("draft should not start") } catch let error as TrainingError { XCTAssertEqual(error.errorDescription, TrainingError.invalidState.errorDescription) }
    }

    func testSessionPersistsParticipantsAndNotesThroughGranularActions() async throws {
        let repository = MockTrainingRepository()
        let dashboard = try await repository.loadDashboard()
        let plan = try XCTUnwrap(dashboard.plans.first(where: { $0.status == .confirmed }))
        let session = try await repository.startSession(planID: plan.id)
        _ = try await repository.manualCheckin(sessionID: session.id, name: "小王")
        _ = try await repository.saveNote(sessionID: session.id, phaseName: "开场", content: "观察到积极协作")
        let saved = try await repository.loadLiveSession(sessionID: session.id)
        XCTAssertEqual(saved.participants.map(\.name), ["小王"])
        XCTAssertEqual(saved.notes.map(\.content), ["观察到积极协作"])
    }

    func testMockRepositoryPersistsAllServerBackedLiveToolsAndEndsSession() async throws {
        let repository = MockTrainingRepository()
        let dashboard = try await repository.loadDashboard()
        let plan = try XCTUnwrap(dashboard.plans.first(where: { $0.status == .confirmed }))
        let session = try await repository.startSession(planID: plan.id)
        let person = try await repository.manualCheckin(sessionID: session.id, name: "测试参与者")
        let groups = [TrainingGroup(id: "group-1", name: "第1组", members: [person.id])]
        _ = try await repository.saveGroups(sessionID: session.id, state: LiveGroupState(teamCount: 2, groupMethod: "average", groups: groups, isGrouped: true))
        let scores = LiveScoreState(groups: [TrainingGroup(id: "group-1", name: "第1组", members: [person.id], score: 5)], scoreMode: "detailed", scoreDetails: ["group-1": [ScoreEntry(groupID: "group-1", delta: 5, reason: "协作")]])
        _ = try await repository.saveScores(sessionID: session.id, state: scores)
        _ = try await repository.saveRandom(sessionID: session.id, state: LiveRandomState(pickedIDs: [person.id], pickedName: person.name, pickedParticipantID: person.id, pickHistory: [RandomPickRecord(id: person.id, name: person.name, type: "participant")]))
        let interaction = try await repository.createInteraction(sessionID: session.id, draft: LiveInteractionDraft(title: "现场词云", type: "wordcloud"))
        try await repository.closeInteraction(sessionID: session.id, interactionID: interaction.id)
        _ = try await repository.saveNote(sessionID: session.id, phaseName: "开场", content: "现场观察")
        try await repository.endSession(sessionID: session.id)

        let saved = try await repository.loadLiveSession(sessionID: session.id)
        XCTAssertEqual(saved.status, .ended)
        XCTAssertEqual(saved.groups.first?.score, 5)
        XCTAssertEqual(saved.scoreDetails["group-1"]?.first?.reason, "协作")
        XCTAssertEqual(saved.randomState.pickedParticipantID, person.id)
        XCTAssertEqual(saved.interactions.first?.status, "closed")
        XCTAssertEqual(saved.notes.first?.content, "现场观察")
    }

    func testMockRepositoryAbandonsSessionAndAllowsPlanToRestart() async throws {
        let repository = MockTrainingRepository()
        let dashboard = try await repository.loadDashboard()
        let plan = try XCTUnwrap(dashboard.plans.first(where: { $0.status == .confirmed }))
        let session = try await repository.startSession(planID: plan.id)

        try await repository.abandonSession(sessionID: session.id)

        do {
            _ = try await repository.loadLiveSession(sessionID: session.id)
            XCTFail("abandoned session should not be restorable")
        } catch let error as TrainingError {
            XCTAssertEqual(error.errorDescription, TrainingError.invalidState.errorDescription)
        }
        let restarted = try await repository.startSession(planID: plan.id)
        XCTAssertNotEqual(restarted.id, session.id)
        XCTAssertEqual(restarted.status, .running)
    }

    func testActivityDecodesAllMiniProgramFieldsAndLegacyCategory() throws {
        let data = Data(#"{"_id":"activity-1","name":"共创","category":"协作沟通","difficulty":"困难","peopleRange":"8-20人","durationMinutes":30,"objective":"形成共识","rules":"轮流发言","reviewQuestions":"观察到了什么？","leaderTips":"控制节奏"}"#.utf8)
        let activity = try JSONDecoder().decode(TrainingActivity.self, from: data)
        XCTAssertEqual(activity.id, "activity-1")
        XCTAssertEqual(activity.scenes, ["协作沟通"])
        XCTAssertEqual(activity.primaryScene, "协作沟通")
        XCTAssertEqual(activity.difficulty, "困难")
        XCTAssertEqual(activity.reviewQuestions, "观察到了什么？")
        XCTAssertEqual(activity.leaderTips, "控制节奏")
    }

    func testActivitySavePayloadMatchesMiniProgramContract() throws {
        let activity = TrainingActivity(id: "activity-1", name: "共创", scenes: ["团队融合", "协作沟通"], difficulty: "中等", durationMinutes: 30, objective: "形成共识", rules: "轮流发言", peopleRange: "8-20人", reviewQuestions: "观察到了什么？", leaderTips: "控制节奏")
        let data = try JSONEncoder().encode(ActivitySavePayload(activity))
        let payload = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertEqual(payload["_id"] as? String, "activity-1")
        XCTAssertEqual(payload["scenes"] as? [String], ["团队融合", "协作沟通"])
        XCTAssertEqual(payload["difficulty"] as? String, "中等")
        XCTAssertEqual(payload["reviewQuestions"] as? String, "观察到了什么？")
        XCTAssertEqual(payload["leaderTips"] as? String, "控制节奏")
    }

    func testNewPlanPayloadOmitsLocalUUIDAndKeepsCompletePhaseContent() throws {
        let phase = SessionPhase(
            name: "练习",
            durationMinutes: 45,
            reminders: ["还剩 5 分钟"],
            activityNames: ["即兴共创"],
            activities: [PhaseActivity(id: "activity-1", name: "即兴共创", category: "协作", durationMinutes: 30)]
        )
        let plan = TrainingPlan(name: "新方案", type: "企业培训", participantCount: 20, status: .draft, phases: [phase])
        let data = try JSONEncoder().encode(PlanSavePayload(plan))
        let payload = try XCTUnwrap(JSONSerialization.jsonObject(with: data) as? [String: Any])
        XCTAssertNil(payload["_id"])
        let phases = try XCTUnwrap(payload["phases"] as? [[String: Any]])
        XCTAssertEqual(phases[0]["reminders"] as? [String], ["还剩 5 分钟"])
        XCTAssertEqual(phases[0]["activityNames"] as? [String], ["即兴共创"])
        let activities = try XCTUnwrap(phases[0]["activities"] as? [[String: Any]])
        XCTAssertEqual(activities[0]["activityId"] as? String, "activity-1")
        XCTAssertEqual(activities[0]["durationMinutes"] as? Int, 30)
    }

    func testCloudRepositoryUsesConfirmActionAndServerPlanID() async throws {
        let recorder = RequestRecorder { action, payload in
            XCTAssertEqual(action, "trainer.confirmPlan")
            XCTAssertEqual(payload["_id"] as? String, "plan-existing")
            return ["planId": "plan-existing", "status": "confirmed"]
        }
        let repository = makeCloudRepository(recorder: recorder)
        let plan = TrainingPlan(id: "plan-existing", name: "确认方案", type: "企业培训", participantCount: 10, status: .confirmed, phases: [SessionPhase(name: "开场", durationMinutes: 15)])

        let saved = try await repository.savePlan(plan)

        XCTAssertEqual(saved.id, "plan-existing")
        XCTAssertEqual(saved.status, .confirmed)
    }

    func testCloudRepositoryReplacesLocalPlanIDWithServerID() async throws {
        let recorder = RequestRecorder { action, payload in
            XCTAssertEqual(action, "trainer.savePlanDraft")
            XCTAssertNil(payload["_id"])
            return ["planId": "plan-server", "status": "draft"]
        }
        let repository = makeCloudRepository(recorder: recorder)
        let plan = TrainingPlan(name: "新方案", type: "企业培训", participantCount: 10, status: .draft, phases: [SessionPhase(name: "开场", durationMinutes: 15)])

        let saved = try await repository.savePlan(plan)

        XCTAssertEqual(saved.id, "plan-server")
        XCTAssertEqual(saved.status, .draft)
    }

    func testMockActivityCreateUpdateAndDelete() async throws {
        let repository = MockTrainingRepository()
        var activity = TrainingActivity(id: "new-activity", name: "新活动", scenes: ["创新思维"], difficulty: "简单", durationMinutes: 20)
        let created = try await repository.saveActivity(activity)
        XCTAssertEqual(created.primaryScene, "创新思维")
        activity.name = "已更新活动"
        _ = try await repository.saveActivity(activity)
        let updatedDashboard = try await repository.loadDashboard()
        XCTAssertTrue(updatedDashboard.activities.contains { $0.name == "已更新活动" })
        try await repository.deleteActivity(id: activity.id)
        let deletedDashboard = try await repository.loadDashboard()
        XCTAssertFalse(deletedDashboard.activities.contains { $0.id == activity.id })
    }

    func testMockFixturesCoverPlansActivitiesAndHistory() async throws {
        let repository = MockTrainingRepository()
        let dashboard = try await repository.loadDashboard()
        let records = try await repository.loadRecords()

        XCTAssertEqual(Set(dashboard.plans.map(\.status)), Set(PlanStatus.allCases))
        XCTAssertEqual(Set(dashboard.activities.flatMap(\.scenes)), Set(["团队融合", "协作沟通", "领导力", "创新思维", "情绪管理"]))
        XCTAssertEqual(Set(records.map { $0.status.rawValue }), Set([SessionStatus.ended.rawValue, SessionStatus.reviewed.rawValue]))
        XCTAssertTrue(records.allSatisfy { !$0.participants.isEmpty && !$0.groups.isEmpty && !$0.interactions.isEmpty && !$0.notes.isEmpty })
        XCTAssertEqual(dashboard.overview.totalSessions, records.count)
        XCTAssertEqual(dashboard.overview.totalParticipants, records.reduce(0) { $0 + $1.participants.count })
        XCTAssertEqual(dashboard.overview.pendingReviews, 1)
    }

    func testNewMockRepositoryRestoresSeedData() async throws {
        let first = MockTrainingRepository()
        let activity = TrainingActivity(id: "temporary-activity", name: "临时活动", scene: "团队融合", durationMinutes: 10)
        _ = try await first.saveActivity(activity)
        try await first.deleteActivity(id: "activity-team")

        let second = MockTrainingRepository()
        let dashboard = try await second.loadDashboard()
        XCTAssertFalse(dashboard.activities.contains { $0.id == "temporary-activity" })
        XCTAssertTrue(dashboard.activities.contains { $0.id == "activity-team" })
    }

    func testCloudRepositoryStartsThenLoadsCompleteSessionContract() async throws {
        let recorder = RequestRecorder { action, _ in
            switch action {
            case "live.startSession":
                return ["sessionId": "session-live"]
            case "live.getSessionDetail":
                return ["session": [
                    "_id": "session-live",
                    "status": "running",
                    "currentPhaseIndex": 1,
                    "startedAt": 1_700_000_000_000,
                    "planSnapshot": [
                        "planId": "plan-live",
                        "name": "真实场次",
                        "type": "企业培训",
                        "participantCount": 20,
                        "phases": [
                            ["name": "开场", "duration": 15],
                            ["name": "练习", "minutes": 45]
                        ]
                    ]
                ]]
            case "live.listParticipants":
                return ["participants": [["_id": "person-1", "name": "小王", "checkedInAt": 1_700_000_001_000]]]
            case "live.listInteractions":
                return ["interactions": [["_id": "interaction-1", "title": "现场投票", "type": "vote", "status": "open", "options": ["A", "B"]]]]
            case "live.listNotes":
                return ["notes": [["id": "note-1", "phaseName": "练习", "content": "观察", "createdAt": 1_700_000_002_000]]]
            default:
                XCTFail("unexpected action \(action)")
                return [:]
            }
        }
        let repository = makeCloudRepository(recorder: recorder)

        let session = try await repository.startSession(planID: "plan-live")

        XCTAssertEqual(recorder.actions.prefix(2), ["live.startSession", "live.getSessionDetail"])
        XCTAssertEqual(Set(recorder.actions.dropFirst(2)), Set(["live.listParticipants", "live.listInteractions", "live.listNotes"]))
        XCTAssertEqual(session.id, "session-live")
        XCTAssertEqual(session.currentPhase.name, "练习")
        XCTAssertEqual(session.currentPhase.durationMinutes, 45)
        XCTAssertEqual(session.participants.first?.id, "person-1")
        XCTAssertEqual(session.interactions.first?.id, "interaction-1")
        XCTAssertEqual(session.notes.first?.content, "观察")
    }

    func testCloudRepositoryUsesGranularPhaseActionAndCamelCasePayload() async throws {
        let recorder = RequestRecorder { action, payload in
            XCTAssertEqual(action, "live.savePhaseState")
            XCTAssertEqual(payload["sessionId"] as? String, "session-live")
            XCTAssertEqual(payload["currentPhaseIndex"] as? Int, 2)
            XCTAssertNil(payload["session_id"])
            return ["currentPhaseIndex": 2]
        }
        let repository = makeCloudRepository(recorder: recorder)

        let value = try await repository.savePhase(sessionID: "session-live", phaseIndex: 2)

        XCTAssertEqual(value, 2)
        XCTAssertEqual(recorder.authorization, "Bearer token")
    }

    func testCloudRepositoryUsesAbandonSessionActionAndSessionIDPayload() async throws {
        let recorder = RequestRecorder { action, payload in
            XCTAssertEqual(action, "live.abandonSession")
            XCTAssertEqual(payload["sessionId"] as? String, "session-live")
            XCTAssertNil(payload["session_id"])
            return ["sessionId": "session-live", "planId": "plan-live"]
        }
        let repository = makeCloudRepository(recorder: recorder)

        try await repository.abandonSession(sessionID: "session-live")

        XCTAssertEqual(recorder.actions, ["live.abandonSession"])
    }

    func testAuthSessionPersistsLoginAndReturnsAccessToken() async throws {
        let recorder = AuthRequestRecorder { action, request in
            XCTAssertEqual(action, "auth.loginEmail")
            XCTAssertNil(request.value(forHTTPHeaderField: "Authorization"))
            return ["accountId": "account-1", "accessToken": "access-1", "refreshToken": "refresh-1", "expiresIn": 900]
        }
        let storage = MemoryAuthTokenStorage()
        let auth = makeAuthSession(recorder: recorder, storage: storage)

        try await auth.login(email: "owner@example.com", password: "password123")

        let accessToken = try await auth.accessToken()
        XCTAssertEqual(accessToken, "access-1")
        XCTAssertEqual(try storage.load()?.refreshToken, "refresh-1")
        XCTAssertEqual(recorder.actions, ["auth.loginEmail"])
    }

    func testAuthSessionRefreshesExpiredTokenAndRotatesStoredCredentials() async throws {
        let storage = MemoryAuthTokenStorage(tokens: AuthTokens(accountId: "account-1", accessToken: "expired", refreshToken: "refresh-old", expiresAt: .distantPast))
        let recorder = AuthRequestRecorder { action, _ in
            XCTAssertEqual(action, "auth.refresh")
            return ["accountId": "account-1", "accessToken": "access-new", "refreshToken": "refresh-new", "expiresIn": 900]
        }
        let auth = makeAuthSession(recorder: recorder, storage: storage)

        let accessToken = try await auth.accessToken()
        XCTAssertEqual(accessToken, "access-new")
        XCTAssertEqual(try storage.load()?.refreshToken, "refresh-new")
        XCTAssertEqual(recorder.actions, ["auth.refresh"])
    }

    func testAuthSessionLogoutRevokesServerTokenAndClearsStorage() async throws {
        let storage = MemoryAuthTokenStorage(tokens: AuthTokens(accountId: "account-1", accessToken: "access-1", refreshToken: "refresh-1", expiresAt: .distantFuture))
        let recorder = AuthRequestRecorder { action, request in
            XCTAssertEqual(action, "auth.logout")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer access-1")
            return ["revoked": true]
        }
        let auth = makeAuthSession(recorder: recorder, storage: storage)

        await auth.logout()

        XCTAssertNil(try storage.load())
        let isAuthenticated = await auth.isAuthenticated()
        XCTAssertFalse(isAuthenticated)
        XCTAssertEqual(recorder.actions, ["auth.logout"])
    }

    private func makeCloudRepository(recorder: RequestRecorder) -> CloudBaseTrainingRepository {
        URLProtocolStub.recorder = recorder
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [URLProtocolStub.self]
        return CloudBaseTrainingRepository(
            configuration: CloudBaseConfiguration(endpoint: URL(string: "https://example.invalid/ios-api")!, accessToken: "token", clientVersion: "test"),
            session: URLSession(configuration: configuration)
        )
    }

    private func makeAuthSession(recorder: AuthRequestRecorder, storage: MemoryAuthTokenStorage) -> AuthSession {
        AuthURLProtocolStub.recorder = recorder
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [AuthURLProtocolStub.self]
        let client = AuthAPIClient(
            endpoint: URL(string: "https://example.invalid/ios-api")!,
            clientVersion: "test",
            session: URLSession(configuration: configuration)
        )
        return AuthSession(client: client, storage: storage)
    }
}

private final class RequestRecorder {
    typealias Handler = (String, [String: Any]) throws -> [String: Any]
    private let lock = NSLock()
    private let handler: Handler
    private(set) var actions = [String]()
    private(set) var authorization = ""

    init(handler: @escaping Handler) { self.handler = handler }

    func response(for request: URLRequest) throws -> Data {
        let body = try requestBody(request)
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        let action = try XCTUnwrap(json["action"] as? String)
        let payload = json["payload"] as? [String: Any] ?? [:]
        lock.lock()
        actions.append(action)
        authorization = request.value(forHTTPHeaderField: "Authorization") ?? ""
        lock.unlock()
        let data = try handler(action, payload)
        return try JSONSerialization.data(withJSONObject: ["code": 0, "message": "success", "data": data])
    }

    private func requestBody(_ request: URLRequest) throws -> Data {
        if let body = request.httpBody { return body }
        let stream = try XCTUnwrap(request.httpBodyStream)
        stream.open()
        defer { stream.close() }
        var result = Data()
        var buffer = [UInt8](repeating: 0, count: 1024)
        while stream.hasBytesAvailable {
            let count = stream.read(&buffer, maxLength: buffer.count)
            if count < 0 { throw try XCTUnwrap(stream.streamError) }
            if count == 0 { break }
            result.append(buffer, count: count)
        }
        return result
    }
}

private final class URLProtocolStub: URLProtocol {
    static var recorder: RequestRecorder?
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        do {
            let data = try XCTUnwrap(Self.recorder).response(for: request)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }
    override func stopLoading() {}
}

private final class MemoryAuthTokenStorage: AuthTokenStorage, @unchecked Sendable {
    private let lock = NSLock()
    private var tokens: AuthTokens?

    init(tokens: AuthTokens? = nil) { self.tokens = tokens }

    func load() throws -> AuthTokens? {
        lock.lock()
        defer { lock.unlock() }
        return tokens
    }

    func save(_ tokens: AuthTokens) throws {
        lock.lock()
        defer { lock.unlock() }
        self.tokens = tokens
    }

    func clear() throws {
        lock.lock()
        defer { lock.unlock() }
        tokens = nil
    }
}

private final class AuthRequestRecorder {
    typealias Handler = (String, URLRequest) throws -> [String: Any]
    private let lock = NSLock()
    private let handler: Handler
    private(set) var actions = [String]()

    init(handler: @escaping Handler) { self.handler = handler }

    func response(for request: URLRequest) throws -> Data {
        let body: Data
        if let httpBody = request.httpBody {
            body = httpBody
        } else {
            let stream = try XCTUnwrap(request.httpBodyStream)
            stream.open()
            defer { stream.close() }
            var result = Data()
            var buffer = [UInt8](repeating: 0, count: 1024)
            while stream.hasBytesAvailable {
                let count = stream.read(&buffer, maxLength: buffer.count)
                if count < 0 { throw try XCTUnwrap(stream.streamError) }
                if count == 0 { break }
                result.append(buffer, count: count)
            }
            body = result
        }
        let json = try XCTUnwrap(JSONSerialization.jsonObject(with: body) as? [String: Any])
        let action = try XCTUnwrap(json["action"] as? String)
        lock.lock()
        actions.append(action)
        lock.unlock()
        let data = try handler(action, request)
        return try JSONSerialization.data(withJSONObject: ["code": 0, "message": "success", "data": data])
    }
}

private final class AuthURLProtocolStub: URLProtocol {
    static var recorder: AuthRequestRecorder?
    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }
    override func startLoading() {
        do {
            let data = try XCTUnwrap(Self.recorder).response(for: request)
            let response = HTTPURLResponse(url: request.url!, statusCode: 200, httpVersion: nil, headerFields: ["Content-Type": "application/json"])!
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }
    override func stopLoading() {}
}
