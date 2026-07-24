Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    interactionType: {
      type: String,
      value: 'wordcloud'
    },
    interactionTitle: {
      type: String,
      value: ''
    },
    voteOptionsText: {
      type: String,
      value: ''
    },
    interactions: {
      type: Array,
      value: []
    },
    interactionCreating: {
      type: Boolean,
      value: false
    },
    closingInteractionId: {
      type: String,
      value: ''
    },
    interactionCodeLoadingId: {
      type: String,
      value: ''
    },
    entryPreviewTitle: {
      type: String,
      value: ''
    },
    entryPreviewUrl: {
      type: String,
      value: ''
    },
    entryPreviewPath: {
      type: String,
      value: ''
    },
    entryPreviewLink: {
      type: String,
      value: ''
    },
    entryPreviewJoinCode: {
      type: String,
      value: ''
    },
    interactionStats: {
      type: Object,
      value: null
    }
  },
  methods: {
    handleChangeType(event) {
      this.triggerEvent('changeinteractiontype', {
        type: event.currentTarget.dataset.type
      })
    },
    handleTitleInput(event) {
      this.triggerEvent('interactiontitleinput', event.detail)
    },
    handleVoteOptions(event) {
      this.triggerEvent('voteoptionsinput', event.detail)
    },
    handleCreate() {
      this.triggerEvent('createinteraction')
    },
    handleCardAction(event) {
      this.triggerEvent(event.currentTarget.dataset.eventName, {
        id: event.currentTarget.dataset.id
      })
    },
    handlePreviewPath(event) {
      this.triggerEvent('previewentrypath', {
        path: event.currentTarget.dataset.path
      })
    },
    handleCopyLink(event) {
      this.triggerEvent('copyentrylink', {
        link: event.currentTarget.dataset.path
      })
    }
  }
})
