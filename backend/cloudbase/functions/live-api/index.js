const {
  ErrorCode,
  cloud,
  db,
  fail,
  generateMiniCode: sharedGenerateMiniCode,
  generateUrlLink: sharedGenerateUrlLink,
  getCurrentIdentity,
  ok,
  requiredText,
  route,
  withIdempotency
} = require('./_shared')
const { normalizeNotes, validatePhaseIndex } = require('./_live-state')

function normalizeMiniCodeBuffer(result) {
  if (!result) return null
  if (Buffer.isBuffer(result)) return result
  if (Buffer.isBuffer(result.buffer)) return result.buffer
  if (result.buffer && result.buffer.data) return Buffer.from(result.buffer.data)
  return null
}

async function getTempFileURL(fileID) {
  const tempResult = await cloud.getTempFileURL({
    fileList: [fileID]
  })
  const file = tempResult.fileList && tempResult.fileList[0]
  return file && file.tempFileURL ? file.tempFileURL : ''
}

async function fallbackGenerateMiniCode({ page, scene, envVersion = 'release', cloudPath }) {
  if (!page || !scene || !cloudPath) {
    throw new Error('generateMiniCode requires page, scene and cloudPath')
  }
  if (scene.length > 32) {
    throw new Error(`wxacode scene is too long: ${scene.length}`)
  }

  const result = await cloud.openapi.wxacode.getUnlimited({
    page,
    scene,
    env_version: envVersion,
    check_path: true
  })
  const fileContent = normalizeMiniCodeBuffer(result)
  if (!fileContent) {
    throw new Error('wxacode.getUnlimited returned empty buffer')
  }

  const upload = await cloud.uploadFile({
    cloudPath,
    fileContent
  })
  const fileID = upload.fileID || ''
  return {
    fileID,
    tempFileURL: fileID ? await getTempFileURL(fileID) : ''
  }
}

const generateMiniCode = typeof sharedGenerateMiniCode === 'function'
  ? sharedGenerateMiniCode
  : fallbackGenerateMiniCode

function resolveUrlLinkGenerator() {
  const openapi = cloud.openapi || {}
  if (openapi.urlLink && typeof openapi.urlLink.generate === 'function') {
    return openapi.urlLink.generate.bind(openapi.urlLink)
  }
  if (openapi.urllink && typeof openapi.urllink.generate === 'function') {
    return openapi.urllink.generate.bind(openapi.urllink)
  }
  return null
}

async function fallbackGenerateUrlLink({ path, query, envVersion = 'release' }) {
  const generate = resolveUrlLinkGenerator()
  if (!generate) {
    throw new Error('urlLink.generate is not available')
  }
  const result = await generate({
    path,
    query,
    env_version: envVersion,
    is_expire: false
  })
  const urlLink = result && (result.url_link || result.urlLink || result.url)
  if (!urlLink) {
    throw new Error('urlLink.generate returned empty link')
  }
  return urlLink
}

const generateUrlLink = typeof sharedGenerateUrlLink === 'function'
  ? sharedGenerateUrlLink
  : fallbackGenerateUrlLink

function settledValue(result, fallback) {
  return result.status === 'fulfilled' ? result.value : fallback
}

