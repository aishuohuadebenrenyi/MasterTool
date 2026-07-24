const { navigateTo } = require('../../../utils/page')
const { goBackOrSwitchTab } = require('../../../utils/navigation')

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}秒`
  const minutes = Math.round(seconds / 60)
  return `${minutes}分钟`
}

Page({
  data: {
    sessionId: '',
    title: '培训方案',
    participants: 0,
    durationText: '0分钟'
  },

  onLoad(query) {
    const seconds = Number(query.seconds || 0)
    this.setData({
      sessionId: query.sessionId || '',
      title: query.title ? decodeURIComponent(query.title) : '培训方案',
      participants: Number(query.participants || 0),
      durationText: formatDuration(seconds)
    })
  },

  goBack() {
    goBackOrSwitchTab('/pages/home/index/index')
  },

  goHome() {
    wx.switchTab({ url: '/pages/home/index/index' })
  },

  collectFeedback() {
    navigateTo(`/pages/feedback/index/index?sessionId=${this.data.sessionId}`)
  },

  startReview() {
    navigateTo(`/pages/plan/activity-detail/index?sessionId=${this.data.sessionId}&entry=review`)
  },

  viewData() {
    navigateTo(`/pages/mine/data/index?sessionId=${this.data.sessionId}`)
  }
})
