const { callAction } = require('../../../../services/cloud')
const { showInfo, showSuccess } = require('../../../../utils/page')
const { SOUND_SOURCES, formatSeconds } = require('../../../../utils/live')

function playSound(page, name, shouldToast = false) {
  page.setData({ activeSound: name })
  if (page.soundPlayer) {
    page.soundPlayer.destroy()
    page.soundPlayer = null
  }
  const player = wx.createInnerAudioContext()
  page.soundPlayer = player
  player.src = SOUND_SOURCES[name] || SOUND_SOURCES['铃声']
  player.onError(() => {
    wx.vibrateShort({ type: name === '铃声' ? 'heavy' : 'medium' })
  })
  player.play()
  if (shouldToast) {
    showSuccess(`已播放${name}`)
  }
  setTimeout(() => page.setData({ activeSound: '' }), 500)
}

function setStandaloneMode(page, mode) {
  if (page.standaloneTimer) {
    clearInterval(page.standaloneTimer)
    page.standaloneTimer = null
  }
  const seconds = mode === 'countdown' ? page.data.selectedCountdownSeconds : 0
  page.setData({
    standaloneMode: mode,
    standaloneRunning: false,
    standaloneSeconds: seconds,
    standaloneDisplay: formatSeconds(seconds),
    standaloneHint: mode === 'countdown' ? '选择常用时长后开始倒计时' : '从 00:00 开始正计时'
  })
}

function setCountdownPreset(page, seconds) {
  const safeSeconds = Math.max(0, Number(seconds || 0))
  if (!safeSeconds) return
  if (page.data.standaloneRunning) {
    showInfo('请先暂停当前计时')
    return
  }
  page.setData({
    selectedCountdownSeconds: safeSeconds,
    standaloneMode: 'countdown',
    standaloneSeconds: safeSeconds,
    standaloneDisplay: formatSeconds(safeSeconds),
    standaloneHint: '选择常用时长后开始倒计时'
  })
}

function toggleStandaloneTimer(page) {
  if (page.data.standaloneRunning) {
    if (page.standaloneTimer) clearInterval(page.standaloneTimer)
    page.standaloneTimer = null
    page.setData({
      standaloneRunning: false,
      standaloneHint: page.data.standaloneMode === 'countdown' ? '已暂停，可继续倒计时' : '已暂停，可继续正计时'
    })
    return
  }
  if (page.data.standaloneMode === 'countdown') {
    const seconds = page.data.standaloneSeconds > 0 ? page.data.standaloneSeconds : page.data.selectedCountdownSeconds
    if (seconds <= 0) {
      showInfo('请先选择倒计时时长')
      return
    }
    page.setData({
      standaloneRunning: true,
      standaloneSeconds: seconds,
      standaloneDisplay: formatSeconds(seconds),
      standaloneHint: '倒计时进行中'
    })
    page.standaloneTimer = setInterval(() => {
      const next = Math.max(0, page.data.standaloneSeconds - 1)
      page.setData({ standaloneSeconds: next, standaloneDisplay: formatSeconds(next) })
      if (next === 0) {
        clearInterval(page.standaloneTimer)
        page.standaloneTimer = null
        page.setData({ standaloneRunning: false, standaloneHint: '倒计时结束' })
        playSound(page, '铃声')
        wx.vibrateShort({ type: 'heavy' })
      }
    }, 1000)
    return
  }
  page.setData({ standaloneRunning: true, standaloneHint: '正计时进行中' })
  page.standaloneTimer = setInterval(() => {
    const next = page.data.standaloneSeconds + 1
    page.setData({ standaloneSeconds: next, standaloneDisplay: formatSeconds(next) })
  }, 1000)
}

function resetStandaloneTimer(page) {
  if (page.standaloneTimer) clearInterval(page.standaloneTimer)
  page.standaloneTimer = null
  const seconds = page.data.standaloneMode === 'countdown' ? page.data.selectedCountdownSeconds : 0
  page.setData({
    standaloneRunning: false,
    standaloneSeconds: seconds,
    standaloneDisplay: formatSeconds(seconds),
    standaloneHint: page.data.standaloneMode === 'countdown' ? '已重置到预设时长' : '已重置到 00:00'
  })
}

async function saveNote(page) {
  const content = page.data.noteContent.trim()
  if (!content) {
    showInfo('请填写笔记')
    return
  }
  const response = await callAction('live-api', 'saveNote', {
    sessionId: page.data.sessionId,
    phaseName: page.data.phaseTitle,
    content
  })
  if (response.code !== 0 || !response.data) {
    showInfo(response.message || '保存失败')
    return
  }
  const notes = [{
    _id: response.data.noteId,
    phaseName: page.data.phaseTitle,
    content,
    createdAt: new Date(response.data.createdAt).toLocaleTimeString()
  }, ...page.data.notes]
  page.setData({ noteContent: '', notes })
  showSuccess('笔记已保存')
}

module.exports = {
  playSound,
  resetStandaloneTimer,
  saveNote,
  setCountdownPreset,
  setStandaloneMode,
  toggleStandaloneTimer
}
