const { callAction } = require('../../../services/cloud')
const { navigateTo, showInfo } = require('../../../utils/page')
const { goBackOrSwitchTab } = require('../../../utils/navigation')

Page({
  data: {
    title: '培训记录',
    activeFilter: '全部',
    filters: ['全部', '企业培训', '团建活动', '即兴演出', '即兴培训'],
    allRecords: [],
    records: []
  },

  onLoad(query) {
    if (query.filter === 'pendingReview') {
      navigateTo('/pages/review/index/index?filter=pending')
      return
    }
    this.loadRecords(query.filter || '')
  },

  async loadRecords(filter) {
    const response = await callAction('trainer-api', 'listTrainingRecords')
    if (response.code !== 0 || !response.data) {
      showInfo(response.message || '记录加载失败')
      return
    }
    const allRecords = response.data.records || []
    const records = filter === 'pendingReview'
      ? allRecords.filter((item) => item.status === '待复盘')
      : allRecords
    this.setData({ allRecords, records })
  },

  setFilter(event) {
    const filter = event.currentTarget.dataset.filter
    const records = filter === '全部'
      ? this.data.allRecords
      : this.data.allRecords.filter((item) => item.category === filter)
    this.setData({ activeFilter: filter, records })
  },

  goBack() {
    goBackOrSwitchTab('/pages/mine/index/index')
  }
})
