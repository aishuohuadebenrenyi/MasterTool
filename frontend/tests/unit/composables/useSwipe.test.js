import { describe, it, expect, vi } from 'vitest'
import { useSwipe } from '../../__uts_mirror__/composables/useSwipe'

describe('useSwipe', () => {
  it('initializes with default values', () => {
    const { offsetX, isSwiping, direction } = useSwipe()
    expect(offsetX.value).toBe(0)
    expect(isSwiping.value).toBe(false)
    expect(direction.value).toBe('')
  })

  it('detects left swipe', () => {
    const onSwipeLeft = vi.fn()
    const { onTouchStart, onTouchMove, onTouchEnd, offsetX, direction } = useSwipe({
      threshold: 80,
      onSwipeLeft
    })

    onTouchStart({ clientX: 200, clientY: 100 })
    onTouchMove({ clientX: 100, clientY: 100 })
    onTouchEnd()

    expect(direction.value).toBe('left')
    expect(offsetX.value).toBe(-80)
  })

  it('detects right swipe', () => {
    const onSwipeRight = vi.fn()
    const { onTouchStart, onTouchMove, onTouchEnd, offsetX, direction } = useSwipe({
      threshold: 80,
      onSwipeRight
    })

    onTouchStart({ clientX: 100, clientY: 100 })
    onTouchMove({ clientX: 200, clientY: 100 })
    onTouchEnd()

    expect(direction.value).toBe('right')
    expect(offsetX.value).toBe(0)
    expect(onSwipeRight).toHaveBeenCalled()
  })

  it('ignores vertical swipes', () => {
    const { onTouchStart, onTouchMove, onTouchEnd, offsetX, isSwiping } = useSwipe()

    onTouchStart({ clientX: 100, clientY: 100 })
    onTouchMove({ clientX: 100, clientY: 200 })
    onTouchEnd()

    expect(offsetX.value).toBe(0)
  })

  it('resets swipe state', () => {
    const { onTouchStart, onTouchMove, resetSwipe, offsetX, direction } = useSwipe()

    onTouchStart({ clientX: 200, clientY: 100 })
    onTouchMove({ clientX: 100, clientY: 100 })
    resetSwipe()

    expect(offsetX.value).toBe(0)
    expect(direction.value).toBe('')
  })

  it('does not trigger below threshold', () => {
    const onSwipeLeft = vi.fn()
    const { onTouchStart, onTouchMove, onTouchEnd, offsetX } = useSwipe({
      threshold: 80,
      onSwipeLeft
    })

    onTouchStart({ clientX: 100, clientY: 100 })
    onTouchMove({ clientX: 50, clientY: 100 })
    onTouchEnd()

    expect(offsetX.value).toBe(0)
    expect(onSwipeLeft).not.toHaveBeenCalled()
  })
})
