function validatePhaseIndex(value, phaseCount) {
  const index = Number(value)
  if (!Number.isInteger(index)) return { valid: false, message: '环节序号无效' }
  if (!Number.isInteger(phaseCount) || phaseCount <= 0 || index < 0 || index >= phaseCount) {
    return { valid: false, message: '环节序号超出范围' }
  }
  return { valid: true, value: index }
}

function normalizeNotes(items) {
  if (!Array.isArray(items)) return []
  return items.slice(0, 200).map((item) => ({
    id: typeof item._id === 'string' ? item._id : '',
    phaseName: typeof item.phaseName === 'string' ? item.phaseName : '',
    content: typeof item.content === 'string' ? item.content : '',
    createdAt: Number(item.createdAt) || 0
  }))
}

module.exports = { normalizeNotes, validatePhaseIndex }
