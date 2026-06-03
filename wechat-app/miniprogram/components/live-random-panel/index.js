Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    randomTab: {
      type: String,
      value: 'actor'
    },
    allowRepeatPick: {
      type: Boolean,
      value: false
    },
    pickedName: {
      type: String,
      value: ''
    },
    pickedIds: {
      type: Array,
      value: []
    },
    pickHistory: {
      type: Array,
      value: []
    }
  },
  methods: {
    handleSetTab(event) {
      this.triggerEvent('setrandomtab', {
        tab: event.currentTarget.dataset.tab
      })
    },
    handleToggleRepeat() {
      this.triggerEvent('togglerepeatpick')
    },
    handlePick() {
      this.triggerEvent('pickparticipant')
    },
    handleResetHistory() {
      this.triggerEvent('resetpickhistory')
    }
  }
})
