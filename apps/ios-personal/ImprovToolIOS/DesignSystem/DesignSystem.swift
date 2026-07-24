import SwiftUI
import UIKit
import AVFoundation

enum ImprovStyle {
    static let brand = adaptive(light: 0x4A7CF7, dark: 0x6B9BFF)
    static let blue = brand
    static let surface = adaptive(light: 0xF5F5F7, dark: 0x11131A)
    static let card = adaptive(light: 0xFFFFFF, dark: 0x1C1E27)
    static let input = adaptive(light: 0xF8F9FE, dark: 0x252834)
    static let divider = adaptive(light: 0xE5E5EA, dark: 0x3A3D49)
    static let primaryText = adaptive(light: 0x1A1A2E, dark: 0xF5F5F7)
    static let secondaryText = adaptive(light: 0x8E8E93, dark: 0xB0B4BD)
    static let success = adaptive(light: 0x34C759, dark: 0x4CD964)
    static let warning = adaptive(light: 0xFF9500, dark: 0xFFB340)
    static let danger = adaptive(light: 0xE5484D, dark: 0xFF6961)
    static let liveBackground = Color(red: 26 / 255, green: 26 / 255, blue: 46 / 255)
    static let livePrimaryText = Color.white
    static let liveSecondaryText = Color.white.opacity(0.68)
    static let liveSurface = Color.white.opacity(0.08)
    static let liveReminderSurface = brand.opacity(0.14)

    static let phaseColors: [Color] = [
        brand,
        success,
        warning,
        adaptive(light: 0xAF52DE, dark: 0xBF6EEA),
        adaptive(light: 0xFF3B30, dark: 0xFF6961),
        adaptive(light: 0x5AC8FA, dark: 0x70D7FF),
        adaptive(light: 0xFFCC00, dark: 0xFFD84D),
        secondaryText
    ]

    private static func adaptive(light: UInt32, dark: UInt32) -> Color {
        Color(UIColor { traits in
            UIColor(rgb: traits.userInterfaceStyle == .dark ? dark : light)
        })
    }
}

private extension UIColor {
    convenience init(rgb: UInt32) {
        self.init(
            red: CGFloat((rgb >> 16) & 0xFF) / 255,
            green: CGFloat((rgb >> 8) & 0xFF) / 255,
            blue: CGFloat(rgb & 0xFF) / 255,
            alpha: 1
        )
    }
}

enum AppPreferenceKey {
    static let swipeForwardEnabled = "swipeForwardEnabled"
    static let swipeBackEnabled = "swipeBackEnabled"
    static let doubleTapDelayEnabled = "doubleTapDelayEnabled"
    static let timerAlertEnabled = "hapticsEnabled"
}

@MainActor
final class TimerAlertPlayer {
    static let shared = TimerAlertPlayer()
    private var player: AVAudioPlayer?

    private init() {}

    func play(isEnabled: Bool) {
        guard isEnabled else { return }
        UINotificationFeedbackGenerator().notificationOccurred(.warning)
        guard let url = Bundle.main.url(forResource: "bell", withExtension: "wav") else { return }
        do {
            try AVAudioSession.sharedInstance().setCategory(.ambient, options: [.mixWithOthers])
            player = try AVAudioPlayer(contentsOf: url)
            player?.play()
        } catch {
            player = nil
        }
    }
}

struct Card<Content: View>: View {
    let content: Content
    init(@ViewBuilder content: () -> Content) { self.content = content() }
    var body: some View { content.padding().background(ImprovStyle.card, in: RoundedRectangle(cornerRadius: 16)).shadow(color: .black.opacity(0.05), radius: 10, y: 4) }
}

struct Metric: View {
    let value: String; let label: String
    var body: some View { VStack(spacing: 4) { Text(value).font(.title2.bold()); Text(label).font(.caption).foregroundStyle(.secondary) }.frame(maxWidth: .infinity) }
}

struct EmptyState: View {
    let title: String
    let symbol: String
    var detail: String = ""
    var fillsAvailableSpace = false

