import SwiftUI
#if canImport(ImprovToolCore)
import ImprovToolCore
#endif

enum PrepareMode: String, CaseIterable, Identifiable, Hashable {
    case plans = "我的方案"
    case activities = "活动库"
    var id: String { rawValue }
}

enum PlanSource: String, CaseIterable, Hashable {
    case all = "全部"
    case myPlans = "我的方案"
    case personalTemplates = "个人模板"
    case publicTemplates = "公共模板"
}

struct PrepareEntry: Equatable {
    var mode: PrepareMode = .plans
    var source: PlanSource = .all
    var status: PlanStatus?
    var fallbackStatus: PlanStatus?

    static func myPlans(preferred: PlanStatus, fallback: PlanStatus? = nil) -> PrepareEntry {
        PrepareEntry(mode: .plans, source: .myPlans, status: preferred, fallbackStatus: fallback)
    }

    func resolved(using plans: [TrainingPlan]) -> PrepareEntry {
        guard let status, !plans.contains(where: { $0.status == status }), let fallbackStatus else { return self }
        var copy = self
        copy.status = fallbackStatus
        return copy
    }
}

private enum PrepareRoute: Hashable {
    case planEditor(TrainingPlan)
    case activityDetail(TrainingActivity)
    case activityEditor(TrainingActivity)
}

private enum PrepareSheet: Identifiable {
    case templatePicker

    var id: String {
        switch self {
        case .templatePicker: return "template-picker"
        }
    }
}

struct PrepareView: View {
    @EnvironmentObject private var store: AppStore
    @Binding var entry: PrepareEntry
    let onStartLive: () -> Void

    @State private var path = [PrepareRoute]()
    @State private var query = ""
    @State private var planType = "全部"
    @State private var activityScene = "全部"
    @State private var presentedSheet: PrepareSheet?
    @State private var pendingRoute: PrepareRoute?
    @State private var startingPlanID: String?

    private var visiblePlans: [TrainingPlan] {
        guard entry.source == .all || entry.source == .myPlans else { return [] }
        return store.plans.filter { plan in
            (entry.status == nil || plan.status == entry.status) &&
            (planType == "全部" || plan.type == planType) &&
            (query.isEmpty || plan.name.localizedCaseInsensitiveContains(query) || plan.customerName.localizedCaseInsensitiveContains(query))
        }
    }

    private var visibleTemplates: [TrainingTemplate] {
        let templates: [TrainingTemplate]
        switch entry.source {
        case .all:
            templates = []
        case .personalTemplates:
            templates = store.templates
        case .publicTemplates:
            templates = TrainingTemplate.starterCatalog
        case .myPlans:
            templates = []
        }
        return templates.filter { template in
            (planType == "全部" || template.type == planType) &&
            (query.isEmpty || template.name.localizedCaseInsensitiveContains(query))
        }
    }

