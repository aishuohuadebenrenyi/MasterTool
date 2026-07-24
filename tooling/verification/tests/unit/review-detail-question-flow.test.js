const test = require('node:test')
const assert = require('node:assert/strict')

const {
  applyFramework,
  nextQuestion,
  persistCurrentAnswer,
  prevQuestion,
  setFramework
} = require('../../../../apps/wechat-cloudbase/miniprogram/pages/review/detail/modules/question-flow')
const {
  __testables: reviewPageFlowTestables
} = require('../../../../apps/wechat-cloudbase/miniprogram/pages/review/detail/modules/page-flow')

const { buildReviewContent } = reviewPageFlowTestables

function createFakePage(initialData = {}) {
  return {
    data: {
      activeFramework: 'ORID',
      questions: [],
      currentQuestion: 0,
      questionIndexText: '',
      questionText: '',
      answer: '',
      answers: {},
      ...initialData
    },
    setData(patch) {
      this.data = {
        ...this.data,
        ...patch
      }
    }
  }
}

test('applyFramework uses the existing first-question answer for the selected framework', () => {
  const page = createFakePage({
    answers: {
      'O-客观：刚才的活动中，你观察到了什么？': '看到了学员主动发言'
    }
  })

  applyFramework(page, 'ORID')

  assert.equal(page.data.activeFramework, 'ORID')
  assert.equal(page.data.questionIndexText, '1/4')
  assert.equal(page.data.questionText, 'O-客观：刚才的活动中，你观察到了什么？')
  assert.equal(page.data.answer, '看到了学员主动发言')
})

test('persistCurrentAnswer trims the current answer before saving it', () => {
  const page = createFakePage({
    questionText: 'Facts：现场发生了什么？',
    answer: '  先进行了破冰  '
  })

  const answers = persistCurrentAnswer(page)

  assert.deepEqual(answers, {
    'Facts：现场发生了什么？': '先进行了破冰'
  })
  assert.deepEqual(page.data.answers, {
    'Facts：现场发生了什么？': '先进行了破冰'
  })
})

test('nextQuestion saves the current answer and loads the next question answer', () => {
  const page = createFakePage({
    questions: [
      'O-客观：刚才的活动中，你观察到了什么？',
      'R-感受：哪些瞬间让你有情绪或能量变化？'
    ],
    currentQuestion: 0,
    questionIndexText: '1/2',
    questionText: 'O-客观：刚才的活动中，你观察到了什么？',
    answer: '  第一题答案  ',
    answers: {
      'R-感受：哪些瞬间让你有情绪或能量变化？': '第二题已有答案'
    }
  })

  nextQuestion(page)

  assert.equal(page.data.currentQuestion, 1)
  assert.equal(page.data.questionIndexText, '2/2')
  assert.equal(page.data.questionText, 'R-感受：哪些瞬间让你有情绪或能量变化？')
  assert.equal(page.data.answer, '第二题已有答案')
  assert.equal(page.data.answers['O-客观：刚才的活动中，你观察到了什么？'], '第一题答案')
})

test('prevQuestion keeps the first question selected but still persists the current answer', () => {
  const page = createFakePage({
    questions: [
      'Facts：现场发生了什么？',
      'Feelings：参与者和你分别有什么感受？'
    ],
    currentQuestion: 0,
    questionIndexText: '1/2',
    questionText: 'Facts：现场发生了什么？',
    answer: '  第一题保留  '
  })

  prevQuestion(page)

  assert.equal(page.data.currentQuestion, 0)
  assert.equal(page.data.questionIndexText, '1/2')
  assert.equal(page.data.answers['Facts：现场发生了什么？'], '第一题保留')
})

test('setFramework persists the current answer before switching to another framework', () => {
  const page = createFakePage({
    activeFramework: 'ORID',
    questions: [
      'O-客观：刚才的活动中，你观察到了什么？',
      'R-感受：哪些瞬间让你有情绪或能量变化？'
    ],
    currentQuestion: 1,
    questionIndexText: '2/2',
    questionText: 'R-感受：哪些瞬间让你有情绪或能量变化？',
    answer: '  原框架第二题  ',
    answers: {
      'Facts：现场发生了什么？': '新框架首题答案'
    }
  })

  setFramework(page, {
    currentTarget: {
      dataset: {
        framework: '4F'
      }
    }
  })

  assert.equal(page.data.activeFramework, '4F')
  assert.equal(page.data.questionIndexText, '1/4')
  assert.equal(page.data.questionText, 'Facts：现场发生了什么？')
  assert.equal(page.data.answer, '新框架首题答案')
  assert.equal(page.data.answers['R-感受：哪些瞬间让你有情绪或能量变化？'], '原框架第二题')
})

test('buildReviewContent joins answered questions and trims the final payload', () => {
  const content = buildReviewContent({
    'O-客观：刚才的活动中，你观察到了什么？': '学员主动发言',
    'D-决定：下一次你会调整什么？': ''
  })

  assert.equal(content, 'O-客观：刚才的活动中，你观察到了什么？\n学员主动发言\n\nD-决定：下一次你会调整什么？')
})
