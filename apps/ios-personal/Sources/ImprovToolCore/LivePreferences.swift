import Foundation

public enum LiveTimerMode: String, Sendable {
    case countUp
    case countDown
}

public struct LiveTimerState: Equatable, Sendable {
    public private(set) var mode: LiveTimerMode
    public private(set) var durationSeconds: Int
    public private(set) var elapsedSeconds: Int
    public private(set) var isRunning: Bool

    public init(mode: LiveTimerMode, durationSeconds: Int = 0) {
        self.mode = mode
        self.durationSeconds = max(0, durationSeconds)
        elapsedSeconds = 0
        isRunning = false
    }

    public var displaySeconds: Int {
        switch mode {
        case .countUp:
            return elapsedSeconds
        case .countDown:
            return max(0, durationSeconds - elapsedSeconds)
        }
    }

    public mutating func setMode(_ mode: LiveTimerMode, durationSeconds: Int = 0) {
        self.mode = mode
        self.durationSeconds = max(0, durationSeconds)
        elapsedSeconds = 0
        isRunning = false
    }

    public mutating func toggleRunning() {
        if mode == .countDown, displaySeconds == 0 {
            elapsedSeconds = 0
        }
        isRunning.toggle()
    }

    public mutating func pause() {
        isRunning = false
    }

    public mutating func reset(durationSeconds: Int? = nil) {
        if let durationSeconds {
            self.durationSeconds = max(0, durationSeconds)
        }
        elapsedSeconds = 0
        isRunning = false
    }

    public mutating func add(seconds: Int) {
        guard mode == .countDown, seconds > 0 else { return }
        durationSeconds += seconds
    }

    @discardableResult
    public mutating func tick() -> Bool {
        guard isRunning else { return false }
        switch mode {
        case .countUp:
            elapsedSeconds += 1
            return false
        case .countDown:
            guard displaySeconds > 0 else {
                isRunning = false
                return false
            }
            elapsedSeconds += 1
            if displaySeconds == 0 {
                isRunning = false
                return true
            }
            return false
        }
    }
}

public enum HorizontalSwipeAction: Equatable, Sendable {
    case previous
    case next
}

public enum LiveTimerTapAction: Equatable, Sendable {
    case primary
    case delay
}

public func applyLiveTimerTap(
    _ action: LiveTimerTapAction,
    doubleTapDelayEnabled: Bool,
    timer: inout LiveTimerState
) {
    switch action {
    case .primary:
        timer.toggleRunning()
    case .delay:
        if doubleTapDelayEnabled { timer.add(seconds: 300) }
    }
}

public func horizontalSwipeAction(
    horizontalDistance: Double,
    verticalDistance: Double,
    threshold: Double = 80,
    dominanceRatio: Double = 1.25
) -> HorizontalSwipeAction? {
    guard abs(horizontalDistance) >= threshold else { return nil }
    guard abs(horizontalDistance) > abs(verticalDistance) * dominanceRatio else { return nil }
    return horizontalDistance < 0 ? .next : .previous
}

public func phaseIndex(after action: HorizontalSwipeAction, currentIndex: Int, phaseCount: Int) -> Int? {
    guard phaseCount > 0, currentIndex >= 0, currentIndex < phaseCount else { return nil }
    switch action {
    case .previous:
        return currentIndex > 0 ? currentIndex - 1 : nil
    case .next:
        return currentIndex < phaseCount - 1 ? currentIndex + 1 : nil
    }
}

public func phaseDurationSeconds(at index: Int, phases: [SessionPhase]) -> Int? {
    guard phases.indices.contains(index) else { return nil }
    return max(0, phases[index].durationMinutes) * 60
}
