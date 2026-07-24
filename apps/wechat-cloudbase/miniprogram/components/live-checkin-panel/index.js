Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    participants: {
      type: Array,
      value: []
    },
    peopleCount: {
      type: Number,
      value: 0
    },
    checkinCodeUrl: {
      type: String,
      value: ''
    },
    checkinEntryLink: {
      type: String,
      value: ''
    },
    checkinPath: {
      type: String,
      value: ''
    },
    checkinCodeLoading: {
      type: Boolean,
      value: false
    },
    participantName: {
      type: String,
      value: ''
    }
  },
  methods: {
    handleLoadCode() {
      if (this.properties.checkinCodeLoading) return
      this.triggerEvent('loadcode')
    },
    handleCopyEntry() {
      this.triggerEvent('copyentry')
    },
    handleNameInput(event) {
      this.triggerEvent('nameinput', event.detail)
    },
    handleManualCheckin() {
      this.triggerEvent('manualcheckin')
    }
  }
})
