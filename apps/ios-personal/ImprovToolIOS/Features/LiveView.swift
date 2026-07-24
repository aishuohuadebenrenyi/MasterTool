import SwiftUI
import UIKit
import Combine
import AVFoundation
#if canImport(ImprovToolCore)
import ImprovToolCore
#endif

private func formatTimerSeconds(_ seconds: Int) -> String {
    String(format: "%02d:%02d", seconds / 60, seconds % 60)
}

enum LiveTool: String, CaseIterable, Identifiable, Hashable {
    case checkin, group, score, random, interaction, sound, timer, note
    var id: String { rawValue }
    var title: String {
        switch self {
        case .checkin: return "签到"
        case .group: return "分组"
        case .score: return "积分"
        case .random: return "随机"
        case .interaction: return "互动"
        case .timer: return "计时"
        case .sound: return "音效"
        case .note: return "笔记"
        }
    }
    var icon: String {
        switch self {
        case .checkin: return "person.badge.plus"
        case .group: return "person.3"
        case .score: return "star"
        case .random: return "dice"
        case .interaction: return "bubble.left.and.bubble.right"
        case .timer: return "timer"
        case .sound: return "speaker.wave.2"
        case .note: return "note.text"
        }
    }
    var sheetStyle: ImprovSheetStyle {
        switch self {
        case .random, .timer, .sound, .note: return .compact
        case .checkin, .group, .score, .interaction: return .scrollable
        }
    }
    var layoutKind: LiveToolLayoutKind {
        switch self {
        case .checkin, .group, .score, .interaction, .note: return .workspace
        case .random, .timer, .sound: return .dock
        }
    }
}

enum LiveToolLayoutKind {
    case workspace
    case dock
}

private enum LiveToolPresentation {
    case sheet
    case workspace
    case dock

    var isEmbedded: Bool { self != .sheet }
    var usesExpandedContent: Bool { self != .sheet }
}

private enum LiveSheetDestination: Identifiable {
    case tool(LiveTool)
    case toolbox
    case end

    var id: String {
        switch self {
        case .tool(let tool): return "tool-\(tool.id)"
        case .toolbox: return "toolbox"
        case .end: return "end"
        }
    }
}

