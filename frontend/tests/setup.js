import { vi } from 'vitest'

global.UTSJSONObject = Object

global.uni = {
  request: vi.fn(),
  showToast: vi.fn(),
  showLoading: vi.fn(),
  hideLoading: vi.fn(),
  setStorageSync: vi.fn(),
  getStorageSync: vi.fn(),
  removeStorageSync: vi.fn(),
  navigateTo: vi.fn(),
  redirectTo: vi.fn(),
  switchTab: vi.fn(),
  navigateBack: vi.fn(),
  showModal: vi.fn(),
  showActionSheet: vi.fn(),
  getWindowInfo: vi.fn(() => ({
    windowWidth: 375,
    screenWidth: 375,
    windowHeight: 812,
    screenHeight: 812,
    statusBarHeight: 44,
    safeAreaInsets: {
      bottom: 34
    }
  })),
  getDeviceInfo: vi.fn(() => ({
    uniPlatform: 'web',
    brand: 'Apple',
    model: 'iPhone'
  })),
  getAppBaseInfo: vi.fn(() => ({
    uniPlatform: 'web',
    hostName: 'h5'
  })),
  getMenuButtonBoundingClientRect: vi.fn(() => ({
    top: 50,
    height: 32,
    width: 88,
    left: 280,
    right: 368
  }))
}
