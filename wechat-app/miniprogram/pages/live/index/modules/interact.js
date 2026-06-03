const { callAction, getMiniProgramEnvVersion } = require('../../../../services/cloud')
const { showInfo, showSuccess } = require('../../../../utils/page')

const INTERACTION_TITLE_MAP = {
  wordcloud: '现场词云',
  vote: '现场投票',
  promise: '行动承诺'
}

function changeInteractionType(page, type) {
  page.setData({
    interactionType: type,
    interactionTitle: INTERACTION_TITLE_MAP[type] || '现场互动',
    activeInteractionId: '',
    interactionStats: null
  })
}

async function loadInteractions(page) {
  const response = await callAction('live-api', 'listInteractions', { sessionId: page.data.sessionId })
  if (response.code !== 0 || !response.data) {
    showInfo(response.message || '互动加载失败')
    return
  }
  page.setData({ interactions: response.data.interactions || [] })
}

function previewEntryPath(_page, path) {
  if (!path) return
  wx.navigateTo({
    url: path,
    fail: () => showInfo('预览失败，请稍后重试')
  })
}

async function createInteraction(page) {
  const title = page.data.interactionTitle.trim()
  if (!title) {
    showInfo('请输入互动标题')
    return
  }
  const options = page.data.voteOptionsText.split('\n').map((item) => item.trim()).filter(Boolean)
  const response = await callAction('live-api', 'createInteraction', {
    sessionId: page.data.sessionId,
    type: page.data.interactionType,
    title,
    options
  })
  if (response.code !== 0 || !response.data) {
    showInfo(response.message || '创建失败')
    return
  }
  showSuccess('已创建互动')
  await loadInteractions(page)
}

async function showInteractionStats(page, interactionId) {
  const response = await callAction('live-api', 'getInteractionStats', { interactionId })
  if (response.code !== 0 || !response.data) {
    showInfo(response.message || '统计加载失败')
    return
  }
  page.setData({ activeInteractionId: interactionId, interactionStats: response.data })
}

function copyInteractionEntry(page, interactionId) {
  const item = page.data.interactions.find((it) => it._id === interactionId)
  if (!item) return
  const path = `/pages/participant/interaction/index?interactionId=${interactionId}&code=${item.joinCode}`
  wx.setClipboardData({
    data: path,
    success: () => showSuccess('互动入口已复制')
  })
}

async function generateInteractionCode(page, interactionId) {
  const item = page.data.interactions.find((it) => it._id === interactionId)
  if (!interactionId || !item) return

  page.setData({ interactionCodeLoadingId: interactionId })
  const response = await callAction(
    'live-api',
    'getInteractionEntryCode',
    {
      interactionId,
      envVersion: getMiniProgramEnvVersion()
    },
    { timeoutMs: 15000 }
  )
  page.setData({ interactionCodeLoadingId: '' })

  if (response.code !== 0 || !response.data) {
    showInfo(response.message || '互动小程序码生成失败')
    return
  }

  page.setData({
    entryPreviewTitle: `${item.title} 参与入口`,
    entryPreviewUrl: response.data.tempFileURL || '',
    entryPreviewPath: response.data.path || '',
    entryPreviewJoinCode: response.data.joinCode || ''
  })
  showSuccess('互动小程序码已生成')
}

async function closeInteraction(page, interactionId) {
  const response = await callAction('live-api', 'closeInteraction', { interactionId })
  if (response.code !== 0) {
    showInfo(response.message || '关闭失败')
    return
  }
  showSuccess('已关闭互动')
  await loadInteractions(page)
}

module.exports = {
  changeInteractionType,
  closeInteraction,
  copyInteractionEntry,
  createInteraction,
  generateInteractionCode,
  loadInteractions,
  previewEntryPath,
  showInteractionStats
}
