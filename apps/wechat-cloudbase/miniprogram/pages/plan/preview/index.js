const { callAction } = require('../../../services/cloud')
const { showInfo, showSuccess } = require('../../../utils/page')
const { getPlanStatusText } = require('../../../utils/status')
const { goBackOrSwitchTab } = require('../../../utils/navigation')
const { buildPlan, formatDuration, normalizePreviewPhase } = require('../../../utils/plan')
const { savePlanAsPrivateTemplate } = require('../modules/template-save')

Page({
  data: {
    savingTemplate: false,
    viewMode: 'trainer',
    isClientView: false,
    pageTitle: '方案预览',
    viewTitle: '培训师执行版',
    viewDesc: '保留时间控制、工具使用、控场提醒和现场执行细节。',
    plan: buildPlan({}),
    phases: [],
    statusText: '草稿',
    durationText: '0分钟',
    phaseCountText: '0个环节'
  },

  async onLoad(query) {
    const draft = wx.getStorageSync('planPreviewDraft') || null
    const planId = query.id || ''
    const title = query.title ? decodeURIComponent(query.title) : ''
    let remotePlan = null
    if (planId) {
      const response = await callAction('trainer-api', 'getPlanDetail', { _id: planId })
      if (response.code === 0 && response.data) {
        remotePlan = response.data.plan
      } else {
        showInfo(response.message || '方案加载失败')
      }
    }
    const source = planId ? (remotePlan || { name: title || '培训方案' }) : (draft || { name: title || '培训方案' })
    const plan = buildPlan(source)
    this.applyPlan(plan, 'trainer')
  },

  applyPlan(plan, viewMode) {
    const normalized = buildPlan(plan)
    const timelineDuration = normalized.phases.reduce((sum, item) => sum + Number(item.duration || item.minutes || 0), 0) || normalized.duration
    const isClientView = viewMode === 'client'
    this.setData({
      viewMode,
      isClientView,
      pageTitle: normalized.status === 'template' ? '模板预览' : '方案预览',
      viewTitle: isClientView ? '客户版课程概览' : '培训师执行版',
      viewDesc: isClientView
        ? '突出课程价值、参与体验和交付节奏，隐藏内部控场提示。'
        : '保留时间控制、工具使用、控场提醒和现场执行细节。',
      plan: normalized,
      phases: normalized.phases.map((phase, index) => normalizePreviewPhase(phase, index, timelineDuration, viewMode)),
      statusText: getPlanStatusText(normalized.status),
      durationText: formatDuration(normalized.duration),
      phaseCountText: `${normalized.phases.length}个环节`
    })
  },

  goBack() {
    goBackOrSwitchTab('/pages/prepare/index/index')
  },

  switchView(event) {
    const mode = event.currentTarget.dataset.mode
    this.applyPlan(this.data.plan, mode)
  },

  exportPlanDoc() {
    const lines = [
      `# ${this.data.plan.name}`,
      '',
      `- 视角：${this.data.viewTitle}`,
      `- 类型：${this.data.plan.type}`,
      `- 人数：${this.data.plan.participantCount}人`,
      `- 时长：${this.data.durationText}`,
      '',
      '## 流程',
      ...this.data.phases.map((phase, index) => `${index + 1}. ${phase.name}（${phase.duration}分钟）${phase.hasActivities ? `\n   活动：${phase.activitySummary}` : ''}`)
    ]
    wx.setClipboardData({
      data: lines.join('\n'),
      success: () => showInfo('已复制方案文档', 2200),
      fail: () => showInfo('导出失败', 2200)
    })
  },

  async saveAsTemplate() {
    return savePlanAsPrivateTemplate(this, {
      getPlanId: (page) => page.data.plan._id,
      saveDraft: (page) => callAction('trainer-api', 'savePlanDraft', page.data.plan),
      assignPlanId: (page, planId) => {
        page.setData({
          plan: {
            ...page.data.plan,
            _id: planId
          }
        })
      },
      showInfo,
      showSuccess,
      successText: '已另存为个人模板'
    })
  }
})