    private var visibleActivities: [TrainingActivity] {
        store.activities.filter { activity in
            (activityScene == "全部" || activity.scenes.contains(activityScene)) &&
            (query.isEmpty || activity.name.localizedCaseInsensitiveContains(query) || activity.scene.localizedCaseInsensitiveContains(query))
        }
    }

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 14) {
                    Picker("内容", selection: $entry.mode) {
                        ForEach(PrepareMode.allCases) { Text($0.rawValue).tag($0) }
                    }
                    .pickerStyle(.segmented)

                    HStack {
                        Spacer()
                        Button { createContent() } label: {
                            Label(entry.mode == .plans ? "新建方案" : "新建活动", systemImage: "plus")
                        }
                        .font(.headline)
                    }

                    searchField
                    if entry.mode == .plans { plansContent } else { activitiesContent }
                }
                .padding()
            }
            .background(ImprovStyle.surface)
            .toolbar(.hidden, for: .navigationBar)
            .refreshable { await store.refresh() }
            .navigationDestination(for: PrepareRoute.self) { route in
                switch route {
                case .planEditor(let plan):
                    PlanEditorView(plan: plan)
                case .activityDetail(let activity):
                    ActivityDetailView(activity: activity)
                case .activityEditor(let activity):
                    ActivityEditor(activity: activity)
                }
            }
        }
        .sheet(item: $presentedSheet, onDismiss: openPendingRoute) { sheet in
            switch sheet {
            case .templatePicker:
                TemplatePicker(
                    onSelectPlan: { plan in
                        pendingRoute = .planEditor(plan)
                        presentedSheet = nil
                    }
                )
            }
        }
    }

    private var searchField: some View {
        HStack {
            Image(systemName: "magnifyingglass")
            TextField(entry.mode == .plans ? "搜索方案/模板名称或客户名" : "搜索活动名称或分类", text: $query)
        }
        .padding(12)
        .background(.background, in: RoundedRectangle(cornerRadius: 16))
    }

    private var plansContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            planFilters
            ForEach(visiblePlans) { plan in
                PlanCard(
                    plan: plan,
                    open: { path.append(.planEditor(plan)) },
                    start: { start(plan) },
                    isStarting: startingPlanID == plan.id
                )
                .swipeActions(edge: .trailing) {
                    if plan.status == .draft {
                        Button("确认") {
                            var copy = plan
                            copy.status = .confirmed
                            Task { _ = await store.save(plan: copy) }
                        }
                        .tint(ImprovStyle.success)
                    }
                }
            }
            ForEach(visibleTemplates) { template in
                Button { path.append(.planEditor(store.plan(from: template))) } label: {
                    Card { TemplateRow(title: template.name, tag: template.tag, detail: template.flowText) }
                }
                .buttonStyle(.plain)
            }
            if visiblePlans.isEmpty && visibleTemplates.isEmpty {
                EmptyState(title: "暂无方案", symbol: "doc.badge.plus", detail: "从公共模板或空白方案开始")
            }
        }
    }

    private var activitiesContent: some View {
        VStack(alignment: .leading, spacing: 12) {
            activityFilters
            ForEach(visibleActivities) { activity in
                Button { path.append(.activityDetail(activity)) } label: { ActivityCard(activity: activity) }
                    .buttonStyle(.plain)
            }
            if visibleActivities.isEmpty {
                EmptyState(title: "暂无活动", symbol: "figure.play", detail: "点击新建活动开始沉淀")
            }
        }
    }

    private var planFilters: some View {
        VStack(alignment: .leading, spacing: 8) {
            FilterChips(
                title: "来源",
                choices: PlanSource.allCases.map(\.rawValue),
                selected: Binding(
                    get: { entry.source.rawValue },
                    set: { value in
                        guard let source = PlanSource(rawValue: value) else { return }
                        entry.source = source
                        if source == .personalTemplates || source == .publicTemplates { entry.status = nil }
                    }
                )
            )
            FilterChips(title: "类型", choices: ["全部", "企业培训", "团建活动", "即兴演出", "即兴培训"], selected: $planType)
            HStack {
                Text("状态").foregroundStyle(.secondary)
                ForEach([PlanStatus.draft, .confirmed, .delivered, .reviewed], id: \.self) { value in
                    Button(value.title) { entry.status = entry.status == value ? nil : value }
                        .buttonStyle(.bordered)
                        .tint(entry.status == value ? ImprovStyle.blue : .gray)
                }
                Spacer()
            }
        }
    }

    private var activityFilters: some View {
        FilterChips(title: "场景", choices: ["全部", "团队融合", "协作沟通", "领导力", "创新思维", "情绪管理"], selected: $activityScene)
    }

    private func createContent() {
        if entry.mode == .plans {
            presentedSheet = .templatePicker
        } else {
            path.append(.activityEditor(TrainingActivity(id: "", name: "", scenes: [], durationMinutes: 0)))
        }
    }

    private func start(_ plan: TrainingPlan) {
        guard startingPlanID == nil else { return }
        startingPlanID = plan.id
        Task { @MainActor in
            let started = await store.start(plan: plan)
            if started {
                startingPlanID = nil
                onStartLive()
            } else {
                startingPlanID = nil
            }
        }
    }

    private func openPendingRoute() {
        guard let pendingRoute else { return }
        path.append(pendingRoute)
        self.pendingRoute = nil
    }
}

private struct FilterChips: View {
    let title: String
    let choices: [String]
    @Binding var selected: String

    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack {
                Text(title).foregroundStyle(.secondary)
                ForEach(choices, id: \.self) { value in
                    Button(value) { selected = value }
                        .buttonStyle(.bordered)
                        .tint(selected == value ? ImprovStyle.blue : .gray)
                }
            }
        }
    }
}