struct LiveView: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.horizontalSizeClass) private var horizontalSizeClass
    @Environment(\.dismiss) private var dismiss
    @State private var inspectorTool: LiveTool = .checkin
    @State private var presentedSheet: LiveSheetDestination?
    @StateObject private var toolState = LiveToolState()
    @State private var phaseTimer = LiveTimerState(mode: .countDown)
    @State private var confirmsAbandon = false
    @AppStorage(AppPreferenceKey.swipeForwardEnabled) private var swipeForwardEnabled = true
    @AppStorage(AppPreferenceKey.swipeBackEnabled) private var swipeBackEnabled = true
    @AppStorage(AppPreferenceKey.doubleTapDelayEnabled) private var doubleTapDelayEnabled = true
    @AppStorage(AppPreferenceKey.timerAlertEnabled) private var timerAlertEnabled = true
    private let clock = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        Group {
            if let session = store.activeSession {
                NavigationStack {
                    GeometryReader { geometry in
                        if horizontalSizeClass == .regular && geometry.size.width >= 700 {
                            adaptivePadLayout(session, width: geometry.size.width)
                        } else {
                            liveBody(session, showsBottomControls: true, maxContentWidth: nil)
                        }
                    }
                    .navigationTitle(session.plan.name)
                    .navigationBarTitleDisplayMode(.inline)
                    .toolbar {
                        ToolbarItem(placement: .cancellationAction) {
                            Button("退出现场") { confirmsAbandon = true }
                                .disabled(store.isLiveMutating)
                        }
                        ToolbarItem(placement: .primaryAction) {
                            Button("结束培训", role: .destructive) { presentedSheet = .end }
                        }
                    }
                    .sheet(item: $presentedSheet) { destination in
                        switch destination {
                        case .tool(let tool):
                            NavigationStack {
                                LiveToolPanel(tool: tool, state: toolState, presentation: .sheet)
                                    .toolbar { ToolbarItem(placement: .topBarTrailing) { SheetCloseButton() } }
                            }
                            .improvLiveSheetStyle(tool.sheetStyle)
                        case .toolbox:
                            NavigationStack {
                                LiveToolbox()
                                    .navigationDestination(for: LiveTool.self) { tool in
                                        LiveToolPanel(tool: tool, state: toolState, presentation: .sheet)
                                            .toolbar { ToolbarItem(placement: .topBarTrailing) { SheetCloseButton() } }
                                    }
                            }
                            .improvLiveSheetStyle(.content)
                        case .end:
                            EndSessionView(session: session)
                        }
                    }
                    .toolbarBackground(ImprovStyle.liveBackground, for: .navigationBar)
                    .toolbarBackground(.visible, for: .navigationBar)
                    .toolbarColorScheme(.dark, for: .navigationBar)
                }
            } else {
                EmptyState(title: "尚未开课", symbol: "play.circle", detail: "从首页选择已确认方案开始培训", fillsAvailableSpace: true)
            }
        }
        .onReceive(clock) { _ in tickTimers() }
        .onChange(of: store.activeSession?.id) { _ in resetPhaseTimerToCurrent() }
        .onChange(of: store.activeSession?.currentPhaseIndex) { _ in resetPhaseTimerToCurrent() }
        .onChange(of: store.activeSession?.status) { status in if status != nil && status != .running { dismiss() } }
        .alert("现场操作未完成", isPresented: errorPresented) {
            Button("知道了") { store.clearError() }
        } message: {
            Text(store.errorMessage ?? "请稍后重试")
        }
        .alert("确认退出现场？", isPresented: $confirmsAbandon) {
            Button("继续培训", role: .cancel) {}
            Button("确认返回", role: .destructive) {
                Task {
                    if await store.abandonActiveSession() { dismiss() }
                }
            }
        } message: {
            Text("退出后不会保留本次现场数据，方案会回退到已确认状态。")
        }
        .improvSecondaryScreen()
    }

    @ViewBuilder
    private func adaptivePadLayout(_ session: TrainingSession, width: CGFloat) -> some View {
        VStack(spacing: 0) {
            LivePadToolStrip(selection: $inspectorTool)

            if width >= 1100 && inspectorTool.layoutKind == .workspace {
                let toolWidth = min(720, max(520, width * 0.54))
                HStack(spacing: 0) {
                    liveBody(session, showsBottomControls: false, maxContentWidth: nil)
                        .frame(minWidth: 480)
                    Divider()
                    LiveToolPanel(
                        tool: inspectorTool,
                        state: toolState,
                        presentation: .workspace,
                        showsNavigationTitle: false
                    )
                    .frame(width: toolWidth)
                    .background(Color(.systemBackground))
                }
            } else {
                liveBody(
                    session,
                    showsBottomControls: false,
                    embeddedTool: inspectorTool,
                    maxContentWidth: width >= 1100 ? 920 : nil
                )
            }
        }
    }

    private func liveBody(
        _ session: TrainingSession,
        showsBottomControls: Bool,
        embeddedTool: LiveTool? = nil,
        maxContentWidth: CGFloat?
    ) -> some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    LiveHeader(session: session, mutation: store.liveMutation)
                    Text(session.currentPhase.name)
                        .font(.title.bold())
                        .foregroundStyle(ImprovStyle.livePrimaryText)
                        .frame(maxWidth: .infinity)
                        .multilineTextAlignment(.center)
                    LivePhaseActivity(phase: session.currentPhase)
                    LivePhaseTimerCard(
                        timer: $phaseTimer,
                        doubleTapDelayEnabled: doubleTapDelayEnabled,
                        reset: resetPhaseTimerToCurrent,
                        addTime: addFiveMinutes
                    )
                    LiveReminders(reminders: session.currentPhase.reminders)
                    if let embeddedTool {
                        LiveToolPanel(
                            tool: embeddedTool,
                            state: toolState,
                            presentation: .dock,
                            showsNavigationTitle: false
                        )
                        .id("live-tool-workspace")
                    }
                }
                .frame(maxWidth: maxContentWidth ?? .infinity)
                .frame(maxWidth: .infinity)
                .padding()
            }
            .onChange(of: embeddedTool) { tool in
                guard tool != nil else { return }
                withAnimation(.easeInOut(duration: 0.2)) {
                    proxy.scrollTo("live-tool-workspace", anchor: .top)
                }
            }
        }
        .safeAreaInset(edge: .bottom) {
            VStack(spacing: 12) {
                if showsBottomControls {
                    LiveQuickActions(open: openCompactTool)
                }
                LivePhaseNavigator(session: session, isBusy: store.isLiveMutating, previous: { movePhase(-1) }, next: nextPhase)
            }
            .padding(.horizontal)
            .padding(.top, 22)
            .padding(.bottom, 6)
            .background(
                LinearGradient(
                    colors: [ImprovStyle.liveBackground.opacity(0), ImprovStyle.liveBackground.opacity(0.96), ImprovStyle.liveBackground],
                    startPoint: .top,
                    endPoint: .center
                )
                .ignoresSafeArea()
            )
        }
        .background(ImprovStyle.liveBackground.ignoresSafeArea())
        .foregroundStyle(ImprovStyle.livePrimaryText)
        .simultaneousGesture(DragGesture(minimumDistance: 30).onEnded { handleSwipe($0, session: session) })
        .onAppear { resetPhaseTimerToCurrent() }
    }

    private var errorPresented: Binding<Bool> {
        Binding(get: { store.errorMessage != nil }, set: { if !$0 { store.clearError() } })
    }

    private func openCompactTool(_ tool: LiveTool) {
        if [.checkin, .group, .score].contains(tool) { presentedSheet = .tool(tool) }
        else { presentedSheet = .toolbox }
    }

    private func movePhase(_ delta: Int) {
        guard let session = store.activeSession else { return }
        let target = min(max(0, session.currentPhaseIndex + delta), session.plan.phases.count - 1)
        guard target != session.currentPhaseIndex else { return }
        Task { _ = await store.changePhase(to: target) }
    }

    private func nextPhase() {
        guard let session = store.activeSession else { return }
        if session.currentPhaseIndex == session.plan.phases.count - 1 { presentedSheet = .end }
        else { movePhase(1) }
    }

    private func handleSwipe(_ value: DragGesture.Value, session: TrainingSession) {
        guard let action = horizontalSwipeAction(horizontalDistance: Double(value.translation.width), verticalDistance: Double(value.translation.height)) else { return }
        guard action == .next ? swipeForwardEnabled : swipeBackEnabled else { return }
        guard let target = phaseIndex(after: action, currentIndex: session.currentPhaseIndex, phaseCount: session.plan.phases.count) else { return }
        Task { _ = await store.changePhase(to: target) }
    }

    private func resetPhaseTimerToCurrent() {
        guard let session = store.activeSession else { return }
        guard let seconds = phaseDurationSeconds(at: session.currentPhaseIndex, phases: session.plan.phases) else { return }
        phaseTimer.reset(durationSeconds: seconds)
    }

    private func addFiveMinutes() { phaseTimer.add(seconds: 300) }

    private func tickTimers() {
        let phaseCompleted = phaseTimer.tick()
        let toolCompleted = toolState.tickTimer()
        if phaseCompleted || toolCompleted { TimerAlertPlayer.shared.play(isEnabled: timerAlertEnabled) }
    }
}

