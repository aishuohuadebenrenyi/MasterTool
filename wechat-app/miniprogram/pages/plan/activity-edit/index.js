const { callAction } = require('../../../services/cloud')
const { showInfo, showSuccess } = require('../../../utils/page')
const { goBackOrSwitchTab } = require('../../../utils/navigation')

Page({
  data: {
    id: '',
    isEditing: false,
    pageTitle: '新增活动',
    name: '',
    scenes: [],
    sceneTags: ['团队融合', '协作沟通', '领导力', '创新思维', '情绪管理'].map((name) => ({ name, active: false })),
    difficulty: '',
    difficultyTags: ['简单', '中等', '困难'].map((name) => ({ name, active: false })),
    participants: '',
    duration: '',
    objective: '',
    rules: '',
    reviewQuestions: '',
    leaderTips: ''
  },

  async onLoad(query) {
    if (!query.id) return
    const response = await callAction('trainer-api', 'getActivityDetail', { _id: query.id })
    if (response.code !== 0 || !response.data || !response.data.activity) {
      showInfo(response.message || '活动加载失败')
      this.goBack()
      return
    }
    const activity = response.data.activity
    this.setData({
      id: query.id,
      isEditing: true,
      pageTitle: '编辑活动',
      name: activity.name || '',
      scenes: Array.isArray(activity.scenes) ? activity.scenes : [],
      difficulty: activity.difficulty || '',
      participants: activity.peopleRange || '',
      duration: `${activity.durationMinutes || ''}`,
      objective: activity.objective || '',
      rules: activity.rules || '',
      reviewQuestions: activity.reviewQuestions || '',
      leaderTips: activity.leaderTips || ''
    })
    this.syncTags()
  },

  goBack() {
    goBackOrSwitchTab('/pages/prepare/index/index')
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field
    this.setData({ [field]: event.detail.value })
  },

  toggleScene(event) {
    const value = event.currentTarget.dataset.value
    const scenes = this.data.scenes.slice()
    const index = scenes.indexOf(value)
    if (index >= 0) scenes.splice(index, 1)
    else scenes.push(value)
    this.setData({ scenes })
    this.syncTags()
  },

  selectDifficulty(event) {
    this.setData({ difficulty: event.currentTarget.dataset.value })
    this.syncTags()
  },

  syncTags() {
    this.setData({
      sceneTags: this.data.sceneTags.map((item) => ({ ...item, active: this.data.scenes.includes(item.name) })),
      difficultyTags: this.data.difficultyTags.map((item) => ({ ...item, active: this.data.difficulty === item.name }))
    })
  },

  validate() {
    if (!this.data.name.trim()) {
      showInfo('请输入活动名称')
      return false
    }
    return true
  },

  buildPayload() {
    return {
      _id: this.data.id,
      name: this.data.name.trim(),
      scenes: this.data.scenes,
      difficulty: this.data.difficulty,
      peopleRange: this.data.participants.trim(),
      durationMinutes: Number(this.data.duration || 0),
      objective: this.data.objective.trim(),
      rules: this.data.rules.trim(),
      reviewQuestions: this.data.reviewQuestions.trim(),
      leaderTips: this.data.leaderTips.trim()
    }
  },

  async saveActivity() {
    if (!this.validate()) return
    const response = await callAction('trainer-api', 'saveActivity', this.buildPayload())
    if (response.code !== 0) {
      showInfo(response.message || '保存失败')
      return
    }
    showSuccess(this.data.isEditing ? '已更新活动' : '已保存活动')
    this.goBack()
  },

  deleteActivity() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      confirmText: '删除',
      confirmColor: '#FF5A5F',
      success: async (res) => {
        if (!res.confirm) return
        if (this.data.id) {
          const response = await callAction('trainer-api', 'deleteActivity', { _id: this.data.id })
          if (response.code !== 0) {
            showInfo(response.message || '删除失败')
            return
          }
        }
        showSuccess('已删除')
        this.goBack()
      }
    })
  }
})
