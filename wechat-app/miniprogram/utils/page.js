const { goBackOrNavigate, goBackOrSwitchTab } = require('./navigation')

function showInfo(title, duration = 2200) {
  wx.showToast({
    title,
    icon: 'none',
    duration
  })
}

function showSuccess(title, duration = 1800) {
  wx.showToast({
    title,
    icon: 'success',
    duration
  })
}

function showError(title, duration = 2400) {
  wx.showToast({
    title,
    icon: 'none',
    duration
  })
}

function switchTabWithState(url, key, value) {
  if (key) {
    wx.setStorageSync(key, value)
  }
  wx.switchTab({ url })
}

function navigateTo(url) {
  wx.navigateTo({
    url,
    fail() {
      showError('页面暂不可用')
    }
  })
}

module.exports = {
  goBackOrNavigate,
  goBackOrSwitchTab,
  navigateTo,
  showError,
  showInfo,
  showSuccess,
  switchTabWithState
}
