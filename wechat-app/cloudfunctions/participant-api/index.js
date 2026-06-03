const {
  ErrorCode,
  db,
  fail,
  getWxContext,
  ok,
  requiredText,
  route,
  withIdempotency
} = require('./_shared')

async function getSessionPublicInfo(request) {
  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const result = await db.collection('live_sessions').doc(sessionId.value).get()
  if (!result.data || result.data.status !== 'running') {
    return fail(ErrorCode.NOT_FOUND, '签到已关闭', request.requestId)
  }

  const snapshot = result.data.planSnapshot || {}
  return ok({
    sessionId: sessionId.value,
    title: snapshot.name || '培训活动',
    customerName: snapshot.customerName || '',
    status: result.data.status
  }, request.requestId)
}

async function checkin(request) {
  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  const name = requiredText(request.payload, 'name', '姓名')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)
  if (!name.valid) return fail(ErrorCode.INVALID_ARGUMENT, name.message, request.requestId)

  const context = getWxContext()
  const openid = context.OPENID
  if (!openid) {
    return fail(ErrorCode.UNAUTHENTICATED, '请在微信中完成签到', request.requestId)
  }

  const sessions = db.collection('live_sessions')
  const session = await sessions.doc(sessionId.value).get()
  if (!session.data || session.data.status !== 'running') {
    return fail(ErrorCode.CONFLICT, '签到已关闭', request.requestId)
  }

  const participants = db.collection('participants')
  const sameName = await participants.where({ sessionId: sessionId.value, name: name.value }).limit(1).get()
  if (sameName.data.length > 0) {
    return fail(ErrorCode.CONFLICT, '该姓名已签到', request.requestId)
  }

  const sameOpenid = await participants.where({ sessionId: sessionId.value, openid }).limit(1).get()
  if (sameOpenid.data.length > 0) {
    return fail(ErrorCode.CONFLICT, '你已签到', request.requestId)
  }

  const result = await withIdempotency(
    request.requestId,
    'participant.checkin',
    openid,
    sessionId.value,
    async () => {
      const created = await participants.add({
        data: {
          sessionId: sessionId.value,
          openid,
          name: name.value,
          checkedInAt: Date.now()
        }
      })
      return { participantId: created._id }
    }
  )

  return ok(result, request.requestId)
}

async function submitFeedback(request) {
  const sessionId = requiredText(request.payload, 'sessionId', '场次')
  if (!sessionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, sessionId.message, request.requestId)

  const context = getWxContext()
  const openid = context.OPENID
  if (!openid) {
    return fail(ErrorCode.UNAUTHENTICATED, '请在微信中提交反馈', request.requestId)
  }

  const rating = typeof request.payload.rating === 'number' ? request.payload.rating : 0
  const content = typeof request.payload.content === 'string' ? request.payload.content.trim() : ''
  if (rating <= 0 && content.length === 0) {
    return fail(ErrorCode.INVALID_ARGUMENT, '请填写反馈内容', request.requestId)
  }
  if (rating < 0 || rating > 5) {
    return fail(ErrorCode.INVALID_ARGUMENT, '评分范围为 1-5', request.requestId)
  }

  const session = await db.collection('live_sessions').doc(sessionId.value).get()
  if (!session.data || (session.data.status !== 'running' && session.data.status !== 'ended')) {
    return fail(ErrorCode.NOT_FOUND, '反馈已关闭', request.requestId)
  }

  const result = await withIdempotency(
    request.requestId,
    'participant.submitFeedback',
    openid,
    sessionId.value,
    async () => {
      const created = await db.collection('feedback').add({
        data: {
          sessionId: sessionId.value,
          openid,
          rating,
          content,
          createdAt: Date.now()
        }
      })
      return { feedbackId: created._id }
    }
  )

  return ok(result, request.requestId)
}

async function getInteractionPublicInfo(request) {
  const interactionId = requiredText(request.payload, 'interactionId', '互动')
  const code = requiredText(request.payload, 'code', '入口码')
  if (!interactionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, interactionId.message, request.requestId)
  if (!code.valid) return fail(ErrorCode.INVALID_ARGUMENT, code.message, request.requestId)

  const result = await db.collection('interactions').doc(interactionId.value).get()
  if (!result.data || result.data.joinCode !== code.value) {
    return fail(ErrorCode.NOT_FOUND, '互动入口不存在', request.requestId)
  }

  return ok({
    interaction: {
      _id: interactionId.value,
      type: result.data.type,
      title: result.data.title,
      options: result.data.options || [],
      status: result.data.status
    }
  }, request.requestId)
}

async function submitInteraction(request) {
  const interactionId = requiredText(request.payload, 'interactionId', '互动')
  const code = requiredText(request.payload, 'code', '入口码')
  if (!interactionId.valid) return fail(ErrorCode.INVALID_ARGUMENT, interactionId.message, request.requestId)
  if (!code.valid) return fail(ErrorCode.INVALID_ARGUMENT, code.message, request.requestId)

  const context = getWxContext()
  const openid = context.OPENID
  if (!openid) {
    return fail(ErrorCode.UNAUTHENTICATED, '请在微信中提交互动')
  }

  const interaction = await db.collection('interactions').doc(interactionId.value).get()
  if (!interaction.data || interaction.data.joinCode !== code.value || interaction.data.status !== 'open') {
    return fail(ErrorCode.CONFLICT, '互动已关闭', request.requestId)
  }

  const type = interaction.data.type
  const content = typeof request.payload.content === 'string' ? request.payload.content.trim() : ''
  const optionIndex = Number(request.payload.optionIndex)
  if (type === 'vote') {
    const options = interaction.data.options || []
    if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= options.length) {
      return fail(ErrorCode.INVALID_ARGUMENT, '请选择投票选项')
    }
  } else if (!content) {
    return fail(ErrorCode.INVALID_ARGUMENT, '请输入提交内容')
  }

  const result = await withIdempotency(
    request.requestId,
    'participant.submitInteraction',
    openid,
    interactionId.value,
    async () => {
      const created = await db.collection('interaction_submissions').add({
        data: {
          interactionId: interactionId.value,
          sessionId: interaction.data.sessionId,
          type,
          openid,
          name: typeof request.payload.name === 'string' ? request.payload.name.trim() : '',
          content,
          optionIndex: type === 'vote' ? optionIndex : -1,
          createdAt: Date.now()
        }
      })
      return { submissionId: created._id }
    }
  )

  return ok(result, request.requestId)
}

exports.main = async (event) => route(event, {
  getSessionPublicInfo,
  checkin,
  submitFeedback,
  getInteractionPublicInfo,
  submitInteraction
})
