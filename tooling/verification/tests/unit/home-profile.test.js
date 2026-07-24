const test = require('node:test')
const assert = require('node:assert/strict')

const homePagePath = '../../../../apps/wechat-cloudbase/miniprogram/pages/home/index/index'

function loadHomeTestables() {
  global.Page = () => {}
  delete require.cache[require.resolve(homePagePath)]
  const home = require(homePagePath)
  delete global.Page
  return home.__testables
}

test('buildHomeProfile uses the profile display name for avatar and greeting', () => {
  const { buildHomeProfile } = loadHomeTestables()
  const profile = buildHomeProfile({ displayName: '李' }, new Date('2026-06-26T19:43:00'))

  assert.equal(profile.displayName, '李')
  assert.equal(profile.avatarText, '李')
  assert.equal(profile.greetingText, '李，晚上好')
})

test('buildHomeProfile falls back to default display name when profile is missing', () => {
  const { buildHomeProfile } = loadHomeTestables()
  const profile = buildHomeProfile(null, new Date('2026-06-26T08:00:00'))

  assert.equal(profile.displayName, '张老师')
  assert.equal(profile.avatarText, '张')
  assert.equal(profile.greetingText, '张老师，早上好')
})

test('greetingByHour returns the expected day parts', () => {
  const { greetingByHour } = loadHomeTestables()

  assert.equal(greetingByHour(9), '早上好')
  assert.equal(greetingByHour(14), '下午好')
  assert.equal(greetingByHour(20), '晚上好')
})

test('profileFromStorageValue accepts cached profile object and legacy string', () => {
  const { profileFromStorageValue } = loadHomeTestables()

  assert.deepEqual(profileFromStorageValue({ displayName: '李可乐' }), { displayName: '李可乐' })
  assert.deepEqual(profileFromStorageValue('李可乐'), { displayName: '李可乐' })
  assert.equal(profileFromStorageValue({ displayName: 123 }), null)
})
