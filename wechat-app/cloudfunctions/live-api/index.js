const {
  ErrorCode,
  db,
  fail,
  generateMiniCode,
  getCurrentIdentity,
  ok,
  requiredText,
  route,
  withIdempotency
} = require('./_shared')

async function requireIdentity(requestId) {
  const identity = await getCurrentIdentity()
  if (!identity.authenticated) {
    return {
      error: fail(ErrorCode.UNAUTHENTICATED, undefined, requestId)
    }
  }
  return { identity }
}

async function startSession(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const planId = requiredText(request.payload, 'planId', '方案')
  if (!planId.valid) {
    return fail(ErrorCode.INVALID_ARGUMENT, planId.message, request.requestId)
  }

  const ownerId = auth.identity.userId
  const plans = db.collection('plans')
  const planResult = await plans.doc(planId.value).get()
  const plan = planResult.data

  if (!plan || plan.ownerId !== ownerId) {
    return fail(ErrorCode.NOT_FOUND, '方案不存在', request.requestId)
  }

  const result = await withIdempotency(
    request.requestId,
    'live.startSession',
    ownerId,
    planId.value,
    async () => {
      const now = Date.now()
      // 开课只创建运行中场次，方案仍保持已确认，结束培训后才进入已交付。
      const txResult = await db.runTransaction(async (transaction) => {
        const txPlans = transaction.collection('plans')
        const txSessions = transaction.collection('live_sessions')
        const latest = await txPlans.doc(planId.value).get()
        if (!latest.data || latest.data.ownerId !== ownerId) {
          return { errorCode: ErrorCode.NOT_FOUND, errorMessage: '方案不存在' }
        }
        if (latest.data.status !== 'confirmed') {
          return { errorCode: ErrorCode.CONFLICT, errorMessage: '请先确认方案再开课' }
        }
        if (latest.data.latestSessionId) {
          const latestSession = await txSessions.doc(latest.data.latestSessionId).get()
          if (latestSession.data && latestSession.data.ownerId === ownerId && latestSession.data.status === 'running') {
            return { errorCode: ErrorCode.CONFLICT, errorMessage: '当前方案正在进行中' }
          }
        }
        const latestPlan = latest.data
        const sessionData = {
          ownerId,
          planId: planId.value,
          planSnapshot: {
            planId: planId.value,
            name: latestPlan.name,
            type: latestPlan.type,
            participantCount: latestPlan.participantCount,
            customerName: latestPlan.customerName || '',
            phases: Array.isArray(latestPlan.phases) ? latestPlan.phases : [],
            confirmedAt: latestPlan.updatedAt || now
          },
          status: 'running',
          currentPhaseIndex: 0,
          allowRepeatPick: false,
          startedAt: now
        }
        const created = await txSessions.add({ data: sessionData })
        await txPlans.doc(planId.value).update({
          data: {
            latestSessionId: created._id,
            updatedAt: now
          }
        })
        return { sessionId: created._id }
      })

      return txResult
    }
  )

  if (result.errorCode) {
    return fail(result.errorCode, result.errorMessage, request.requestId)
  }

  return ok(result, request.requestId)
}

async function getSessionDetail(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const result = await db.collection('live_sessions').doc(sessionId.value).get()
  if (!result.data || result.data.ownerId !== auth.identity.userId) {
    return fail(ErrorCode.NOT_FOUND, '场次不存在', request.requestId)
  }

  return ok({ session: result.data }, request.requestId)
}

function normalizeGroupMethod(method) {
  return method === 'random' ? 'random' : 'average'
}

function normalizeScoreMode(mode) {
  return mode === 'detailed' ? 'detailed' : 'simple'
}

function normalizeRandomTab(tab) {
  if (tab === 'audience' || tab === 'topic') return tab
  return 'actor'
}

function normalizeMemberList(members) {
  if (!Array.isArray(members)) return []
  return members
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 80)
}

function normalizeGroups(groups) {
  if (!Array.isArray(groups)) return []
  return groups.slice(0, 10).map((group, index) => {
    const members = normalizeMemberList(group && group.members)
    return {
      groupId: typeof group.groupId === 'string' && group.groupId.trim() ? group.groupId.trim() : `group-${index + 1}`,
      name: typeof group.name === 'string' && group.name.trim() ? group.name.trim() : `第${index + 1}组`,
      color: typeof group.color === 'string' && group.color.trim() ? group.color.trim() : '#4A7CF7',
      score: Math.max(0, Number(group && group.score) || 0),
      members,
      membersText: members.length ? members.join('、') : '暂无成员'
    }
  })
}