private struct PlanCard: View {
    let plan: TrainingPlan
    let open: () -> Void
    let start: () -> Void
    let isStarting: Bool

    var body: some View {
        Card {
            VStack(alignment: .leading, spacing: 10) {
                HStack {
                    Text(plan.name).font(.headline)
                    Spacer()
                    Text(plan.status.title)
                        .font(.caption.bold())
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .foregroundStyle(statusColor)
                        .background(statusColor.opacity(0.12), in: Capsule())
                }
                Text("\(plan.type) · \(plan.customerName.isEmpty ? "未填写客户" : plan.customerName) · \(plan.participantCount) 人")
                    .foregroundStyle(.secondary)
                Text(plan.phases.map(\.name).joined(separator: " -> "))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                HStack {
                    Text("\(plan.phases.count) 个环节").font(.caption).foregroundStyle(.tertiary)
                    Spacer()
                    Button("查看", action: open).buttonStyle(.bordered)
                    if plan.status == .confirmed {
                        Button(action: start) {
                            HStack(spacing: 6) {
                                if isStarting { ProgressView().controlSize(.small) }
                                Text(isStarting ? "开课中" : "开课")
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(isStarting)
                        .accessibilityIdentifier("prepare.plan.\(plan.id).start")
                    }
                }
            }
        }
    }

    private var statusColor: Color {
        switch plan.status {
        case .confirmed: return ImprovStyle.success
        case .draft: return ImprovStyle.warning
        case .delivered: return ImprovStyle.brand
        case .reviewed: return ImprovStyle.phaseColors[3]
        }
    }
}

struct ActivityCard: View {
    let activity: TrainingActivity

    var body: some View {
        Card {
            HStack {
                Image(systemName: activity.isFavorite ? "star.fill" : "figure.play")
                    .foregroundStyle(activity.isFavorite ? ImprovStyle.warning : ImprovStyle.blue)
                    .frame(width: 42, height: 42)
                    .background(ImprovStyle.blue.opacity(0.08), in: RoundedRectangle(cornerRadius: 12))
                VStack(alignment: .leading) {
                    Text(activity.name).font(.headline)
                    Text("\(activity.scene) · \(activity.durationMinutes) 分钟\(activity.peopleRange.isEmpty ? "" : " · \(activity.peopleRange)")")
                        .foregroundStyle(.secondary)
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(.tertiary)
            }
        }
    }
}

private struct TemplatePicker: View {
    let onSelectPlan: (TrainingPlan) -> Void

    var body: some View {
        NavigationStack {
            List {
                Button {
                    onSelectPlan(TrainingPlan(name: "", type: "企业培训", participantCount: 20, status: .draft, phases: [SessionPhase(name: "开场", durationMinutes: 15)]))
                } label: {
                    TemplateRow(title: "空白新建", tag: "空白方案", detail: "从空白方案开始，自定义环节与活动。")
                }
                ForEach(TrainingTemplate.starterCatalog) { template in
                    Button {
                        onSelectPlan(TrainingPlan(name: template.name, type: template.type, participantCount: 20, status: .draft, phases: template.phases))
                    } label: {
                        TemplateRow(title: template.name, tag: template.tag, detail: template.flowText)
                    }
                }
            }
            .navigationTitle("选择方案模板")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { SheetCloseButton() } }
        }
        .improvSheetStyle(.content)
    }
}

struct TemplateRow: View {
    let title: String
    let tag: String
    let detail: String

    var body: some View {
        VStack(alignment: .leading, spacing: 5) {
            HStack {
                Text(title).font(.headline)
                Text(tag)
                    .font(.caption.bold())
                    .foregroundStyle(ImprovStyle.blue)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 3)
                    .background(ImprovStyle.blue.opacity(0.1), in: Capsule())
            }
            Text(detail).foregroundStyle(.secondary)
        }
    }
}

private enum PlanEditorSheet: Identifiable {
    case addPhase
    case activityPicker(phaseID: String)

    var id: String {
        switch self {
        case .addPhase: return "add-phase"
        case .activityPicker(let phaseID): return "activity-picker-\(phaseID)"
        }
    }
}

struct PlanEditorView: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    @State private var plan: TrainingPlan
    @State private var presentedSheet: PlanEditorSheet?
    @State private var isSaving = false
    @State private var isStarting = false

