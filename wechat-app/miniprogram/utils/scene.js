function decodeSceneValue(scene) {
  if (!scene || typeof scene !== 'string') return {}

  const text = decodeURIComponent(scene)
  return text.split('&').reduce((acc, pair) => {
    const [rawKey, rawValue = ''] = pair.split('=')
    const key = rawKey ? rawKey.trim() : ''
    if (!key) return acc
    acc[key] = rawValue ? decodeURIComponent(rawValue) : ''
    return acc
  }, {})
}

function resolveSceneParams(query = {}, mapping = {}) {
  const rawScene = query.scene && typeof query.scene === 'string' && !query.scene.includes('=')
    ? decodeURIComponent(query.scene)
    : ''
  const scene = decodeSceneValue(query.scene || '')
  return Object.keys(mapping).reduce((acc, key) => {
    const candidates = Array.isArray(mapping[key]) ? mapping[key] : [mapping[key]]
    const foundKey = candidates.find((candidate) => {
      if (candidate === '*') return rawScene.trim()
      const value = query[candidate] || scene[candidate]
      return typeof value === 'string' && value.trim()
    })
    acc[key] = foundKey === '*'
      ? rawScene
      : (foundKey ? (query[foundKey] || scene[foundKey] || '') : '')
    return acc
  }, {})
}

module.exports = {
  decodeSceneValue,
  resolveSceneParams
}
