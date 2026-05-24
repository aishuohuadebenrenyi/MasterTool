import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTimer } from '../../__uts_mirror__/composables/useTimer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('initializes with given seconds', () => {
    const { seconds, display, isRunning } = useTimer(60)
    expect(seconds.value).toBe(60)
    expect(display.value).toBe('01:00')
    expect(isRunning.value).toBe(false)
  })

  it('starts and counts down', () => {
    const { start, seconds, isRunning } = useTimer(10)
    start()
    expect(isRunning.value).toBe(true)
    vi.advanceTimersByTime(3000)
    expect(seconds.value).toBe(7)
  })

  it('stops the timer', () => {
    const { start, stop, seconds, isRunning } = useTimer(10)
    start()
    vi.advanceTimersByTime(3000)
    stop()
    expect(isRunning.value).toBe(false)
    expect(seconds.value).toBe(7)
    vi.advanceTimersByTime(3000)
    expect(seconds.value).toBe(7)
  })

  it('resets the timer', () => {
    const { start, reset, seconds } = useTimer(60)
    start()
    vi.advanceTimersByTime(10000)
    reset()
    expect(seconds.value).toBe(60)
  })

  it('resets with new seconds value', () => {
    const { start, reset, seconds, progress } = useTimer(100)
    start()
    vi.advanceTimersByTime(50000)
    reset(200)
    expect(seconds.value).toBe(200)
  })

  it('calls onComplete when timer reaches zero', () => {
    const onComplete = vi.fn()
    const { start } = useTimer(3, { onComplete })
    start()
    vi.advanceTimersByTime(3000)
    expect(onComplete).toHaveBeenCalledOnce()
  })

  it('adds extra time', () => {
    const { addTime, seconds } = useTimer(60)
    addTime(30)
    expect(seconds.value).toBe(90)
  })

  it('calculates progress correctly', () => {
    const { start, progress } = useTimer(100)
    expect(progress.value).toBe(0)
    start()
    vi.advanceTimersByTime(50000)
    expect(progress.value).toBe(50)
  })

  it('formats display correctly for various values', () => {
    const { display: d1 } = useTimer(0)
    expect(d1.value).toBe('00:00')

    const { display: d2 } = useTimer(5)
    expect(d2.value).toBe('00:05')

    const { display: d3 } = useTimer(3600)
    expect(d3.value).toBe('60:00')
  })
})
