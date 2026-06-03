Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    standaloneMode: {
      type: String,
      value: 'countup'
    },
    countdownPresets: {
      type: Array,
      value: []
    },
    selectedCountdownSeconds: {
      type: Number,
      value: 0
    },
    standaloneDisplay: {
      type: String,
      value: '00:00'
    },
    standaloneHint: {
      type: String,
      value: ''
    }
  },
  methods: {
    handleSetMode(event) {
      this.triggerEvent('setstandalonemode', {
        mode: event.currentTarget.dataset.mode
      })
    },
    handleSetPreset(event) {
      this.triggerEvent('setcountdownpreset', {
        seconds: event.currentTarget.dataset.seconds
      })
    }
  }
})
