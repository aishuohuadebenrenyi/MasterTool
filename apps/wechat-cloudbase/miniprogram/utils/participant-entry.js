const { buildRequestState, createRequestState } = require('./request-state')

function resolveDetail(detail) {
  return detail && typeof detail === 'object' ? detail : {}
}

function getInputValue(event) {
  return typeof event.detail === 'object' && event.detail !== null
    ? String(event.detail.value || '')
    : ''
}

async function withPending(page, field, task) {
  if (page.data[field]) {
    return { skipped: true }
  }
  page.setData({ [field]: true })
  try {
    return await task()
  } finally {
    page.setData({ [field]: false })
  }
}

function buildPublicEntryState(options = {}) {
  const detail = resolveDetail(options)
  return buildRequestState({
    loading: Boolean(detail.loading),
    error: detail.error || '',
    errorTitle: detail.errorTitle || '入口不可用',
    errorDesc: detail.errorDesc || '',
    items: detail.items || [],
    emptyTitle: detail.emptyTitle || '暂无内容',
    emptyDesc: detail.emptyDesc || ''
  })
}

module.exports = {
  buildPublicEntryState,
  createRequestState,
  getInputValue,
  withPending
}