    init(plan: TrainingPlan) { _plan = State(initialValue: plan) }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 18) {
                Text("基本信息")
                    .font(.headline)
                    .foregroundStyle(ImprovStyle.secondaryText)
                    .padding(.horizontal, 4)
                basicInformationCard
                phaseSettingsCard
            }
            .padding()
        }
        .background(ImprovStyle.surface.ignoresSafeArea())
        .navigationTitle("方案编辑")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarLeading) {
                NavigationLink("预览") { PlanPreviewView(plan: plan) }
            }
        }
        .sheet(item: $presentedSheet) { sheet in
            switch sheet {
            case .addPhase:
                AddPhaseSheet { name, duration in
                    plan.phases.append(SessionPhase(name: name, durationMinutes: duration))
                }
            case .activityPicker(let phaseID):
                ActivityPicker(plan: $plan, phaseID: phaseID)
            }
        }
        .safeAreaInset(edge: .bottom) { bottomActionBar }
        .improvSecondaryScreen()
    }

    private var totalDuration: Int { plan.phases.reduce(0) { $0 + $1.durationMinutes } }
    private var canSave: Bool {
        !plan.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && !plan.phases.isEmpty
    }

    private var basicInformationCard: some View {
        VStack(alignment: .leading, spacing: 22) {
            PlanEditorField(title: "方案名称", placeholder: "请输入方案名称", text: $plan.name)
            ViewThatFits(in: .horizontal) {
                HStack(alignment: .top, spacing: 16) {
                    participantControl
                    PlanEditorField(title: "客户名称", placeholder: "请输入客户名称", text: $plan.customerName)
                }
                VStack(alignment: .leading, spacing: 22) {
                    participantControl
                    PlanEditorField(title: "客户名称", placeholder: "请输入客户名称", text: $plan.customerName)
                }
            }
            VStack(alignment: .leading, spacing: 10) {
                Text("方案类型").font(.subheadline.bold()).foregroundStyle(ImprovStyle.secondaryText)
                Text(plan.type)
                    .font(.subheadline.bold())
                    .foregroundStyle(.white)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 9)
                    .background(ImprovStyle.brand, in: Capsule())
            }
        }
        .padding(18)
        .background(ImprovStyle.card, in: RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.06), radius: 12, y: 4)
    }

    private var participantControl: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("参与人数").font(.subheadline.bold()).foregroundStyle(ImprovStyle.secondaryText)
            HStack(spacing: 0) {
                compactNumberButton("minus", disabled: plan.participantCount <= 1) {
                    plan.participantCount = max(1, plan.participantCount - 1)
                }
                Text("\(plan.participantCount)")
                    .font(.headline)
                    .foregroundStyle(ImprovStyle.primaryText)
                    .frame(minWidth: 58, maxWidth: .infinity)
                    .frame(height: 44)
                    .background(ImprovStyle.card)
                compactNumberButton("plus", disabled: plan.participantCount >= 500) {
                    plan.participantCount = min(500, plan.participantCount + 1)
                }
            }
            .frame(minWidth: 150)
            .background(ImprovStyle.input, in: RoundedRectangle(cornerRadius: 12))
            .overlay { RoundedRectangle(cornerRadius: 12).stroke(ImprovStyle.divider) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private func compactNumberButton(_ symbol: String, disabled: Bool, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: symbol).font(.subheadline.bold()).frame(width: 44, height: 44)
        }
        .buttonStyle(.plain)
        .foregroundStyle(disabled ? ImprovStyle.secondaryText.opacity(0.45) : ImprovStyle.brand)
        .disabled(disabled)
    }

    private var phaseSettingsCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("环节设置").font(.title3.bold()).foregroundStyle(ImprovStyle.primaryText)
                Spacer()
                Button { presentedSheet = .addPhase } label: { Label("添加环节", systemImage: "plus") }
                    .font(.subheadline.bold())
                    .foregroundStyle(ImprovStyle.brand)
            }
            if plan.phases.isEmpty {
                Text("暂无环节，点击上方添加")
                    .foregroundStyle(ImprovStyle.secondaryText)
                    .frame(maxWidth: .infinity, minHeight: 120)
            } else {
                ForEach(Array(plan.phases.indices), id: \.self) { index in
                    PhaseEditorCard(
                        phase: $plan.phases[index],
                        index: index,
                        color: ImprovStyle.phaseColors[index % ImprovStyle.phaseColors.count],
                        canMoveUp: index > 0,
                        canMoveDown: index < plan.phases.count - 1,
                        addActivity: { presentedSheet = .activityPicker(phaseID: plan.phases[index].id) },
                        removeActivity: { activityID in removeActivity(activityID, fromPhaseAt: index) },
                        moveUp: { movePhase(at: index, by: -1) },
                        moveDown: { movePhase(at: index, by: 1) },
                        delete: { plan.phases.remove(at: index) }
                    )
                }
                Divider()
                Text("共 \(plan.phases.count) 个环节，预计 \(totalDuration) 分钟")
                    .font(.subheadline)
                    .foregroundStyle(ImprovStyle.secondaryText)
            }
        }
        .padding(18)
        .background(ImprovStyle.card, in: RoundedRectangle(cornerRadius: 20))
        .shadow(color: .black.opacity(0.06), radius: 12, y: 4)
    }

    private var bottomActionBar: some View {
        HStack(spacing: 12) {
            if plan.status == .draft {
                PlanEditorActionButton(title: isSaving ? "保存中..." : "保存草稿", color: ImprovStyle.input, foreground: ImprovStyle.primaryText) { save(.draft) }
                PlanEditorActionButton(title: "确认方案", color: ImprovStyle.brand) { save(.confirmed) }
            } else if plan.status == .confirmed {
                PlanEditorActionButton(title: isSaving ? "保存中..." : "保存修改", color: ImprovStyle.brand) { save(.confirmed) }
                PlanEditorActionButton(title: isStarting ? "开课中..." : "开始培训", color: ImprovStyle.success) { startTraining() }
            } else {
                PlanEditorActionButton(title: isSaving ? "保存中..." : "保存修改", color: ImprovStyle.brand) { save(plan.status) }
            }
        }
        .disabled(!canSave || isSaving || isStarting)
        .padding(.horizontal)
        .padding(.vertical, 12)
        .background(ImprovStyle.card.shadow(.drop(color: .black.opacity(0.08), radius: 10, y: -3)))
    }

    private func save(_ status: PlanStatus) {
        guard canSave, !isSaving else { return }
        isSaving = true
        plan.status = status
        Task {
            if await store.save(plan: plan) { dismiss() }
            isSaving = false
        }
    }

    private func startTraining() {
        guard canSave, plan.status == .confirmed, !isStarting else { return }
        isStarting = true
        Task {
            if await store.start(plan: plan) { dismiss() }
            isStarting = false
        }
    }

    private func movePhase(at index: Int, by offset: Int) {
        let destination = index + offset
        guard plan.phases.indices.contains(index), plan.phases.indices.contains(destination) else { return }
        plan.phases.swapAt(index, destination)
    }

    private func removeActivity(_ activityID: String, fromPhaseAt index: Int) {
        guard plan.phases.indices.contains(index) else { return }
        plan.phases[index].activities.removeAll { $0.id == activityID }
        plan.phases[index].activityNames = plan.phases[index].activities.map(\.name)
    }
}

