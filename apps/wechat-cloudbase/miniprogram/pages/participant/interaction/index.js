const { callAction } = require('../../../services/cloud')
const { resolveSceneParams } = require('../../../utils/scene')
const { showInfo, showSuccess } = require('../../../utils/page')
const { goBackOrSwitchTab } = require('../../../utils/navigation')
const { buildPublicEntryState, createRequestState, getInputValue, withPending } = require('../../../utils/participant-entry')

Page({
  data: {
    interactionId: '',
    entryKey: '',
    code: '',
    loading: true,
    submitting: false,
    interaction: null,
    selectedOption: -1,
    content: '',
    name: '',
    requestState: createRequestState()
  },

  onLoad(query) {
    const params = resolveSceneParams(query, {
      interactionId: ['interactionId', 'iid'],
      entryKey: ['entryKey', 'k'],
      code: ['code', 'c']
    })
    this.setData({
      ...params,
      requestState: buildPublicEntryState({ loading: true })
    })
    this.loadInteraction()
  },

  async loadInteraction() {
    if ((!this.data.interactionId && !this.data.entryKey) || !this.data.code) {
      showInfo('互动入口无效，请联系培训师')
      this.setData({
        loading: false,
        requestState: buildPublicEntryState({
          error: '互动入口无效，请联系培训师',
          errorDesc: '请确认入口是否正确或联系培训师。'
        })
      })
      return
    }
    const response = await callAction('participant-api', 'getInteractionPublicInfo', {
      interactionId: this.data.interactionId,
      entryKey: this.data.entryKey,
      code: this.data.code
    })
    if (response.code !== 0 || !response.data) {
      showInfo(response.message || '互动加载失败')
      this.setData({
        loading: false,
        requestState: buildPublicEntryState({
          error: response.message || '互动加载失败',
          errorDesc: '请稍后重试或联系培训师。'
        })
      })
      return
    }
    this.setData({
      loading: false,
      interaction: response.data.interaction,
      requestState: buildPublicEntryState({ items: [response.data.interaction] })
    })
  },

  goBack() {
    goBackOrSwitchTab('/pages/home/index/index')
  },

  chooseOption(event) {
    this.setData({ selectedOption: Number(event.currentTarget.dataset.index) })
  },

  handleInput(event) {
    this.setData({ content: getInputValue(event) })
  },

  handleName(event) {
    this.setData({ name: getInputValue(event) })
  },

  async submit() {
    await withPending(this, 'submitting', async () => {
      if ((!this.data.interactionId && !this.data.entryKey) || !this.data.code) {
        showInfo('互动入口无效，请联系培训师')
        return
      }
      const interaction = this.data.interaction
      if (!interaction || interaction.status !== 'open') {
        showInfo('互动已关闭')
        return
      }
      if (interaction.type === 'vote' && this.data.selectedOption < 0) {
        showInfo('请选择一个选项')
        return
      }
      if (interaction.type !== 'vote' && !this.data.content.trim()) {
        showInfo('请输入内容')
        return
      }
      const response = await callAction('participant-api', 'submitInteraction', {
        interactionId: this.data.interactionId,
        entryKey: this.data.entryKey,
        code: this.data.code,
        optionIndex: this.data.selectedOption,
        content: this.data.content.trim(),
        name: this.data.name.trim()
      })
      if (response.code !== 0) {
        showInfo(response.message || '提交失败')
        return
      }
      showSuccess('提交成功')
      this.setData({ selectedOption: -1, content: '', name: '' })
    })
  }
})
