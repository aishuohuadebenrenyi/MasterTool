const { callAction } = require('../../../services/cloud')
const { showInfo, showSuccess } = require('../../../utils/page')
const { goBackOrSwitchTab } = require('../../../utils/navigation')

Page({
  data: {
    faqList: [
      {
        question: '开课前需要准备什么？',
        answer: '先在备课页新建或编辑方案，也可以从公共模板、个人模板应用生成新方案；若想沉淀复用内容，可在方案编辑页将方案保存为个人模板，再补齐客户、人数和环节信息并确认开课。',
        expanded: true
      },
      {
        question: '现场签到、分组和积分的数据从哪里来？',
        answer: '签到名单会成为现场参与者名单，分组和随机抽取都会优先使用已签到人员，积分会按已生成的小组同步展示。',
        expanded: false
      },
      {
        question: '培训结束后如何复盘和查看数据？',
        answer: '结束页可以收集反馈、开始复盘或查看本场数据。复盘记录和数据详情也会出现在我的页培训记录中。',
        expanded: false
      }
    ],
    contact: '',
    content: '',
    contentCount: '0/500'
  },

  goBack() {
    goBackOrSwitchTab('/pages/mine/index/index')
  },

  toggleFaq(event) {
    const index = Number(event.currentTarget.dataset.index)
    const faqList = this.data.faqList.map((item, itemIndex) => ({
      ...item,
      expanded: itemIndex === index ? !item.expanded : item.expanded
    }))
    this.setData({ faqList })
  },

  handleContactInput(event) {
    this.setData({ contact: event.detail.value })
  },

  handleInput(event) {
    const content = event.detail.value || ''
    this.setData({
      content,
      contentCount: `${content.length}/500`
    })
  },

  async submitFeedback() {
    if (!this.data.content.trim()) {
      wx.showToast({ title: '请描述问题', icon: 'none', duration: 2200 })
      return
    }

    const response = await callAction('trainer-api', 'saveSupportFeedback', {
      contact: this.data.contact,
      content: this.data.content
    })
    if (response.code !== 0) {
      showInfo(response.message || '提交失败')
      return
    }
    showSuccess('感谢反馈')
    this.setData({
      contact: '',
      content: '',
      contentCount: '0/500'
    })
  }
})
