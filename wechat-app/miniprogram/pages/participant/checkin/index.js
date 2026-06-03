const { callAction } = require('../../../services/cloud')
const { resolveSceneParams } = require('../../../utils/scene')
const { showInfo, showSuccess } = require('../../../utils/page')
const { goBackOrSwitchTab } = require('../../../utils/navigation')
const { getInputValue, withPending } = require('../../../utils/participant-entry')

Page({
  data: {
    sessionId: '',
    session: null,
    name: '',
    checkedNames: [],
    submitting: false
  },

  onLoad(query) {
    const { sessionId } = resolveSceneParams(query, {
      sessionId: ['sessionId', 'sid', '*']
    })
    this.setData({ sessionId })
    this.loadSession()
  },

  goBack() {
    goBackOrSwitchTab('/pages/home/index/index')
  },

  async loadSession() {
    if (!this.data.sessionId) {
      this.setData({
        session: {
          title: '参与者签到',
          customerName: '请输入姓名完成签到'
        }
      })
      return
    }

    const response = await callAction('participant-api', 'getSessionPublicInfo', {
      sessionId: this.data.sessionId
    })
    if (response.code === 0 && response.data) {
      this.setData({ session: response.data })
      return
    }

    this.setData({
      session: {
        title: '参与者签到',
        customerName: '请联系培训师重新获取签到码'
      }
    })
  },

  handleNameInput(event) {
    this.setData({ name: getInputValue(event) })
  },

  async submitCheckin() {
    await withPending(this, 'submitting', async () => {
      if (!this.data.sessionId) {
        showInfo('签到入口无效，请联系培训师')
        return
      }
      const name = this.data.name.trim()
      if (!name) {
        showInfo('请填写姓名')
        return
      }
      if (this.data.checkedNames.includes(name)) {
        showInfo('该姓名已签到', 2400)
        return
      }

      const response = await callAction('participant-api', 'checkin', {
        sessionId: this.data.sessionId,
        name
      })
      if (response.code === 0) {
        this.setData({
          name: '',
          checkedNames: [name, ...this.data.checkedNames]
        })
        showSuccess('签到成功')
        return
      }
      showInfo(response.message || '签到失败')
    })
  }
})
