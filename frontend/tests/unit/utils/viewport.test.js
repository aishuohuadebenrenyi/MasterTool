import { describe, it, expect, beforeEach, vi } from 'vitest'
import { rpxToPx } from '../../__uts_mirror__/utils/viewport'

describe('viewport sizing', () => {
  beforeEach(() => {
    vi.mocked(global.uni.getWindowInfo).mockReturnValue({
      windowWidth: 375,
      screenWidth: 375,
      windowHeight: 812,
      screenHeight: 812,
      statusBarHeight: 44,
      safeAreaInsets: {
        bottom: 34
      }
    })
  })

  it('converts rpx using the current WeChat window width', () => {
    vi.mocked(global.uni.getWindowInfo).mockReturnValue({
      windowWidth: 390,
      screenWidth: 390,
      windowHeight: 844,
      screenHeight: 844,
      statusBarHeight: 47,
      safeAreaInsets: {
        bottom: 34
      }
    })

    expect(rpxToPx(120)).toBe(62)
  })

  it('scales the same rpx value on narrower devices', () => {
    vi.mocked(global.uni.getWindowInfo).mockReturnValue({
      windowWidth: 320,
      screenWidth: 320,
      windowHeight: 568,
      screenHeight: 568,
      statusBarHeight: 20,
      safeAreaInsets: {
        bottom: 0
      }
    })

    expect(rpxToPx(120)).toBe(51)
  })
})