private struct LiveHeader: View {
    let session: TrainingSession
    let mutation: String?
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("环节 \(session.currentPhaseIndex + 1)/\(session.plan.phases.count)")
                    .foregroundStyle(ImprovStyle.liveSecondaryText)
                Spacer()
                if let mutation { ProgressView().controlSize(.small).tint(.white); Text(mutation).font(.caption).foregroundStyle(ImprovStyle.liveSecondaryText) }
                else { Label("进行中", systemImage: "circle.fill").font(.caption.bold()).foregroundStyle(ImprovStyle.success) }
            }
            ProgressView(value: Double(session.currentPhaseIndex + 1), total: Double(max(session.plan.phases.count, 1)))
                .tint(.white)
                .background(ImprovStyle.liveSecondaryText.opacity(0.25), in: Capsule())
        }
    }
}

private struct LivePhaseActivity: View {
    let phase: SessionPhase

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("本环节活动").font(.headline)
            Text(phase.activityNames.isEmpty ? "当前环节未关联活动" : phase.activityNames.joined(separator: "、"))
                .font(.subheadline)
                .foregroundStyle(ImprovStyle.liveSecondaryText)
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(ImprovStyle.liveSurface, in: RoundedRectangle(cornerRadius: 14))
    }
}

private struct LivePhaseTimerCard: View {
    @Binding var timer: LiveTimerState
    let doubleTapDelayEnabled: Bool
    let reset: () -> Void
    let addTime: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text(formatTimerSeconds(timer.displaySeconds))
                .font(.system(size: 56, weight: .bold, design: .rounded).monospacedDigit())
                .foregroundStyle(timer.isRunning ? ImprovStyle.blue : ImprovStyle.livePrimaryText)
                .minimumScaleFactor(0.55)
                .lineLimit(1)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 6)
                .contentShape(Rectangle())
                .gesture(
                    ExclusiveGesture(TapGesture(count: 2), TapGesture(count: 1))
                        .onEnded { value in
                            switch value {
                            case .first:
                                applyLiveTimerTap(.delay, doubleTapDelayEnabled: doubleTapDelayEnabled, timer: &timer)
                            case .second:
                                applyLiveTimerTap(.primary, doubleTapDelayEnabled: doubleTapDelayEnabled, timer: &timer)
                            }
                        }
                )
                .accessibilityLabel("本环节剩余时间 \(formatTimerSeconds(timer.displaySeconds))")
                .accessibilityAction(named: "延长 5 分钟", addTime)
            ProgressView(value: Double(timer.elapsedSeconds), total: Double(max(timer.durationSeconds, 1)))
                .tint(ImprovStyle.blue)
                .background(ImprovStyle.liveSecondaryText.opacity(0.22), in: Capsule())
            Text(timerHint)
                .font(.caption)
                .foregroundStyle(ImprovStyle.liveSecondaryText)
                .frame(maxWidth: .infinity)
            HStack {
                Button("重置", action: reset).buttonStyle(.bordered)
                Button("+5 分钟", action: addTime).buttonStyle(.bordered)
                Spacer()
                Button(timer.isRunning ? "暂停" : "开始") { timer.toggleRunning() }.buttonStyle(.borderedProminent)
            }
            .tint(ImprovStyle.blue)
        }
    }

    private var timerHint: String {
        if timer.displaySeconds == 0 { return "本环节时间已到" }
        if timer.isRunning { return doubleTapDelayEnabled ? "点击暂停，双击延时 5 分钟" : "点击暂停" }
        return doubleTapDelayEnabled ? "点击开始，双击延时 5 分钟" : "点击开始"
    }
}

private struct LiveReminders: View {
    let reminders: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Label("关键提醒", systemImage: "list.bullet.clipboard")
                .font(.headline)
                .foregroundStyle(ImprovStyle.blue)
            if reminders.isEmpty {
                Text("当前环节暂无关键提醒")
                    .foregroundStyle(ImprovStyle.liveSecondaryText)
            } else {
                ForEach(reminders, id: \.self) { reminder in
                    HStack(alignment: .firstTextBaseline, spacing: 10) {
                        Text("•").foregroundStyle(ImprovStyle.blue)
                        Text(reminder).foregroundStyle(ImprovStyle.livePrimaryText.opacity(0.84))
                    }
                }
            }
        }
        .padding()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(ImprovStyle.liveReminderSurface, in: RoundedRectangle(cornerRadius: 14))
    }
}

private struct LivePadToolStrip: View {
    @Binding var selection: LiveTool

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 10) {
                ForEach(LiveTool.allCases) { tool in
                    Button { selection = tool } label: {
                        VStack(spacing: 5) {
                            Image(systemName: tool.icon)
                                .font(.title3)
                            Text(tool.title)
                                .font(.subheadline.bold())
                                .lineLimit(1)
                        }
                        .foregroundStyle(selection == tool ? Color.white : ImprovStyle.liveSecondaryText)
                        .frame(minWidth: 76, minHeight: 56)
                        .padding(.horizontal, 4)
                        .background(
                            selection == tool ? ImprovStyle.blue : ImprovStyle.liveSurface,
                            in: RoundedRectangle(cornerRadius: 13)
                        )
                    }
                    .buttonStyle(.plain)
                    .accessibilityLabel("现场工具：\(tool.title)")
                    .accessibilityAddTraits(selection == tool ? .isSelected : [])
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 10)
        }
        .background(ImprovStyle.liveBackground)
        .overlay(alignment: .bottom) { Divider().overlay(ImprovStyle.liveSecondaryText.opacity(0.2)) }
    }
}

private struct LiveQuickActions: View {
    @Environment(\.dynamicTypeSize) private var dynamicTypeSize
    let open: (LiveTool) -> Void
    var body: some View {
        LazyVGrid(columns: columns, spacing: 10) {
            quick(.checkin, title: "签到", icon: LiveTool.checkin.icon)
            quick(.group, title: "分组", icon: LiveTool.group.icon)
            quick(.score, title: "积分", icon: LiveTool.score.icon)
            quick(.random, title: "工具箱", icon: "square.grid.2x2")
        }
    }

