const test = require('node:test')
const assert = require('node:assert/strict')

const cloudPath = '../../../wechat-app/miniprogram/services/cloud'
const helpPagePath = '../../../wechat-app/miniprogram/pages/mine/help/index'
const minePagePath = '../../../wechat-app/miniprogram/pages/mine/index/index'

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function loadPage(pagePath) {
  let definition = null
  global.Page = (config) => {
    definition = config
  }
  delete require.cache[require.resolve(pagePath)]
  require(pagePath)
  delete global.Page
  return definition
}

function createPage(definition) {
  return {
    ...definition,
    data: clone(definition.data),
    setData(patch) {
      this.data = {
        ...this.data,
        ...patch
      }
    }
  }
}

test('mine page starts stats with placeholders instead of sample data', () => {
  const pageDefinition = loadPage(minePagePath)

  assert.equal(pageDefinition.data.totalSessions, '--')
  assert.equal(pageDefinition.data.avgSatisfaction, '--')
  assert.equal(pageDefinition.data.totalParticipants, '--')
})

test('support feedback clears draft only after successful submit', async () => {
  const originalWx = global.wx
  global.wx = {
    showToast() {}
  }

  const cloud = require(cloudPath)
  const originalCallAction = cloud.callAction
  cloud.callAction = async () => ({
    code: 0,
    data: {
      feedbackId: 'feedback-1'
    }
  })

  try {
    const page = createPage(loadPage(helpPagePath))
    page.setData({
      contact: 'user@example.com',
      content: '二维码无法生成',
      contentCount: '7/500'
    })

    await page.submitFeedback()

    assert.equal(page.data.submitting, false)
    assert.equal(page.data.contact, '')
    assert.equal(page.data.content, '')
    assert.equal(page.data.contentCount, '0/500')
  } finally {
    cloud.callAction = originalCallAction
    global.wx = originalWx
  }
})
