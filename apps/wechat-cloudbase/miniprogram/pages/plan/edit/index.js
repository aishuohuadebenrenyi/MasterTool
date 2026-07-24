const { callAction } = require('../../../services/cloud')
const { navigateTo, showInfo, showSuccess } = require('../../../utils/page')
const { goBackOrSwitchTab } = require('../../../utils/navigation')
const { savePlanAsPrivateTemplate } = require('../modules/template-save')

const BADGE_COLORS = ['#4A7CF7', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA', '#FFCC00', '#8E8E93']

function totalDuration(phases) {
  return phases.reduce((sum, item) => sum + Number(item.duration || 0), 0)
}

function normalizePhaseActivities(phase) {
  if (Array.isArray(phase.activities) && phase.activities.length > 0) {
    return phase.activities.map((activity) => ({
      activityId: activity.activityId || activity._id || '',
      name: activity.name || '未命名活动',
      category: activity.category || activity.typeText || '团队融合',
      durationMinutes: Math.max(0, Number(activity.durationMinutes || activity.duration || 0)),
      peopleRange: activity.peopleRange || ''
    }))
  }
  if (phase.activityId) {
    return [{
      activityId: phase.activityId,
      name: phase.name || '未命名活动',
      category: phase.type || '团队融合',
      durationMinutes: Math.max(0, Number(phase.duration || phase.minutes || 0)),
      peopleRange: ''
    }]
  }
  return []
}

function decoratePhases(phases) {
  return phases.map((phase, index) => {
    const activities = normalizePhaseActivities(phase)
    return {
      ...phase,
      activities,
      activityCount: activities.length,
      activityNamesText: activities.map((activity) => activity.name).join('、'),
      hasActivities: activities.length > 0,
      color: BADGE_COLORS[index % BADGE_COLORS.length],
      canMoveUp: index > 0,
      canMoveDown: index < phases.length - 1
    }
  })
}

function normalizeActivity(activity) {
  return {
    ...activity,
    activityId: activity._id || '',
    typeText: activity.category || (Array.isArray(activity.scenes) && activity.scenes.length ? activity.scenes[0] : '团队融合'),
    durationText: `${activity.durationMinutes || 0}分钟`,
    peopleText: activity.peopleRange || '人数待定'
  }
}

Page({
  data: {
    id: '',
    pageTitle: '方案编辑',
    savingTemplate: false,
    isStartingTraining: false,
    contentKind: 'plan',
    isTemplate: false,
    isReadonly: false,
    templateSourceId: '',
    templateVisibility: '',
    status: 'draft',
    name: '',
    customerName: '',
    participantCount: 20,
    type: '企业培训',
    phases: [],
    totalDuration: 0,
    addPhaseVisible: false,
    phaseTypeList: [
      { name: '计时练习', icon: '/static/icons/icon-tool-timer.png' },
      { name: '随机抽取', icon: '/static/icons/icon-tool-random.png' },
      { name: '场景模拟', icon: '/static/icons/icon-phase-opening.png' },
      { name: '反思分享', icon: '/static/icons/icon-phase-summary.png' },
      { name: '自定义环节', icon: '/static/icons/icon-state-document.png' }
    ],
    newPhaseName: '',
    newPhaseDuration: '10',
    showActivityPicker: false,
    currentPhaseIndex: -1,
    activitySearch: '',
    activities: [],
    filteredActivities: []
  },

  onLoad(query) {
    this.loadActivities()
    if (query.id) {
      this.loadPlan(query.id)
      return
    }
    if (query.templateId) {
      this.loadTemplate(query.templateId)
      return
    }
    this.setData({
      name: '新培训方案',
      phases: [],
      totalDuration: 0
    })
  },

  async loadPlan(id) {
    const response = await callAction('trainer-api', 'getPlanDetail', { _id: id })
    if (response.code !== 0 || !response.data || !response.data.plan) {
      showInfo(response.message || '方案加载失败')
      this.goBack()
      return
    }
    const plan = response.data.plan
    const phases = decoratePhases(Array.isArray(plan.phases) ? plan.phases : [])
    this.setData({
      id,
      pageTitle: '方案编辑',
      contentKind: 'plan',
      isTemplate: false,
      templateSourceId: '',
      templateVisibility: '',
      status: plan.status || 'draft',
      name: plan.name || '',
      customerName: plan.customerName || '',
      participantCount: plan.participantCount || 20,
      type: plan.type || '企业培训',
      phases,
      totalDuration: totalDuration(phases)
    })
  },

  async loadTemplate(templateId) {
    const response = await callAction('trainer-api', 'getTemplateDetail', { _id: templateId })
    if (response.code !== 0 || !response.data || !response.data.template) {
      showInfo(response.message || '模板加载失败')
      return
    }
    this.applyTemplate(response.data.template)
  },

  applyTemplate(template) {
    // 模板的 phases 必须来自数据库；没有导入模板数据时保持空方案，避免误用演示流程。
    const phases = decoratePhases(Array.isArray(template.phases) ? template.phases : [])
    const templateVisibility = template.visibility === 'public' ? 'public' : 'private'
    this.setData({
      id: '',
      pageTitle: '方案编辑',
      contentKind: 'plan',
      isTemplate: false,
      status: 'draft',
      templateSourceId: template._id || '',
      templateVisibility,
      name: template.name ? template.name.replace('模板', '方案') : '新培训方案',
      customerName: '',
      participantCount: 20,
      type: template.type || '企业培训',
      phases,
      totalDuration: totalDuration(phases)
    })
  },

  syncPhases(phases) {
    const decorated = decoratePhases(phases)
    this.setData({
      phases: decorated,
      totalDuration: totalDuration(decorated)
    })
  },

  goBack() {
    goBackOrSwitchTab('/pages/prepare/index/index')
  },

  goPreview() {
    wx.setStorageSync('planPreviewDraft', this.buildPayload(this.data.status || 'draft'))
    navigateTo(`/pages/plan/preview/index?title=${encodeURIComponent(this.data.name || '方案预览')}`)
  },

  handleNameInput(event) {
    this.setData({ name: event.detail.value })
  },

  handleCustomerInput(event) {
    this.setData({ customerName: event.detail.value })
  },

  decrementPeople() {
    this.setData({ participantCount: Math.max(0, this.data.participantCount - 1) })
  },

  incrementPeople() {
    this.setData({ participantCount: this.data.participantCount + 1 })
  },

  showAddPhase() {
    this.setData({ addPhaseVisible: true, newPhaseName: '', newPhaseDuration: '10' })
  },

  hideAddPhase() {
    this.setData({ addPhaseVisible: false })
  },

  noop() {},

  selectPhaseType(event) {
    this.setData({ newPhaseName: event.currentTarget.dataset.name })
  },

  handlePhaseNameInput(event) {
    this.setData({ newPhaseName: event.detail.value })
  },

  handlePhaseDurationInput(event) {
    this.setData({ newPhaseDuration: event.detail.value })
  },

  async loadActivities() {
    const response = await callAction('trainer-api', 'listActivities')
    if (response.code !== 0 || !response.data) return
    const activities = (response.data.activities || []).map(normalizeActivity)
    this.setData({
      activities,
      filteredActivities: activities
    })
  },

  openPhaseActivityPicker(event) {
    const index = Number(event.currentTarget.dataset.index)
    if (index < 0 || index >= this.data.phases.length) return
    this.setData({
      showActivityPicker: true,
      currentPhaseIndex: index,
      activitySearch: '',
      filteredActivities: this.data.activities
    })
  },

  hideActivityPicker() {
    this.setData({
      showActivityPicker: false,
      currentPhaseIndex: -1,
      activitySearch: '',
      filteredActivities: this.data.activities
    })
  },

  handleActivitySearch(event) {
    const keyword = (event.detail.value || '').trim()
    const filteredActivities = this.data.activities.filter((item) => {
      if (!keyword) return true
      return (item.name || '').includes(keyword) || (item.typeText || '').includes(keyword)
    })
    this.setData({
      activitySearch: event.detail.value,
      filteredActivities
    })
  },

  selectActivityPhase(event) {
    const id = event.currentTarget.dataset.id
    const activity = this.data.activities.find((item) => item._id === id)
    if (!activity) {
      showInfo('活动不存在')
      return
    }
    const phaseIndex = this.data.currentPhaseIndex
    if (phaseIndex < 0 || phaseIndex >= this.data.phases.length) {
      showInfo('请先选择要添加活动的环节')
      return
    }
    const nextPhases = this.data.phases.map((phase, index) => {
      if (index !== phaseIndex) return phase
      const currentActivities = Array.isArray(phase.activities) ? phase.activities.slice() : []
      if (currentActivities.some((item) => item.activityId === activity._id)) {
        showInfo('该活动已在当前环节中')
        return phase
      }
      currentActivities.push({
        activityId: activity._id,
        name: activity.name,
        category: activity.category || activity.typeText || '团队融合',
        durationMinutes: Math.max(0, Number(activity.durationMinutes || 0)),
        peopleRange: activity.peopleRange || ''
      })
      return {
        ...phase,
        activities: currentActivities
      }
    })
    this.syncPhases(nextPhases)
    this.hideActivityPicker()
    showSuccess('已添加到当前环节')
  },

  removePhaseActivity(event) {
    const phaseIndex = Number(event.currentTarget.dataset.phaseIndex)
    const activityId = event.currentTarget.dataset.activityId
    if (!activityId) return
    const nextPhases = this.data.phases.map((phase, index) => {
      if (index !== phaseIndex) return phase
      const activities = Array.isArray(phase.activities)
        ? phase.activities.filter((item) => item.activityId !== activityId)
        : []
      return {
        ...phase,
        activities
      }
    })
    this.syncPhases(nextPhases)
    showSuccess('已移除活动')
  },

  confirmAddPhase() {
    const name = this.data.newPhaseName.trim()
    const duration = Math.max(1, Number(this.data.newPhaseDuration || 10))
    if (!name) {
      showInfo('请选择或输入环节')
      return
    }
    this.syncPhases([...this.data.phases, { name, duration, type: name, activities: [] }])
    this.setData({ addPhaseVisible: false })
    showSuccess('已添加')
  },

  removePhase(event) {
    const index = Number(event.currentTarget.dataset.index)
    this.syncPhases(this.data.phases.filter((_item, idx) => idx !== index))
  },

  movePhase(event) {
    const index = Number(event.currentTarget.dataset.index)
    const delta = Number(event.currentTarget.dataset.delta)
    const target = index + delta
    if (target < 0 || target >= this.data.phases.length) return
    const phases = this.data.phases.slice()
    const [item] = phases.splice(index, 1)
    phases.splice(target, 0, item)
    this.syncPhases(phases)
  },

  buildPayload(status) {
    const phases = this.data.phases.map((phase) => ({
      name: phase.name,
      duration: Number(phase.duration || 0),
      type: phase.type || phase.name,
      activities: Array.isArray(phase.activities)
        ? phase.activities.map((activity) => ({
          activityId: activity.activityId || activity._id || '',
          name: activity.name || '',
          category: activity.category || '',
          durationMinutes: Math.max(0, Number(activity.durationMinutes || activity.duration || 0)),
          peopleRange: activity.peopleRange || ''
        }))
        : []
    }))
    return {
      _id: this.data.id,
      name: this.data.name.trim(),
      customerName: this.data.customerName.trim(),
      type: this.data.type,
      status,
      participantCount: this.data.participantCount,
      durationMinutes: this.data.totalDuration,
      phases
    }
  },

  validatePlan() {
    if (!this.data.name.trim()) {
      showInfo('请输入方案名称')
      return false
    }
    if (this.data.phases.length === 0) {
      showInfo('请先添加环节')
      return false
    }
    return true
  },

  async saveDraft() {
    if (!this.validatePlan()) return
    const response = await callAction('trainer-api', 'savePlanDraft', this.buildPayload('draft'))
    if (response.code === 0 && response.data && response.data.planId) {
      this.setData({ id: response.data.planId, status: 'draft' })
    } else {
      showInfo(response.message || '保存失败')
      return
    }
    showSuccess('已保存草稿')
    this.goBack()
  },

  async saveAsTemplate() {
    if (!this.validatePlan()) return
    return savePlanAsPrivateTemplate(this, {
      getPlanId: (page) => page.data.id,
      saveDraft: (page) => callAction('trainer-api', 'savePlanDraft', page.buildPayload('draft')),
      assignPlanId: (page, planId) => {
        page.setData({
          id: planId,
          status: 'draft'
        })
      },
      showInfo,
      showSuccess,
      successText: '已保存为个人模板'
    })
  },

  async confirmPlan() {
    if (!this.validatePlan()) return
    const response = await callAction('trainer-api', 'confirmPlan', this.buildPayload('confirmed'))
    if (response.code !== 0 || !response.data) {
      showInfo(response.message || '确认失败')
      return ''
    }
    const planId = response.code === 0 && response.data ? response.data.planId : ''
    this.setData({
      id: planId || this.data.id,
      status: 'confirmed'
    })
    showSuccess('已确认方案')
    return planId || this.data.id
  },

  async launchTraining(planId) {
    const response = await callAction('live-api', 'startSession', { planId })
    if (response.code !== 0 || !response.data || !response.data.sessionId) {
      showInfo(response.message || '开课失败')
      return false
    }
    const sessionId = response.data.sessionId
    navigateTo(`/pages/live/index/index?sessionId=${sessionId}&title=${encodeURIComponent(this.data.name)}`)
    return true
  },

  async startTraining() {
    if (!this.validatePlan()) return
    if (this.data.isStartingTraining) return
    if (this.data.status === 'confirmed') {
      if (!this.data.id) {
        showInfo('请先确认方案')
        return
      }
      this.setData({ isStartingTraining: true })
      try {
        await this.launchTraining(this.data.id)
      } finally {
        this.setData({ isStartingTraining: false })
      }
      return
    }
    this.setData({ isStartingTraining: true })
    wx.showModal({
      title: '确认并开始培训',
      content: '将先确认当前方案，然后进入培训现场。',
      confirmText: '开始培训',
      cancelText: '再看看',
      success: async (res) => {
        if (!res.confirm) {
          this.setData({ isStartingTraining: false })
          return
        }
        try {
          const planId = await this.confirmPlan()
          if (planId) {
            await this.launchTraining(planId)
          }
        } finally {
          this.setData({ isStartingTraining: false })
        }
      },
      fail: () => {
        this.setData({ isStartingTraining: false })
      }
    })
  }
})
