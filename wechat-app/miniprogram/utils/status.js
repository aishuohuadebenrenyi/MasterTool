const PLAN_STATUS_TEXT = {
  draft: '草稿',
  confirmed: '已确认',
  delivered: '已交付',
  reviewed: '已复盘',
  template: '模板'
}

const SESSION_STATUS_TEXT = {
  running: '进行中',
  ended: '待复盘',
  reviewed: '已复盘'
}

function normalizeStatusValue(status) {
  if (status === 'reviewing') return 'ended'
  if (status === 'completed') return 'reviewed'
  return status || ''
}

function getPlanStatusText(status) {
  const normalized = normalizeStatusValue(status)
  return PLAN_STATUS_TEXT[normalized] || normalized || '草稿'
}

function getSessionStatusText(status) {
  const normalized = normalizeStatusValue(status)
  return SESSION_STATUS_TEXT[normalized] || normalized || '进行中'
}

function isReviewedStatus(status) {
  return normalizeStatusValue(status) === 'reviewed'
}

module.exports = {
  getPlanStatusText,
  getSessionStatusText,
  isReviewedStatus,
  normalizeStatusValue
}
