Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    value: {
      type: String,
      value: ''
    },
    placeholder: {
      type: String,
      value: '请输入关键词'
    },
    wrapClass: {
      type: String,
      value: ''
    },
    inputClass: {
      type: String,
      value: ''
    }
  },
  methods: {
    handleInput(event) {
      this.triggerEvent('input', event.detail)
    },
    handleConfirm(event) {
      this.triggerEvent('confirm', event.detail)
    }
  }
})
