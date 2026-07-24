const { showInfo, showSuccess } = require('../../../utils/page')
const { goBackOrSwitchTab } = require('../../../utils/navigation')
const { callAction } = require('../../../services/cloud')

Page({
  data: {
    sections: [
      {
        title: '手势控制',
        items: [
          { key: 'swipeNext', title: '左滑推进', desc: '向左滑动推进到下一步', enabled: true },
          { key: 'swipePrev', title: '右滑回退', desc: '向右滑动回退到上一步', enabled: true },
          { key: 'doubleTap', title: '双击延时', desc: '双击屏幕启动延时计时', enabled: false }
        ]
      },
      {
        title: '其他',
        items: [
          { key: 'sound', title: '计时器声音', desc: '倒计时结束时播放提示音', enabled: true },
          { key: 'autosave', title: '自动保存', desc: '自动保存培训记录和进度', enabled: true }
        ]
      }
    ],
    iosBindingCode: '',
    iosBindingExpiresAt: ''
  },

  onLoad() {
    const saved = wx.getStorageSync('trainerToolSettings')
    if (saved && Array.isArray(saved.sections)) {
      this.setData({ sections: saved.sections })
    }
  },

  goBack() {
    goBackOrSwitchTab('/pages/mine/index/index')
  },

  toggleSetting(event) {
    const key = event.currentTarget.dataset.key
    const sections = this.data.sections.map((section) => ({
      ...section,
      items: section.items.map((item) => item.key === key ? { ...item, enabled: !item.enabled } : item)
    }))
    this.setData({ sections })
    wx.setStorageSync('trainerToolSettings', { sections })
    showSuccess('设置已更新')
  },

  async createIOSBindingCode() {
    const response = await callAction('trainer-api', 'createIOSBindingCode')
    if (response.code !== 0 || !response.data) {
      showInfo(response.message || '绑定码生成失败')
      return
    }
    const expiresAt = new Date(response.data.expiresAt)
    const time = `${String(expiresAt.getHours()).padStart(2, '0')}:${String(expiresAt.getMinutes()).padStart(2, '0')}`
    this.setData({
      iosBindingCode: response.data.token,
      iosBindingExpiresAt: `有效至 ${time}，仅可使用一次`
    })
    wx.setClipboardData({ data: response.data.token })
    showSuccess('绑定码已复制，请在 iOS App 中输入')
  }
})
