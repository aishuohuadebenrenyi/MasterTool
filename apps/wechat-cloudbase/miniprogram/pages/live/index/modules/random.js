const { callAction } = require('../../../../services/cloud')
const { showInfo } = require('../../../../utils/page')

const TOPICS = ['客户沟通', '临场反应', '团队协作', '情绪管理']

async function persistRandomState(page, partialState = {}) {
  const payload = {
    sessionId: page.data.sessionId,
    randomTab: partialState.randomTab !== undefined ? partialState.randomTab : page.data.randomTab,
    allowRepeatPick: partialState.allowRepeatPick !== undefined ? partialState.allowRepeatPick : page.data.allowRepeatPick,
    pickedIds: partialState.pickedIds !== undefined ? partialState.pickedIds : page.data.pickedIds,
    pickedName: partialState.pickedName !== undefined ? partialState.pickedName : page.data.pickedName,
    pickedParticipantId: partialState.pickedParticipantId !== undefined ? partialState.pickedParticipantId : '',
    pickHistory: partialState.pickHistory !== undefined ? partialState.pickHistory : page.data.pickHistory
  }
  const response = await callAction('live-api', 'saveRandomState', payload)
  if (response.code !== 0) {
    showInfo(response.message || '随机状态保存失败')
    return false
  }
  return true
}

async function setRandomTab(page, nextTab) {
  page.setData({ randomTab: nextTab, pickedName: '' })
  await persistRandomState(page, { randomTab: nextTab, pickedName: '' })
}

async function toggleRepeatPick(page) {
  const allowRepeatPick = !page.data.allowRepeatPick
  page.setData({ allowRepeatPick })
  await persistRandomState(page, { allowRepeatPick })
}

async function resetPickHistory(page) {
  page.setData({ pickedIds: [], pickedName: '', pickHistory: [] })
  await persistRandomState(page, { pickedIds: [], pickedName: '', pickHistory: [] })
}

async function pickParticipant(page) {
  if (page.data.randomTab === 'topic') {
    const pickedName = TOPICS[Math.floor(Math.random() * TOPICS.length)]
    const pickHistory = [{
      id: '',
      name: pickedName,
      type: 'topic',
      pickedAt: Date.now()
    }, ...page.data.pickHistory].slice(0, 20)
    page.setData({ pickedName, pickHistory })
    await persistRandomState(page, { pickedName, pickHistory, pickedParticipantId: '' })
    return
  }

  const pool = page.data.allowRepeatPick
    ? page.data.participants
    : page.data.participants.filter((item) => !page.data.pickedIds.includes(item._id))
  if (pool.length === 0) {
    showInfo('本轮已全部抽完')
    return
  }
  const picked = pool[Math.floor(Math.random() * pool.length)]
  const pickedIds = page.data.allowRepeatPick ? page.data.pickedIds : [...page.data.pickedIds, picked._id]
  const pickHistory = [{
    id: picked._id,
    name: picked.name,
    type: 'participant',
    pickedAt: Date.now()
  }, ...page.data.pickHistory].slice(0, 20)
  page.setData({
    pickedName: picked.name,
    pickedIds,
    pickHistory
  })
  await persistRandomState(page, {
    pickedName: picked.name,
    pickedIds,
    pickHistory,
    pickedParticipantId: picked._id
  })
}

module.exports = {
  persistRandomState,
  pickParticipant,
  resetPickHistory,
  setRandomTab,
  toggleRepeatPick
}
