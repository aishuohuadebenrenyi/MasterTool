Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    items: {
      type: Array,
      value: []
    },
    active: {
      type: String,
      value: ''
    },
    scrollClass: {
      type: String,
      value: ''
    }
  },
  methods: {
    handleTap(event) {
      const value = event.currentTarget.dataset.value
      this.triggerEvent('change', { value })
    }
  }
})
