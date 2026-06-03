const { callAction } = require('../../../../services/cloud')
const { showInfo } = require('../../../../utils/page')
const {
  SHEET_TITLES,
  formatSeconds,
  hydrateGroups,
  normalizePhase,
  normalizeScoreDetails
} = require('../../../../utils/live')

function clearTimers(page) {
  if (page.timer) {
    clearInterval(page.timer)
    page.timer = null
  }
  if (page.timerTapTimer) {
    clearTimeout(page.timerTapTimer)
    page.timerTapTimer = null
  }
  if (page.standaloneTimer) {
    clearInterval(page.standaloneTimer)
    page.standaloneTimer = null
  }
  if (page.soundPlayer) {
    page.soundPlayer.destroy()
    page.soundPlayer = null
  }
}

function syncPhase(page) {
  const phase = page.data.phases[page.data.phaseIndex]
  if (!phase) return
  const totalSeconds = phase.minutes * 60
  page.setData({
    phaseTitle: phase.name,
    phaseReminders: phase.reminders,
    phaseActivities: phase.activities || [],
    phaseActivitySummary: Array.isArray(phase.activities) && phase.activities.length
      ? phase.activities.map((activity) => activity.name).join('、')
      : '当前环节未关联活动',
    phaseTotal: page.data.phases.length,
    progressPercent: Math.round(((page.data.phaseIndex + 1) / page.data.phases.length) * 100),
    timerSeconds: totalSeconds,
    timerDisplay: formatSeconds(totalSeconds),
    timerProgress: 0,
    timerRunning: false,
    timerHint: '点击开始，双击延时 5 分钟'
  })
}

async function loadSession(page) {
  const response = await callAction('live-api', 'getSessionDetail', { sessionId: page.data.sessionId })
  if (response.code !== 0 || !response.data || !response.data.session) {
    showInfo(response.message || '场次加载失败')
    page.goBack()
    return
  }
  const session = response.data.session
  const snapshot = session.planSnapshot || {}
  const phases = Array.isArray(snapshot.phases) ? snapshot.phases.map(normalizePhase) : []
  if (phases.length === 0) {
    showInfo('当前方案没有可执行环节')
    page.goBack()
    return
  }

  const groups = hydrateGroups(session.groups)
  const randomState = session.randomState || {}
  const scoreDetails = normalizeScoreDetails(session.scoreDetails, groups)
  page.setData({
    title: snapshot.name || page.data.title,
    peopleCount: Number(snapshot.participantCount || 0),
    phases,
    phaseIndex: Math.min(Number(session.currentPhaseIndex || 0), phases.length - 1),
    teamCount: Math.min(10, Math.max(2, Number(session.teamCount || 2))),
    groupMethod: session.groupMethod === 'random' ? 'random' : 'average',
    groups,
    isGrouped: Boolean(session.isGrouped) && groups.length > 0,
    scoreMode: session.scoreMode === 'detailed' ? 'detailed' : 'simple',
    scoreDetails,
    scoreReasonInputs: {},
    randomTab: randomState.randomTab === 'audience' || randomState.randomTab === 'topic' ? randomState.randomTab : 'actor',
    allowRepeatPick: typeof randomState.allowRepeatPick === 'boolean' ? randomState.allowRepeatPick : Boolean(session.allowRepeatPick),
    pickedIds: Array.isArray(randomState.pickedIds) ? randomState.pickedIds : [],
    pickedName: typeof randomState.pickedName === 'string' ? randomState.pickedName : '',
    pickHistory: Array.isArray(randomState.pickHistory) ? randomState.pickHistory : []
  })
  syncPhase(page)
}

function handleTimerTap(page) {
  if (page.timerTapTimer) {
    clearTimeout(page.timerTapTimer)
    page.timerTapTimer = null
    page.setData({
      timerSeconds: page.data.timerSeconds + 300,
      timerDisplay: formatSeconds(page.data.timerSeconds + 300)
    })
    showInfo('已延时 5 分钟')
    return
  }

  page.timerTapTimer = setTimeout(() => {
    page.timerTapTimer = null
    toggleTimer(page)
  }, 220)
}