private struct PlanEditorField: View {
    let title: String
    let placeholder: String
    @Binding var text: String

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title).font(.subheadline.bold()).foregroundStyle(ImprovStyle.secondaryText)
            TextField(placeholder, text: $text)
                .padding(.horizontal, 12)
                .frame(height: 44)
                .background(ImprovStyle.input, in: RoundedRectangle(cornerRadius: 12))
                .overlay { RoundedRectangle(cornerRadius: 12).stroke(ImprovStyle.divider) }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

private struct PlanEditorActionButton: View {
    let title: String
    let color: Color
    var foreground: Color = .white
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title).font(.headline).frame(maxWidth: .infinity).frame(height: 48)
        }
        .buttonStyle(.plain)
        .foregroundStyle(foreground)
        .background(color, in: RoundedRectangle(cornerRadius: 14))
    }
}

private struct PhaseEditorCard: View {
    @Binding var phase: SessionPhase
    let index: Int
    let color: Color
    let canMoveUp: Bool
    let canMoveDown: Bool
    let addActivity: () -> Void
    let removeActivity: (String) -> Void
    let moveUp: () -> Void
    let moveDown: () -> Void
    let delete: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Text("\(index + 1)")
                .font(.subheadline.bold())
                .foregroundStyle(.white)
                .frame(width: 30, height: 30)
                .background(color, in: Circle())
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .firstTextBaseline, spacing: 8) {
                    TextField("环节名称", text: $phase.name).font(.headline)
                    if !phase.activities.isEmpty {
                        Text("\(phase.activities.count)个活动")
                            .font(.caption2.bold())
                            .foregroundStyle(ImprovStyle.brand)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(ImprovStyle.brand.opacity(0.1), in: Capsule())
                    }
                }
                HStack(spacing: 8) {
                    Text("时长").font(.caption).foregroundStyle(ImprovStyle.secondaryText)
                    Button { phase.durationMinutes = max(1, phase.durationMinutes - 5) } label: { Image(systemName: "minus") }
                    Text("\(phase.durationMinutes) 分钟").font(.subheadline.monospacedDigit())
                    Button { phase.durationMinutes = min(240, phase.durationMinutes + 5) } label: { Image(systemName: "plus") }
                }
                .buttonStyle(.borderless)
                .foregroundStyle(ImprovStyle.brand)
                Text("本环节可挂多个活动").font(.caption).foregroundStyle(ImprovStyle.secondaryText)
                if phase.activities.isEmpty {
                    Text("还没有选择活动").font(.subheadline).foregroundStyle(ImprovStyle.secondaryText.opacity(0.8))
                } else {
                    ForEach(phase.activities) { activity in
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text(activity.name).font(.subheadline.bold()).foregroundStyle(ImprovStyle.primaryText)
                                Text("\(activity.category) · \(activity.durationMinutes) 分钟").font(.caption).foregroundStyle(ImprovStyle.secondaryText)
                            }
                            Spacer()
                            Button("移除", role: .destructive) { removeActivity(activity.id) }
                                .font(.caption.bold())
                                .buttonStyle(.bordered)
                                .tint(ImprovStyle.danger)
                        }
                        .padding(10)
                        .background(ImprovStyle.card, in: RoundedRectangle(cornerRadius: 12))
                    }
                }
                HStack(spacing: 8) {
                    Button("选活动", action: addActivity).buttonStyle(.bordered).tint(ImprovStyle.brand)
                    Button(action: moveUp) { Image(systemName: "arrow.up") }.disabled(!canMoveUp)
                    Button(action: moveDown) { Image(systemName: "arrow.down") }.disabled(!canMoveDown)
                    Spacer()
                    Button(role: .destructive, action: delete) { Image(systemName: "xmark") }
                        .tint(ImprovStyle.danger)
                }
                .buttonStyle(.bordered)
            }
        }
        .padding(14)
        .background(ImprovStyle.input, in: RoundedRectangle(cornerRadius: 16))
    }
}

