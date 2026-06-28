const {
  ErrorCode,
  db,
  fail,
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

function isPublicTemplate(template) {
  return !!template && template.visibility === 'public'
}

function isPrivateTemplateOwnedBy(template, ownerId) {
  return !!template && template.visibility !== 'public' && template.ownerId === ownerId
}

function normalizeTemplateForUser(template, ownerId) {
  const isPublic = isPublicTemplate(template)
  const isOwned = isPrivateTemplateOwnedBy(template, ownerId)
  return {
    ...template,
    visibility: isPublic ? 'public' : 'private',
    isPublic,
    canDelete: isOwned,
    canEdit: isOwned,
    canToggleFavorite: isOwned,
    canTogglePinned: isOwned
  }
}

async function listVisibleTemplates(ownerId, limit, offset) {
  const result = await db.collection('templates')
    .orderBy('updatedAt', 'desc')
    .limit(500)
    .get()

  const visible = result.data
    .filter((item) => isPublicTemplate(item) || isPrivateTemplateOwnedBy(item, ownerId))
    .map((item) => normalizeTemplateForUser(item, ownerId))

  return {
    templates: visible.slice(offset, offset + limit),
    hasMore: offset + limit < visible.length
  }
}

async function getHomeSummary(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const ownerId = auth.identity.userId
  const plans = db.collection('plans')
  const sessions = db.collection('live_sessions')
  const profiles = db.collection('trainer_profiles')

  const confirmed = await plans.where({ ownerId, status: 'confirmed' }).count()
  const drafts = await plans.where({ ownerId, status: 'draft' }).count()
  const ended = await sessions.where({ ownerId, status: 'ended' }).count()
  const profile = await profiles.where({ userId: ownerId }).limit(1).get()

  return ok({
    pendingStartCount: confirmed.total,
    draftPlanCount: drafts.total,
    pendingReviewCount: ended.total,
    profile: profile.data[0] || null
  }, request.requestId)
}

function averageRating(items) {
  if (!items.length) return 0
  const total = items.reduce((sum, item) => sum + Number(item.rating || 0), 0)
  return Math.round((total / items.length) * 10) / 10
}

function npsScore(items) {
  if (!items.length) return 0
  const promoters = items.filter((item) => Number(item.rating || 0) >= 5).length
  const detractors = items.filter((item) => Number(item.rating || 0) <= 3).length
  return Math.round(((promoters - detractors) / items.length) * 100)
}

async function getSessionStats(sessionId) {
  const participants = await db.collection('participants').where({ sessionId }).limit(500).get()
  const feedback = await db.collection('feedback').where({ sessionId }).orderBy('createdAt', 'desc').limit(200).get()
  const participantCount = participants.data.length
  const feedbackCount = feedback.data.length
  return {
    participantCount,
    feedbackCount,
    avgSatisfaction: averageRating(feedback.data),
    nps: npsScore(feedback.data),
    responseRate: participantCount > 0 ? `${Math.round((feedbackCount / participantCount) * 100)}%` : '0%',
    feedback: feedback.data
  }
}

function formatDate(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

async function listTrainingRecords(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const ownerId = auth.identity.userId
  const result = await db.collection('live_sessions')
    .where({ ownerId })
    .orderBy('startedAt', 'desc')
    .limit(50)
    .get()

  const visibleSessions = result.data.filter((session) => session.status === 'ended' || session.status === 'reviewed')
  const records = await Promise.all(visibleSessions.map(async (session) => {
    const stats = await getSessionStats(session._id)
    const snapshot = session.planSnapshot || {}
    return {
      _id: session._id,
      name: snapshot.name || '培训活动',
      category: snapshot.type || '企业培训',
      date: formatDate(session.endedAt || session.startedAt),
      participants: stats.participantCount,
      satisfaction: stats.feedbackCount > 0 ? stats.avgSatisfaction.toFixed(1) : '--',
      nps: stats.feedbackCount > 0 ? `${stats.nps}` : '--',
      status: session.status === 'reviewed' ? '已复盘' : (session.status === 'ended' ? '待复盘' : '进行中')
    }
  }))

  return ok({ records }, request.requestId)
}

async function getDataOverview(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const ownerId = auth.identity.userId
  const sessionId = typeof request.payload.sessionId === 'string' ? request.payload.sessionId.trim() : ''
  if (sessionId) {
    const session = await db.collection('live_sessions').doc(sessionId).get()
    if (!session.data || session.data.ownerId !== ownerId) {
      return fail(ErrorCode.NOT_FOUND, '场次不存在', request.requestId)
    }
    const stats = await getSessionStats(sessionId)
    const ratingBuckets = [5, 4, 3, 2, 1].map((rating) => {
      const count = stats.feedback.filter((item) => Number(item.rating || 0) === rating).length
      return { name: `${rating}星`, count, width: Math.max(12, count * 36) }
    })
    return ok({
      mode: 'session',
      title: (session.data.planSnapshot || {}).name || '本场培训',
      metrics: [
        { value: '1', label: '本场培训' },
        { value: `${stats.participantCount}`, label: '已签到人数' },
        { value: stats.feedbackCount > 0 ? stats.avgSatisfaction.toFixed(1) : '--', label: '满意度' },
        { value: stats.feedbackCount > 0 ? `${stats.nps}` : '--', label: '本场 NPS' }
      ],
      trends: [
        { name: '反馈数量', value: `${stats.feedbackCount} 条` },
        { name: '回收率', value: stats.responseRate }
      ],
      distributionTitle: '满意度分布',
      distribution: ratingBuckets,
      feedbackList: stats.feedback.slice(0, 20).map((item) => ({
        content: item.content || '',
        rating: item.rating || 0,
        time: formatDate(item.createdAt)
      }))
    }, request.requestId)
  }

  const sessions = await db.collection('live_sessions').where({ ownerId }).orderBy('startedAt', 'desc').limit(100).get()
  const completedSessions = sessions.data.filter((session) => session.status === 'ended' || session.status === 'reviewed')
  const allStats = await Promise.all(completedSessions.map((session) => getSessionStats(session._id)))
  const totalParticipants = allStats.reduce((sum, item) => sum + item.participantCount, 0)
  const feedbackItems = allStats.flatMap((item) => item.feedback)
  const sceneCount = {}
  completedSessions.forEach((session) => {
    const type = (session.planSnapshot || {}).type || '未分类'
    sceneCount[type] = (sceneCount[type] || 0) + 1
  })
  const maxScene = Math.max(1, ...Object.values(sceneCount))

  return ok({
    mode: 'all',
    metrics: [
      { value: `${completedSessions.length}`, label: '总培训场次' },
      { value: `${totalParticipants}`, label: '累计参与人数' },
      { value: feedbackItems.length > 0 ? averageRating(feedbackItems).toFixed(1) : '--', label: '平均满意度' },
      { value: feedbackItems.length > 0 ? `${npsScore(feedbackItems)}` : '--', label: '平均 NPS' }
    ],
    trends: [
      { name: '反馈总量', value: `${feedbackItems.length} 条` },
      { name: '已复盘场次', value: `${completedSessions.filter((item) => item.status === 'reviewed').length} 场` }
    ],
    distributionTitle: '场景分布',
    distribution: Object.keys(sceneCount).map((name) => ({
      name,
      count: sceneCount[name],
      width: Math.max(12, Math.round((sceneCount[name] / maxScene) * 240))
    }))
  }, request.requestId)
}

async function getProfile(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const ownerId = auth.identity.userId
  const result = await db.collection('trainer_profiles').where({ userId: ownerId }).limit(1).get()

  return ok({
    profile: result.data[0] || null
  }, request.requestId)
}

async function updateProfile(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const displayName = requiredText(request.payload, 'displayName', '姓名')
  if (!displayName.valid) {
    return fail(ErrorCode.INVALID_ARGUMENT, displayName.message, request.requestId)
  }

  const ownerId = auth.identity.userId
  const organization = typeof request.payload.organization === 'string'
    ? request.payload.organization.trim()
    : ''
  const now = Date.now()

  const result = await withIdempotency(
    request.requestId,
    'trainer.updateProfile',
    ownerId,
    ownerId,
    async () => {
      const profiles = db.collection('trainer_profiles')
      const existed = await profiles.where({ userId: ownerId }).limit(1).get()
      const data = {
        userId: ownerId,
        displayName: displayName.value,
        role: 'trainer',
        organization,
        updatedAt: now
      }

      if (existed.data.length > 0) {
        const profileId = existed.data[0]._id
        await profiles.doc(profileId).update({ data })
        return { profileId }
      }

      const created = await profiles.add({
        data: {
          ...data,
          createdAt: now
        }
      })
      return { profileId: created._id }
    }
  )

  return ok(result, request.requestId)
}

async function saveSupportFeedback(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const content = requiredText(request.payload, 'content', '反馈内容')
  if (!content.valid) return fail(ErrorCode.INVALID_ARGUMENT, content.message, request.requestId)
  const contact = typeof request.payload.contact === 'string' ? request.payload.contact.trim() : ''
  const ownerId = auth.identity.userId
  const result = await withIdempotency(
    request.requestId,
    'trainer.saveSupportFeedback',
    ownerId,
    content.value,
    async () => {
      const created = await db.collection('support_feedback').add({
        data: {
          ownerId,
          contact,
          content: content.value,
          status: 'open',
          createdAt: Date.now()
        }
      })
      return { feedbackId: created._id }
    }
  )
  return ok(result, request.requestId)
}

async function listPlans(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const ownerId = auth.identity.userId
  const status = typeof request.payload.status === 'string' ? request.payload.status : ''
  const limit = Math.min(100, Math.max(1, Number(request.payload.limit || 50)))
  const offset = Math.max(0, Number(request.payload.offset || 0))
  const query = status ? { ownerId, status } : { ownerId }
  const result = await db.collection('plans').where(query).orderBy('updatedAt', 'desc').skip(offset).limit(limit).get()
  const planIds = result.data.map((item) => item._id).filter(Boolean)
  let reviewSessionByPlanId = {}
  let latestSessionByPlanId = {}
  if (planIds.length > 0) {
    const sessions = await db.collection('live_sessions')
      .where({ ownerId })
      .orderBy('startedAt', 'desc')
      .limit(200)
      .get()
    reviewSessionByPlanId = sessions.data.reduce((map, session) => {
      if (!planIds.includes(session.planId)) return map
      if (session.status !== 'ended' && session.status !== 'reviewed') return map
      if (!map[session.planId]) {
        map[session.planId] = {
          reviewSessionId: session._id,
          reviewSessionStatus: session.status
        }
      }
      return map
    }, {})
    latestSessionByPlanId = sessions.data.reduce((map, session) => {
      if (!planIds.includes(session.planId)) return map
      if (!map[session.planId]) {
        map[session.planId] = {
          latestSessionId: session._id,
          latestSessionStatus: session.status
        }
      }
      return map
    }, {})
  }

  return ok({
    plans: result.data.map((item) => ({
      ...item,
      ...(latestSessionByPlanId[item._id] || {}),
      ...(reviewSessionByPlanId[item._id] || {})
    })),
    offset,
    limit,
    hasMore: result.data.length === limit
  }, request.requestId)
}

async function getPlanDetail(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const planId = requiredText(request.payload, '_id', '方案')
  if (!planId.valid) return fail(ErrorCode.INVALID_ARGUMENT, planId.message, request.requestId)

  const result = await db.collection('plans').doc(planId.value).get()
  if (!result.data || result.data.ownerId !== auth.identity.userId) {
    return fail(ErrorCode.NOT_FOUND, '方案不存在', request.requestId)
  }

  return ok({ plan: result.data }, request.requestId)
}

async function listTemplates(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const ownerId = auth.identity.userId
  const limit = Math.min(100, Math.max(1, Number(request.payload.limit || 50)))
  const offset = Math.max(0, Number(request.payload.offset || 0))
  const result = await listVisibleTemplates(ownerId, limit, offset)
  return ok({ templates: result.templates, offset, limit, hasMore: result.hasMore }, request.requestId)
}

async function getTemplateDetail(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const templateId = requiredText(request.payload, '_id', '模板')
  if (!templateId.valid) return fail(ErrorCode.INVALID_ARGUMENT, templateId.message, request.requestId)

  const result = await db.collection('templates').doc(templateId.value).get()
  if (!result.data || (!isPublicTemplate(result.data) && !isPrivateTemplateOwnedBy(result.data, auth.identity.userId))) {
    return fail(ErrorCode.NOT_FOUND, '模板不存在', request.requestId)
  }

  return ok({ template: normalizeTemplateForUser(result.data, auth.identity.userId) }, request.requestId)
}

async function deleteTemplate(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const templateId = requiredText(request.payload, '_id', '模板')
  if (!templateId.valid) return fail(ErrorCode.INVALID_ARGUMENT, templateId.message, request.requestId)

  const template = await db.collection('templates').doc(templateId.value).get()
  if (!template.data) {
    return fail(ErrorCode.NOT_FOUND, '模板不存在', request.requestId)
  }
  if (isPublicTemplate(template.data)) {
    return fail(ErrorCode.CONFLICT, '公共模板不允许删除', request.requestId)
  }
  if (!isPrivateTemplateOwnedBy(template.data, auth.identity.userId)) {
    return fail(ErrorCode.NOT_FOUND, '模板不存在', request.requestId)
  }
  await db.collection('templates').doc(templateId.value).remove()
  return ok({ templateId: templateId.value }, request.requestId)
}

async function updateTemplateFlags(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const templateId = requiredText(request.payload, '_id', '模板')
  if (!templateId.valid) return fail(ErrorCode.INVALID_ARGUMENT, templateId.message, request.requestId)

  const template = await db.collection('templates').doc(templateId.value).get()
  if (!template.data) {
    return fail(ErrorCode.NOT_FOUND, '模板不存在', request.requestId)
  }
  if (isPublicTemplate(template.data)) {
    return fail(ErrorCode.CONFLICT, '公共模板不支持此操作', request.requestId)
  }
  if (!isPrivateTemplateOwnedBy(template.data, auth.identity.userId)) {
    return fail(ErrorCode.NOT_FOUND, '模板不存在', request.requestId)
  }
  const data = { updatedAt: Date.now() }
  if (typeof request.payload.isFavorite === 'boolean') data.isFavorite = request.payload.isFavorite
  if (typeof request.payload.isPinned === 'boolean') data.isPinned = request.payload.isPinned
  await db.collection('templates').doc(templateId.value).update({ data })
  return ok({ templateId: templateId.value, ...data }, request.requestId)
}

async function listActivities(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const ownerId = auth.identity.userId
  const limit = Math.min(100, Math.max(1, Number(request.payload.limit || 100)))
  const offset = Math.max(0, Number(request.payload.offset || 0))
  const result = await db.collection('activities').where({ ownerId }).orderBy('updatedAt', 'desc').skip(offset).limit(limit).get()
  return ok({ activities: result.data, offset, limit, hasMore: result.data.length === limit }, request.requestId)
}

async function getActivityDetail(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const activityId = requiredText(request.payload, '_id', '活动')
  if (!activityId.valid) return fail(ErrorCode.INVALID_ARGUMENT, activityId.message, request.requestId)

  const result = await db.collection('activities').doc(activityId.value).get()
  if (!result.data || result.data.ownerId !== auth.identity.userId) {
    return fail(ErrorCode.NOT_FOUND, '活动不存在', request.requestId)
  }

  return ok({ activity: result.data }, request.requestId)
}

function normalizePlanPayload(payload, status) {
  const name = requiredText(payload, 'name', '方案名称')
  if (!name.valid) return { error: name.message }

  const phases = Array.isArray(payload.phases)
    ? payload.phases.map((phase, index) => ({
      name: typeof phase.name === 'string' && phase.name.trim() ? phase.name.trim() : `环节${index + 1}`,
      type: typeof phase.type === 'string' && phase.type.trim() ? phase.type.trim() : '',
      duration: Math.max(0, Number(phase.duration || phase.minutes || 0)),
      activityId: typeof phase.activityId === 'string' && phase.activityId.trim() ? phase.activityId.trim() : '',
      activities: Array.isArray(phase.activities)
        ? phase.activities
          .filter((activity) => activity && typeof activity === 'object')
          .map((activity) => ({
            activityId: typeof activity.activityId === 'string' && activity.activityId.trim() ? activity.activityId.trim() : '',
            name: typeof activity.name === 'string' ? activity.name.trim() : '',
            category: typeof activity.category === 'string' ? activity.category.trim() : '',
            durationMinutes: Math.max(0, Number(activity.durationMinutes || activity.duration || 0)),
            peopleRange: typeof activity.peopleRange === 'string' ? activity.peopleRange.trim() : ''
          }))
          .filter((activity) => activity.activityId && activity.name)
        : []
    }))
    : []

  if (phases.length === 0) return { error: '请先添加环节' }

  return {
    data: {
      name: name.value,
      customerName: typeof payload.customerName === 'string' ? payload.customerName.trim() : '',
      type: typeof payload.type === 'string' && payload.type.trim() ? payload.type.trim() : '企业培训',
      status,
      participantCount: Math.max(0, Number(payload.participantCount || 0)),
      durationMinutes: Math.max(0, Number(payload.durationMinutes || 0)),
      phases
    }
  }
}

async function upsertPlan(request, status) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const normalized = normalizePlanPayload(request.payload, status)
  if (normalized.error) {
    return fail(ErrorCode.INVALID_ARGUMENT, normalized.error, request.requestId)
  }

  const ownerId = auth.identity.userId
  const planId = typeof request.payload._id === 'string' && request.payload._id.trim()
    ? request.payload._id.trim()
    : ''
  const now = Date.now()

  const result = await withIdempotency(
    request.requestId,
    `trainer.${status === 'confirmed' ? 'confirmPlan' : 'savePlanDraft'}`,
    ownerId,
    planId || normalized.data.name,
    async () => {
      const plans = db.collection('plans')
      const data = {
        ...normalized.data,
        ownerId,
        updatedAt: now
      }

      if (planId) {
        const existed = await plans.doc(planId).get()
        if (!existed.data || existed.data.ownerId !== ownerId) {
          return { errorCode: ErrorCode.NOT_FOUND, errorMessage: '方案不存在' }
        }
        await plans.doc(planId).update({ data })
        return { planId }
      }

      const created = await plans.add({
        data: {
          ...data,
          createdAt: now
        }
      })
      return { planId: created._id }
    }
  )

  if (result.errorCode) {
    return fail(result.errorCode, result.errorMessage, request.requestId)
  }

  return ok(result, request.requestId)
}

async function savePlanDraft(request) {
  return upsertPlan(request, 'draft')
}

async function confirmPlan(request) {
  return upsertPlan(request, 'confirmed')
}

async function deletePlan(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const planId = requiredText(request.payload, '_id', '方案')
  if (!planId.valid) return fail(ErrorCode.INVALID_ARGUMENT, planId.message, request.requestId)

  const ownerId = auth.identity.userId
  const plans = db.collection('plans')
  const existed = await plans.doc(planId.value).get()
  if (!existed.data || existed.data.ownerId !== ownerId) {
    return fail(ErrorCode.NOT_FOUND, '方案不存在', request.requestId)
  }

  const running = await db.collection('live_sessions').where({ ownerId, planId: planId.value, status: 'running' }).limit(1).get()
  if (running.data.length > 0) {
    return fail(ErrorCode.CONFLICT, '培训进行中，暂不能删除方案', request.requestId)
  }

  await plans.doc(planId.value).remove()
  return ok({ planId: planId.value }, request.requestId)
}

async function updatePlanFlags(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const planId = requiredText(request.payload, '_id', '方案')
  if (!planId.valid) return fail(ErrorCode.INVALID_ARGUMENT, planId.message, request.requestId)

  const ownerId = auth.identity.userId
  const plan = await db.collection('plans').doc(planId.value).get()
  if (!plan.data || plan.data.ownerId !== ownerId) {
    return fail(ErrorCode.NOT_FOUND, '方案不存在', request.requestId)
  }

  const data = { updatedAt: Date.now() }
  if (typeof request.payload.isFavorite === 'boolean') data.isFavorite = request.payload.isFavorite
  if (typeof request.payload.isPinned === 'boolean') data.isPinned = request.payload.isPinned
  await db.collection('plans').doc(planId.value).update({ data })
  return ok({ planId: planId.value, ...data }, request.requestId)
}

async function savePlanAsTemplate(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const planId = requiredText(request.payload, '_id', '方案')
  if (!planId.valid) return fail(ErrorCode.INVALID_ARGUMENT, planId.message, request.requestId)

  const ownerId = auth.identity.userId
  const plan = await db.collection('plans').doc(planId.value).get()
  if (!plan.data || plan.data.ownerId !== ownerId) {
    return fail(ErrorCode.NOT_FOUND, '方案不存在', request.requestId)
  }

  const now = Date.now()
  const source = plan.data
  const created = await db.collection('templates').add({
    data: {
      ownerId,
      visibility: 'private',
      name: source.name.endsWith('方案') ? source.name.replace(/方案$/, '模板') : `${source.name}模板`,
      type: source.type || '企业培训',
      phaseCount: Array.isArray(source.phases) ? source.phases.length : 0,
      flowText: Array.isArray(source.phases) ? source.phases.map((phase) => phase.name).join(' -> ') : '',
      phases: Array.isArray(source.phases) ? source.phases : [],
      sourcePlanId: planId.value,
      createdAt: now,
      updatedAt: now
    }
  })

  return ok({ templateId: created._id }, request.requestId)
}

function normalizeActivityPayload(payload) {
  const name = requiredText(payload, 'name', '活动名称')
  if (!name.valid) return { error: name.message }

  const scenes = Array.isArray(payload.scenes)
    ? payload.scenes.filter((item) => typeof item === 'string' && item.trim()).map((item) => item.trim())
    : []

  return {
    data: {
      name: name.value,
      scenes,
      category: scenes[0] || '团队融合',
      difficulty: typeof payload.difficulty === 'string' && payload.difficulty.trim() ? payload.difficulty.trim() : '中等',
      peopleRange: typeof payload.peopleRange === 'string' ? payload.peopleRange.trim() : '',
      durationMinutes: Math.max(0, Number(payload.durationMinutes || 0)),
      objective: typeof payload.objective === 'string' ? payload.objective.trim() : '',
      rules: typeof payload.rules === 'string' ? payload.rules.trim() : '',
      reviewQuestions: typeof payload.reviewQuestions === 'string' ? payload.reviewQuestions.trim() : '',
      leaderTips: typeof payload.leaderTips === 'string' ? payload.leaderTips.trim() : ''
    }
  }
}

async function saveActivity(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const normalized = normalizeActivityPayload(request.payload)
  if (normalized.error) {
    return fail(ErrorCode.INVALID_ARGUMENT, normalized.error, request.requestId)
  }

  const ownerId = auth.identity.userId
  const activityId = typeof request.payload._id === 'string' && request.payload._id.trim()
    ? request.payload._id.trim()
    : ''
  const now = Date.now()

  const result = await withIdempotency(
    request.requestId,
    'trainer.saveActivity',
    ownerId,
    activityId || normalized.data.name,
    async () => {
      const activities = db.collection('activities')
      const data = {
        ...normalized.data,
        ownerId,
        updatedAt: now
      }

      if (activityId) {
        const existed = await activities.doc(activityId).get()
        if (!existed.data || existed.data.ownerId !== ownerId) {
          return { errorCode: ErrorCode.NOT_FOUND, errorMessage: '活动不存在' }
        }
        await activities.doc(activityId).update({ data })
        return { activityId }
      }

      const created = await activities.add({
        data: {
          ...data,
          createdAt: now
        }
      })
      return { activityId: created._id }
    }
  )

  if (result.errorCode) {
    return fail(result.errorCode, result.errorMessage, request.requestId)
  }

  return ok(result, request.requestId)
}

async function deleteActivity(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const activityId = requiredText(request.payload, '_id', '活动')
  if (!activityId.valid) return fail(ErrorCode.INVALID_ARGUMENT, activityId.message, request.requestId)

  const ownerId = auth.identity.userId
  const activities = db.collection('activities')
  const existed = await activities.doc(activityId.value).get()
  if (!existed.data || existed.data.ownerId !== ownerId) {
    return fail(ErrorCode.NOT_FOUND, '活动不存在', request.requestId)
  }

  await activities.doc(activityId.value).remove()
  return ok({ activityId: activityId.value }, request.requestId)
}

async function updateActivityFlags(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const activityId = requiredText(request.payload, '_id', '活动')
  if (!activityId.valid) return fail(ErrorCode.INVALID_ARGUMENT, activityId.message, request.requestId)

  const ownerId = auth.identity.userId
  const activity = await db.collection('activities').doc(activityId.value).get()
  if (!activity.data || activity.data.ownerId !== ownerId) {
    return fail(ErrorCode.NOT_FOUND, '活动不存在', request.requestId)
  }
  const data = { updatedAt: Date.now() }
  if (typeof request.payload.isFavorite === 'boolean') data.isFavorite = request.payload.isFavorite
  if (typeof request.payload.isPinned === 'boolean') data.isPinned = request.payload.isPinned
  await db.collection('activities').doc(activityId.value).update({ data })
  return ok({ activityId: activityId.value, ...data }, request.requestId)
}

async function addActivityToPlan(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const activityId = requiredText(request.payload, 'activityId', '活动')
  const planId = requiredText(request.payload, 'planId', '方案')
  if (!activityId.valid) return fail(ErrorCode.INVALID_ARGUMENT, activityId.message, request.requestId)
  if (!planId.valid) return fail(ErrorCode.INVALID_ARGUMENT, planId.message, request.requestId)

  const phaseIndex = Math.max(0, Number(request.payload.phaseIndex || 0))
  const ownerId = auth.identity.userId
  const [activity, plan] = await Promise.all([
    db.collection('activities').doc(activityId.value).get(),
    db.collection('plans').doc(planId.value).get()
  ])
  if (!activity.data || activity.data.ownerId !== ownerId) return fail(ErrorCode.NOT_FOUND, '活动不存在', request.requestId)
  if (!plan.data || plan.data.ownerId !== ownerId) return fail(ErrorCode.NOT_FOUND, '方案不存在', request.requestId)
  if (plan.data.status !== 'draft') return fail(ErrorCode.CONFLICT, '只能编辑草稿方案', request.requestId)

  const phases = Array.isArray(plan.data.phases) ? plan.data.phases.slice() : []
  const target = Math.min(phaseIndex, phases.length - 1)
  if (target < 0 || !phases[target]) {
    return fail(ErrorCode.INVALID_ARGUMENT, '请选择有效环节', request.requestId)
  }
  const targetPhase = { ...phases[target] }
  const phaseActivities = Array.isArray(targetPhase.activities) ? targetPhase.activities.slice() : []
  if (phaseActivities.some((item) => item.activityId === activityId.value)) {
    return fail(ErrorCode.CONFLICT, '该活动已在当前环节中', request.requestId)
  }
  phaseActivities.push({
    activityId: activityId.value,
    name: activity.data.name,
    category: activity.data.category || '活动',
    durationMinutes: Number(activity.data.durationMinutes || 10),
    peopleRange: activity.data.peopleRange || ''
  })
  targetPhase.activities = phaseActivities
  if (!targetPhase.activityId) {
    targetPhase.activityId = activityId.value
  }
  phases[target] = targetPhase
  const durationMinutes = phases.reduce((sum, item) => sum + Number(item.duration || 0), 0)
  await db.collection('plans').doc(planId.value).update({
    data: {
      phases,
      durationMinutes,
      updatedAt: Date.now()
    }
  })
  return ok({ planId: planId.value, phases, durationMinutes }, request.requestId)
}

exports.main = async (event) => route(event, {
  getHomeSummary,
  listTrainingRecords,
  getDataOverview,
  getProfile,
  updateProfile,
  saveSupportFeedback,
  listPlans,
  getPlanDetail,
  listTemplates,
  getTemplateDetail,
  deleteTemplate,
  updateTemplateFlags,
  listActivities,
  getActivityDetail,
  savePlanDraft,
  confirmPlan,
  deletePlan,
  updatePlanFlags,
  savePlanAsTemplate,
  saveActivity,
  deleteActivity,
  updateActivityFlags,
  addActivityToPlan
})
