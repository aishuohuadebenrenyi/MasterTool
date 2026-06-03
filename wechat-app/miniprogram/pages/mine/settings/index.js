const { showSuccess } = require('../../../utils/page')
const { goBackOrSwitchTab } = require('../../../utils/navigation')

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
    ]
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
  }
})