private struct AddPhaseSheet: View {
    @Environment(\.dismiss) private var dismiss
    @State private var name = ""
    @State private var duration = "10"
    @State private var selectedType = ""
    let onAdd: (String, Int) -> Void

    private let phaseTypes = [
        ("计时练习", "timer"),
        ("随机抽取", "dice"),
        ("场景模拟", "theatermasks"),
        ("反思分享", "bubble.left.and.bubble.right"),
        ("自定义环节", "slider.horizontal.3")
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 18) {
                    Text("环节类型").font(.headline).foregroundStyle(ImprovStyle.primaryText)
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                        ForEach(phaseTypes, id: \.0) { type in
                            Button { selectedType = type.0; name = type.0 } label: {
                                VStack(spacing: 8) {
                                    Image(systemName: type.1).font(.title3)
                                    Text(type.0).font(.subheadline.bold())
                                }
                                .foregroundStyle(selectedType == type.0 ? ImprovStyle.brand : ImprovStyle.primaryText)
                                .frame(maxWidth: .infinity, minHeight: 88)
                                .background(selectedType == type.0 ? ImprovStyle.brand.opacity(0.12) : ImprovStyle.input, in: RoundedRectangle(cornerRadius: 16))
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    VStack(alignment: .leading, spacing: 18) {
                        PlanEditorField(title: "环节名称", placeholder: "请输入或选择环节类型", text: $name)
                        VStack(alignment: .leading, spacing: 10) {
                            Text("时长（分钟）").font(.subheadline.bold()).foregroundStyle(ImprovStyle.secondaryText)
                            TextField("10", text: $duration)
                                .keyboardType(.numberPad)
                                .padding(.horizontal, 12)
                                .frame(height: 44)
                                .background(ImprovStyle.input, in: RoundedRectangle(cornerRadius: 12))
                                .overlay { RoundedRectangle(cornerRadius: 12).stroke(ImprovStyle.divider) }
                        }
                    }
                    .padding(18)
                    .background(ImprovStyle.card, in: RoundedRectangle(cornerRadius: 18))
                }
                .padding()
            }
            .background(ImprovStyle.surface)
            .navigationTitle("添加环节")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    SheetCloseButton()
                }
            }
            .safeAreaInset(edge: .bottom) {
                SheetPrimaryActionBar(
                    title: "确认添加",
                    isDisabled: name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
                ) {
                    let finalName = name.trimmingCharacters(in: .whitespacesAndNewlines)
                    onAdd(finalName, max(1, Int(duration) ?? 10))
                    dismiss()
                }
            }
        }
        .improvSheetStyle(.content)
    }
}