function normalizeScoreDetails(scoreDetails, groups) {
  const allowedGroupIds = new Set((groups || []).map((group) => group.groupId))
  if (!scoreDetails || typeof scoreDetails !== 'object' || Array.isArray(scoreDetails)) return {}
  return Object.keys(scoreDetails).reduce((acc, groupId) => {
    if (!allowedGroupIds.has(groupId)) return acc
    const items = Array.isArray(scoreDetails[groupId]) ? scoreDetails[groupId] : []
    const normalizedItems = items
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const delta = Number(item.delta || 0)
        const safeDelta = delta > 20 ? 20 : (delta < -20 ? -20 : delta)
        const reason = typeof item.reason === 'string' ? item.reason.trim().slice(0, 40) : ''
        return {
          delta: safeDelta,
          reason: reason || (safeDelta >= 0 ? '现场加分' : '现场扣分'),
          createdAt: Number(item.createdAt) || Date.now()
        }
      })
      .filter((item) => item.delta !== 0)
      .slice(0, 20)
    acc[groupId] = normalizedItems
    return acc
  }, {})
}

function normalizeRandomState(payload) {
  const pickedIds = Array.isArray(payload.pickedIds)
    ? payload.pickedIds.filter((item) => typeof item === 'string' && item.trim()).slice(0, 500)
    : []
  const pickHistory = Array.isArray(payload.pickHistory)
    ? payload.pickHistory
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        id: typeof item.id === 'string' ? item.id.trim() : '',
        name: typeof item.name === 'string' ? item.name.trim() : '',
        type: item.type === 'topic' ? 'topic' : 'participant',
        pickedAt: Number(item.pickedAt) || Date.now()
      }))
      .filter((item) => item.name)
      .slice(0, 50)
    : []

  return {
    randomTab: normalizeRandomTab(payload.randomTab),
    allowRepeatPick: Boolean(payload.allowRepeatPick),
    pickedIds,
    pickedName: typeof payload.pickedName === 'string' ? payload.pickedName.trim() : '',
    pickedParticipantId: typeof payload.pickedParticipantId === 'string' ? payload.pickedParticipantId.trim() : '',
    pickHistory,
    updatedAt: Date.now()
  }
}

async function getOwnedSessionOrError(sessionId, ownerId, requestId, options = {}) {
  const session = await db.collection('live_sessions').doc(sessionId).get()
  if (!session.data || session.data.ownerId !== ownerId) {
    return {
      error: fail(ErrorCode.NOT_FOUND, '场次不存在', requestId)
    }
  }
  if (options.requireRunning && session.data.status !== 'running') {
    return {
      error: fail(ErrorCode.CONFLICT, '当前场次不可操作', requestId)
    }
  }
  return {
    session: session.data
  }
}

async function manualCheckin(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  const name = requiredText(request.payload, 'name', '姓名')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)
  if (!name.valid) return fail(ErrorCode.INVALID_ARGUMENT, name.message, request.requestId)

  const ownerId = auth.identity.userId
  const session = await db.collection('live_sessions').doc(sessionId.value).get()
  if (!session.data || session.data.ownerId !== ownerId) {
    return fail(ErrorCode.NOT_FOUND, '场次不存在', request.requestId)
  }
  if (session.data.status !== 'running') {
    return fail(ErrorCode.CONFLICT, '签到已关闭', request.requestId)
  }

  const existed = await db.collection('participants')
    .where({ sessionId: sessionId.value, name: name.value })
    .limit(1)
    .get()
  if (existed.data.length > 0) {
    return fail(ErrorCode.CONFLICT, '该姓名已签到', request.requestId)
  }

  const result = await withIdempotency(
    request.requestId,
    'live.manualCheckin',
    ownerId,
    sessionId.value,
    async () => {
      const created = await db.collection('participants').add({
        data: {
          sessionId: sessionId.value,
          openid: `manual:${Date.now()}`,
          name: name.value,
          checkedInAt: Date.now()
        }
      })
      return { participantId: created._id }
    }
  )

  return ok(result, request.requestId)
}

async function listParticipants(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const session = await db.collection('live_sessions').doc(sessionId.value).get()
  if (!session.data || session.data.ownerId !== auth.identity.userId) {
    return fail(ErrorCode.NOT_FOUND, '场次不存在', request.requestId)
  }

  const result = await db.collection('participants')
    .where({ sessionId: sessionId.value })
    .orderBy('checkedInAt', 'desc')
    .limit(200)
    .get()

  return ok({ participants: result.data }, request.requestId)
}

