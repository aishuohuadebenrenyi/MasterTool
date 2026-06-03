Component({
  options: {
    styleIsolation: 'shared',
    multipleSlots: true
  },
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    title: {
      type: String,
      value: ''
    },
    compact: {
      type: Boolean,
      value: false
    },
    maskClosable: {
      type: Boolean,
      value: true
    },
    sheetClass: {
      type: String,
      value: ''
    },
    bodyClass: {
      type: String,
      value: ''
    }
  },
  methods: {
    handleMaskTap() {
      if (!this.properties.maskClosable) return
      this.triggerEvent('close')
    },
    handleClose() {
      this.triggerEvent('close')
    },
    noop() {}
  }
})