    var body: some View {
        VStack(spacing: 10) {
            Image(systemName: symbol).font(.largeTitle).foregroundStyle(.secondary)
            Text(title).font(.headline)
            if !detail.isEmpty { Text(detail).font(.subheadline).foregroundStyle(.secondary) }
        }
        .multilineTextAlignment(.center)
        .padding()
        .frame(maxWidth: .infinity, maxHeight: fillsAvailableSpace ? .infinity : nil, alignment: .center)
    }
}

struct ChoiceChipGroup: View {
    let choices: [String]
    @Binding var selection: Set<String>
    var allowsMultiple = false

    var body: some View {
        LazyVGrid(columns: [GridItem(.adaptive(minimum: 88), spacing: 8)], alignment: .leading, spacing: 8) {
            ForEach(choices, id: \.self) { choice in
                Button(choice) { toggle(choice) }
                    .buttonStyle(.bordered)
                    .tint(selection.contains(choice) ? ImprovStyle.blue : .gray)
            }
        }
    }

    private func toggle(_ choice: String) {
        if allowsMultiple {
            if selection.contains(choice) { selection.remove(choice) } else { selection.insert(choice) }
        } else {
            selection = selection.contains(choice) ? [] : [choice]
        }
    }
}

struct CountedTextEditor: View {
    let placeholder: String
    @Binding var text: String
    let limit: Int

    var body: some View {
        VStack(alignment: .trailing, spacing: 4) {
            ZStack(alignment: .topLeading) {
                if text.isEmpty {
                    Text(placeholder)
                        .foregroundStyle(.tertiary)
                        .padding(.horizontal, 5)
                        .padding(.vertical, 8)
                }
                TextEditor(text: $text)
                    .frame(minHeight: 110)
                    .onChange(of: text) { value in
                        if value.count > limit { text = String(value.prefix(limit)) }
                    }
            }
            Text("\(text.count)/\(limit)")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

struct SheetCloseButton: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        Button { dismiss() } label: {
            Image(systemName: "xmark")
                .font(.caption.bold())
                .foregroundStyle(.secondary)
                .frame(width: 34, height: 34)
                .background(Color.secondary.opacity(0.1), in: Circle())
        }
        .accessibilityLabel("关闭")
    }
}

struct SheetPrimaryActionBar: View {
    let title: String
    var isDisabled = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.headline)
                .frame(maxWidth: .infinity)
        }
        .buttonStyle(.borderedProminent)
        .controlSize(.large)
        .disabled(isDisabled)
        .padding(.horizontal)
        .padding(.vertical, 10)
        .background(.bar)
    }
}

enum ImprovSheetStyle {
    case compact
    case content
    case scrollable

    var initialDetent: PresentationDetent {
        switch self {
        case .compact: return .height(360)
        case .content: return .fraction(0.68)
        case .scrollable: return .medium
        }
    }

    var detents: Set<PresentationDetent> { [initialDetent, .large] }
}

private struct ImprovSheetModifier: ViewModifier {
    let style: ImprovSheetStyle
    @State private var selectedDetent: PresentationDetent

    init(style: ImprovSheetStyle) {
        self.style = style
        _selectedDetent = State(initialValue: style.initialDetent)
    }

    @ViewBuilder
    func body(content: Content) -> some View {
        if UIDevice.current.userInterfaceIdiom == .phone {
            let sheet = content
                .presentationDetents(style.detents, selection: $selectedDetent)
                .presentationDragIndicator(.visible)
            if #available(iOS 16.4, *) {
                sheet.presentationContentInteraction(.scrolls)
            } else {
                sheet
            }
        } else {
            content
        }
    }
}

extension View {
    func improvSheetStyle(_ style: ImprovSheetStyle) -> some View {
        modifier(ImprovSheetModifier(style: style))
    }

    @ViewBuilder
    func improvLiveSheetStyle(_ style: ImprovSheetStyle) -> some View {
        if #available(iOS 16.4, *) {
            modifier(ImprovSheetModifier(style: style))
                .presentationBackground(Color(.systemBackground))
        } else {
            modifier(ImprovSheetModifier(style: style))
        }
    }

    func improvSecondaryScreen() -> some View {
        toolbar(.hidden, for: .tabBar)
    }
}
