Component({
  options: {
    styleIsolation: 'shared',
    multipleSlots: true
  },
  properties: {
    requestState: {
      type: Object,
      value: null
    },
    loadingText: {
      type: String,
      value: '加载中...'
    },
    retryText: {
      type: String,
      value: '重试'
    }
  },
  methods: {
    handleRetry() {
      this.triggerEvent('retry')
    }
  }
})
