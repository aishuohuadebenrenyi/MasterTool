const cloud = require('wx-server-sdk')
const crypto = require('crypto')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()
const ACCESS_TOKEN_TTL_SECONDS = 15 * 60
const REFRESH_TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000
const AUTH_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const AUTH_RATE_LIMIT_MAX = 10

function config(name) {
  const value = process.env[name]
  if (!value) throw new Error(`missing ${name}`)
  return value
}

function json(value, statusCode = 200) {
  return { statusCode, headers: { 'content-type': 'application/json' }, body: JSON.stringify(value) }
}

function fail(message, requestId = '', code = 40001, statusCode = 400) {
  return json({ code, message, requestId }, statusCode)
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url')
}

function timingSafeEqual(left, right) {
  const a = Buffer.from(left)
  const b = Buffer.from(right)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

function hashToken(value) {
  return crypto.createHash('sha256').update(String(value)).digest('base64url')
}

function issueAccessToken(accountId) {
  const issuedAt = Date.now()
  const payload = Buffer.from(JSON.stringify({ sub: accountId, type: 'access', iat: issuedAt, exp: Math.floor(issuedAt / 1000) + ACCESS_TOKEN_TTL_SECONDS })).toString('base64url')
  return `${payload}.${sign(payload, config('IMPROV_IOS_TOKEN_SECRET'))}`
}

function verifyToken(token) {
  const [payload, signature] = String(token || '').split('.')
  if (!payload || !signature || !timingSafeEqual(signature, sign(payload, config('IMPROV_IOS_TOKEN_SECRET')))) return null
  try {
    const value = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    return value.type === 'access' && value.exp > Math.floor(Date.now() / 1000) && typeof value.sub === 'string' ? value : null
  } catch { return null }
}

async function isAccessTokenActive(token, payload) {
  const revoked = await db.collection('ios_revoked_access_tokens').where({ tokenHash: hashToken(token) }).limit(1).get()
  if (revoked.data.length) return false
  const account = await db.collection('ios_accounts').doc(payload.sub).get()
  return !!account.data && Number(account.data.credentialsValidAfter || 0) <= payload.iat
}

async function enforceAuthRateLimit(key) {
  const now = Date.now()
  const bucket = Math.floor(now / AUTH_RATE_LIMIT_WINDOW_MS)
  const id = hashToken(`${key}:${bucket}`)
  const collection = db.collection('ios_auth_rate_limits')
  const existed = await collection.doc(id).get()
  const count = Number(existed.data && existed.data.count) || 0
  if (count >= AUTH_RATE_LIMIT_MAX) throw new Error('请求过于频繁，请稍后再试')
  if (existed.data) {
    await collection.doc(id).update({ data: { count: db.command.inc(1), updatedAt: now } })
  } else {
    await collection.doc(id).set({ data: { count: 1, expiresAt: now + AUTH_RATE_LIMIT_WINDOW_MS * 2, createdAt: now, updatedAt: now } })
  }
}

async function issueCredentials(accountId) {
  const refreshToken = crypto.randomBytes(48).toString('base64url')
  const now = Date.now()
  await db.collection('ios_refresh_tokens').add({
    data: {
      accountId,
      tokenHash: hashToken(refreshToken),
      expiresAt: now + REFRESH_TOKEN_TTL_MS,
      revokedAt: 0,
      createdAt: now
    }
  })
  return { accountId, accessToken: issueAccessToken(accountId), refreshToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS }
}

async function queueEmailToken(accountId, email, type) {
  const token = crypto.randomBytes(32).toString('base64url')
  const now = Date.now()
  const expiresAt = now + 30 * 60 * 1000
  await db.collection('ios_email_tokens').add({ data: { accountId, email, type, tokenHash: hashToken(token), expiresAt, consumedAt: 0, createdAt: now } })
  await db.collection('ios_email_outbox').add({
    data: {
      type,
      to: email,
      token,
      status: 'pending',
      createdAt: now,
      expiresAt
    }
  })
  return { accepted: true }
}

async function requestEmailVerification(accountId) {
  const account = await db.collection('ios_accounts').doc(accountId).get()
  if (!account.data || !account.data.email) throw new Error('账户不存在')
  if (account.data.emailVerifiedAt) return { accepted: true, alreadyVerified: true }
  await enforceAuthRateLimit(`verify:${account.data.email}`)
  return queueEmailToken(accountId, account.data.email, 'verify-email')
}

async function verifyEmail(payload) {
  const token = String(payload.token || '')
  const result = await db.collection('ios_email_tokens').where({ type: 'verify-email', tokenHash: hashToken(token), consumedAt: 0 }).limit(1).get()
  const value = result.data[0]
  if (!value || value.expiresAt <= Date.now()) throw new Error('验证链接无效或已过期')
  await db.collection('ios_email_tokens').doc(value._id).update({ data: { consumedAt: Date.now() } })
  await db.collection('ios_accounts').doc(value.accountId).update({ data: { emailVerifiedAt: Date.now(), updatedAt: Date.now() } })
  return { verified: true }
}

async function requestPasswordReset(payload) {
  const email = String(payload.email || '').trim().toLowerCase()
  await enforceAuthRateLimit(`reset:${email}`)
  const result = await db.collection('ios_accounts').where({ email }).limit(1).get()
  if (result.data[0]) await queueEmailToken(result.data[0]._id, email, 'reset-password')
  return { accepted: true }
}

async function resetPassword(payload) {
  const token = String(payload.token || '')
  const password = String(payload.password || '')
  if (password.length < 8) throw new Error('密码至少需要 8 位')
  const result = await db.collection('ios_email_tokens').where({ type: 'reset-password', tokenHash: hashToken(token), consumedAt: 0 }).limit(1).get()
  const value = result.data[0]
  if (!value || value.expiresAt <= Date.now()) throw new Error('重置链接无效或已过期')
  const salt = crypto.randomBytes(16).toString('base64url')
  const passwordHash = crypto.scryptSync(password, salt, 32).toString('base64url')
  await db.collection('ios_email_tokens').doc(value._id).update({ data: { consumedAt: Date.now() } })
  const credentialsValidAfter = Date.now()
  await db.collection('ios_accounts').doc(value.accountId).update({ data: { salt, passwordHash, credentialsValidAfter, updatedAt: credentialsValidAfter } })
  const activeTokens = await db.collection('ios_refresh_tokens').where({ accountId: value.accountId, revokedAt: 0 }).limit(100).get()
  await Promise.all(activeTokens.data.map((item) => db.collection('ios_refresh_tokens').doc(item._id).update({ data: { revokedAt: Date.now(), revokeReason: 'password-reset' } })))
  return { reset: true }
}

async function refreshCredentials(payload) {
  const refreshToken = String(payload.refreshToken || '')
  if (!refreshToken) throw new Error('刷新令牌无效')
  const tokens = db.collection('ios_refresh_tokens')
  const result = await tokens.where({ tokenHash: hashToken(refreshToken), revokedAt: 0 }).limit(1).get()
  const current = result.data[0]
  if (!current || current.expiresAt <= Date.now()) throw new Error('登录已失效，请重新登录')
  await tokens.doc(current._id).update({ data: { revokedAt: Date.now(), revokeReason: 'rotated' } })
  return issueCredentials(current.accountId)
}

async function revokeCredentials(accountId, payload, accessToken, accessPayload) {
  const refreshToken = String(payload.refreshToken || '')
  if (refreshToken) {
    const result = await db.collection('ios_refresh_tokens').where({ accountId, tokenHash: hashToken(refreshToken), revokedAt: 0 }).limit(1).get()
    if (result.data[0]) await db.collection('ios_refresh_tokens').doc(result.data[0]._id).update({ data: { revokedAt: Date.now(), revokeReason: 'logout' } })
  }
  await db.collection('ios_revoked_access_tokens').add({ data: { accountId, tokenHash: hashToken(accessToken), expiresAt: accessPayload.exp * 1000, createdAt: Date.now() } })
  return { revoked: true }
}

async function resolveAccountUser(accountId) {
  const account = await db.collection('ios_accounts').doc(accountId).get()
  if (!account.data) throw new Error('账户不存在')
  if (account.data.linkedUserId) return { account: account.data, userId: account.data.linkedUserId }
  const users = await db.collection('users').where({ iosAccountId: accountId }).limit(1).get()
  return { account: account.data, userId: users.data[0] && users.data[0]._id }
}

async function queryAll(collection, query) {
  const values = []
  const pageSize = 100
  while (true) {
    const result = await db.collection(collection).where(query).skip(values.length).limit(pageSize).get()
    values.push(...result.data)
    if (result.data.length < pageSize) return values
  }
}

async function collectAccountData(accountId) {
  const resolved = await resolveAccountUser(accountId)
  const ownerId = resolved.userId
  const ownerCollections = ['trainer_profiles', 'plans', 'activities', 'templates', 'live_sessions', 'reviews', 'support_feedback']
  const values = { account: { email: resolved.account.email || '', provider: resolved.account.provider || 'email', createdAt: resolved.account.createdAt || 0 } }
  if (!ownerId) return values
  for (const name of ownerCollections) {
    const field = name === 'trainer_profiles' ? 'userId' : 'ownerId'
    values[name] = await queryAll(name, { [field]: ownerId })
  }
  for (const name of ['ugc_reports', 'ugc_blocks']) {
    const field = name === 'ugc_reports' ? 'reporterId' : 'ownerId'
    values[name] = await queryAll(name, { [field]: ownerId })
  }
  const sessionIds = (values.live_sessions || []).map((item) => item._id)
  const interactionIds = []
  values.participants = []
  values.feedback = []
  values.interactions = []
  values.session_notes = []
  for (const sessionId of sessionIds) {
    for (const name of ['participants', 'feedback', 'interactions', 'session_notes']) {
      const result = await queryAll(name, { sessionId })
      values[name].push(...result)
      if (name === 'interactions') interactionIds.push(...result.map((item) => item._id))
    }
  }
  values.interaction_submissions = []
  for (const interactionId of interactionIds) {
    values.interaction_submissions.push(...await queryAll('interaction_submissions', { interactionId }))
  }
  return values
}

async function exportAccountData(accountId) {
  const exportedAt = Date.now()
  const data = await collectAccountData(accountId)
  const cloudPath = `account-exports/${hashToken(accountId)}/${exportedAt}.json`
  const uploaded = await cloud.uploadFile({ cloudPath, fileContent: Buffer.from(JSON.stringify({ exportedAt, data }, null, 2)) })
  const links = await cloud.getTempFileURL({ fileList: [uploaded.fileID] })
  const downloadURL = links.fileList && links.fileList[0] && links.fileList[0].tempFileURL
  if (!downloadURL) throw new Error('无法生成导出文件')
  return { downloadURL, expiresAt: exportedAt + 2 * 60 * 60 * 1000 }
}

async function deleteByQuery(collection, query) {
  await db.collection(collection).where(query).remove()
}

async function deleteAccount(accountId, payload) {
  if (payload.confirmation !== 'DELETE') throw new Error('请确认永久删除账户')
  const snapshot = await collectAccountData(accountId)
  const resolved = await resolveAccountUser(accountId)
  const ownerId = resolved.userId
  const sessions = snapshot.live_sessions || []
  const interactions = snapshot.interactions || []
  for (const interaction of interactions) await deleteByQuery('interaction_submissions', { interactionId: interaction._id })
  for (const session of sessions) {
    for (const name of ['participants', 'feedback', 'interactions', 'session_notes']) await deleteByQuery(name, { sessionId: session._id })
  }
  if (ownerId) {
    await deleteByQuery('trainer_profiles', { userId: ownerId })
    for (const name of ['plans', 'activities', 'templates', 'live_sessions', 'reviews', 'support_feedback']) await deleteByQuery(name, { ownerId })
    await deleteByQuery('ugc_reports', { reporterId: ownerId })
    await deleteByQuery('ugc_blocks', { ownerId })
    await deleteByQuery('operation_logs', { actorId: ownerId })
    await db.collection('users').doc(ownerId).remove()
  }
  await deleteByQuery('ios_refresh_tokens', { accountId })
  await deleteByQuery('ios_revoked_access_tokens', { accountId })
  await deleteByQuery('ios_email_tokens', { accountId })
  await deleteByQuery('ios_email_outbox', { to: resolved.account.email })
  await deleteByQuery('ios_account_links', { accountId })
  await db.collection('ios_accounts').doc(accountId).remove()
  await db.collection('account_deletion_audit').add({ data: { accountHash: hashToken(accountId), deletedAt: Date.now() } })
  return { deleted: true }
}

function parse(event) {
  const headers = event.headers || {}
  const authorization = headers.authorization || headers.Authorization || ''
  const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || event)
  return { body, token: authorization.replace(/^Bearer\s+/i, '') }
}

