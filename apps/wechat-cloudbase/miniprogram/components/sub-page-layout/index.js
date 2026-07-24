Component({
  options: {
    multipleSlots: true,
    styleIsolation: 'shared'
  },
  properties: {
    title: {
      type: String,
      value: ''
    },
    pageClass: {
      type: String,
      value: ''
    },
    scrollClass: {
      type: String,
      value: ''
    },
    contentClass: {
      type: String,
      value: ''
    }
  },
  methods: {
    handleBack() {
      this.triggerEvent('back')
    }
  }
})
