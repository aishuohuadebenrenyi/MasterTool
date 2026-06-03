const { callAction, getMiniProgramEnvVersion } = require('../../../../services/cloud')
const { showInfo, showSuccess } = require('../../../../utils/page')
const { buildGroups, enrichParticipant, pad } = require('../../../../utils/live')

function refreshGroupsSnapshot(page, participants) {
  const groups = buildGroups(participants, page.data.teamCount, page.data.groupMethod)
  page.setData({ groups })
}

async function loadParticipants(page) {
  const response = await callAction('live-api', 'listParticipants', { sessionId: page.data.sessionId })
  if (response.code !== 0 || !response.data) {
    showInfo(response.message || '签到列表加载失败')
    if (!page.data.isGrouped && page.data.groups.length === 0) {
      refreshGroupsSnapshot(page, page.data.participants)
    }
    return
  }
  const participants = (response.data.participants || []).map(enrichParticipant)
  page.setData({ participants })
  if (!page.data.isGrouped && page.data.groups.length === 0) {
    refreshGroupsSnapshot(page, participants)
  }
}

async function manualCheckin(page) {
  const name = page.data.participantName.trim()
  if (!name) {
    showInfo('请填写姓名')
    return
  }
  if (page.data.participants.some((item) => item.name === name)) {
    showInfo('该姓名已签到', 2400)
    return
  }

  const response = await callAction('live-api', 'manualCheckin', {
    sessionId: page.data.sessionId,
    name
  })
  if (response.code === 0) {
    const now = new Date()
    const participants = [
      enrichParticipant({
        _id: response.data.participantId,
        name,
        checkedInAtText: `${pad(now.getHours())}:${pad(now.getMinutes())}`
      }),
      ...page.data.participants
    ]
    page.setData({ participantName: '', participants })
    if (!page.data.isGrouped) {
      refreshGroupsSnapshot(page, participants)
    }
    showSuccess('已签到')
    return
  }
  showInfo(response.message || '签到失败')
}

function copyCheckinEntry(page) {
  wx.setClipboardData({
    data: page.data.checkinPath,
    success: () => showSuccess('签到入口已复制')
  })
}

async function loadCheckinCode(page) {
  page.setData({ checkinCodeLoading: true })
  const response = await callAction(
    'live-api',
    'getSessionEntryCode',
    {
      sessionId: page.data.sessionId,
      entryType: 'checkin',
      envVersion: getMiniProgramEnvVersion()
    },
    { timeoutMs: 15000 }
  )
  page.setData({ checkinCodeLoading: false })
  if (response.code !== 0 || !response.data) {
    showInfo(response.message || '签到小程序码生成失败')
    return
  }
  page.setData({
    checkinCodeUrl: response.data.tempFileURL || '',
    checkinCodeFileId: response.data.fileID || ''
  })
  showSuccess('签到小程序码已生成')
}

module.exports = {
  copyCheckinEntry,
  loadCheckinCode,
  loadParticipants,
  manualCheckin
}
