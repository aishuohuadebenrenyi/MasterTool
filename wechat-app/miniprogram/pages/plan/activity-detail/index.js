const { callAction } = require('../../../services/cloud')
const { navigateTo, showInfo, showSuccess } = require('../../../utils/page')
const { normalizeActivity, getFirstActivityId } = require('../../../utils/activity')
const { buildFlowText, buildSessionView } = require('../../../utils/session')
const { normalizeStatusValue } = require('../../../utils/status')
const { goBackOrNavigate, goBackOrSwitchTab } = require('../../../utils/navigation')

function normalizePlan(plan) {
  return {
    ...plan,
    metaText: `${plan.customerName || '未填写客户'} · ${plan.participantCount || 0}人`,
    phases: Array.isArray(plan.phases) ? plan.phases : []
  }
}

function resolveDetailMode(query) {
  return query.sessionId ? 'review-entry' : 'detail'
}

Page({
  data: {
    id: '',
    sessionId: '',
    entry: '',
    mode: 'detail',
    pageTitle: '活动详情',
    activity: normalizeActivity({}),
    isFavorite: false,
    expandRules: true,
    expandReview: false,
    expandTips: false,
    showAddToPlan: false,
    addStep: 1,
    plans: [],
    selectedPlan: null,
    isReviewMode: false,
    reviewStatus: '',
    reviewStatusText: '',
    reviewActionText: '去复盘',
    sessionCustomerText: '',
    sessionParticipantText: '',
    sessionPhaseText: '',
    sessionEndedText: '',
    sessionFlowText: '',
    sessionPhaseActivities: []
  },

  async onLoad(query) {
    const id = query.id || ''
    const sessionId = query.sessionId || ''
    const entry = query.entry || ''
    const mode = resolveDetailMode(query)
    const isReviewMode = mode === 'review-entry'
    this.setData({
      id,
      sessionId,
      entry,
      mode,
      isReviewMode,
      pageTitle: isReviewMode ? '交付详情' : '活动详情'
    })

    if (isReviewMode) {
      await this.loadReviewEntry(sessionId)
      return
    }

    await Promise.all([
      this.loadActivity(id),
      this.loadPlans()
    ])
  },

  async loadActivity(id) {
    if (!id) {
      showInfo('缺少活动信息')
      return
    }
    const response = await callAction('trainer-api', 'getActivityDetail', { _id: id })
    if (response.code !== 0 || !response.data || !response.data.activity) {
      showInfo(response.message || '活动加载失败')
      return
    }
    const activity = response.data.activity
    this.setData({
      activity: normalizeActivity(activity),
      isFavorite: !!activity.isFavorite
    })
  },

  async loadReviewEntry(sessionId) {
    if (!sessionId) {
      showInfo('缺少场次信息')
      this.goBack()
      return
    }

    const [sessionResponse, reviewResponse] = await Promise.all([
      callAction('live-api', 'getSessionDetail', { sessionId }),
      callAction('review-api', 'getReviewDetail', { sessionId })
    ])

    if (sessionResponse.code !== 0 || !sessionResponse.data || !sessionResponse.data.session) {
      showInfo(sessionResponse.message || '活动详情加载失败')
      this.goBack()
      return
    }

    const session = sessionResponse.data.session
    const snapshot = session.planSnapshot || {}
    const phases = Array.isArray(snapshot.phases) ? snapshot.phases : []
    const totalMinutes = phases.reduce((sum, phase) => sum + Math.max(0, Number(phase.duration || phase.minutes || 0)), 0)
    const firstActivityId = getFirstActivityId(phases)

    let activity = null
    if (firstActivityId) {
      const activityResponse = await callAction('trainer-api', 'getActivityDetail', { _id: firstActivityId })
      if (activityResponse.code === 0 && activityResponse.data && activityResponse.data.activity) {
        activity = activityResponse.data.activity
      }
    }

    const normalizedActivity = normalizeActivity({
      ...(activity || {}),
      _id: firstActivityId || (activity && activity._id) || '',
      name: snapshot.name || (activity && activity.name) || '培训活动',
      scenes: [snapshot.type || (activity && activity.category) || '企业培训'],
      category: snapshot.type || (activity && activity.category) || '企业培训',
      difficulty: activity && activity.difficulty ? activity.difficulty : '已交付',
      peopleRange: snapshot.participantCount ? `${snapshot.participantCount}人` : ((activity && activity.peopleRange) || '人数待定'),
      durationMinutes: totalMinutes || (activity && activity.durationMinutes) || 0,
      objective: activity && activity.objective
        ? activity.objective
        : (snapshot.customerName ? `客户：${snapshot.customerName}` : '查看本场活动详情，再进入复盘记录。'),
      rules: activity && activity.rules ? activity.rules : buildFlowText(phases),
      reviewQuestions: activity && activity.reviewQuestions ? activity.reviewQuestions : '请结合现场反馈、参与状态与流程执行情况进行复盘。',
      leaderTips: activity && activity.leaderTips ? activity.leaderTips : '先看清本场方案与执行信息，再进入复盘沉淀关键观察。'
    })

    const reviewStatus = reviewResponse.code === 0 && reviewResponse.data && reviewResponse.data.session
      ? reviewResponse.data.session.status
      : session.status
    const normalizedSessionId = session._id || sessionId

    this.setData({
      id: firstActivityId || this.data.id,
      sessionId: normalizedSessionId,
      activity: normalizedActivity,
      isFavorite: !!(activity && activity.isFavorite),
      reviewStatus,
      reviewActionText: reviewStatus === 'reviewed' ? '查看复盘' : '去复盘',
      ...buildSessionView(snapshot, session, reviewStatus)
    })
  },

  async loadPlans() {
    const response = await callAction('trainer-api', 'listPlans', { status: '' })
    if (response.code !== 0 || !response.data) {
      showInfo(response.message || '方案加载失败')
      return
    }
    this.setData({
      plans: (response.data.plans || []).filter((plan) => plan.status === 'draft').map(normalizePlan)
    })
  },

  goBack() {
    if (this.data.entry === 'review') {
      goBackOrNavigate('/pages/review/index/index')
      return
    }
    goBackOrSwitchTab('/pages/prepare/index/index')
  },

  goEdit() {
    if (this.data.isReviewMode) return
    navigateTo(`/pages/plan/activity-edit/index?id=${this.data.id || this.data.activity._id}`)
  },

  goReview() {
    if (!this.data.sessionId) {
      showInfo('当前交付场次缺失，暂时无法复盘')
      return
    }
    const normalizedStatus = normalizeStatusValue(this.data.reviewStatus)
    if (normalizedStatus && normalizedStatus !== 'ended' && normalizedStatus !== 'reviewed') {
      showInfo('当前活动尚未结束，暂时不能复盘')
      return
    }
    wx.navigateTo({
      url: `/pages/review/detail/index?sessionId=${this.data.sessionId}`,
      fail: () => showInfo('进入复盘失败，请稍后重试')
    })
  },

  async toggleFavorite() {
    const nextFavorite = !this.data.isFavorite
    const response = await callAction('trainer-api', 'updateActivityFlags', {
      _id: this.data.id || this.data.activity._id,
      isFavorite: nextFavorite
    })
    if (response.code !== 0) {
      showInfo(response.message || '操作失败')
      return
    }
    this.setData({ isFavorite: nextFavorite })
    showSuccess(nextFavorite ? '已收藏' : '已取消收藏')
  },

  toggleExpand(event) {
    const field = event.currentTarget.dataset.field
    this.setData({ [field]: !this.data[field] })
  },

  openAddToPlan() {
    this.setData({
      showAddToPlan: true,
      addStep: 1,
      selectedPlan: null
    })
  },

  closeAddToPlan() {
    this.setData({ showAddToPlan: false })
  },

  noop() {},

  selectPlan(event) {
    const id = event.currentTarget.dataset.id
    const selectedPlan = this.data.plans.find((item) => item._id === id)
    if (!selectedPlan) return
    this.setData({ selectedPlan, addStep: 2 })
  },

  backToPlans() {
    this.setData({ addStep: 1, selectedPlan: null })
  },

  async selectPhase(event) {
    const index = Number(event.currentTarget.dataset.index)
    const phase = this.data.selectedPlan && this.data.selectedPlan.phases[index]
    if (!phase) {
      showInfo('请选择环节')
      return
    }
    const response = await callAction('trainer-api', 'addActivityToPlan', {
      activityId: this.data.id || this.data.activity._id,
      planId: this.data.selectedPlan._id,
      phaseIndex: index
    })
    if (response.code !== 0) {
      showInfo(response.message || '添加失败')
      return
    }
    this.closeAddToPlan()
    showSuccess('已添加到方案')
  }
})
