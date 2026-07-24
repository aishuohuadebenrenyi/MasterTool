const { createRequestState } = require('../../../utils/request-state')
const {
  applyFilter: applyFilterModule,
  goBack: goBackModule,
  goDetail: goDetailModule,
  loadReviews: loadReviewsModule,
  onLoad: onLoadModule,
  setFilter: setFilterModule
} = require('./modules/page-flow')

Page({
  data: {
    activeFilter: '待复盘',
    filters: ['待复盘', '已复盘'],
    sessions: [],
    filteredSessions: [],
    requestState: createRequestState()
  },

  onLoad(query) {
    return onLoadModule(this, query || {})
  },

  async loadReviews() {
    return loadReviewsModule(this)
  },

  setFilter(event) {
    return setFilterModule(this, event)
  },

  applyFilter() {
    return applyFilterModule(this)
  },

  goDetail(event) {
    return goDetailModule(this, event)
  },

  goBack() {
    return goBackModule()
  }
})
