const { callAction } = require('../../../services/cloud')
const { showInfo, showSuccess } = require('../../../utils/page')

async function ensurePlanIdForTemplate(page, options = {}) {
  const getPlanId = options.getPlanId || (() => '')
  const saveDraft = options.saveDraft || (async () => ({ code: -1 }))
  const assignPlanId = options.assignPlanId || (() => {})
  const notifyInfo = options.showInfo || showInfo

  const currentPlanId = getPlanId(page)
  if (currentPlanId) return currentPlanId

  const response = await saveDraft(page)
  if (response.code !== 0 || !response.data || !response.data.planId) {
    notifyInfo(response.message || '请先保存方案')
    return ''
  }

  assignPlanId(page, response.data.planId)
  return response.data.planId
}

async function savePlanAsPrivateTemplate(page, options = {}) {
  if (page.data.savingTemplate) {
    return { ok: false, skipped: true }
  }

  const request = options.callAction || callAction
  const notifyInfo = options.showInfo || showInfo
  const notifySuccess = options.showSuccess || showSuccess
  const successText = options.successText || '已保存为个人模板'

  page.setData({ savingTemplate: true })

  const planId = await ensurePlanIdForTemplate(page, {
    getPlanId: options.getPlanId,
    saveDraft: options.saveDraft,
    assignPlanId: options.assignPlanId,
    showInfo: notifyInfo
  })

  if (!planId) {
    page.setData({ savingTemplate: false })
    return { ok: false, skipped: false }
  }

  const response = await request('trainer-api', 'savePlanAsTemplate', { _id: planId })
  page.setData({ savingTemplate: false })

  if (response.code !== 0) {
    notifyInfo(response.message || '保存个人模板失败')
    return { ok: false, skipped: false }
  }

  notifySuccess(successText)
  return {
    ok: true,
    skipped: false,
    templateId: response.data && response.data.templateId ? response.data.templateId : ''
  }
}

module.exports = {
  __testables: {
    ensurePlanIdForTemplate
  },
  savePlanAsPrivateTemplate
}
