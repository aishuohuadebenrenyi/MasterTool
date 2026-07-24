const { callAction } = require('../../../../services/cloud')
const { navigateTo, showInfo } = require('../../../../utils/page')
const { buildRequestState } = require('../../../../utils/request-state')
const { normalizeReviewSession } = require('../../../../utils/session')
const { goBackOrSwitchTab } = require('../../../../utils/navigation')

async function onLoad(page, query) {
  const filter = query.filter === 'done' ? '已复盘' : '待复盘'
  page.setData({ activeFilter: filter })
  return loadReviews(page)
}

async function loadReviews(page) {
  page.setData({
    requestState: buildRequestState({ loading: true, items: [] })
  })
  const response = await callAction('review-api', 'listReviews')
  if (response.code !== 0 || !response.data) {
    showInfo(response.message || '复盘列表加载失败')
    page.setData({
      requestState: buildRequestState({
        error: response.message || '复盘列表加载失败',
        items: [],
        emptyTitle: '复盘列表加载失败',
        emptyDesc: '请稍后重试。'
      })
    })
    return
  }
  page.setData({ sessions: (response.data.sessions || []).map(normalizeReviewSession) })
  applyFilter(page)
}

function setFilter(page, event) {
  page.setData({ activeFilter: event.currentTarget.dataset.filter })
  applyFilter(page)
}

function applyFilter(page) {
  const list = page.data.sessions.filter((item) => item.statusText === page.data.activeFilter)
  page.setData({
    filteredSessions: list,
    requestState: buildRequestState({
      items: list,
      emptyTitle: '暂无复盘内容',
      emptyDesc: page.data.activeFilter === '待复盘'
        ? '结束培训后，待复盘场次会显示在这里。'
        : '完成复盘后，可在这里查看历史内容。'
    })
  })
}

function goDetail(page, event) {
  navigateTo(`/pages/plan/activity-detail/index?sessionId=${event.currentTarget.dataset.id}&entry=review`)
}

function goBack() {
  goBackOrSwitchTab('/pages/home/index/index')
}

module.exports = {
  applyFilter,
  goBack,
  goDetail,
  loadReviews,
  onLoad,
  setFilter
}
