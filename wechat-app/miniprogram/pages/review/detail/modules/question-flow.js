const QUESTION_MAP = {
  ORID: [
    'O-客观：刚才的活动中，你观察到了什么？',
    'R-感受：哪些瞬间让你有情绪或能量变化？',
    'I-诠释：这些现象说明了什么？',
    'D-决定：下一次你会调整什么？'
  ],
  '4F': [
    'Facts：现场发生了什么？',
    'Feelings：参与者和你分别有什么感受？',
    'Findings：你发现了哪些模式？',
    'Future：下一场如何优化？'
  ],
  SSC: [
    'Start：下次应该开始做什么？',
    'Stop：哪些做法应该停止？',
    'Continue：哪些做法应该继续？'
  ]
}

function buildQuestionState(framework, answers = {}) {
  const questions = QUESTION_MAP[framework] || QUESTION_MAP.ORID
  const firstQuestion = questions[0] || ''
  return {
    activeFramework: framework,
    questions,
    currentQuestion: 0,
    questionIndexText: `1/${questions.length}`,
    questionText: firstQuestion,
    answer: answers[firstQuestion] || ''
  }
}

function applyFramework(page, framework) {
  page.setData(buildQuestionState(framework, page.data.answers))
}

function handleInput(page, event) {
  page.setData({ answer: event.detail.value })
}

function persistCurrentAnswer(page) {
  const answers = {
    ...page.data.answers,
    [page.data.questionText]: page.data.answer.trim()
  }
  page.setData({ answers })
  return answers
}

function setFramework(page, event) {
  persistCurrentAnswer(page)
  applyFramework(page, event.currentTarget.dataset.framework)
}

function prevQuestion(page) {
  persistCurrentAnswer(page)
  if (page.data.currentQuestion <= 0) return
  const currentQuestion = page.data.currentQuestion - 1
  page.setData({
    currentQuestion,
    questionIndexText: `${currentQuestion + 1}/${page.data.questions.length}`,
    questionText: page.data.questions[currentQuestion],
    answer: page.data.answers[page.data.questions[currentQuestion]] || ''
  })
}

function nextQuestion(page) {
  persistCurrentAnswer(page)
  if (page.data.currentQuestion >= page.data.questions.length - 1) return
  const currentQuestion = page.data.currentQuestion + 1
  page.setData({
    currentQuestion,
    questionIndexText: `${currentQuestion + 1}/${page.data.questions.length}`,
    questionText: page.data.questions[currentQuestion],
    answer: page.data.answers[page.data.questions[currentQuestion]] || ''
  })
}

module.exports = {
  applyFramework,
  handleInput,
  nextQuestion,
  persistCurrentAnswer,
  prevQuestion,
  setFramework
}