private struct ActivityPicker: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    @Binding var plan: TrainingPlan
    let phaseID: String
    @State private var query = ""
    @State private var duplicateActivityName = ""

    var body: some View {
        NavigationStack {
            List(store.activities.filter { query.isEmpty || $0.name.localizedCaseInsensitiveContains(query) || $0.primaryScene.localizedCaseInsensitiveContains(query) }) { activity in
                Button { add(activity) } label: { ActivityCard(activity: activity) }
                    .buttonStyle(.plain)
            }
            .searchable(text: $query, prompt: "搜索活动名称或分类")
            .navigationTitle("从活动库添加")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { SheetCloseButton() } }
            .alert("该活动已在当前环节中", isPresented: Binding(get: { !duplicateActivityName.isEmpty }, set: { if !$0 { duplicateActivityName = "" } })) {
                Button("知道了", role: .cancel) {}
            } message: { Text(duplicateActivityName) }
        }
        .improvSheetStyle(store.activities.count <= 3 ? .compact : .scrollable)
    }

    private func add(_ activity: TrainingActivity) {
        guard let index = plan.phases.firstIndex(where: { $0.id == phaseID }) else { return }
        guard !plan.phases[index].activities.contains(where: { $0.id == activity.id }) else {
            duplicateActivityName = activity.name
            return
        }
        plan.phases[index].activities.append(PhaseActivity(id: activity.id, name: activity.name, category: activity.scene, durationMinutes: activity.durationMinutes))
        plan.phases[index].activityNames.append(activity.name)
        dismiss()
    }
}

struct PlanPreviewView: View {
    let plan: TrainingPlan