async function saveGroupState(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const teamCount = Math.min(10, Math.max(2, Number(request.payload.teamCount || 2)))
  const groups = normalizeGroups(request.payload.groups)
  if (groups.length === 0) {
    return fail(ErrorCode.INVALID_ARGUMENT, '请先生成分组', request.requestId)
  }

  const owned = await getOwnedSessionOrError(sessionId.value, auth.identity.userId, request.requestId, { requireRunning: true })
  if (owned.error) return owned.error

  const now = Date.now()
  await db.collection('live_sessions').doc(sessionId.value).update({
    data: {
      teamCount,
      groupMethod: normalizeGroupMethod(request.payload.groupMethod),
      groups,
      isGrouped: Boolean(request.payload.isGrouped),
      scoreDetails: {},
      updatedAt: now
    }
  })

  return ok({
    teamCount,
    groupMethod: normalizeGroupMethod(request.payload.groupMethod),
    groups,
    isGrouped: Boolean(request.payload.isGrouped),
    scoreDetails: {},
    updatedAt: now
  }, request.requestId)
}

async function saveScoreState(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const groups = normalizeGroups(request.payload.groups)
  if (groups.length === 0) {
    return fail(ErrorCode.INVALID_ARGUMENT, '请先完成分组', request.requestId)
  }

  const owned = await getOwnedSessionOrError(sessionId.value, auth.identity.userId, request.requestId, { requireRunning: true })
  if (owned.error) return owned.error

  const scoreMode = normalizeScoreMode(request.payload.scoreMode)
  const scoreDetails = normalizeScoreDetails(request.payload.scoreDetails, groups)
  const now = Date.now()
  await db.collection('live_sessions').doc(sessionId.value).update({
    data: {
      groups,
      isGrouped: true,
      scoreMode,
      scoreDetails,
      updatedAt: now
    }
  })

  return ok({
    groups,
    scoreMode,
    scoreDetails,
    updatedAt: now
  }, request.requestId)
}

async function saveRandomState(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const owned = await getOwnedSessionOrError(sessionId.value, auth.identity.userId, request.requestId, { requireRunning: true })
  if (owned.error) return owned.error

  const randomState = normalizeRandomState(request.payload)
  await db.collection('live_sessions').doc(sessionId.value).update({
    data: {
      randomState,
      allowRepeatPick: randomState.allowRepeatPick,
      updatedAt: randomState.updatedAt
    }
  })

  return ok({ randomState }, request.requestId)
}

async function endSession(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const ownerId = auth.identity.userId
  const session = await db.collection('live_sessions').doc(sessionId.value).get()
  if (!session.data || session.data.ownerId !== ownerId) {
    return fail(ErrorCode.NOT_FOUND, '场次不存在', request.requestId)
  }

  const result = await withIdempotency(
    request.requestId,
    'live.endSession',
    ownerId,
    sessionId.value,
    async () => {
      const now = Date.now()
      return db.runTransaction(async (transaction) => {
        const txSessions = transaction.collection('live_sessions')
        const txPlans = transaction.collection('plans')
        const latest = await txSessions.doc(sessionId.value).get()
        if (!latest.data || latest.data.ownerId !== ownerId) {
          return { errorCode: ErrorCode.NOT_FOUND, errorMessage: '场次不存在' }
        }
        if (latest.data.status !== 'running') {
          return { errorCode: ErrorCode.CONFLICT, errorMessage: '培训已结束' }
        }
        const planId = latest.data.planId
        if (!planId) {
          return { errorCode: ErrorCode.NOT_FOUND, errorMessage: '关联方案不存在' }
        }
        const latestPlan = await txPlans.doc(planId).get()
        if (!latestPlan.data || latestPlan.data.ownerId !== ownerId) {
          return { errorCode: ErrorCode.NOT_FOUND, errorMessage: '关联方案不存在' }
        }
        await txSessions.doc(sessionId.value).update({
          data: {
            status: 'ended',
            endedAt: now,
            updatedAt: now
          }
        })
        await txPlans.doc(planId).update({
          data: {
            status: 'delivered',
            latestSessionId: sessionId.value,
            updatedAt: now
          }
        })
        return { sessionId: sessionId.value, planId }
      })
    }
  )

  if (result.errorCode) {
    return fail(result.errorCode, result.errorMessage, request.requestId)
  }

  return ok(result, request.requestId)
}

