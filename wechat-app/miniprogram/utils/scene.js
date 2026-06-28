function decodeSceneText(value) {
  if (!value || typeof value !== 'string') return ''
  let text = value
  for (let index = 0; index < 2; index += 1) {
    try {
      const decoded = decodeURIComponent(text)
      if (decoded === text) break
      text = decoded
    } catch {
      break
    }
  }
  return text.trim()
}

function decodeSceneValue(scene) {
  if (!scene || typeof scene !== 'string') return {}

  const text = decodeSceneText(scene)
  const queryText = getQueryText(text)
  return queryText.split('&').reduce((acc, pair) => {
    const [rawKey, ...rawValueParts] = pair.split('=')
    const rawValue = rawValueParts.join('=')
    const key = rawKey ? rawKey.trim() : ''
    if (!key) return acc
    acc[decodeSceneText(key)] = rawValue ? decodeSceneText(rawValue) : ''
    return acc
  }, {})
}

function getQueryText(text) {
  const hashIndex = text.indexOf('#')
  const withoutHash = hashIndex >= 0 ? text.slice(0, hashIndex) : text
  const queryIndex = withoutHash.indexOf('?')
  if (queryIndex >= 0) return withoutHash.slice(queryIndex + 1)
  return withoutHash.startsWith('?') ? withoutHash.slice(1) : withoutHash
}

function getRawSceneToken(value) {
  const text = decodeSceneText(value)
  if (!text || text.includes('?') || text.includes('=') || text.includes('&') || text.includes('/')) {
    return ''
  }
  return text
}

function resolveSceneParams(query = {}, mapping = {}) {
  const scene = decodeSceneValue(query.scene || '')
  const q = decodeSceneValue(query.q || '')
  const queryText = decodeSceneValue(query.query || '')
  const path = decodeSceneValue(query.path || '')
  const url = decodeSceneValue(query.url || '')
  const nestedScene = decodeSceneValue(scene.scene || q.scene || queryText.scene || path.scene || url.scene || '')
  const params = {
    ...nestedScene,
    ...url,
    ...path,
    ...queryText,
    ...q,
    ...scene
  }
  const rawScene = [
    query.scene,
    scene.scene,
    q.scene,
    queryText.scene,
    path.scene,
    url.scene
  ].map(getRawSceneToken).find(Boolean) || ''

  return Object.keys(mapping).reduce((acc, key) => {
    const candidates = Array.isArray(mapping[key]) ? mapping[key] : [mapping[key]]
    const foundKey = candidates.find((candidate) => {
      if (candidate === '*') return rawScene.trim()
      const value = query[candidate] || params[candidate]
      return typeof value === 'string' && value.trim()
    })
    acc[key] = foundKey === '*'
      ? rawScene
      : (foundKey ? (query[foundKey] || params[foundKey] || '') : '')
    return acc
  }, {})
}

module.exports = {
  decodeSceneValue,
  getRawSceneToken,
  resolveSceneParams
}
