Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    scoreMode: {
      type: String,
      value: 'simple'
    },
    isGrouped: {
      type: Boolean,
      value: false
    },
    groups: {
      type: Array,
      value: []
    },
    scoreDetails: {
      type: Object,
      value: null
    },
    scoreReasonInputs: {
      type: Object,
      value: null
    }
  },
  methods: {
    handleScoreMode(event) {
      this.triggerEvent('setscoremode', {
        mode: event.currentTarget.dataset.mode
      })
    },
    handleChangeScore(event) {
      this.triggerEvent('changescore', {
        index: event.currentTarget.dataset.index,
        delta: event.currentTarget.dataset.delta
      })
    },
    handleReasonInput(event) {
      this.triggerEvent('scorereasoninput', {
        groupId: event.currentTarget.dataset.groupId,
        value: event.detail.value
      })
    },
    handleDetailedScore(event) {
      this.triggerEvent('applydetailedscore', {
        index: event.currentTarget.dataset.index,
        delta: event.currentTarget.dataset.delta
      })
    }
  }
})