async function abandonSession(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const ownerId = auth.identity.userId
  const result = await withIdempotency(
    request.requestId,
    'live.abandonSession',
    ownerId,
    sessionId.value,
    async () => {
      const now = Date.now()
      return db.runTransaction(async (transaction) => {
        const txSessions = transaction.collection('live_sessions')
        const txPlans = transaction.collection('plans')
        const latestSession = await txSessions.doc(sessionId.value).get()
        if (!latestSession.data || latestSession.data.ownerId !== ownerId) {
          return { errorCode: ErrorCode.NOT_FOUND, errorMessage: '场次不存在' }
        }
        if (latestSession.data.status !== 'running') {
          return { errorCode: ErrorCode.CONFLICT, errorMessage: '当前场次不可回退' }
        }

        const planId = latestSession.data.planId
        if (!planId) {
          return { errorCode: ErrorCode.NOT_FOUND, errorMessage: '关联方案不存在' }
        }

        const latestPlan = await txPlans.doc(planId).get()
        if (!latestPlan.data || latestPlan.data.ownerId !== ownerId) {
          return { errorCode: ErrorCode.NOT_FOUND, errorMessage: '关联方案不存在' }
        }

        const planData = {
          status: 'confirmed',
          updatedAt: now
        }
        if (latestPlan.data.latestSessionId === sessionId.value) {
          planData.latestSessionId = ''
        }

        await txPlans.doc(planId).update({ data: planData })
        await txSessions.doc(sessionId.value).update({
          data: {
            status: 'abandoned',
            abandonedAt: now,
            updatedAt: now
          }
        })

        return {
          sessionId: sessionId.value,
          planId
        }
      })
    }
  )

  if (result.errorCode) {
    return fail(result.errorCode, result.errorMessage, request.requestId)
  }

  return ok(result, request.requestId)
}

async function saveNote(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  const content = requiredText(request.payload, 'content', '笔记')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)
  if (!content.valid) return fail(ErrorCode.INVALID_ARGUMENT, content.message, request.requestId)

  const ownerId = auth.identity.userId
  const session = await db.collection('live_sessions').doc(sessionId.value).get()
  if (!session.data || session.data.ownerId !== ownerId) {
    return fail(ErrorCode.NOT_FOUND, '场次不存在', request.requestId)
  }

  const now = Date.now()
  const created = await db.collection('session_notes').add({
    data: {
      ownerId,
      sessionId: sessionId.value,
      phaseName: typeof request.payload.phaseName === 'string' ? request.payload.phaseName.trim() : '',
      content: content.value,
      createdAt: now
    }
  })

  return ok({ noteId: created._id, createdAt: now }, request.requestId)
}

function normalizeInteractionType(type) {
  if (type === 'vote' || type === 'promise' || type === 'wordcloud') return type
  return 'wordcloud'
}

function buildJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

async function createInteraction(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  const title = requiredText(request.payload, 'title', '互动标题')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)
  if (!title.valid) return fail(ErrorCode.INVALID_ARGUMENT, title.message, request.requestId)

  const ownerId = auth.identity.userId
  const session = await db.collection('live_sessions').doc(sessionId.value).get()
  if (!session.data || session.data.ownerId !== ownerId || session.data.status !== 'running') {
    return fail(ErrorCode.CONFLICT, '当前场次不可创建互动', request.requestId)
  }

  const type = normalizeInteractionType(request.payload.type)
  const options = Array.isArray(request.payload.options)
    ? request.payload.options.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim()).slice(0, 8)
    : []
  if (type === 'vote' && options.length < 2) {
    return fail(ErrorCode.INVALID_ARGUMENT, '投票至少需要 2 个选项', request.requestId)
  }

  const now = Date.now()
  const created = await db.collection('interactions').add({
    data: {
      ownerId,
      sessionId: sessionId.value,
      type,
      title: title.value,
      options,
      status: 'open',
      joinCode: buildJoinCode(),
      createdAt: now,
      updatedAt: now
    }
  })

  return ok({ interactionId: created._id }, request.requestId)
}

async function listInteractions(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const session = await db.collection('live_sessions').doc(sessionId.value).get()
  if (!session.data || session.data.ownerId !== auth.identity.userId) {
    return fail(ErrorCode.NOT_FOUND, '场次不存在', request.requestId)
  }

  const result = await db.collection('interactions')
    .where({ ownerId: auth.identity.userId, sessionId: sessionId.value })
    .orderBy('createdAt', 'desc')
    .limit(20)
    .get()

  return ok({ interactions: result.data }, request.requestId)
}

