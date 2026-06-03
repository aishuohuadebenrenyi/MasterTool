Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    phaseTitle: {
      type: String,
      value: ''
    },
    noteContent: {
      type: String,
      value: ''
    },
    notes: {
      type: Array,
      value: []
    }
  },
  methods: {
    handleInput(event) {
      this.triggerEvent('noteinput', event.detail)
    }
  }
})
