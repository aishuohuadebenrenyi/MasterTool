const { callAction, getMiniProgramEnvVersion } = require('../../../../services/cloud')
const { navigateTo, showInfo, showSuccess } = require('../../../../utils/page')
const { goBackOrSwitchTab } = require('../../../../utils/navigation')
const { buildRequestState } = require('../../../../utils/request-state')

function buildFeedbackStats(data = {}) {
  const metrics = data.metrics || []
  const trends = data.trends || []
  return {
    count: Number((trends[0] && `${trends[0].value}`.replace(/\D/g, '')) || 0),
    avgSatisfaction: (metrics[2] && metrics[2].value) || '--',
    nps: (metrics[3] && metrics[3].value) || '--',
    responseRate: (trends[1] && trends[1].value) || '0%'
  }
}

function buildUnavailableState() {
  return buildRequestState({
    error: '缺少场次信息',
    errorTitle: '反馈入口不可用',
    errorDesc: '请从有效场次重新进入反馈收集页。'
  })
}

function buildErrorState(message) {
  return buildRequestState({
    error: message || '反馈数据加载失败',
    errorTitle: '反馈加载失败',
    errorDesc: '请稍后重试。',
    items: [],
    emptyTitle: '暂无反馈',
    emptyDesc: '复制入口发给参与者后，反馈会展示在这里。'
  })
}

function buildSuccessState(feedbackList) {
  return buildRequestState({
    items: feedbackList,
    emptyTitle: '暂无反馈',
    emptyDesc: '复制入口发给参与者后，反馈会展示在这里。'
  })
}

async function onLoad(page, query) {
  const sessionId = query.sessionId || ''
  page.setData({
    sessionId,
    feedbackPath: `/pages/participant/feedback/index?sessionId=${sessionId}`,
    requestState: buildRequestState({ loading: true, items: [] })
  })
  return loadFeedback(page)
}

async function loadFeedback(page) {
  if (!page.data.sessionId) {
    page.setData({ requestState: buildUnavailableState() })
    return
  }
  const response = await callAction('trainer-api', 'getDataOverview', { sessionId: page.data.sessionId })
  if (response.code !== 0 || !response.data) {
    showInfo(response.message || '反馈数据加载失败')
    page.setData({ requestState: buildErrorState(response.message) })
    return
  }
  const feedbackList = response.data.feedbackList || []
  page.setData({
    stats: buildFeedbackStats(response.data),
    feedbackList,
    requestState: buildSuccessState(feedbackList)
  })
}

function goBack() {
  goBackOrSwitchTab('/pages/home/index/index')
}

function toggleAnonymous(page) {
  page.setData({ anonymousEnabled: !page.data.anonymousEnabled })
}

function copyEntry(page) {
  wx.setClipboardData({
    data: page.data.feedbackPath,
    success: () => showSuccess('入口已复制')
  })
}

async function generateEntryCode(page) {
  page.setData({ feedbackCodeLoading: true })
  const response = await callAction('live-api', 'getSessionEntryCode', {
    sessionId: page.data.sessionId,
    entryType: 'feedback',
    envVersion: getMiniProgramEnvVersion()
  }, { timeoutMs: 15000 })
  page.setData({ feedbackCodeLoading: false })
  if (response.code !== 0 || !response.data) {
    showInfo(response.message || '反馈小程序码生成失败')
    return
  }
  page.setData({ feedbackCodeUrl: response.data.tempFileURL || '' })
  showSuccess('反馈小程序码已生成')
}

function openSubmitPreview(page) {
  navigateTo(page.data.feedbackPath)
}

module.exports = {
  __testables: {
    buildErrorState,
    buildFeedbackStats,
    buildSuccessState,
    buildUnavailableState
  },
  copyEntry,
  generateEntryCode,
  goBack,
  loadFeedback,
  onLoad,
  openSubmitPreview,
  toggleAnonymous
}
