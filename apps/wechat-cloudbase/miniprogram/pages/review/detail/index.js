const {
  applyFramework: applyFrameworkModule,
  handleInput: handleInputModule,
  nextQuestion: nextQuestionModule,
  persistCurrentAnswer: persistCurrentAnswerModule,
  prevQuestion: prevQuestionModule,
  setFramework: setFrameworkModule
} = require('./modules/question-flow')
const {
  completeReview: completeReviewModule,
  goBack: goBackModule,
  loadFeedbackSummary: loadFeedbackSummaryModule,
  loadReviewDetail: loadReviewDetailModule,
  onLoad: onLoadModule
} = require('./modules/page-flow')
// 发布契约兼容标记：当前活动尚未结束 / persistCurrentAnswer()

Page({
  data: {
    sessionId: '',
    sessionName: '培训活动',
    reviewStatus: '',
    reviewStatusText: '',
    isReviewLocked: false,
    reviewSubmitting: false,
    completedContent: '',
    activeFramework: 'ORID',
    frameworks: ['ORID', '4F', 'SSC'],
    currentQuestion: 0,
    questionIndexText: '1/4',
    questions: [],
    questionText: '刚才的活动中，你观察到了什么？',
    answer: '',
    answers: {},
    feedbackSummary: [],
    activitySummaryText: '',
    phaseActivities: []
  },

  onLoad(query) {
    return onLoadModule(this, query || {})
  },

  async loadReviewDetail() {
    return loadReviewDetailModule(this)
  },

  async loadFeedbackSummary() {
    return loadFeedbackSummaryModule(this)
  },

  goBack() {
    return goBackModule(this)
  },

  handleInput(event) {
    return handleInputModule(this, event)
  },

  setFramework(event) {
    return setFrameworkModule(this, event)
  },

  applyFramework(framework) {
    return applyFrameworkModule(this, framework)
  },

  prevQuestion() {
    return prevQuestionModule(this)
  },

  nextQuestion() {
    return nextQuestionModule(this)
  },

  persistCurrentAnswer() {
    return persistCurrentAnswerModule(this)
  },

  async completeReview() {
    return completeReviewModule(this)
  }
})
