const { callAction } = require('../../../../services/cloud')
const { showInfo, showSuccess } = require('../../../../utils/page')
const { getSessionStatusText, isReviewedStatus, normalizeStatusValue } = require('../../../../utils/status')
const { goBackOrNavigate } = require('../../../../utils/navigation')

function goBack(page) {
  goBackOrNavigate(`/pages/plan/activity-detail/index?sessionId=${page.data.sessionId}&entry=review`)
}

async function onLoad(page, query) {
  page.setData({ sessionId: query.sessionId || '' })
  page.applyFramework('ORID')
  await loadReviewDetail(page)
  await loadFeedbackSummary(page)
}

async function loadReviewDetail(page) {
  if (!page.data.sessionId) return
  const response = await callAction('review-api', 'getReviewDetail', { sessionId: page.data.sessionId })
  if (response.code !== 0 || !response.data || !response.data.session) {
    showInfo(response.message || '复盘详情加载失败')
    goBack(page)
    return
  }
  const session = response.data.session
  const review = response.data.review || null
  const normalizedStatus = normalizeStatusValue(session.status)
  const isReviewed = isReviewedStatus(normalizedStatus)
  if (normalizedStatus !== 'ended' && !isReviewed) {
    showInfo('当前活动尚未结束')
    goBack(page)
    return
  }
  page.setData({
    sessionName: session.name || '培训活动',
    reviewStatus: normalizedStatus,
    reviewStatusText: getSessionStatusText(normalizedStatus),
    isReviewLocked: isReviewed,
    completedContent: review && typeof review.content === 'string' ? review.content : '',
    activitySummaryText: session.activitySummaryText || '',
    phaseActivities: Array.isArray(session.phaseActivities) ? session.phaseActivities : []
  })
}

async function loadFeedbackSummary(page) {
  if (!page.data.sessionId) return
  const response = await callAction('trainer-api', 'getDataOverview', { sessionId: page.data.sessionId })
  if (response.code !== 0 || !response.data) return
  const summary = (response.data.feedbackList || [])
    .filter((item) => item.content)
    .map((item) => item.content)
    .slice(0, 5)
  page.setData({ feedbackSummary: summary })
}

async function completeReview(page) {
  if (page.data.isReviewLocked) {
    showInfo('该场次已完成复盘')
    return
  }
  const answers = page.persistCurrentAnswer()
  const content = Object.keys(answers)
    .map((question) => `${question}\n${answers[question] || ''}`)
    .join('\n\n')
    .trim()
  if (!content) {
    showInfo('请先填写复盘内容')
    return
  }
  const response = await callAction('review-api', 'saveReview', {
    sessionId: page.data.sessionId,
    content
  })
  if (response.code !== 0) {
    showInfo(response.message || '复盘保存失败')
    return
  }
  showSuccess('复盘已完成')
  goBack(page)
}

module.exports = {
  completeReview,
  goBack,
  loadFeedbackSummary,
  loadReviewDetail,
  onLoad
}
