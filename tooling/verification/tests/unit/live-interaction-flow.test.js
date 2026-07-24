const test = require('node:test')
const assert = require('node:assert/strict')

const cloudPath = '../../../../apps/wechat-cloudbase/miniprogram/services/cloud'
const interactPath = '../../../../apps/wechat-cloudbase/miniprogram/pages/live/index/modules/interact'

function loadInteractModule(callAction) {
  const cloud = require(cloudPath)
  const originalCallAction = cloud.callAction
  cloud.callAction = callAction
  delete require.cache[require.resolve(interactPath)]
  const module = require(interactPath)
  cloud.callAction = originalCallAction
  return module
}

function createPage(initialData = {}) {
  return {
    data: {
      sessionId: 'session-1',
      interactionType: 'wordcloud',
      interactionTitle: '现场词云',
      voteOptionsText: 'A\nB',
      interactions: [{ _id: 'interaction-1', title: '现场词云', joinCode: 'ABC123' }],
      interactionCreating: false,
      closingInteractionId: '',
      interactionCodeLoadingId: '',
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

test('createInteraction skips cloud call while creation is pending', async () => {
  let callCount = 0
  const interact = loadInteractModule(async () => {
    callCount += 1
    return { code: 0, data: {} }
  })
  const page = createPage({ interactionCreating: true })

  await interact.createInteraction(page)

  assert.equal(callCount, 0)
})

test('generateInteractionCode skips cloud call while another code is loading', async () => {
  let callCount = 0
  const interact = loadInteractModule(async () => {
    callCount += 1
    return { code: 0, data: {} }
  })
  const page = createPage({ interactionCodeLoadingId: 'interaction-2' })

  await interact.generateInteractionCode(page, 'interaction-1')

  assert.equal(callCount, 0)
})

test('closeInteraction skips cloud call while close is pending', async () => {
  let callCount = 0
  const interact = loadInteractModule(async () => {
    callCount += 1
    return { code: 0, data: {} }
  })
  const page = createPage({ closingInteractionId: 'interaction-2' })

  await interact.closeInteraction(page, 'interaction-1')

  assert.equal(callCount, 0)
})
