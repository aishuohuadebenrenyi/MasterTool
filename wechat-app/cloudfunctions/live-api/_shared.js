const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const command = db.command

function getWxContext() {
  return cloud.getWXContext()
}

async function getCurrentIdentity() {
  const context = getWxContext()
  const openid = context.OPENID
  const unionid = context.UNIONID

  if (!openid) {
    return {
      authenticated: false
    }
  }

  const now = Date.now()
  const users = db.collection('users')
  const existed = await users.where({ openid }).limit(1).get()

  if (existed.data.length > 0) {
    const user = existed.data[0]
    return {
      authenticated: true,
      userId: user._id,
      openid,
      unionid
    }
  }

  const created = await users.add({
    data: {
      openid,
      unionid,
      createdAt: now,
      updatedAt: now
    }
  })

  return {
    authenticated: true,
    userId: created._id,
    openid,
    unionid
  }
}

async function withIdempotency(requestId, action, actorId, targetId, run) {
  if (!requestId) {
    return run()
  }

  const logs = db.collection('operation_logs')
  const existed = await logs.where({ requestId, actorId, action }).limit(1).get()
  if (existed.data.length > 0) {
    return existed.data[0].result
  }

  const result = await run()
  await logs.add({
    data: {
      requestId,
      action,
      actorId,
      targetId: targetId || '',
      result,
      createdAt: Date.now()
    }
  })
  return result
}

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseEvent(event) {
  const source = isRecord(event) ? event : {}
  const action = typeof source.action === 'string' ? source.action : ''
  const requestId = typeof source.requestId === 'string' ? source.requestId : ''
  const payload = isRecord(source.payload) ? source.payload : {}

  return {
    action,
    requestId,
    payload
  }
}

function requiredText(payload, key, label) {
  const value = payload[key]
  if (typeof value !== 'string' || value.trim().length === 0) {
    return {
      valid: false,
      message: `请输入${label}`
    }
  }
  return {
    valid: true,
    value: value.trim()
  }
}

const ErrorCode = {
  SUCCESS: 0,
  INVALID_ARGUMENT: 40001,
  UNAUTHENTICATED: 40101,
  FORBIDDEN: 40301,
  NOT_FOUND: 40401,
  CONFLICT: 40901,
  INTERNAL: 50001
}

const ErrorMessage = {
  [ErrorCode.SUCCESS]: 'success',
  [ErrorCode.INVALID_ARGUMENT]: '参数不完整',
  [ErrorCode.UNAUTHENTICATED]: '请先完成身份确认',
  [ErrorCode.FORBIDDEN]: '无权访问该数据',
  [ErrorCode.NOT_FOUND]: '数据不存在',
  [ErrorCode.CONFLICT]: '当前状态已变化，请刷新后重试',
  [ErrorCode.INTERNAL]: '服务暂时不可用，请稍后重试'
}

function ok(data, requestId) {
  return {
    code: ErrorCode.SUCCESS,
    message: ErrorMessage[ErrorCode.SUCCESS],
    data,
    requestId
  }
}

function fail(code, message, requestId) {
  return {
    code,
    message: message || ErrorMessage[code] || ErrorMessage[ErrorCode.INTERNAL],
    requestId
  }
}

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

async function generateMiniCode({ page, scene, envVersion = 'release', cloudPath }) {
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

async function generateUrlLink({ path, query, envVersion = 'release' }) {
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

async function route(event, handlers) {
  const request = parseEvent(event)
  const handler = handlers[request.action]

  if (!request.action || typeof handler !== 'function') {
    return fail(ErrorCode.INVALID_ARGUMENT, '未知操作', request.requestId)
  }

  try {
    return await handler(request)
  } catch (error) {
    console.error('[cloudfunction:error]', request.action, error)
    return fail(ErrorCode.INTERNAL, undefined, request.requestId)
  }
}

module.exports = {
  ErrorCode,
  cloud,
  command,
  db,
  fail,
  generateMiniCode,
  generateUrlLink,
  getCurrentIdentity,
  getWxContext,
  isRecord,
  ok,
  parseEvent,
  requiredText,
  route,
  withIdempotency
}
