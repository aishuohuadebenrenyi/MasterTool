const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizeNotes, validatePhaseIndex } = require('../../../../backend/cloudbase/functions/live-api/_live-state')

test('validatePhaseIndex accepts only integer indexes inside the phase snapshot', () => {
  assert.deepEqual(validatePhaseIndex(1, 3), { valid: true, value: 1 })
  assert.equal(validatePhaseIndex(-1, 3).valid, false)
  assert.equal(validatePhaseIndex(3, 3).valid, false)
  assert.equal(validatePhaseIndex(1.5, 3).valid, false)
  assert.equal(validatePhaseIndex('1', 3).value, 1)
})

test('normalizeNotes exposes stable fields and caps the result at 200', () => {
  const source = Array.from({ length: 205 }, (_, index) => ({
    _id: `note-${index}`,
    phaseName: index === 0 ? '开场' : undefined,
    content: `笔记 ${index}`,
    createdAt: 1000 + index,
    ownerId: 'private-owner'
  }))
  const notes = normalizeNotes(source)
  assert.equal(notes.length, 200)
  assert.deepEqual(notes[0], { id: 'note-0', phaseName: '开场', content: '笔记 0', createdAt: 1000 })
  assert.equal(Object.hasOwn(notes[0], 'ownerId'), false)
})
