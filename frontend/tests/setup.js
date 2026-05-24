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
  getSystemInfoSync: vi.fn(() => ({
    windowWidth: 375,
    windowHeight: 812,
    statusBarHeight: 44
  }))
}