function logEntryGenerationResult(label, results, context) {
  const failures = results
    .map((result, index) => ({ result, index }))
    .filter((item) => item.result.status === 'rejected')
  if (failures.length === 0) return
  console.error(`${label} partial failure`, {
    ...context,
    failures: failures.map((item) => ({
      index: item.index,
      error: item.result.reason
    }))
  })
}

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
        const runningSessions = await txSessions
          .where({ ownerId, planId: planId.value, status: 'running' })
          .limit(1)
          .get()
        if (runningSessions.data.length > 0) {
          const runningSessionId = runningSessions.data[0]._id
          if (latest.data.latestSessionId !== runningSessionId) {
            await txPlans.doc(planId.value).update({
              data: {
                latestSessionId: runningSessionId,
                updatedAt: now
              }
            })
          }
          return { sessionId: runningSessionId }
        }
        if (latest.data.latestSessionId) {
          const latestSession = await txSessions.doc(latest.data.latestSessionId).get()
          if (latestSession.data && latestSession.data.ownerId === ownerId && latestSession.data.status === 'running') {
            return { sessionId: latest.data.latestSessionId }
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

async function savePhaseState(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const owned = await getOwnedSessionOrError(sessionId.value, auth.identity.userId, request.requestId, { requireRunning: true })
  if (owned.error) return owned.error

  const phases = owned.session.planSnapshot && Array.isArray(owned.session.planSnapshot.phases)
    ? owned.session.planSnapshot.phases
    : []
  const phaseIndex = validatePhaseIndex(request.payload.currentPhaseIndex, phases.length)
  if (!phaseIndex.valid) return fail(ErrorCode.INVALID_ARGUMENT, phaseIndex.message, request.requestId)

  const now = Date.now()
  await db.collection('live_sessions').doc(sessionId.value).update({
    data: {
      currentPhaseIndex: phaseIndex.value,
      updatedAt: now
    }
  })
  return ok({ currentPhaseIndex: phaseIndex.value, updatedAt: now }, request.requestId)
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

async function listNotes(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const owned = await getOwnedSessionOrError(sessionId.value, auth.identity.userId, request.requestId)
  if (owned.error) return owned.error

  const result = await db.collection('session_notes')
    .where({ ownerId: auth.identity.userId, sessionId: sessionId.value })
    .orderBy('createdAt', 'desc')
    .limit(200)
    .get()

  return ok({ notes: normalizeNotes(result.data) }, request.requestId)
}

function normalizeInteractionType(type) {
  if (type === 'vote' || type === 'promise' || type === 'wordcloud') return type
  return 'wordcloud'
}

function buildJoinCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function buildEntryKey() {
  return Math.random().toString(36).slice(2, 10)
}

async function ensureInteractionEntryKey(interactionId, interaction) {
  if (interaction.entryKey) return interaction.entryKey
  const interactions = db.collection('interactions')
  for (let index = 0; index < 5; index += 1) {
    const entryKey = buildEntryKey()
    const existed = await interactions.where({ entryKey }).limit(1).get()
    if (existed.data.length === 0) {
      await interactions.doc(interactionId).update({
        data: {
          entryKey,
          updatedAt: Date.now()
        }
      })
      return entryKey
    }
  }
  throw new Error('failed to generate interaction entry key')
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
  const result = await withIdempotency(
    request.requestId,
    'live.createInteraction',
    ownerId,
    sessionId.value,
    async () => {
      const interactions = db.collection('interactions')
      const existed = await interactions
        .where({
          ownerId,
          sessionId: sessionId.value,
          type,
          title: title.value,
          status: 'open'
        })
        .limit(1)
        .get()
      if (existed.data.length > 0) {
        return { interactionId: existed.data[0]._id, duplicated: true }
      }
      const created = await interactions.add({
        data: {
          ownerId,
          sessionId: sessionId.value,
          type,
          title: title.value,
          options,
          status: 'open',
          entryKey: buildEntryKey(),
          joinCode: buildJoinCode(),
          createdAt: now,
          updatedAt: now
        }
      })
      return { interactionId: created._id }
    }
  )

  return ok(result, request.requestId)
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
  const visibleSubmissions = submissions.data.filter((item) => !item.hiddenAt)
  const type = interaction.data.type
  const options = interaction.data.options || []
  const optionStats = options.map((label, index) => ({
    label,
    count: visibleSubmissions.filter((item) => Number(item.optionIndex) === index).length
  }))
  const words = visibleSubmissions
    .filter((item) => item.content)
    .reduce((acc, item) => {
      const key = item.content.trim()
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})

  return ok({
    interaction: interaction.data,
    count: visibleSubmissions.length,
    optionStats,
    words: Object.keys(words).map((text) => ({ text, count: words[text] })).sort((a, b) => b.count - a.count).slice(0, 30),
    submissions: type === 'promise' ? visibleSubmissions.slice(0, 30).map((item) => ({ id: item._id, content: item.content || '' })) : []
  }, request.requestId)
}

async function reportInteractionSubmission(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error
  const submissionId = requiredText(request.payload, 'submissionId', '提交内容')
  if (!submissionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, submissionId.message, request.requestId)
  const submission = await db.collection('interaction_submissions').doc(submissionId.value).get()
  if (!submission.data) return fail(ErrorCode.NOT_FOUND, '提交内容不存在', request.requestId)
  const interaction = await db.collection('interactions').doc(submission.data.interactionId).get()
  if (!interaction.data || interaction.data.ownerId !== auth.identity.userId) return fail(ErrorCode.NOT_FOUND, '提交内容不存在', request.requestId)
  const now = Date.now()
  await db.collection('interaction_submissions').doc(submissionId.value).update({ data: { hiddenAt: now, hiddenBy: auth.identity.userId } })
  await db.collection('ugc_reports').add({ data: { reporterId: auth.identity.userId, submissionId: submissionId.value, interactionId: submission.data.interactionId, sessionId: submission.data.sessionId, reason: typeof request.payload.reason === 'string' ? request.payload.reason.trim() : 'objectionable', status: 'open', createdAt: now } })
  if (submission.data.openid) {
    const existed = await db.collection('ugc_blocks').where({ sessionId: submission.data.sessionId, openid: submission.data.openid }).limit(1).get()
    if (existed.data.length === 0) await db.collection('ugc_blocks').add({ data: { sessionId: submission.data.sessionId, openid: submission.data.openid, ownerId: auth.identity.userId, createdAt: now } })
  }
  return ok({ submissionId: submissionId.value, hidden: true, blocked: !!submission.data.openid }, request.requestId)
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
  const query = `sessionId=${encodeURIComponent(sessionId.value)}`

  const results = await Promise.allSettled([
    generateMiniCode({
      page,
      scene,
      envVersion,
      cloudPath: `minicodes/${sessionId.value}/${entryType}-${envVersion}.png`
    }),
    generateUrlLink({
      path: page,
      query,
      envVersion
    })
  ])
  const code = settledValue(results[0], {})
  const urlLink = settledValue(results[1], '')
  logEntryGenerationResult('getSessionEntryCode', results, {
    entryType,
    envVersion,
    page,
    scene,
    sessionId: sessionId.value
  })

  if (!code.tempFileURL && !urlLink) {
    return fail(ErrorCode.INTERNAL, '小程序入口生成失败，请稍后重试', request.requestId)
  }

  return ok({
    entryType,
    path: `/${page}?${query}`,
    scene,
    urlLink,
    ...code
  }, request.requestId)
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

  const entryKey = await ensureInteractionEntryKey(interactionId.value, interaction.data)
  const joinCode = interaction.data.joinCode
  const scene = `k=${encodeURIComponent(entryKey)}&c=${encodeURIComponent(joinCode)}`
  const query = `entryKey=${encodeURIComponent(entryKey)}&code=${encodeURIComponent(joinCode)}`
  const page = 'pages/participant/interaction/index'

  const results = await Promise.allSettled([
    generateMiniCode({
      page,
      scene,
      envVersion,
      cloudPath: `minicodes/${interaction.data.sessionId}/interaction-${interactionId.value}-${envVersion}.png`
    }),
    generateUrlLink({
      path: page,
      query,
      envVersion
    })
  ])
  const code = settledValue(results[0], {})
  const urlLink = settledValue(results[1], '')
  logEntryGenerationResult('getInteractionEntryCode', results, {
    envVersion,
    page,
    scene,
    interactionId: interactionId.value
  })

  if (!code.tempFileURL && !urlLink) {
    return fail(ErrorCode.INTERNAL, '互动入口生成失败，请稍后重试', request.requestId)
  }

  return ok({
    interactionId: interactionId.value,
    entryKey,
    joinCode,
    path: `/${page}?${query}`,
    scene,
    urlLink,
    ...code
  }, request.requestId)
}

exports.main = async (event) => route(event, {
  startSession,
  getSessionDetail,
  savePhaseState,
  manualCheckin,
  listParticipants,
  saveGroupState,
  saveScoreState,
  saveRandomState,
  abandonSession,
  endSession,
  saveNote,
  listNotes,
  createInteraction,
  listInteractions,
  closeInteraction,
  getInteractionStats,
  reportInteractionSubmission,
  getSessionEntryCode,
  getInteractionEntryCode
})
