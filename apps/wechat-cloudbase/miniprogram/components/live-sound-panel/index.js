Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    activeSound: {
      type: String,
      value: ''
    }
  },
  methods: {
    handlePlay(event) {
      this.triggerEvent('playsound', {
        name: event.currentTarget.dataset.name
      })
    }
  }
})