async function closeInteraction(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const interactionId = requiredText(request.payload, 'interactionId', '互动')
  if (!interactionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, interactionId.message, request.requestId)

  const interaction = await db.collection('interactions').doc(interactionId.value).get()
  if (!interaction.data || interaction.data.ownerId !== auth.identity.userId) {
    return fail(ErrorCode.NOT_FOUND, '互动不存在', request.requestId)
  }

  await db.collection('interactions').doc(interactionId.value).update({
    data: { status: 'closed', updatedAt: Date.now() }
  })
  return ok({ interactionId: interactionId.value }, request.requestId)
}

async function getInteractionStats(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const interactionId = requiredText(request.payload, 'interactionId', '互动')
  if (!interactionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, interactionId.message, request.requestId)

  const interaction = await db.collection('interactions').doc(interactionId.value).get()
  if (!interaction.data || interaction.data.ownerId !== auth.identity.userId) {
    return fail(ErrorCode.NOT_FOUND, '互动不存在', request.requestId)
  }

  const submissions = await db.collection('interaction_submissions')
    .where({ interactionId: interactionId.value })
    .orderBy('createdAt', 'desc')
    .limit(300)
    .get()
  const type = interaction.data.type
  const options = interaction.data.options || []
  const optionStats = options.map((label, index) => ({
    label,
    count: submissions.data.filter((item) => Number(item.optionIndex) === index).length
  }))
  const words = submissions.data
    .filter((item) => item.content)
    .reduce((acc, item) => {
      const key = item.content.trim()
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

  return ok({
    interaction: interaction.data,
    count: submissions.data.length,
    optionStats,
    words: Object.keys(words).map((text) => ({ text, count: words[text] })).sort((a, b) => b.count - a.count).slice(0, 30),
    submissions: type === 'promise' ? submissions.data.slice(0, 30) : []
  }, request.requestId)
}

async function getSessionEntryCode(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const entryType = request.payload.entryType === 'feedback' ? 'feedback' : 'checkin'
  const envVersion = typeof request.payload.envVersion === 'string' && request.payload.envVersion.trim()
    ? request.payload.envVersion.trim()
    : 'release'

  const owned = await getOwnedSessionOrError(sessionId.value, auth.identity.userId, request.requestId)
  if (owned.error) return owned.error

  const page = entryType === 'feedback'
    ? 'pages/participant/feedback/index'
    : 'pages/participant/checkin/index'
  const scene = sessionId.value

  try {
    const code = await generateMiniCode({
      page,
      scene,
      envVersion,
      cloudPath: `minicodes/${sessionId.value}/${entryType}-${envVersion}.png`
    })

    return ok({
      entryType,
      path: `/${page}?sessionId=${sessionId.value}`,
      scene,
      ...code
    }, request.requestId)
  } catch (error) {
    console.error('getSessionEntryCode failed', error)
    return fail(ErrorCode.INTERNAL, '小程序码生成失败，请稍后重试', request.requestId)
  }
}

async function getInteractionEntryCode(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const interactionId = requiredText(request.payload, 'interactionId', '互动')
  if (!interactionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, interactionId.message, request.requestId)
  const envVersion = typeof request.payload.envVersion === 'string' && request.payload.envVersion.trim()
    ? request.payload.envVersion.trim()
    : 'release'

  const interaction = await db.collection('interactions').doc(interactionId.value).get()
  if (!interaction.data || interaction.data.ownerId !== auth.identity.userId) {
    return fail(ErrorCode.NOT_FOUND, '互动不存在', request.requestId)
  }

  const scene = `iid=${encodeURIComponent(interactionId.value)}&code=${encodeURIComponent(interaction.data.joinCode)}`

  try {
    const code = await generateMiniCode({
      page: 'pages/participant/interaction/index',
      scene,
      envVersion,
      cloudPath: `minicodes/${interaction.data.sessionId}/interaction-${interactionId.value}-${envVersion}.png`
    })

    return ok({
      interactionId: interactionId.value,
      joinCode: interaction.data.joinCode,
      path: `/pages/participant/interaction/index?interactionId=${interactionId.value}&code=${interaction.data.joinCode}`,
      scene,
      ...code
    }, request.requestId)
  } catch (error) {
    console.error('getInteractionEntryCode failed', error)
    return fail(ErrorCode.INTERNAL, '互动小程序码生成失败，请稍后重试', request.requestId)
  }
}

exports.main = async (event) => route(event, {
  startSession,
  getSessionDetail,
  manualCheckin,
  listParticipants,
  saveGroupState,
  saveScoreState,
  saveRandomState,
  abandonSession,
  endSession,
  saveNote,
  createInteraction,
  listInteractions,
  closeInteraction,
  getInteractionStats,
  getSessionEntryCode,
  getInteractionEntryCode
})