async function registerEmail(payload) {
  const email = String(payload.email || '').trim().toLowerCase()
  const password = String(payload.password || '')
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) throw new Error('请使用有效邮箱和至少 8 位密码')
  await enforceAuthRateLimit(`register:${email}`)
  const accounts = db.collection('ios_accounts')
  const existed = await accounts.where({ email }).limit(1).get()
  if (existed.data.length) throw new Error('该邮箱已注册')
  const salt = crypto.randomBytes(16).toString('base64url')
  const passwordHash = crypto.scryptSync(password, salt, 32).toString('base64url')
  const createdAt = Date.now()
  const created = await accounts.add({ data: { email, salt, passwordHash, provider: 'email', credentialsValidAfter: createdAt, createdAt, updatedAt: createdAt } })
  await queueEmailToken(created._id, email, 'verify-email')
  return issueCredentials(created._id)
}

async function loginEmail(payload) {
  const email = String(payload.email || '').trim().toLowerCase()
  await enforceAuthRateLimit(`login:${email}`)
  const account = await db.collection('ios_accounts').where({ email }).limit(1).get()
  const value = account.data[0]
  if (!value || !timingSafeEqual(value.passwordHash, crypto.scryptSync(String(payload.password || ''), value.salt, 32).toString('base64url'))) throw new Error('邮箱或密码错误')
  return issueCredentials(value._id)
}

