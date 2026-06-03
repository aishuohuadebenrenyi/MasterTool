const { callAction } = require('../../../services/cloud')
const { navigateTo, showInfo, switchTabWithState } = require('../../../utils/page')

const TEMPLATE_ORDER = ['企业培训', '团建活动', '即兴演出', '即兴培训']

function templateBadge(item) {
  if (item.tagText) return item.tagText
  const phaseCount = Number(item.phaseCount || 0)
  return phaseCount > 0 ? `${phaseCount}段式` : '流程模板'
}

function formatHomeDate() {
  const now = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${now.getMonth() + 1}月${now.getDate()}日 ${weekdays[now.getDay()]}`
}

Page({
  data: {
    loading: false,
    currentDate: formatHomeDate(),
    pendingReviewDesc: '暂无待复盘事项',
    summary: {
      pendingStartCount: 0,
      draftPlanCount: 0,
      pendingReviewCount: 0
    },
    hasTodoItems: false,
    showPlanSelect: false,
    flowTemplates: []
  },

  onShow() {
    this.loadSummary()
  },

  async loadSummary() {
    this.setData({ loading: true })
    const [summaryResponse, templateResponse] = await Promise.all([
      callAction('trainer-api', 'getHomeSummary'),
      callAction('trainer-api', 'listTemplates')
    ])

    if (summaryResponse.code === 0 && summaryResponse.data) {
      const pendingStartCount = Number(summaryResponse.data.pendingStartCount || 0)
      const draftPlanCount = Number(summaryResponse.data.draftPlanCount || 0)
      const pendingReviewCount = Number(summaryResponse.data.pendingReviewCount || 0)
      const hasTodoItems = pendingStartCount > 0 || draftPlanCount > 0
      this.setData({
        pendingReviewDesc: pendingReviewCount > 0 ? `${pendingReviewCount} 场待复盘` : '暂无待复盘事项',
        summary: {
          pendingStartCount,
          draftPlanCount,
          pendingReviewCount
        },
        hasTodoItems
      })
    } else {
      showInfo(summaryResponse.message || '首页数据加载失败')
    }

    if (templateResponse.code === 0 && templateResponse.data && Array.isArray(templateResponse.data.templates)) {
      const flowTemplates = templateResponse.data.templates
        .filter((item) => item.visibility === 'public' || item.isPublic)
        .sort((left, right) => {
          const leftIndex = TEMPLATE_ORDER.indexOf(left.type || '')
          const rightIndex = TEMPLATE_ORDER.indexOf(right.type || '')
          const safeLeftIndex = leftIndex === -1 ? TEMPLATE_ORDER.length : leftIndex
          const safeRightIndex = rightIndex === -1 ? TEMPLATE_ORDER.length : rightIndex
          if (safeLeftIndex !== safeRightIndex) return safeLeftIndex - safeRightIndex
          return String(left.name || '').localeCompare(String(right.name || ''), 'zh-Hans-CN')
        })
        .map((item) => ({
          ...item,
          icon: item.type === '团建活动'
            ? '/static/icons/icon-type-team.png'
            : (item.type === '即兴演出'
              ? '/static/icons/icon-type-show.png'
              : (item.type === '即兴培训' ? '/static/icons/icon-type-training.png' : '/static/icons/icon-type-corporate.png')),
          tag: templateBadge(item)
        }))
      this.setData({
        flowTemplates
      })
    }
    this.setData({ loading: false })
  },

  handleStartTraining() {
    this.openPlanSelect()
  },

  handlePendingStart() {
    switchTabWithState('/pages/prepare/index/index', 'prepareEntry', {
      tab: 'plans',
      planKind: '我的方案',
      preferredStatus: 'confirmed'
    })
  },

  openPlanSelect() {
    wx.hideTabBar({ animation: false })
    this.setData({ showPlanSelect: true })
  },

  closePlanSelect() {
    wx.showTabBar({ animation: false })
    this.setData({ showPlanSelect: false })
  },

  noop() {},

  selectFromMyPlans() {
    this.closePlanSelect()
    switchTabWithState('/pages/prepare/index/index', 'prepareEntry', {
      tab: 'plans',
      planKind: '我的方案',
      preferredStatus: 'confirmed',
      fallbackStatus: 'draft'
    })
  },

  selectTemplate(event) {
    this.closePlanSelect()
    const id = event.currentTarget.dataset.id
    if (!id) {
      showInfo('请先导入公共模板数据')
      return
    }
    navigateTo(`/pages/plan/edit/index?templateId=${id}`)
  },

  handlePrepare() {
    switchTabWithState('/pages/prepare/index/index', 'prepareEntry', {
      tab: 'plans',
      preferredStatus: ''
    })
  },

  handleDraftPlans() {
    switchTabWithState('/pages/prepare/index/index', 'prepareEntry', {
      tab: 'plans',
      preferredStatus: 'draft'
    })
  },

  handleReview() {
    navigateTo('/pages/review/index/index?filter=pending')
  }
})
