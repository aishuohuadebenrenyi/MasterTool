const test = require('node:test')
const assert = require('node:assert/strict')

const {
  decodeSceneValue,
  getRawSceneToken,
  resolveSceneParams
} = require('../../../../apps/wechat-cloudbase/miniprogram/utils/scene')

test('resolveSceneParams reads direct sessionId query', () => {
  const params = resolveSceneParams({ sessionId: 'session-1' }, {
    sessionId: ['sessionId', 'sid', '*']
  })

  assert.equal(params.sessionId, 'session-1')
})

test('resolveSceneParams reads raw wxacode scene as sessionId', () => {
  const params = resolveSceneParams({ scene: '98ea68476a3ffd49015990122cb6f93f' }, {
    sessionId: ['sessionId', 'sid', '*']
  })

  assert.equal(params.sessionId, '98ea68476a3ffd49015990122cb6f93f')
})

test('resolveSceneParams reads encoded key-value scene', () => {
  const params = resolveSceneParams({ scene: 'sessionId%3Dsession-2' }, {
    sessionId: ['sessionId', 'sid', '*']
  })

  assert.equal(params.sessionId, 'session-2')
})

test('resolveSceneParams reads sessionId from q url', () => {
  const params = resolveSceneParams({
    q: encodeURIComponent('https://example.com/pages/participant/checkin/index?sessionId=session-3')
  }, {
    sessionId: ['sessionId', 'sid', '*']
  })

  assert.equal(params.sessionId, 'session-3')
})

test('resolveSceneParams reads nested raw scene from q url', () => {
  const params = resolveSceneParams({
    q: encodeURIComponent('https://example.com/pages/participant/checkin/index?scene=session-4')
  }, {
    sessionId: ['sessionId', 'sid', '*']
  })

  assert.equal(params.sessionId, 'session-4')
})

test('resolveSceneParams reads sessionId from path and query fields', () => {
  const fromPath = resolveSceneParams({
    path: '/pages/participant/checkin/index?sessionId=session-5'
  }, {
    sessionId: ['sessionId', 'sid', 'session', 'id', '*']
  })
  const fromQuery = resolveSceneParams({
    query: 'id=session-6'
  }, {
    sessionId: ['sessionId', 'sid', 'session', 'id', '*']
  })

  assert.equal(fromPath.sessionId, 'session-5')
  assert.equal(fromQuery.sessionId, 'session-6')
})

test('resolveSceneParams reads nested scene from path field', () => {
  const params = resolveSceneParams({
    path: '/pages/participant/checkin/index?scene=session-7'
  }, {
    sessionId: ['sessionId', 'sid', 'session', 'id', '*']
  })

  assert.equal(params.sessionId, 'session-7')
})

test('resolveSceneParams reads short interaction scene keys', () => {
  const params = resolveSceneParams({ scene: 'k%3Dentry-1%26c%3DABC123' }, {
    entryKey: ['entryKey', 'k'],
    code: ['code', 'c']
  })

  assert.equal(params.entryKey, 'entry-1')
  assert.equal(params.code, 'ABC123')
})

test('decodeSceneValue and getRawSceneToken classify scene formats', () => {
  assert.deepEqual(decodeSceneValue('sid%3Dsession-8'), { sid: 'session-8' })
  assert.deepEqual(decodeSceneValue('/pages/participant/checkin/index?sid=session-9'), { sid: 'session-9' })
  assert.equal(getRawSceneToken('session-10'), 'session-10')
  assert.equal(getRawSceneToken('sid=session-11'), '')
})
