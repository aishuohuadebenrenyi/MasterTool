const test = require('node:test')
const assert = require('node:assert/strict')
const { moderateText, normalizeTerms } = require('../../../../backend/cloudbase/functions/participant-api/_content-safety')

test('moderateText removes control characters and accepts normal content', () => {
  assert.deepEqual(moderateText('  正常\u0000内容  ', ''), { allowed: true, text: '正常内容' })
})

test('moderateText rejects configured terms and oversized content', () => {
  assert.equal(moderateText('包含 BLOCKED 内容', 'blocked,other').allowed, false)
  assert.equal(moderateText('a'.repeat(501), '').reason, '内容不能超过 500 字')
  assert.deepEqual(normalizeTerms(' A, b ,,A '), ['a', 'b', 'a'])
})