    private var columns: [GridItem] {
        Array(repeating: GridItem(.flexible(), spacing: 10), count: dynamicTypeSize.isAccessibilitySize ? 2 : 4)
    }

    private func quick(_ tool: LiveTool, title: String, icon: String) -> some View {
        Button { open(tool) } label: {
            VStack(spacing: 6) {
                Image(systemName: icon).font(.title3).foregroundStyle(ImprovStyle.blue)
                Text(title).font(.subheadline.bold()).foregroundStyle(ImprovStyle.secondaryText).lineLimit(1).minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity, minHeight: 62)
            .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 14))
        }
        .buttonStyle(.plain)
    }
}

private struct LivePhaseNavigator: View {
    let session: TrainingSession
    let isBusy: Bool
    let previous: () -> Void
    let next: () -> Void
    var body: some View {
        HStack(spacing: 12) {
            Button("上一环节", action: previous)
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(ImprovStyle.liveSurface, in: RoundedRectangle(cornerRadius: 14))
                .opacity(session.currentPhaseIndex == 0 ? 0.42 : 1)
                .disabled(isBusy || session.currentPhaseIndex == 0)
            Button(session.currentPhaseIndex == session.plan.phases.count - 1 ? "结束培训" : "下一环节", action: next)
                .frame(maxWidth: .infinity, minHeight: 50)
                .background(ImprovStyle.blue, in: RoundedRectangle(cornerRadius: 14))
                .disabled(isBusy)
        }
        .buttonStyle(.plain)
        .font(.headline)
        .foregroundStyle(.white)
    }
}

@MainActor
private final class LiveToolState: ObservableObject {
    @Published var participantName = ""
    @Published var sessionEntry: LiveEntryCode?
    @Published var groupMethod = "average"
    @Published var teamCount = 2
    @Published var groupPreview = [TrainingGroup]()
    @Published var scoreMode = "simple"
    @Published var scoreReasons = [String: String]()
    @Published var randomType = "actor"
    @Published var allowRepeatPick = false
    @Published var interactionType = "wordcloud"
    @Published var interactionTitle = "现场词云"
    @Published var voteOptions = "选项A\n选项B\n选项C"
    @Published var selectedInteractionEntry: LiveEntryCode?
    @Published var selectedInteractionStats: LiveInteractionStats?
    @Published var selectedInteractionID: String?
    @Published var timerMode = "countup"
    @Published var selectedMinutes = 5
    @Published var timer = LiveTimerState(mode: .countUp)
    @Published var noteContent = ""

    func setTimerMode(_ mode: String) { timerMode = mode; timer.setMode(mode == "countdown" ? .countDown : .countUp, durationSeconds: mode == "countdown" ? selectedMinutes * 60 : 0) }
    func setCountdownMinutes(_ minutes: Int) { selectedMinutes = minutes; if timerMode == "countdown" { timer.reset(durationSeconds: minutes * 60) } }
    func resetTimer() { timer.reset(durationSeconds: timerMode == "countdown" ? selectedMinutes * 60 : 0) }
    func tickTimer() -> Bool { timer.tick() }
}

private struct LiveToolbox: View {
    var body: some View {
        ScrollView {
            LazyVGrid(columns: [GridItem(.flexible(), spacing: 12), GridItem(.flexible(), spacing: 12)], spacing: 12) {
                ForEach(LiveTool.allCases) { tool in
                    NavigationLink(value: tool) {
                        HStack(spacing: 12) {
                            Image(systemName: tool.icon)
                                .font(.title3)
                                .foregroundStyle(ImprovStyle.blue)
                                .frame(width: 42, height: 42)
                                .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 12))
                            Text(tool.title)
                                .font(.headline)
                                .foregroundStyle(.primary)
                            Spacer(minLength: 0)
                        }
                        .padding()
                        .frame(maxWidth: .infinity, minHeight: 88)
                        .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 14))
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding()
        }
        .navigationTitle("工具箱")
        .toolbar { ToolbarItem(placement: .topBarTrailing) { SheetCloseButton() } }
    }
}

private struct LiveToolContainer<Content: View, Footer: View>: View {
    let tool: LiveTool
    let presentation: LiveToolPresentation
    @ViewBuilder let content: Content
    @ViewBuilder let footer: Footer

    var body: some View {
        switch presentation {
        case .sheet:
            ScrollView { content.padding() }
                .safeAreaInset(edge: .bottom) { footer }
        case .workspace:
            VStack(spacing: 0) {
                header
                Divider()
                ScrollView { content.padding() }
                footer
            }
        case .dock:
            VStack(alignment: .leading, spacing: 0) {
                header
                Divider()
                content.padding()
                Spacer(minLength: 0)
                footer
            }
            .frame(
                maxWidth: .infinity,
                minHeight: tool.layoutKind == .workspace ? 380 : 300,
                alignment: .top
            )
            .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 18))
            .clipShape(RoundedRectangle(cornerRadius: 18))
        }
    }

    private var header: some View {
        HStack(spacing: 12) {
            Image(systemName: tool.icon)
                .font(.title3)
                .foregroundStyle(ImprovStyle.blue)
                .frame(width: 38, height: 38)
                .background(Color(.secondarySystemBackground), in: RoundedRectangle(cornerRadius: 11))
            VStack(alignment: .leading, spacing: 2) {
                Text(tool.title).font(.headline)
                Text(tool.layoutKind == .workspace ? "现场工作区" : "快捷工具台")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
        }
        .foregroundStyle(.primary)
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
    }
}

private struct LiveResponsivePair<Leading: View, Trailing: View>: View {
    let expanded: Bool
    @ViewBuilder let leading: Leading
    @ViewBuilder let trailing: Trailing

    var body: some View {
        if expanded {
            ViewThatFits(in: .horizontal) {
                HStack(alignment: .top, spacing: 18) {
                    leading.frame(minWidth: 250, maxWidth: .infinity, alignment: .topLeading)
                    Divider()
                    trailing.frame(minWidth: 250, maxWidth: .infinity, alignment: .topLeading)
                }
                VStack(alignment: .leading, spacing: 18) { leading; Divider(); trailing }
            }
        } else {
            VStack(alignment: .leading, spacing: 18) { leading; Divider(); trailing }
        }
    }
}

