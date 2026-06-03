const { getMiniProgramEnvVersion } = require('../config/env')

function createRequestId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

const DEFAULT_TIMEOUT_MS = 8000

function classifyError(error) {
  const message = error && error.errMsg ? error.errMsg : ''
  if (error && error.code === 'CLIENT_TIMEOUT') return 'timeout'
  if (message.includes('timeout')) return 'timeout'
  if (message.includes('auth') || message.includes('permission') || message.includes('unauthorized')) return 'permission'
  if (message.includes('network') || message.includes('fail')) return 'network'
  return 'unknown'
}

function normalizeError(error, context) {
  const detail = context ? `${context.functionName}.${context.action}` : 'cloud.callFunction'
  const type = classifyError(error)
  console.warn(`[cloud] ${detail} failed`, error)
  if (type === 'permission') {
    return {
      type,
      message: '当前账号暂无操作权限'
    }
  }
  if (type === 'timeout' || type === 'network') {
    return {
      type,
      message: '网络开小差，请稍后再试'
    }
  }
  return {
    type,
    message: '服务暂不可用，请稍后再试'
  }
}

function callFunctionWithTimeout(options, timeoutMs = DEFAULT_TIMEOUT_MS) {
  let timer = null
  const request = wx.cloud.callFunction(options)

  // Promise.race 超时后，原始云调用仍可能稍后 reject；这里提前挂 catch，
  // 避免开发者工具额外抛出未处理 Promise，排障时只保留有上下文的日志。
  request.catch(() => {})

  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject({
        code: 'CLIENT_TIMEOUT',
        errMsg: `cloud.callFunction timeout after ${timeoutMs}ms`
      })
    }, timeoutMs)
  })

  return Promise.race([request, timeout]).finally(() => {
    if (timer) {
      clearTimeout(timer)
    }
  })
}

async function callAction(functionName, action, payload = {}, options = {}) {
  if (!wx.cloud || !wx.cloud.callFunction) {
    return {
      code: -1,
      message: '云开发未初始化'
    }
  }

  try {
    const response = await callFunctionWithTimeout({
      name: functionName,
      data: {
        action,
        requestId: createRequestId(action),
        payload
      }
    }, options.timeoutMs)

    if (!response || !response.result) {
      return {
        code: -1,
        message: '服务返回为空'
      }
    }

    return response.result
  } catch (error) {
    const normalized = normalizeError(error, { functionName, action })
    return {
      code: -1,
      type: normalized.type,
      message: normalized.message
    }
  }
}

module.exports = {
  callAction,
  getMiniProgramEnvVersion
}
