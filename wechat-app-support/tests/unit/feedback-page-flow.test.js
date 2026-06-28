const test = require('node:test')
const assert = require('node:assert/strict')

const {
  generateEntryCode,
  __testables,
  loadFeedback
} = require('../../../wechat-app/miniprogram/pages/feedback/index/modules/page-flow')

const {
  buildErrorState,
  buildFeedbackStats,
  buildSuccessState,
  buildUnavailableState
} = __testables

function createFakePage(initialData = {}) {
  return {
    data: {
      sessionId: '',
      requestState: null,
      ...initialData
    },
    setData(patch) {
      this.data = {
        ...this.data,
        ...patch
      }
    }
  }
}

test('buildFeedbackStats maps metric and trend values with safe fallbacks', () => {
  const stats = buildFeedbackStats({
    metrics: [{}, {}, { value: '4.8' }, { value: '+52' }],
    trends: [{ value: '12 份反馈' }, { value: '73%' }]
  })

  assert.deepEqual(stats, {
    count: 12,
    avgSatisfaction: '4.8',
    nps: '+52',
    responseRate: '73%'
  })
})

test('buildFeedbackStats falls back when metrics or trends are missing', () => {
  const stats = buildFeedbackStats({})

  assert.deepEqual(stats, {
    count: 0,
    avgSatisfaction: '--',
    nps: '--',
    responseRate: '0%'
  })
})

test('buildUnavailableState returns a non-empty error request state for missing session', () => {
  const state = buildUnavailableState()

  assert.equal(state.hasError, true)
  assert.equal(state.error, '缺少场次信息')
  assert.equal(state.errorTitle, '反馈入口不可用')
  assert.equal(state.errorDesc, '请从有效场次重新进入反馈收集页。')
  assert.equal(state.isEmpty, false)
})

test('buildErrorState keeps the custom message while using the shared fallback copy', () => {
  const state = buildErrorState('接口超时')

  assert.equal(state.hasError, true)
  assert.equal(state.error, '接口超时')
  assert.equal(state.errorTitle, '反馈加载失败')
  assert.equal(state.errorDesc, '请稍后重试。')
  assert.equal(state.emptyTitle, '暂无反馈')
  assert.equal(state.emptyDesc, '复制链接发给参与者后，反馈会展示在这里。')
})

test('buildSuccessState marks a feedback list as data-present and not empty', () => {
  const state = buildSuccessState([{ _id: 'f1', content: '很有帮助' }])

  assert.equal(state.hasError, false)
  assert.equal(state.hasData, true)
  assert.equal(state.isEmpty, false)
  assert.equal(state.emptyTitle, '暂无反馈')
})

test('loadFeedback uses the unavailable request state when sessionId is missing', async () => {
  const page = createFakePage()

  await loadFeedback(page)

  assert.equal(page.data.requestState.error, '缺少场次信息')
  assert.equal(page.data.requestState.errorTitle, '反馈入口不可用')
  assert.equal(page.data.requestState.hasError, true)
})

test('generateEntryCode returns without changing loading state when already loading', async () => {
  const page = createFakePage({ feedbackCodeLoading: true })

  await generateEntryCode(page)

  assert.equal(page.data.feedbackCodeLoading, true)
})

test('generateEntryCode does not enter loading state without a session id', async () => {
  const originalWx = global.wx
  global.wx = {
    showToast() {}
  }
  const page = createFakePage({ feedbackCodeLoading: false })

  try {
    await generateEntryCode(page)
  } finally {
    global.wx = originalWx
  }

  assert.equal(page.data.feedbackCodeLoading, false)
})
