Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    groupMethod: {
      type: String,
      value: 'average'
    },
    teamCount: {
      type: Number,
      value: 2
    },
    groups: {
      type: Array,
      value: []
    }
  },
  methods: {
    handleMethodTap(event) {
      this.triggerEvent('changegroupmethod', {
        method: event.currentTarget.dataset.method
      })
    },
    handleTeamCount(event) {
      this.triggerEvent('changeteamcount', {
        delta: event.currentTarget.dataset.delta
      })
    }
  }
})
