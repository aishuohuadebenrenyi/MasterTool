function normalizeTerms(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
}

function moderateText(value, termsValue = process.env.IMPROV_UGC_BLOCKED_TERMS) {
  const text = String(value || '').replace(/[\u0000-\u001F\u007F]/g, '').trim()
  if (!text) return { allowed: false, reason: '请输入提交内容', text: '' }
  if (text.length > 500) return { allowed: false, reason: '内容不能超过 500 字', text }
  const lowered = text.toLowerCase()
  const matched = normalizeTerms(termsValue).find((term) => lowered.includes(term))
  if (matched) return { allowed: false, reason: '内容包含不适合公开展示的信息', text }
  return { allowed: true, text }
}

module.exports = { moderateText, normalizeTerms }
