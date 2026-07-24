const { callAction } = require('../../../services/cloud')
const { resolveSceneParams } = require('../../../utils/scene')
const { showInfo, showSuccess } = require('../../../utils/page')
const { goBackOrSwitchTab } = require('../../../utils/navigation')
const { getInputValue, withPending } = require('../../../utils/participant-entry')

Page({
  data: {
    sessionId: '',
    rating: 5,
    ratings: [1, 2, 3, 4, 5],
    content: '',
    submitting: false
  },

  onLoad(query) {
    const { sessionId } = resolveSceneParams(query, {
      sessionId: ['sessionId', 'sid', 'session', 'id', '*']
    })
    this.setData({ sessionId })
  },

  goBack() {
    goBackOrSwitchTab('/pages/home/index/index')
  },

  setRating(event) {
    this.setData({ rating: Number(event.currentTarget.dataset.rating) })
  },

  handleInput(event) {
    this.setData({ content: getInputValue(event) })
  },

  async submitFeedback() {
    await withPending(this, 'submitting', async () => {
      if (!this.data.sessionId) {
        showInfo('反馈入口无效，请联系培训师')
        return
      }
      if (!this.data.content.trim()) {
        showInfo('请填写反馈内容')
        return
      }
      const response = await callAction('participant-api', 'submitFeedback', {
        sessionId: this.data.sessionId,
        rating: this.data.rating,
        content: this.data.content.trim()
      })
      if (response.code === 0) {
        showSuccess('反馈已提交')
        this.setData({ content: '' })
        return
      }
      showInfo(response.message || '提交失败')
    })
  }
})
