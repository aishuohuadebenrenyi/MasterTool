const { callAction } = require('../../../services/cloud')
const { showInfo } = require('../../../utils/page')
const { goBackOrSwitchTab } = require('../../../utils/navigation')

Page({
  data: {
    title: '数据详情',
    isSessionMode: false,
    sessionId: '',
    sessionText: '全部培训',
    rangeType: '6个月',
    ranges: ['6个月', '12个月'],
    metrics: [],
    trends: [],
    distributionTitle: '场景分布',
    distribution: []
  },

  onLoad(query) {
    const isSessionMode = !!query.sessionId
    this.setData({
      isSessionMode,
      sessionId: query.sessionId || '',
      title: isSessionMode ? '本场数据' : '数据详情',
      sessionText: isSessionMode ? `当前场次 ${query.sessionId.slice(0, 8)}` : '全部培训'
    })
    this.loadData()
  },

  async loadData() {
    const response = await callAction('trainer-api', 'getDataOverview', {
      sessionId: this.data.isSessionMode ? this.data.sessionId : ''
    })
    if (response.code !== 0 || !response.data) {
      showInfo(response.message || '数据加载失败')
      return
    }
    this.setData({
      sessionText: this.data.isSessionMode ? (response.data.title || this.data.sessionText) : '全部培训',
      metrics: response.data.metrics || [],
      trends: response.data.trends || [],
      distributionTitle: response.data.distributionTitle || '分布',
      distribution: response.data.distribution || []
    })
  },

  setRange(event) {
    this.setData({ rangeType: event.currentTarget.dataset.range })
    this.loadData()
  },

  goBack() {
    goBackOrSwitchTab('/pages/mine/index/index')
  }
})
