function goBackOrSwitchTab(fallbackUrl) {
  wx.navigateBack({
    fail: () => wx.switchTab({ url: fallbackUrl })
  })
}

function goBackOrNavigate(fallbackUrl) {
  wx.navigateBack({
    fail: () => wx.navigateTo({ url: fallbackUrl })
  })
}

module.exports = {
  goBackOrNavigate,
  goBackOrSwitchTab
}
