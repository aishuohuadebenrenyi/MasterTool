const test = require('node:test')
const assert = require('node:assert/strict')

const {
  __testables,
  savePlanAsPrivateTemplate
} = require('../../../wechat-app/miniprogram/pages/plan/modules/template-save')

const { ensurePlanIdForTemplate } = __testables

function createFakePage(initialData = {}) {
  return {
    data: {
      savingTemplate: false,
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

test('ensurePlanIdForTemplate returns the existing plan id without saving a draft', async () => {
  const page = createFakePage({ id: 'plan_existing' })
  let draftCalled = false

  const planId = await ensurePlanIdForTemplate(page, {
    getPlanId: (currentPage) => currentPage.data.id,
    saveDraft: async () => {
      draftCalled = true
      return { code: 0, data: { planId: 'plan_new' } }
    },
    assignPlanId: () => {}
  })

  assert.equal(planId, 'plan_existing')
  assert.equal(draftCalled, false)
})

test('ensurePlanIdForTemplate saves a draft and assigns the new plan id when missing', async () => {
  const page = createFakePage({ id: '' })

  const planId = await ensurePlanIdForTemplate(page, {
    getPlanId: (currentPage) => currentPage.data.id,
    saveDraft: async () => ({ code: 0, data: { planId: 'plan_new' } }),
    assignPlanId: (currentPage, nextPlanId) => {
      currentPage.setData({ id: nextPlanId })
    }
  })

  assert.equal(planId, 'plan_new')
  assert.equal(page.data.id, 'plan_new')
})

test('savePlanAsPrivateTemplate persists the draft first and then saves the private template', async () => {
  const page = createFakePage({ id: '' })
  const actionCalls = []
  const messages = []

  const result = await savePlanAsPrivateTemplate(page, {
    getPlanId: (currentPage) => currentPage.data.id,
    saveDraft: async () => ({ code: 0, data: { planId: 'plan_new' } }),
    assignPlanId: (currentPage, nextPlanId) => currentPage.setData({ id: nextPlanId }),
    callAction: async (_service, action, payload) => {
      actionCalls.push({ action, payload })
      return { code: 0, data: { templateId: 'tpl_1' } }
    },
    showInfo: (message) => messages.push({ type: 'info', message }),
    showSuccess: (message) => messages.push({ type: 'success', message }),
    successText: '已保存为个人模板'
  })

  assert.deepEqual(actionCalls, [
    { action: 'savePlanAsTemplate', payload: { _id: 'plan_new' } }
  ])
  assert.deepEqual(messages, [
    { type: 'success', message: '已保存为个人模板' }
  ])
  assert.equal(page.data.id, 'plan_new')
  assert.equal(page.data.savingTemplate, false)
  assert.deepEqual(result, {
    ok: true,
    skipped: false,
    templateId: 'tpl_1'
  })
})

test('savePlanAsPrivateTemplate skips repeated taps while saving', async () => {
  const page = createFakePage({ savingTemplate: true, id: 'plan_existing' })
  let actionCalled = false

  const result = await savePlanAsPrivateTemplate(page, {
    getPlanId: (currentPage) => currentPage.data.id,
    saveDraft: async () => ({ code: 0, data: { planId: 'unused' } }),
    assignPlanId: () => {},
    callAction: async () => {
      actionCalled = true
      return { code: 0, data: { templateId: 'tpl_1' } }
    }
  })

  assert.equal(actionCalled, false)
  assert.deepEqual(result, {
    ok: false,
    skipped: true
  })
})

test('savePlanAsPrivateTemplate reports draft failure and resets the saving state', async () => {
  const page = createFakePage({ id: '' })
  const messages = []

  const result = await savePlanAsPrivateTemplate(page, {
    getPlanId: (currentPage) => currentPage.data.id,
    saveDraft: async () => ({ code: -1, message: '草稿保存失败' }),
    assignPlanId: () => {},
    callAction: async () => ({ code: 0, data: { templateId: 'tpl_1' } }),
    showInfo: (message) => messages.push(message),
    showSuccess: () => {}
  })

  assert.deepEqual(messages, ['草稿保存失败'])
  assert.equal(page.data.savingTemplate, false)
  assert.deepEqual(result, {
    ok: false,
    skipped: false
  })
})