private struct LiveToolPanel: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    let tool: LiveTool
    @ObservedObject var state: LiveToolState
    var presentation: LiveToolPresentation = .sheet
    var showsNavigationTitle = true
    @State private var confirmsScoreReset = false

    var body: some View {
        LiveToolContainer(tool: tool, presentation: presentation) {
            Group {
                switch tool {
                case .checkin: checkin
                case .group: group
                case .score: score
                case .random: random
                case .interaction: interaction
                case .timer: timer
                case .sound: sound
                case .note: note
                }
            }
            .frame(maxWidth: .infinity, alignment: .topLeading)
        } footer: {
            footer
        }
        .modifier(LiveToolNavigationTitleModifier(title: showsNavigationTitle ? tool.title : nil))
        .disabled(store.isLiveMutating)
        .overlay(alignment: .top) { if store.isLiveMutating { ProgressView(store.liveMutation ?? "处理中").padding(8).background(.thinMaterial, in: Capsule()) } }
        .confirmationDialog("确认清空所有队伍积分和积分流水？", isPresented: $confirmsScoreReset, titleVisibility: .visible) {
            Button("确认重置", role: .destructive, action: resetScores)
            Button("取消", role: .cancel) {}
        }
    }

    @ViewBuilder
    private var footer: some View {
        switch tool {
        case .checkin:
            if presentation == .sheet {
                SheetPrimaryActionBar(title: "结束签到") { dismiss() }
            } else {
                SheetPrimaryActionBar(title: "刷新签到名单") { Task { _ = await store.refreshParticipants() } }
            }
        case .group:
            HStack(spacing: 12) {
                footerButton("生成分组", action: generateGroupPreview)
                footerButton("确认分组", isProminent: true, isDisabled: currentGroups.isEmpty, action: confirmGroups)
            }
            .padding(.horizontal)
            .padding(.vertical, 10)
            .background(.bar)
        case .score:
            if !(store.activeSession?.groups.isEmpty ?? true) {
                SheetPrimaryActionBar(title: "重置积分") { confirmsScoreReset = true }
                    .tint(ImprovStyle.danger)
            }
        case .timer:
            HStack(spacing: 12) {
                footerButton("重置", action: state.resetTimer)
                footerButton(state.timer.isRunning ? "暂停" : "开始", isProminent: true) { state.timer.toggleRunning() }
            }
            .padding(.horizontal)
            .padding(.vertical, 10)
            .background(.bar)
        case .note:
            SheetPrimaryActionBar(title: "保存笔记", isDisabled: state.noteContent.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty) {
                Task {
                    if await store.saveLiveNote(content: state.noteContent) { state.noteContent = "" }
                }
            }
        case .interaction:
            if presentation.isEmbedded {
                SheetPrimaryActionBar(title: "创建互动") { createInteraction() }
            }
        case .random, .sound:
            EmptyView()
        }
    }

    @ViewBuilder
    private func footerButton(_ title: String, isProminent: Bool = false, isDisabled: Bool = false, action: @escaping () -> Void) -> some View {
        let button = Button(title, action: action)
            .font(.headline)
            .frame(maxWidth: .infinity, minHeight: 48)
            .disabled(isDisabled)
        if isProminent {
            button.buttonStyle(.borderedProminent)
        } else {
            button.buttonStyle(.bordered)
        }
    }

    private var checkin: some View {
        VStack(alignment: .leading, spacing: 14) {
            HStack {
                VStack(alignment: .leading) { Text("已签到 \(store.activeSession?.participants.count ?? 0) 人").font(.title3.bold()); Text("预计 \(store.activeSession?.plan.participantCount ?? 0) 人").foregroundStyle(.secondary) }
                Spacer()
                Button("刷新") { Task { _ = await store.refreshParticipants() } }
            }
            HStack { TextField("手动补录姓名", text: $state.participantName).textFieldStyle(.roundedBorder); Button("签到") { manualCheckin() }.buttonStyle(.borderedProminent) }
            Button { Task { state.sessionEntry = await store.sessionEntry() } } label: { Label("生成参与者签到入口", systemImage: "qrcode") }.buttonStyle(.bordered)
            if let entry = state.sessionEntry { EntryCodeView(entry: entry) }
            Divider()
            if let participants = store.activeSession?.participants, !participants.isEmpty {
                ForEach(participants) { participant in
                    HStack { Image(systemName: "checkmark.circle.fill").foregroundStyle(ImprovStyle.success); Text(participant.name); Spacer(); if let date = participant.checkedInAt { Text(date, style: .time).font(.caption).foregroundStyle(.secondary) } }
                    Divider()
                }
            } else { EmptyState(title: "暂无签到", symbol: "person.crop.circle.badge.questionmark") }
        }
    }

    private var group: some View {
        VStack(alignment: .leading, spacing: 14) {
            Picker("分组方式", selection: $state.groupMethod) { Text("按人数均分").tag("average"); Text("随机分组").tag("random") }.pickerStyle(.segmented)
            Stepper("队伍数量：\(state.teamCount)", value: $state.teamCount, in: 2...10)
            if currentGroups.isEmpty {
                EmptyState(title: "尚未生成分组", symbol: "person.3")
            } else {
                LazyVGrid(columns: adaptiveCardColumns, spacing: 12) {
                    ForEach(currentGroups) { group in groupRow(group) }
                }
            }
        }
    }

    private var score: some View {
        VStack(alignment: .leading, spacing: 14) {
            Picker("积分模式", selection: $state.scoreMode) { Text("简化模式").tag("simple"); Text("详细模式").tag("detailed") }.pickerStyle(.segmented)
            if let groups = store.activeSession?.groups, !groups.isEmpty {
                LazyVGrid(columns: adaptiveCardColumns, spacing: 12) {
                    ForEach(groups) { group in
                        VStack(alignment: .leading, spacing: 8) {
                            HStack { Text(group.name).font(.headline); Spacer(); Text("\(group.score)").font(.title2.monospacedDigit()) }
                            if state.scoreMode == "detailed" { TextField("本次加减分原因", text: scoreReason(group.id)).textFieldStyle(.roundedBorder) }
                            HStack { Button("-1") { saveScore(groupID: group.id, delta: -1) }; Button("+1") { saveScore(groupID: group.id, delta: 1) }; Button("+5") { saveScore(groupID: group.id, delta: 5) } }.buttonStyle(.bordered)
                        }
                        .padding().background(.quaternary.opacity(0.25), in: RoundedRectangle(cornerRadius: 12))
                    }
                }
            } else { EmptyState(title: "请先完成分组", symbol: "person.3") }
        }
        .onAppear { state.scoreMode = store.activeSession?.scoreMode ?? "simple" }
    }

    private var random: some View {
        LiveResponsivePair(expanded: presentation.usesExpandedContent) {
            VStack(alignment: .leading, spacing: 14) {
                Picker("随机类型", selection: $state.randomType) { Text("抽演员").tag("actor"); Text("抽观众").tag("audience"); Text("抽题目").tag("topic") }.pickerStyle(.segmented)
                if state.randomType != "topic" { Toggle("允许重复抽取", isOn: $state.allowRepeatPick) }
                let result = store.activeSession?.randomState.pickedName ?? ""
                Text(result.isEmpty ? "等待抽取" : result)
                    .font(.system(size: presentation.isEmbedded ? 44 : 34, weight: .bold, design: .rounded))
                    .foregroundStyle(ImprovStyle.blue)
                    .frame(maxWidth: .infinity, minHeight: 90)
                    .background(.quaternary.opacity(0.2), in: RoundedRectangle(cornerRadius: 14))
                HStack {
                    Button("开始抽取", action: pickRandom).buttonStyle(.borderedProminent)
                    Button("重置记录", action: resetRandom).buttonStyle(.bordered)
                }
            }
        } trailing: {
            VStack(alignment: .leading, spacing: 10) {
                Text("最近结果").font(.headline)
                if let history = store.activeSession?.randomState.pickHistory, !history.isEmpty {
                    ForEach(history.prefix(10)) { item in HStack { Text(item.name); Spacer(); Text(item.pickedAt, style: .time).font(.caption).foregroundStyle(.secondary) } }
                } else {
                    Text("暂无抽取记录").foregroundStyle(.secondary).frame(maxWidth: .infinity, minHeight: 90)
                }
            }
        }
        .onAppear { state.randomType = store.activeSession?.randomState.randomTab ?? "actor"; state.allowRepeatPick = store.activeSession?.randomState.allowRepeatPick ?? false }
    }

    private var interaction: some View {
        LiveResponsivePair(expanded: presentation.usesExpandedContent) {
            VStack(alignment: .leading, spacing: 14) {
                Picker("互动类型", selection: $state.interactionType) { Text("词云").tag("wordcloud"); Text("投票").tag("vote"); Text("承诺").tag("promise") }.pickerStyle(.segmented)
                TextField("互动标题", text: $state.interactionTitle).textFieldStyle(.roundedBorder)
                if state.interactionType == "vote" { TextEditor(text: $state.voteOptions).frame(minHeight: 100).overlay(RoundedRectangle(cornerRadius: 8).stroke(.quaternary)); Text("每行一个选项，至少两项").font(.caption).foregroundStyle(.secondary) }
                if !presentation.isEmbedded { Button("创建互动") { createInteraction() }.buttonStyle(.borderedProminent) }
                if let entry = state.selectedInteractionEntry { EntryCodeView(entry: entry) }
                if let stats = state.selectedInteractionStats {
                    InteractionStatsView(stats: stats) { submissionID in
                        Task {
                            guard await store.reportInteractionSubmission(submissionID), let interactionID = state.selectedInteractionID else { return }
                            state.selectedInteractionStats = await store.interactionStats(interactionID)
                        }
                    }
                }
            }
        } trailing: {
            VStack(alignment: .leading, spacing: 12) {
                Text("互动记录").font(.headline)
                if store.activeSession?.interactions.isEmpty ?? true {
                    Text("暂无互动").foregroundStyle(.secondary).frame(maxWidth: .infinity, minHeight: 100)
                }
                ForEach(store.activeSession?.interactions ?? []) { item in
                    VStack(alignment: .leading, spacing: 8) {
                        HStack { VStack(alignment: .leading) { Text(item.title).font(.headline); Text("\(item.type) · \(item.status == "open" ? "进行中" : "已结束")").font(.caption).foregroundStyle(.secondary) }; Spacer() }
                        HStack { Button("入口") { Task { state.selectedInteractionEntry = await store.interactionEntry(item.id) } }; Button("统计") { state.selectedInteractionID = item.id; Task { state.selectedInteractionStats = await store.interactionStats(item.id) } }; if item.status == "open" { Button("关闭", role: .destructive) { Task { _ = await store.closeInteraction(item.id) } } } }.buttonStyle(.bordered)
                    }
                    .padding().background(.quaternary.opacity(0.25), in: RoundedRectangle(cornerRadius: 12))
                }
            }
        }
        .onChange(of: state.interactionType) { type in state.interactionTitle = ["wordcloud": "现场词云", "vote": "现场投票", "promise": "行动承诺"][type] ?? "现场互动" }
    }

    private var timer: some View {
        VStack(alignment: .leading, spacing: 14) {
            Picker("计时模式", selection: $state.timerMode) { Text("正计时").tag("countup"); Text("倒计时").tag("countdown") }.pickerStyle(.segmented).onChange(of: state.timerMode) { state.setTimerMode($0) }
            if state.timerMode == "countdown" { Picker("常用倒计时", selection: $state.selectedMinutes) { ForEach([1, 3, 5, 10, 15, 30], id: \.self) { Text("\($0) 分钟").tag($0) } }.onChange(of: state.selectedMinutes) { state.setCountdownMinutes($0) } }
            Text(formatTimerSeconds(state.timer.displaySeconds))
                .font(.system(size: presentation.isEmbedded ? 76 : 52, weight: .semibold, design: .rounded).monospacedDigit())
                .minimumScaleFactor(0.5)
                .lineLimit(1)
                .frame(maxWidth: .infinity, minHeight: presentation.isEmbedded ? 110 : nil)
            if state.timerMode == "countdown" { Button("+5 分钟") { state.timer.add(seconds: 300) }.buttonStyle(.bordered) }
        }
    }

    private var sound: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("音效只在培训师主动点击时播放，不产生网络请求。") .foregroundStyle(.secondary)
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                ForEach([("欢呼", "cheer"), ("鼓掌", "clap"), ("铃声", "bell"), ("主题", "theme")], id: \.1) { item in
                    Button { LiveSoundPlayer.shared.play(resource: item.1) } label: {
                        VStack(spacing: 10) {
                            Image(systemName: "play.circle.fill").font(.title)
                            Text(item.0).font(.headline)
                        }
                        .frame(maxWidth: .infinity, minHeight: presentation.isEmbedded ? 104 : 72)
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
    }

    private var note: some View {
        LiveResponsivePair(expanded: presentation.usesExpandedContent) {
            VStack(alignment: .leading, spacing: 14) {
                Text("当前环节：\(store.activeSession?.currentPhase.name ?? "--")").font(.subheadline).foregroundStyle(.secondary)
                TextEditor(text: $state.noteContent)
                    .frame(minHeight: presentation.isEmbedded ? 240 : 150)
                    .overlay(RoundedRectangle(cornerRadius: 10).stroke(.quaternary))
            }
        } trailing: {
            VStack(alignment: .leading, spacing: 12) {
                Text("历史笔记").font(.headline)
                if store.activeSession?.notes.isEmpty ?? true {
                    Text("暂无现场笔记").foregroundStyle(.secondary).frame(maxWidth: .infinity, minHeight: 100)
                }
                ForEach(store.activeSession?.notes ?? []) { note in VStack(alignment: .leading, spacing: 4) { HStack { Text(note.phaseName.isEmpty ? "现场" : note.phaseName).font(.caption.bold()); Spacer(); Text(note.createdAt, style: .time).font(.caption).foregroundStyle(.secondary) }; Text(note.content) }.padding().background(.quaternary.opacity(0.25), in: RoundedRectangle(cornerRadius: 12)) }
            }
        }
    }

    private var adaptiveCardColumns: [GridItem] {
        [GridItem(.adaptive(minimum: presentation.usesExpandedContent ? 220 : 260), spacing: 12, alignment: .top)]
    }

    private func manualCheckin() { Task { if await store.manualCheckin(name: state.participantName) { state.participantName = "" } } }
    private func scoreReason(_ id: String) -> Binding<String> { Binding(get: { state.scoreReasons[id, default: ""] }, set: { state.scoreReasons[id] = $0 }) }

    private func generateGroupPreview() {
        guard let participants = store.activeSession?.participants, !participants.isEmpty else { store.errorMessage = "请先完成参与者签到"; return }
        let source = state.groupMethod == "random" ? participants.shuffled() : participants
        state.groupPreview = (0..<state.teamCount).map { index in TrainingGroup(name: "第\(index + 1)组", members: source.enumerated().filter { $0.offset % state.teamCount == index }.map { $0.element.id }) }
    }

    private var currentGroups: [TrainingGroup] {
        state.groupPreview.isEmpty ? (store.activeSession?.groups ?? []) : state.groupPreview
    }

    private func confirmGroups() {
        let groups = currentGroups
        guard !groups.isEmpty else { return }
        Task {
            if await store.confirmGroups(LiveGroupState(teamCount: state.teamCount, groupMethod: state.groupMethod, groups: groups, isGrouped: true)) {
                state.groupPreview = []
            }
        }
    }

    private func groupRow(_ group: TrainingGroup) -> some View {
        let participants = store.activeSession?.participants ?? []
        let names = group.members.compactMap { id in participants.first(where: { $0.id == id })?.name ?? id }
        return VStack(alignment: .leading, spacing: 4) { Text(group.name).font(.headline); Text(names.isEmpty ? "暂无成员" : names.joined(separator: "、")).foregroundStyle(.secondary) }.padding().frame(maxWidth: .infinity, alignment: .leading).background(.quaternary.opacity(0.25), in: RoundedRectangle(cornerRadius: 12))
    }

    private func saveScore(groupID: String, delta: Int) {
        guard var session = store.activeSession, let index = session.groups.firstIndex(where: { $0.id == groupID }) else { return }
        session.groups[index].score = max(0, session.groups[index].score + delta)
        if state.scoreMode == "detailed" {
            let reason = state.scoreReasons[groupID, default: ""].trimmingCharacters(in: .whitespacesAndNewlines)
            session.scoreDetails[groupID, default: []].insert(ScoreEntry(groupID: groupID, delta: delta, reason: reason.isEmpty ? (delta >= 0 ? "现场加分" : "现场扣分") : reason), at: 0)
        }
        state.scoreReasons[groupID] = ""
        Task { _ = await store.updateScores(LiveScoreState(groups: session.groups, scoreMode: state.scoreMode, scoreDetails: session.scoreDetails)) }
    }

    private func resetScores() {
        guard var session = store.activeSession else { return }
        for index in session.groups.indices { session.groups[index].score = 0 }
        Task { _ = await store.updateScores(LiveScoreState(groups: session.groups, scoreMode: state.scoreMode, scoreDetails: [:])) }
    }

    private func pickRandom() {
        guard let session = store.activeSession else { return }
        var random = session.randomState
        random.randomTab = state.randomType; random.allowRepeatPick = state.allowRepeatPick
        let name: String
        let pickedID: String
        if state.randomType == "topic" {
            name = ["客户沟通", "临场反应", "团队协作", "情绪管理"].randomElement() ?? ""
            pickedID = UUID().uuidString
        } else {
            let pool = state.allowRepeatPick ? session.participants : session.participants.filter { !random.pickedIDs.contains($0.id) }
            guard let participant = pool.randomElement() else { store.errorMessage = "没有可抽取的参与者"; return }
            name = participant.name; pickedID = participant.id
            if !state.allowRepeatPick { random.pickedIDs.append(participant.id) }
        }
        random.pickedName = name; random.pickedParticipantID = state.randomType == "topic" ? "" : pickedID
        random.pickHistory.insert(RandomPickRecord(id: pickedID, name: name, type: state.randomType == "topic" ? "topic" : "participant"), at: 0)
        random.pickHistory = Array(random.pickHistory.prefix(50))
        Task { _ = await store.updateRandom(random) }
    }

    private func resetRandom() {
        var value = store.activeSession?.randomState ?? LiveRandomState()
        value.pickedIDs = []
        value.pickedName = ""
        value.pickedParticipantID = ""
        value.pickHistory = []
        Task { _ = await store.updateRandom(value) }
    }

    private func createInteraction() {
        let title = state.interactionTitle.trimmingCharacters(in: .whitespacesAndNewlines)
        let options = state.interactionType == "vote" ? state.voteOptions.split(separator: "\n").map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty } : []
        guard !title.isEmpty else { store.errorMessage = "请输入互动标题"; return }
        guard state.interactionType != "vote" || options.count >= 2 else { store.errorMessage = "投票至少需要 2 个选项"; return }
        Task { _ = await store.createInteraction(LiveInteractionDraft(title: title, type: state.interactionType, options: options)) }
    }
}

