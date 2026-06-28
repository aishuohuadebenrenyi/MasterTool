const { createRequestState } = require('../../../utils/request-state')
const {
  copyEntry: copyEntryModule,
  generateEntryCode: generateEntryCodeModule,
  goBack: goBackModule,
  loadFeedback: loadFeedbackModule,
  onLoad: onLoadModule,
  openSubmitPreview: openSubmitPreviewModule,
  toggleAnonymous: toggleAnonymousModule
} = require('./modules/page-flow')

Page({
  data: {
    sessionId: '',
    feedbackPath: '',
    feedbackCodeUrl: '',
    feedbackEntryLink: '',
    feedbackCodeLoading: false,
    anonymousEnabled: true,
    requestState: createRequestState(),
    stats: {
      count: 0,
      avgSatisfaction: '0.0',
      nps: 0,
      responseRate: '0%'
    },
    feedbackList: []
  },

  onLoad(query) {
    return onLoadModule(this, query || {})
  },

  async loadFeedback() {
    return loadFeedbackModule(this)
  },

  goBack() {
    return goBackModule()
  },

  toggleAnonymous() {
    return toggleAnonymousModule(this)
  },

  copyEntry() {
    return copyEntryModule(this)
  },

  async generateEntryCode() {
    return generateEntryCodeModule(this)
  },

  openSubmitPreview() {
    return openSubmitPreviewModule(this)
  }
})
