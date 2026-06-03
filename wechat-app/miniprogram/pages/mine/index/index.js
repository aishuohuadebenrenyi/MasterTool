const { callAction } = require('../../../services/cloud')
const { navigateTo, showInfo, showSuccess } = require('../../../utils/page')

Page({
  data: {
    displayName: '张老师',
    editName: '张老师',
    avatarText: '张',
    roleText: '认证培训师',
    totalSessions: 7,
    avgSatisfaction: 0,
    totalParticipants: 0,
    showProfileEdit: false
  },

  onLoad() {
    this.loadProfile()
    this.loadStats()
  },

  onShow() {
    const entry = wx.getStorageSync('mineEntry') || {}
    wx.removeStorageSync('mineEntry')
    if (entry.filter === 'pendingReview') {
      navigateTo('/pages/review/index/index?filter=pending')
    }
  },

  async loadProfile() {
    const response = await callAction('trainer-api', 'getProfile')
    if (response.code === 0 && response.data && response.data.profile) {
      const displayName = response.data.profile.displayName || '张老师'
      this.setData({
        displayName,
        editName: displayName,
        avatarText: displayName.slice(0, 1)
      })
    }
  },

  async loadStats() {
    const response = await callAction('trainer-api', 'getDataOverview')
    if (response.code !== 0 || !response.data) return
    const metrics = response.data.metrics || []
    this.setData({
      totalSessions: Number((metrics[0] && metrics[0].value) || 0),
      totalParticipants: Number((metrics[1] && metrics[1].value) || 0),
      avgSatisfaction: (metrics[2] && metrics[2].value) || '--'
    })
  },

  openProfileEdit() {
    wx.hideTabBar({ animation: false })
    this.setData({
      showProfileEdit: true,
      editName: this.data.displayName
    })
  },

  closeProfileEdit() {
    wx.showTabBar({ animation: false })
    this.setData({ showProfileEdit: false })
  },

  noop() {},

  handleNameInput(event) {
    this.setData({ editName: event.detail.value })
  },

  async saveProfile() {
    const displayName = this.data.editName.trim()
    if (!displayName) {
      showInfo('请填写昵称', 2200)
      return
    }

    const response = await callAction('trainer-api', 'updateProfile', { displayName })
    if (response.code === 0) {
      this.setData({
        displayName,
        avatarText: displayName.slice(0, 1),
        showProfileEdit: false
      })
      wx.showTabBar({ animation: false })
      showSuccess('资料已保存')
      return
    }
    showInfo(response.message || '保存失败')
  },

  goTrainingRecords() {
    navigateTo('/pages/mine/records/index')
  },

  goDataDetail() {
    navigateTo('/pages/mine/data/index')
  },

  goSettings() {
    navigateTo('/pages/mine/settings/index')
  },

  goHelp() {
    navigateTo('/pages/mine/help/index')
  },

  goAbout() {
    navigateTo('/pages/mine/about/index')
  }
})
