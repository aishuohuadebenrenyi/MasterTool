import SwiftUI
#if canImport(ImprovToolCore)
import ImprovToolCore
#endif

private enum HomeRoute: Hashable {
    case planEditor(TrainingPlan)
}

private enum HomePendingAction {
    case openPrepare(PrepareEntry)
    case navigate(HomeRoute)
}

struct HomeView: View {
    @EnvironmentObject private var store: AppStore
    let onOpenPrepare: (PrepareEntry) -> Void
    let onResumeLive: () -> Void

    @State private var path = [HomeRoute]()
    @State private var entry: StartEntry?
    @State private var pendingAction: HomePendingAction?

    private var confirmed: [TrainingPlan] { store.plans.filter { $0.status == .confirmed } }
    private var drafts: [TrainingPlan] { store.plans.filter { $0.status == .draft } }

    var body: some View {
        NavigationStack(path: $path) {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    profileHeader
                    startButton
                    reviewLink
                    todoSection
                    activeSessionLink
                }
                .padding()
                .padding(.top, 4)
            }
            .background(ImprovStyle.surface)
            .toolbar(.hidden, for: .navigationBar)
            .refreshable { await store.refresh() }
            .navigationDestination(for: HomeRoute.self) { route in
                switch route {
                case .planEditor(let plan):
                    PlanEditorView(plan: plan)
                }
            }
        }
        .sheet(item: $entry, onDismiss: performPendingAction) { _ in
            StartSessionSheet(
                templates: TrainingTemplate.starterCatalog,
                onSelectMyPlans: {
                    pendingAction = .openPrepare(.myPlans(preferred: .confirmed, fallback: .draft))
                    entry = nil
                },
                onSelectTemplate: { template in
                    pendingAction = .navigate(.planEditor(store.plan(from: template)))
                    entry = nil
                }
            )
        }
    }

    private var profileHeader: some View {
        HStack(spacing: 12) {
            Text(String(store.profile.displayName.prefix(1)))
                .font(.title3.bold())
                .foregroundStyle(.white)
                .frame(width: 46, height: 46)
                .background(ImprovStyle.blue, in: Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text("\(store.profile.displayName)，\(greeting)").font(.title3.bold())
                Text(today).foregroundStyle(.secondary)
            }
            Spacer()
        }
    }

    private var startButton: some View {
        Button { entry = .start } label: {
            HStack {
                VStack(alignment: .leading, spacing: 6) {
                    Text("我要开课").font(.title2.bold())
                    Text("开始一场培训").font(.headline).opacity(0.86)
                }
                Spacer()
                Image(systemName: "arrow.right")
                    .font(.system(size: 30, weight: .bold))
                    .frame(width: 64, height: 64)
                    .background(.white.opacity(0.18), in: RoundedRectangle(cornerRadius: 20))
            }
            .padding(22)
            .foregroundStyle(.white)
            .background(ImprovStyle.blue, in: RoundedRectangle(cornerRadius: 24))
        }
        .accessibilityIdentifier("home.startTraining")
    }

    private var reviewLink: some View {
        NavigationLink { ReviewListView() } label: {
            Card {
                HStack(spacing: 14) {
                    Image(systemName: "checklist.checked")
                        .font(.title2)
                        .foregroundStyle(ImprovStyle.blue)
                        .frame(width: 42, height: 42)
                        .background(ImprovStyle.blue.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                    VStack(alignment: .leading) {
                        Text("我要复盘").font(.headline)
                        Text(store.overview.pendingReviews == 0 ? "暂无待复盘场次" : "\(store.overview.pendingReviews) 场待复盘")
                            .foregroundStyle(.secondary)
                    }
                    Spacer()
                    Image(systemName: "chevron.right").foregroundStyle(.tertiary)
                }
            }
        }
        .buttonStyle(.plain)
    }

    @ViewBuilder private var todoSection: some View {
        if !confirmed.isEmpty || !drafts.isEmpty {
            Text("待处理").font(.title3.bold()).padding(.top, 8)
            if !confirmed.isEmpty {
                Button { onOpenPrepare(.myPlans(preferred: .confirmed)) } label: {
                    TodoRow(icon: "arrow.right", title: "\(confirmed.count) 个方案待开课", color: ImprovStyle.blue)
                }
                .buttonStyle(.plain)
            }
            if !drafts.isEmpty {
                Button { onOpenPrepare(.myPlans(preferred: .draft)) } label: {
                    TodoRow(icon: "doc", title: "\(drafts.count) 个草稿方案", color: .gray)
                }
                .buttonStyle(.plain)
            }
        }
    }

    @ViewBuilder private var activeSessionLink: some View {
        if let active = store.activeSession, active.status == .running {
            Button(action: onResumeLive) {
                Label("返回当前培训：\(active.plan.name)", systemImage: "timer")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(ImprovStyle.success.opacity(0.12), in: RoundedRectangle(cornerRadius: 16))
            }
            .buttonStyle(.plain)
        }
    }

    private func performPendingAction() {
        defer { pendingAction = nil }
        switch pendingAction {
        case .openPrepare(let entry): onOpenPrepare(entry)
        case .navigate(let route): path.append(route)
        case nil: break
        }
    }

    private var greeting: String {
        Calendar.current.component(.hour, from: .now) < 12 ? "早上好" : (Calendar.current.component(.hour, from: .now) < 18 ? "下午好" : "晚上好")
    }

    private var today: String { Date.now.formatted(.dateTime.month().day().weekday(.wide)) }
}

private enum StartEntry: String, Identifiable {
    case start
    var id: String { rawValue }
}

private struct TodoRow: View {
    let icon: String
    let title: String
    let color: Color

    var body: some View {
        Card {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                    .frame(width: 40, height: 40)
                    .background(color.opacity(0.1), in: RoundedRectangle(cornerRadius: 12))
                Text(title).font(.headline)
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(.tertiary)
            }
        }
    }
}

struct StartSessionSheet: View {
    let templates: [TrainingTemplate]
    let onSelectMyPlans: () -> Void
    let onSelectTemplate: (TrainingTemplate) -> Void

    var body: some View {
        NavigationStack {
            List {
                Section {
                    Button(action: onSelectMyPlans) {
                        HStack {
                            Image(systemName: "doc.text")
                                .foregroundStyle(.white)
                                .frame(width: 42, height: 42)
                                .background(ImprovStyle.blue, in: RoundedRectangle(cornerRadius: 12))
                            VStack(alignment: .leading) {
                                Text("从我的方案").font(.headline)
                                Text("直接进入备课页，优先筛选已确认方案")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            Image(systemName: "chevron.right")
                        }
                    }
                    .listRowBackground(ImprovStyle.blue.opacity(0.12))
                }
                Section("从公共模板新建方案") {
                    ForEach(templates) { template in
                        Button { onSelectTemplate(template) } label: {
                            TemplateRow(title: template.name, tag: template.tag, detail: template.flowText)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .navigationTitle("选择开课入口")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { SheetCloseButton() } }
        }
        .improvSheetStyle(.content)
    }
}
