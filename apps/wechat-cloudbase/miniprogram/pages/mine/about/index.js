const { navigateTo } = require('../../../utils/page')
const { goBackOrSwitchTab } = require('../../../utils/navigation')
const { appVersion } = require('../../../config/version')

Page({
  data: {
    appName: '培训师工具箱',
    version: appVersion,
    description: '面向企业培训、团建活动和即兴训练现场的流程编排与互动工具。'
  },

  goBack() {
    goBackOrSwitchTab('/pages/mine/index/index')
  },

  openPrivacy() {
    navigateTo('/pages/mine/legal/index?type=privacy')
  },

  openTerms() {
    navigateTo('/pages/mine/legal/index?type=terms')
  }
})