private struct LiveToolNavigationTitleModifier: ViewModifier {
    let title: String?

    @ViewBuilder
    func body(content: Content) -> some View {
        if let title {
            content.navigationTitle(title)
        } else {
            content
        }
    }
}

private struct EntryCodeView: View {
    let entry: LiveEntryCode
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let imageURL = entry.imageURL { AsyncImage(url: imageURL) { image in image.resizable().scaledToFit() } placeholder: { ProgressView() }.frame(maxWidth: 180, maxHeight: 180) }
            Text(entry.path).font(.caption).textSelection(.enabled)
            HStack {
                Button("复制路径") { UIPasteboard.general.string = entry.path }
                if let link = entry.urlLink { ShareLink(item: link) { Label("分享链接", systemImage: "square.and.arrow.up") } }
            }.buttonStyle(.bordered)
        }
        .padding().frame(maxWidth: .infinity, alignment: .leading).background(.quaternary.opacity(0.25), in: RoundedRectangle(cornerRadius: 12))
    }
}

private struct InteractionStatsView: View {
    let stats: LiveInteractionStats
    let report: (String) -> Void
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("已参与 \(stats.count) 人").font(.headline)
            ForEach(stats.optionStats, id: \.label) { Text("\($0.label)：\($0.count)") }
            ForEach(stats.words, id: \.text) { Text("\($0.text) × \($0.count)") }
            ForEach(stats.submissions) { submission in
                HStack(alignment: .top) {
                    Text(submission.content)
                    Spacer()
                    Button("举报并屏蔽", role: .destructive) {
                        report(submission.id)
                    }
                    .font(.caption)
                }
            }
        }
        .padding().frame(maxWidth: .infinity, alignment: .leading).background(.quaternary.opacity(0.25), in: RoundedRectangle(cornerRadius: 12))
    }
}