async function bindWechatAccount(accountId, payload) {
  const token = String(payload.transferToken || '').trim()
  if (!token) throw new Error('请输入一次性绑定码')
  const links = db.collection('ios_account_links')
  const result = await links.where({ token, consumedAt: 0, expiresAt: db.command.gt(Date.now()) }).limit(1).get()
  const link = result.data[0]
  if (!link || !link.userId) throw new Error('绑定码无效或已过期')
  await db.runTransaction(async transaction => {
    await transaction.collection('users').doc(link.userId).update({ data: { iosAccountId: accountId, updatedAt: Date.now() } })
    await transaction.collection('ios_accounts').doc(accountId).update({ data: { linkedUserId: link.userId, updatedAt: Date.now() } })
    await transaction.collection('ios_account_links').doc(link._id).update({ data: { consumedAt: Date.now(), accountId } })
  })
  return { linked: true }
}

function identityAssertion(accountId) {
  const issuedAt = Date.now()
  const value = `${accountId}:${issuedAt}`
  return { accountId, issuedAt, signature: sign(value, config('IMPROV_IOS_ASSERTION_SECRET')) }
}

function resolveFunction(action) {
  const [scope, name] = String(action || '').split('.', 2)
  const map = { trainer: 'trainer-api', live: 'live-api', review: 'review-api', participant: 'participant-api' }
  return map[scope] && name ? { name: map[scope], action: name } : null
}

