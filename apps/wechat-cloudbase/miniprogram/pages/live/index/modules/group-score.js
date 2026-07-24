const { callAction } = require('../../../../services/cloud')
const { showInfo, showSuccess } = require('../../../../utils/page')
const {
  buildGroups,
  formatScoreLogTime,
  hydrateGroups,
  normalizeScoreDetails,
  serializeScoreDetails
} = require('../../../../utils/live')

function refreshGroups(page, participants) {
  const groups = buildGroups(participants, page.data.teamCount, page.data.groupMethod)
  page.setData({ groups })
}

function generateGroups(page) {
  if (page.data.participants.length < page.data.teamCount) {
    showInfo('签到人数不足')
    return
  }
  refreshGroups(page, page.data.participants)
  showSuccess('已生成分组')
}

async function confirmGroups(page) {
  if (page.data.groups.length === 0) {
    showInfo('请先生成分组')
    return
  }
  const response = await callAction('live-api', 'saveGroupState', {
    sessionId: page.data.sessionId,
    teamCount: page.data.teamCount,
    groupMethod: page.data.groupMethod,
    groups: page.data.groups,
    isGrouped: true
  })
  if (response.code !== 0 || !response.data) {
    showInfo(response.message || '分组保存失败')
    return
  }
  page.setData({
    groups: hydrateGroups(response.data.groups),
    isGrouped: Boolean(response.data.isGrouped),
    scoreDetails: normalizeScoreDetails({}, response.data.groups || []),
    scoreReasonInputs: {}
  })
  ensureScores(page)
  page.closeSheet()
  showSuccess('已确认分组')
}

function ensureScores(page) {
  if (page.data.isGrouped && page.data.groups.length === 0) {
    refreshGroups(page, page.data.participants)
  }
}

async function setScoreMode(page, scoreMode) {
  page.setData({ scoreMode })
  if (!page.data.isGrouped || page.data.groups.length === 0) return
  const response = await callAction('live-api', 'saveScoreState', {
    sessionId: page.data.sessionId,
    scoreMode,
    groups: page.data.groups,
    scoreDetails: serializeScoreDetails(page.data.scoreDetails)
  })
  if (response.code !== 0) {
    showInfo(response.message || '积分模式保存失败')
    return
  }
  page.setData({
    scoreDetails: normalizeScoreDetails(response.data && response.data.scoreDetails, page.data.groups)
  })
}

async function changeScore(page, index, delta) {
  const previous = hydrateGroups(page.data.groups)
  const groups = hydrateGroups(page.data.groups)
  if (!groups[index]) return
  groups[index].score = Math.max(0, (groups[index].score || 0) + delta)
  page.setData({ groups })
  const response = await callAction('live-api', 'saveScoreState', {
    sessionId: page.data.sessionId,
    scoreMode: page.data.scoreMode,
    groups,
    scoreDetails: serializeScoreDetails(page.data.scoreDetails)
  })
  if (response.code !== 0 || !response.data) {
    page.setData({ groups: previous })
    showInfo(response.message || '积分保存失败')
    return
  }
  page.setData({
    groups: hydrateGroups(response.data.groups),
    scoreDetails: normalizeScoreDetails(response.data.scoreDetails, response.data.groups || [])
  })
}

async function applyDetailedScore(page, index, delta) {
  const groups = hydrateGroups(page.data.groups)
  const previousGroups = hydrateGroups(page.data.groups)
  const previousDetails = normalizeScoreDetails(page.data.scoreDetails, page.data.groups)
  const group = groups[index]
  if (!group || !delta) return
  const groupId = group.groupId
  const actualDelta = delta < 0 ? -Math.min(group.score || 0, Math.abs(delta)) : delta
  if (!actualDelta) {
    showInfo('当前队伍已是 0 分')
    return
  }
  const inputReason = (page.data.scoreReasonInputs[groupId] || '').trim()
  const createdAt = Date.now()
  const nextEntry = {
    delta: actualDelta,
    reason: inputReason || (actualDelta > 0 ? '现场加分' : '现场扣分'),
    createdAt,
    deltaText: actualDelta > 0 ? `+${actualDelta}` : `${actualDelta}`,
    timeText: formatScoreLogTime(createdAt)
  }
  const scoreDetails = {
    ...previousDetails,
    [groupId]: [nextEntry, ...(previousDetails[groupId] || [])].slice(0, 20)
  }
  group.score = Math.max(0, (group.score || 0) + actualDelta)
  page.setData({
    groups,
    scoreDetails,
    [`scoreReasonInputs.${groupId}`]: ''
  })
  const response = await callAction('live-api', 'saveScoreState', {
    sessionId: page.data.sessionId,
    scoreMode: page.data.scoreMode,
    groups,
    scoreDetails: serializeScoreDetails(scoreDetails)
  })
  if (response.code !== 0 || !response.data) {
    page.setData({
      groups: previousGroups,
      scoreDetails: previousDetails,
      [`scoreReasonInputs.${groupId}`]: inputReason
    })
    showInfo(response.message || '详细积分保存失败')
    return
  }
  page.setData({
    groups: hydrateGroups(response.data.groups),
    scoreDetails: normalizeScoreDetails(response.data.scoreDetails, response.data.groups || [])
  })
}

async function resetScores(page) {
  const groups = hydrateGroups(page.data.groups).map((group) => ({ ...group, score: 0 }))
  page.setData({ groups, scoreDetails: {}, scoreReasonInputs: {} })
  const response = await callAction('live-api', 'saveScoreState', {
    sessionId: page.data.sessionId,
    scoreMode: page.data.scoreMode,
    groups,
    scoreDetails: {}
  })
  if (response.code !== 0 || !response.data) {
    showInfo(response.message || '积分重置失败')
    return
  }
  page.setData({
    groups: hydrateGroups(response.data.groups),
    scoreDetails: normalizeScoreDetails(response.data.scoreDetails, response.data.groups || [])
  })
  showSuccess('已重置积分')
}

module.exports = {
  applyDetailedScore,
  changeScore,
  confirmGroups,
  ensureScores,
  generateGroups,
  refreshGroups,
  resetScores,
  setScoreMode
}