@MainActor
private final class LiveSoundPlayer {
    static let shared = LiveSoundPlayer()
    private var player: AVAudioPlayer?
    func play(resource: String) {
        guard let url = Bundle.main.url(forResource: resource, withExtension: "wav") else { UINotificationFeedbackGenerator().notificationOccurred(.success); return }
        do { player?.stop(); player = try AVAudioPlayer(contentsOf: url); player?.prepareToPlay(); player?.play() }
        catch { UINotificationFeedbackGenerator().notificationOccurred(.success) }
    }
}

private struct EndSessionView: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    let session: TrainingSession
    var body: some View {
        NavigationStack {
            List {
                Section("本场概览") { Text(session.plan.name).font(.headline); Text("\(session.participants.count) 人签到 · \(session.notes.count) 条笔记") }
                Section("结束后") { Text("结束成功后，场次将进入待复盘，方案进入已交付。") }
            }
            .navigationTitle("结束培训")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { SheetCloseButton() } }
            .safeAreaInset(edge: .bottom) {
                SheetPrimaryActionBar(title: store.liveMutation ?? "确认结束") {
                    Task { if await store.finishActiveSession() { dismiss() } }
                }
                .disabled(store.isLiveMutating)
            }
        }
        .improvSheetStyle(.compact)
    }
}

struct FeedbackView: View {
    let session: TrainingSession
    @State private var anonymous = true
    var body: some View {
        List {
            Section("反馈入口") { Toggle("匿名反馈", isOn: $anonymous); Text("开启后参与者无需展示姓名").font(.caption).foregroundStyle(.secondary); HStack { Image(systemName: "qrcode").font(.largeTitle).foregroundStyle(ImprovStyle.blue); VStack(alignment: .leading) { Text("参与者反馈码").font(.headline); Text("继续使用微信小程序完成反馈").foregroundStyle(.secondary) } } }
            Section("本场数据") { LabeledContent("已签到", value: "\(session.participants.count) 人"); LabeledContent("反馈回收", value: "等待参与者提交") }
        }
        .navigationTitle("反馈数据")
        .improvSecondaryScreen()
    }
}
