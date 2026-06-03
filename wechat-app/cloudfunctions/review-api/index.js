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

function buildPhaseActivities(phases) {
  if (!Array.isArray(phases)) return []
  return phases.map((phase, index) => {
    const activities = Array.isArray(phase.activities)
      ? phase.activities
        .filter((activity) => activity && typeof activity === 'object' && activity.name)
        .map((activity) => ({
          activityId: activity.activityId || '',
          name: activity.name,
          category: activity.category || '活动',
          durationMinutes: Number(activity.durationMinutes || activity.duration || 0)
        }))
      : []
    return {
      name: phase.name || `环节${index + 1}`,
      activities
    }
  })
}

function buildActivitySummaryText(phases) {
  const phaseActivities = buildPhaseActivities(phases)
  const lines = phaseActivities
    .filter((phase) => phase.activities.length > 0)
    .map((phase) => `${phase.name}：${phase.activities.map((activity) => activity.name).join('、')}`)
  return lines.join('\n')
}

async function listReviews(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const ownerId = auth.identity.userId
  const sessions = await db.collection('live_sessions')
    .where({ ownerId })
    .orderBy('startedAt', 'desc')
    .limit(50)
    .get()

  return ok({
    sessions: sessions.data
      .filter((item) => item.status === 'ended' || item.status === 'reviewed')
      .map((item) => {
        const phases = Array.isArray((item.planSnapshot || {}).phases) ? item.planSnapshot.phases : []
        return {
        _id: item._id,
        name: (item.planSnapshot || {}).name || '培训活动',
        type: (item.planSnapshot || {}).type || '企业培训',
        status: item.status,
        endedAt: item.endedAt || 0,
        reviewedAt: item.reviewedAt || 0,
        participantCount: (item.planSnapshot || {}).participantCount || 0,
        customerName: (item.planSnapshot || {}).customerName || '',
        durationMinutes: (item.planSnapshot || {}).durationMinutes || 0,
        phaseCount: phases.length,
        flowText: phases.map((phase) => phase.name).join(' -> '),
        activitySummaryText: buildActivitySummaryText(phases)
      }
      })
  }, request.requestId)
}

async function getReviewDetail(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const ownerId = auth.identity.userId
  const session = await db.collection('live_sessions').doc(sessionId.value).get()
  if (!session.data || session.data.ownerId !== ownerId) {
    return fail(ErrorCode.NOT_FOUND, '场次不存在', request.requestId)
  }

  const reviews = await db.collection('reviews')
    .where({ sessionId: sessionId.value, ownerId })
    .orderBy('updatedAt', 'desc')
    .limit(1)
    .get()

  return ok({
    session: {
      _id: session.data._id,
      name: (session.data.planSnapshot || {}).name || '培训活动',
      type: (session.data.planSnapshot || {}).type || '企业培训',
      status: session.data.status,
      endedAt: session.data.endedAt || 0,
      reviewedAt: session.data.reviewedAt || 0,
      activitySummaryText: buildActivitySummaryText((session.data.planSnapshot || {}).phases),
      phaseActivities: buildPhaseActivities((session.data.planSnapshot || {}).phases)
    },
    review: reviews.data[0] || null
  }, request.requestId)
}

async function saveReview(request) {
  const auth = await requireIdentity(request.requestId)
  if (auth.error) return auth.error

  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const ownerId = auth.identity.userId
  const content = typeof request.payload.content === 'string' ? request.payload.content.trim() : ''
  if (content.length === 0) {
    return fail(ErrorCode.INVALID_ARGUMENT, '请填写复盘内容', request.requestId)
  }

  const session = await db.collection('live_sessions').doc(sessionId.value).get()
  if (!session.data || session.data.ownerId !== ownerId) {
    return fail(ErrorCode.NOT_FOUND, '场次不存在', request.requestId)
  }

  const result = await withIdempotency(
    request.requestId,
    'review.saveReview',
    ownerId,
    sessionId.value,
    async () => {
      const now = Date.now()
      // 复盘保存与场次状态更新是同一业务动作，事务能避免复盘已写入但场次仍待复盘。
      return db.runTransaction(async (transaction) => {
        const sessions = transaction.collection('live_sessions')
        const reviews = transaction.collection('reviews')
        const plans = transaction.collection('plans')
        const latest = await sessions.doc(sessionId.value).get()
        if (!latest.data || latest.data.ownerId !== ownerId) {
          return { errorCode: ErrorCode.NOT_FOUND, errorMessage: '场次不存在' }
        }
        if (latest.data.status === 'reviewed') {
          return { errorCode: ErrorCode.CONFLICT, errorMessage: '该场次已完成复盘' }
        }
        if (latest.data.status !== 'ended') {
          return { errorCode: ErrorCode.CONFLICT, errorMessage: '请先结束培训再复盘' }
        }
        const created = await reviews.add({
          data: {
            sessionId: sessionId.value,
            ownerId,
            content,
            createdAt: now,
            updatedAt: now
          }
        })
        await sessions.doc(sessionId.value).update({
          data: {
            status: 'reviewed',
            reviewedAt: now
          }
        })
        if (latest.data.planId) {
          const plan = await plans.doc(latest.data.planId).get()
          if (plan.data && plan.data.ownerId === ownerId) {
            await plans.doc(latest.data.planId).update({
              data: {
                status: 'reviewed',
                latestSessionId: sessionId.value,
                updatedAt: now
              }
            })
          }
        }
        return { reviewId: created._id }
      })
    }
  )

  if (result.errorCode) {
    return fail(result.errorCode, result.errorMessage, request.requestId)
  }

  return ok(result, request.requestId)
}

exports.main = async (event) => route(event, {
  listReviews,
  getReviewDetail,
  saveReview
})