exports.main = async event => {
  let request
  try { request = parse(event) } catch { return fail('请求格式错误') }
  const { body } = request
  const requestId = typeof body.requestId === 'string' ? body.requestId : ''
  try {
    if (body.action === 'auth.registerEmail') return json({ code: 0, message: 'success', data: await registerEmail(body.payload || {}), requestId })
    if (body.action === 'auth.loginEmail') return json({ code: 0, message: 'success', data: await loginEmail(body.payload || {}), requestId })
    if (body.action === 'auth.refresh') return json({ code: 0, message: 'success', data: await refreshCredentials(body.payload || {}), requestId })
    if (body.action === 'auth.verifyEmail') return json({ code: 0, message: 'success', data: await verifyEmail(body.payload || {}), requestId })
    if (body.action === 'auth.requestPasswordReset') return json({ code: 0, message: 'success', data: await requestPasswordReset(body.payload || {}), requestId })
    if (body.action === 'auth.resetPassword') return json({ code: 0, message: 'success', data: await resetPassword(body.payload || {}), requestId })
    const token = verifyToken(request.token)
    if (!token || !(await isAccessTokenActive(request.token, token))) return fail('登录已失效，请重新登录', requestId, 40101, 401)
    if (body.action === 'auth.logout') return json({ code: 0, message: 'success', data: await revokeCredentials(token.sub, body.payload || {}, request.token, token), requestId })
    if (body.action === 'auth.requestEmailVerification') return json({ code: 0, message: 'success', data: await requestEmailVerification(token.sub), requestId })
    if (body.action === 'auth.exportAccountData') return json({ code: 0, message: 'success', data: await exportAccountData(token.sub), requestId })
    if (body.action === 'auth.deleteAccount') return json({ code: 0, message: 'success', data: await deleteAccount(token.sub, body.payload || {}), requestId })
    if (body.action === 'auth.bindWechatAccount') return json({ code: 0, message: 'success', data: await bindWechatAccount(token.sub, body.payload || {}), requestId })
    const target = resolveFunction(body.action)
    if (!target) return fail('未知操作', requestId)
    const response = await cloud.callFunction({ name: target.name, data: { action: target.action, requestId, payload: body.payload || {}, _iosIdentity: identityAssertion(token.sub) } })
    return json(response.result || { code: 50001, message: '服务返回为空', requestId }, (response.result || {}).code === 0 ? 200 : 400)
  } catch (error) {
    console.error('[ios-api]', body.action, error)
    return fail('服务暂不可用，请稍后重试', requestId, 50001, 500)
  }
}
