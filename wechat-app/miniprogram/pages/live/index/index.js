const { callAction } = require('../../../services/cloud')
const { showInfo } = require('../../../utils/page')
const {
  copyCheckinEntry: copyCheckinEntryModule,
  loadCheckinCode: loadCheckinCodeModule,
  loadParticipants: loadParticipantsModule,
  manualCheckin: manualCheckinModule
} = require('./modules/checkin')
const {
  applyDetailedScore: applyDetailedScoreModule,
  changeScore: changeScoreModule,
  confirmGroups: confirmGroupsModule,
  ensureScores: ensureScoresModule,
  generateGroups: generateGroupsModule,
  refreshGroups: refreshGroupsModule,
  resetScores: resetScoresModule,
  setScoreMode: setScoreModeModule
} = require('./modules/group-score')
const {
  changeInteractionType: changeInteractionTypeModule,
  closeInteraction: closeInteractionModule,
  copyInteractionEntry: copyInteractionEntryModule,
  createInteraction: createInteractionModule,
  generateInteractionCode: generateInteractionCodeModule,
  loadInteractions: loadInteractionsModule,
  previewEntryPath: previewEntryPathModule,
  showInteractionStats: showInteractionStatsModule
} = require('./modules/interact')
const {
  persistRandomState: persistRandomStateModule,
  pickParticipant: pickParticipantModule,
  resetPickHistory: resetPickHistoryModule,
  setRandomTab: setRandomTabModule,
  toggleRepeatPick: toggleRepeatPickModule
} = require('./modules/random')
const {
  clearTimers: clearTimersModule,
  closeSheet: closeSheetModule,
  endSession: endSessionModule,
  handleTimerTap: handleTimerTapModule,
  loadSession: loadSessionModule,
  nextPhase: nextPhaseModule,
  openToolByKey: openToolByKeyModule,
  prevPhase: prevPhaseModule,
  syncPhase: syncPhaseModule,
  toggleTimer: toggleTimerModule
} = require('./modules/page-flow')
const {
  playSound: playSoundModule,
  resetStandaloneTimer: resetStandaloneTimerModule,
  saveNote: saveNoteModule,
  setCountdownPreset: setCountdownPresetModule,
  setStandaloneMode: setStandaloneModeModule,
  toggleStandaloneTimer: toggleStandaloneTimerModule
} = require('./modules/tools')
const {
  ALL_TOOLS,
  COUNTDOWN_PRESETS,
  QUICK_TOOLS,
  formatPresetLabel,
} = require('../../../utils/live')