function toggleTimer(page) {
  if (page.data.timerRunning) {
    if (page.timer) clearInterval(page.timer)
    page.timer = null
    page.setData({ timerRunning: false, timerHint: '点击开始，双击延时 5 分钟' })
    return
  }

  page.setData({ timerRunning: true, timerHint: '点击暂停，双击延时 5 分钟' })
  page.timer = setInterval(() => {
    const next = Math.max(0, page.data.timerSeconds - 1)
    const total = page.data.phases[page.data.phaseIndex].minutes * 60
    page.setData({
      timerSeconds: next,
      timerDisplay: formatSeconds(next),
      timerProgress: total > 0 ? Math.min(100, Math.round(((total - next) / total) * 100)) : 0
    })
    if (next === 0) {
      clearInterval(page.timer)
      page.timer = null
      page.setData({ timerRunning: false, timerHint: '本环节时间已到' })
    }
  }, 1000)
}

function prevPhase(page) {
  if (page.data.phaseIndex <= 0) return
  if (page.timer) clearInterval(page.timer)
  page.timer = null
  page.setData({ phaseIndex: page.data.phaseIndex - 1 })
  syncPhase(page)
}

function nextPhase(page) {
  if (page.data.phaseIndex >= page.data.phases.length - 1) {
    page.endSession()
    return
  }
  if (page.timer) clearInterval(page.timer)
  page.timer = null
  page.setData({ phaseIndex: page.data.phaseIndex + 1 })
  syncPhase(page)
}

function openToolByKey(page, key) {
  if (key === 'toolbox') {
    wx.hideTabBar({ animation: false })
    page.setData({ activeSheet: 'toolbox', sheetTitle: SHEET_TITLES.toolbox })
    return
  }
  wx.hideTabBar({ animation: false })
  page.setData({ activeSheet: key, sheetTitle: SHEET_TITLES[key] || '工具箱' })
  if (key === 'group' && (!page.data.isGrouped || page.data.groups.length === 0)) page.refreshGroups(page.data.participants)
  if (key === 'score') page.ensureScores()
  if (key === 'interact') page.loadInteractions()
  if (key === 'checkin' && !page.data.checkinCodeUrl) page.loadCheckinCode()
}

function closeSheet(page) {
  wx.showTabBar({ animation: false })
  page.setData({
    activeSheet: '',
    sheetTitle: '',
    entryPreviewTitle: '',
    entryPreviewUrl: '',
    entryPreviewPath: '',
    entryPreviewJoinCode: '',
    interactionCodeLoadingId: ''
  })
}

async function endSession(page) {
  wx.showModal({
    title: '结束培训',
    content: '结束后可收集反馈、开始复盘或查看本场数据。',
    confirmText: '结束',
    cancelText: '取消',
    confirmColor: '#FF5A5F',
    success: async (res) => {
      if (!res.confirm) return
      if (page.timer) clearInterval(page.timer)
      const response = await callAction('live-api', 'endSession', { sessionId: page.data.sessionId })
      if (response.code !== 0) {
        showInfo(response.message || '结束失败')
        return
      }
      const totalSeconds = page.data.phases.reduce((sum, item) => sum + item.minutes * 60, 0)
      wx.redirectTo({
        url: `/pages/live/end/index?sessionId=${page.data.sessionId}&title=${encodeURIComponent(page.data.title)}&participants=${page.data.participants.length}&seconds=${totalSeconds}`
      })
    }
  })
}

module.exports = {
  clearTimers,
  closeSheet,
  endSession,
  handleTimerTap,
  loadSession,
  nextPhase,
  openToolByKey,
  prevPhase,
  syncPhase,
  toggleTimer
}
