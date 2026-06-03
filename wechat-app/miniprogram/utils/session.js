const { getSessionStatusText } = require('./status')
const { buildActivitySummaryText, buildPhaseActivityDetails } = require('./activity')

function formatSessionDate(timestamp, mode = 'short') {
  if (!timestamp) return mode === 'short' ? '未结束' : '未结束'
  const date = new Date(timestamp)
  if (mode === 'month-day') {
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${month}-${day}`
}

function buildFlowText(phases) {
  return Array.isArray(phases) && phases.length
    ? phases.map((phase, index) => `${index + 1}. ${phase.name || `环节${index + 1}`}`).join('\n')
    : '暂无环节信息'
}

function normalizeReviewSession(session) {
  return {
    ...session,
    title: session.name || '培训活动',
    typeText: session.type || '企业培训',
    statusText: getSessionStatusText(session.status),
    dateText: formatSessionDate(session.reviewedAt || session.endedAt, 'month-day'),
    participantsText: `${session.participantCount || 0}人`,
    durationText: `${session.durationMinutes || 0}分钟`,
    customerText: session.customerName || '未填写客户',
    phaseText: session.phaseCount ? `${session.phaseCount}个环节` : '未配置环节',
    flowText: session.flowText || '暂无方案流程',
    activitySummaryText: session.activitySummaryText || ''
  }
}

function buildSessionView(snapshot, session, reviewStatus) {
  const phases = Array.isArray(snapshot.phases) ? snapshot.phases : []
  return {
    reviewStatusText: getSessionStatusText(reviewStatus),
    sessionCustomerText: snapshot.customerName || '未填写客户',
    sessionParticipantText: `${snapshot.participantCount || 0}人`,
    sessionPhaseText: phases.length ? `${phases.length}个环节` : '暂无环节',
    sessionEndedText: formatSessionDate(session.reviewedAt || session.endedAt || session.startedAt),
    sessionFlowText: phases.length ? phases.map((phase) => phase.name || '未命名环节').join(' -> ') : '暂无方案流程',
    sessionPhaseActivities: buildPhaseActivityDetails(phases),
    activitySummaryText: buildActivitySummaryText(phases)
  }
}

module.exports = {
  buildFlowText,
  buildSessionView,
  formatSessionDate,
  normalizeReviewSession
}