Page({
  data: {
    sessionId: '',
    title: '培训现场',
    peopleCount: 0,
    phases: [],
    phaseIndex: 0,
    phaseTotal: 0,
    phaseTitle: '',
    phaseReminders: [],
    phaseActivities: [],
    phaseActivitySummary: '',
    progressPercent: 0,
    timerSeconds: 0,
    timerDisplay: '00:00',
    timerProgress: 0,
    timerRunning: false,
    timerHint: '点击开始，双击延时 5 分钟',
    quickTools: QUICK_TOOLS,
    allTools: ALL_TOOLS,
    activeSheet: '',
    sheetTitle: '',
    participantName: '',
    participants: [],
    checkinPath: '',
    checkinCodeUrl: '',
    checkinCodeFileId: '',
    checkinCodeLoading: false,
    teamCount: 2,
    groupMethod: 'average',
    groups: [],
    isGrouped: false,
    scoreMode: 'simple',
    scoreDetails: {},
    scoreReasonInputs: {},
    pickedName: '',
    pickedIds: [],
    pickHistory: [],
    allowRepeatPick: false,
    randomTab: 'actor',
    noteContent: '',
    notes: [],
    standaloneMode: 'countup',
    standaloneSeconds: 0,
    standaloneDisplay: '00:00',
    standaloneRunning: false,
    standaloneHint: '从 00:00 开始正计时',
    countdownPresets: COUNTDOWN_PRESETS.map((seconds) => ({ seconds, label: formatPresetLabel(seconds) })),
    selectedCountdownSeconds: 300,
    activeSound: '',
    interactions: [],
    interactionType: 'wordcloud',
    interactionTitle: '现场词云',
    voteOptionsText: '选项A\n选项B\n选项C',
    activeInteractionId: '',
    interactionStats: null,
    interactionCodeLoadingId: '',
    entryPreviewTitle: '',
    entryPreviewUrl: '',
    entryPreviewPath: '',
    entryPreviewJoinCode: '',
    touchStartX: 0,
    touchStartY: 0
  },

  timer: null,
  timerTapTimer: null,
  standaloneTimer: null,
  soundPlayer: null,

  async onLoad(query) {
    const sessionId = query.sessionId || ''
    if (!sessionId) {
      showInfo('缺少培训场次')
      this.goBack()
      return
    }
    this.setData({
      sessionId,
      title: query.title ? decodeURIComponent(query.title) : '培训现场',
      checkinPath: `/pages/participant/checkin/index?sessionId=${sessionId}`
    })
    await this.loadSession()
    await this.loadParticipants()
  },

  onUnload() {
    return clearTimersModule(this)
  },

  clearTimers() {
    return clearTimersModule(this)
  },

  async loadSession() {
    return loadSessionModule(this)
  },

  syncPhase() {
    return syncPhaseModule(this)
  },

  async loadParticipants() {
    return loadParticipantsModule(this)
  },

  async persistRandomState(partialState = {}) {
    return persistRandomStateModule(this, partialState)
  },

  goBack() {
    wx.showModal({
      title: '确认返回',
      content: '返回后不会保留本次现场数据，方案会回退到已确认状态，确定继续吗？',
      confirmText: '确认返回',
      cancelText: '继续',
      success: async (res) => {
        if (!res.confirm) return
        const response = await callAction('live-api', 'abandonSession', { sessionId: this.data.sessionId })
        if (response.code !== 0) {
          showInfo(response.message || '返回失败，请稍后重试')
          return
        }
        this.clearTimers()
        wx.navigateBack({
          fail: () => wx.switchTab({ url: '/pages/home/index/index' })
        })
      }
    })
  },

  handleTouchStart(event) {
    const touch = event.touches[0]
    this.setData({ touchStartX: touch.clientX, touchStartY: touch.clientY })
  },

  handleTouchEnd(event) {
    if (this.data.activeSheet) return
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - this.data.touchStartX
    const deltaY = touch.clientY - this.data.touchStartY
    if (Math.abs(deltaY) > 48 || Math.abs(deltaX) < 60) return
    if (deltaX < 0) this.nextPhase()
    if (deltaX > 0) this.prevPhase()
  },

  handleTimerTap() {
    return handleTimerTapModule(this)
  },

  toggleTimer() {
    return toggleTimerModule(this)
  },

  prevPhase() {
    return prevPhaseModule(this)
  },

  nextPhase() {
    return nextPhaseModule(this)
  },

  openTool(event) {
    const key = event.currentTarget.dataset.key
    this.openToolByKey(key)
  },

  openToolByKey(key) {
    return openToolByKeyModule(this, key)
  },

  openToolFromToolbox(event) {
    this.openToolByKey(event.currentTarget.dataset.key)
  },

  closeSheet() {
    return closeSheetModule(this)
  },

  noop() {},

  handleNameInput(event) {
    const value = event.detail && typeof event.detail.value === 'string'
      ? event.detail.value
      : event.detail
    this.setData({ participantName: value || '' })
  },

  async manualCheckin() {
    return manualCheckinModule(this)
  },

  copyCheckinEntry() {
    return copyCheckinEntryModule(this)
  },

  async loadCheckinCode() {
    return loadCheckinCodeModule(this)
  },

  changeGroupMethod(event) {
    const method = event.detail.method || event.currentTarget.dataset.method
    this.setData({ groupMethod: method })
  },

  changeTeamCount(event) {
    const delta = event.detail.delta !== undefined ? event.detail.delta : event.currentTarget.dataset.delta
    const next = this.data.teamCount + Number(delta)
    if (next < 2) {
      showInfo('至少需要 2 组')
      return
    }
    if (next > 10) {
      showInfo('最多支持 10 组')
      return
    }
    this.setData({ teamCount: next })
  },

  refreshGroups(participants) {
    return refreshGroupsModule(this, participants)
  },

  generateGroups() {
    return generateGroupsModule(this)
  },

  async confirmGroups() {
    return confirmGroupsModule(this)
  },

  ensureScores() {
    return ensureScoresModule(this)
  },

  async setScoreMode(event) {
    const scoreMode = event.detail.mode || event.currentTarget.dataset.mode
    return setScoreModeModule(this, scoreMode)
  },

  async changeScore(event) {
    const index = Number(event.detail.index !== undefined ? event.detail.index : event.currentTarget.dataset.index)
    const delta = Number(event.detail.delta !== undefined ? event.detail.delta : event.currentTarget.dataset.delta)
    return changeScoreModule(this, index, delta)
  },

  handleScoreReasonInput(event) {
    const groupId = event.detail.groupId || event.currentTarget.dataset.groupId
    if (!groupId) return
    this.setData({
      [`scoreReasonInputs.${groupId}`]: event.detail.value || ''
    })
  },

  async applyDetailedScore(event) {
    const index = Number(event.detail.index !== undefined ? event.detail.index : event.currentTarget.dataset.index)
    const delta = Number(event.detail.delta !== undefined ? event.detail.delta : event.currentTarget.dataset.delta)
    return applyDetailedScoreModule(this, index, delta)
  },

  async resetScores() {
    return resetScoresModule(this)
  },

  async setRandomTab(event) {
    const nextTab = event.detail.tab || event.currentTarget.dataset.tab
    return setRandomTabModule(this, nextTab)
  },

  async toggleRepeatPick() {
    return toggleRepeatPickModule(this)
  },

  async resetPickHistory() {
    return resetPickHistoryModule(this)
  },

  async pickParticipant() {
    return pickParticipantModule(this)
  },

  changeInteractionType(event) {
    const type = event.detail.type || event.currentTarget.dataset.type
    return changeInteractionTypeModule(this, type)
  },

  handleInteractionTitle(event) {
    const value = event.detail && typeof event.detail.value === 'string'
      ? event.detail.value
      : event.detail
    this.setData({ interactionTitle: value || '' })
  },

  handleVoteOptions(event) {
    const value = event.detail && typeof event.detail.value === 'string'
      ? event.detail.value
      : event.detail
    this.setData({ voteOptionsText: value || '' })
  },

  async loadInteractions() {
    return loadInteractionsModule(this)
  },

  previewEntryPath(event) {
    const path = event.detail.path || event.currentTarget.dataset.path
    return previewEntryPathModule(this, path)
  },

  async createInteraction() {
    return createInteractionModule(this)
  },

  async showInteractionStats(event) {
    const interactionId = event.detail.id || event.currentTarget.dataset.id
    return showInteractionStatsModule(this, interactionId)
  },

  copyInteractionEntry(event) {
    const interactionId = event.detail.id || event.currentTarget.dataset.id
    return copyInteractionEntryModule(this, interactionId)
  },

  async generateInteractionCode(event) {
    const interactionId = event.detail.id || event.currentTarget.dataset.id
    return generateInteractionCodeModule(this, interactionId)
  },

  async closeInteraction(event) {
    const interactionId = event.detail.id || event.currentTarget.dataset.id
    return closeInteractionModule(this, interactionId)
  },

  playSound(event) {
    const name = event.detail.name || event.currentTarget.dataset.name
    return playSoundModule(this, name, true)
  },

  playSoundByName(name, shouldToast = false) {
    return playSoundModule(this, name, shouldToast)
  },

  setStandaloneMode(event) {
    const mode = event.detail.mode || event.currentTarget.dataset.mode
    return setStandaloneModeModule(this, mode)
  },

  setCountdownPreset(event) {
    const nextSeconds = event.detail.seconds !== undefined ? event.detail.seconds : event.currentTarget.dataset.seconds
    return setCountdownPresetModule(this, nextSeconds)
  },

  toggleStandaloneTimer() {
    return toggleStandaloneTimerModule(this)
  },

  resetStandaloneTimer() {
    return resetStandaloneTimerModule(this)
  },

  handleNoteInput(event) {
    const value = event.detail && typeof event.detail.value === 'string'
      ? event.detail.value
      : event.detail
    this.setData({ noteContent: value || '' })
  },

  async saveNote() {
    return saveNoteModule(this)
  },

  async endSession() {
    return endSessionModule(this)
  }
})