    var body: some View {
        List {
            Section("方案摘要") {
                Text(plan.name).font(.headline)
                Text("\(plan.type) · \(plan.participantCount) 人")
            }
            Section("培训流程") {
                ForEach(Array(plan.phases.enumerated()), id: \.element.id) { index, phase in
                    VStack(alignment: .leading) {
                        Text("\(index + 1). \(phase.name) · \(phase.durationMinutes) 分钟")
                        if !phase.activityNames.isEmpty {
                            Text(phase.activityNames.joined(separator: "、"))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .navigationTitle("方案预览")
        .improvSecondaryScreen()
    }
}

struct ActivityDetailView: View {
    @EnvironmentObject private var store: AppStore
    @State var activity: TrainingActivity

    var body: some View {
        Form {
            Section("活动信息") {
                Text(activity.name).font(.headline)
                LabeledContent("培训场景", value: activity.scenes.joined(separator: "、"))
                if !activity.difficulty.isEmpty { LabeledContent("难度", value: activity.difficulty) }
                LabeledContent("时长", value: "\(activity.durationMinutes) 分钟")
                if !activity.peopleRange.isEmpty { LabeledContent("人数", value: activity.peopleRange) }
            }
            if !activity.objective.isEmpty { Section("学习目标") { Text(activity.objective) } }
            if !activity.rules.isEmpty { Section("规则说明") { Text(activity.rules) } }
            if !activity.reviewQuestions.isEmpty { Section("复盘引导问题") { Text(activity.reviewQuestions) } }
            if !activity.leaderTips.isEmpty { Section("带领者Tips") { Text(activity.leaderTips) } }
            Section {
                Button(activity.isFavorite ? "取消收藏" : "收藏") {
                    activity.isFavorite.toggle()
                    store.update(activity: activity)
                }
                NavigationLink("编辑活动") {
                    ActivityEditor(activity: activity) { saved in
                        activity = saved
                    }
                }
            }
        }
        .navigationTitle("活动详情")
        .improvSecondaryScreen()
    }
}

struct ActivityEditor: View {
    @EnvironmentObject private var store: AppStore
    @Environment(\.dismiss) private var dismiss
    @State private var activity: TrainingActivity
    @State private var selectedScenes: Set<String>
    @State private var selectedDifficulty: Set<String>
    @State private var durationText: String
    @State private var isSaving = false
    @State private var showDeleteConfirmation = false
    let onSave: ((TrainingActivity) -> Void)?

    private let sceneChoices = ["团队融合", "协作沟通", "领导力", "创新思维", "情绪管理"]
    private let difficultyChoices = ["简单", "中等", "困难"]

    init(activity: TrainingActivity, onSave: ((TrainingActivity) -> Void)? = nil) {
        _activity = State(initialValue: activity)
        _selectedScenes = State(initialValue: Set(activity.scenes))
        _selectedDifficulty = State(initialValue: activity.difficulty.isEmpty ? [] : [activity.difficulty])
        _durationText = State(initialValue: activity.durationMinutes > 0 ? String(activity.durationMinutes) : "")
        self.onSave = onSave
    }

    var body: some View {
        Form {
            Section("基本信息") {
                TextField("请输入活动名称", text: $activity.name)
                VStack(alignment: .leading, spacing: 8) {
                    Text("培训场景")
                    ChoiceChipGroup(choices: sceneChoices, selection: $selectedScenes, allowsMultiple: true)
                }
                VStack(alignment: .leading, spacing: 8) {
                    Text("难度")
                    ChoiceChipGroup(choices: difficultyChoices, selection: $selectedDifficulty)
                }
                TextField("人数范围，如：8-20人", text: $activity.peopleRange)
                TextField("时长，如：30", text: $durationText)
                    .keyboardType(.numberPad)
            }
            Section("内容") {
                TextField("请输入学习目标", text: $activity.objective, axis: .vertical)
                TextField("请输入规则说明", text: $activity.rules, axis: .vertical)
                TextField("请输入复盘引导问题", text: $activity.reviewQuestions, axis: .vertical)
                TextField("请输入带领者Tips", text: $activity.leaderTips, axis: .vertical)
            }
            if !activity.id.isEmpty {
                Section {
                    Button("删除活动", role: .destructive) { showDeleteConfirmation = true }
                }
            }
        }
        .navigationTitle(activity.id.isEmpty ? "新增活动" : "编辑活动")
        .improvSecondaryScreen()
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button(isSaving ? "保存中..." : "保存") { save() }
                    .disabled(isSaving || activity.name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
            }
        }
        .confirmationDialog("确认删除", isPresented: $showDeleteConfirmation, titleVisibility: .visible) {
            Button("删除", role: .destructive) { delete() }
            Button("取消", role: .cancel) {}
        } message: { Text("删除后无法恢复") }
    }

    private func save() {
        activity.name = activity.name.trimmingCharacters(in: .whitespacesAndNewlines)
        activity.scenes = sceneChoices.filter(selectedScenes.contains)
        activity.difficulty = difficultyChoices.first(where: selectedDifficulty.contains) ?? ""
        activity.durationMinutes = max(0, Int(durationText) ?? 0)
        isSaving = true
        Task {
            if let saved = await store.save(activity: activity) {
                onSave?(saved)
                dismiss()
            }
            isSaving = false
        }
    }

    private func delete() {
        isSaving = true
        Task {
            if await store.delete(activity: activity) { dismiss() }
            isSaving = false
        }
    }
}
