const { getCloudEnvConfig } = require('./config/env')

App({
  globalData: {
    cloudEnv: null
  },

  onLaunch() {
    if (wx.cloud) {
      const cloudEnv = getCloudEnvConfig()
      this.globalData.cloudEnv = cloudEnv
      wx.cloud.init({
        env: cloudEnv.envId,
        traceUser: true
      })

      if (cloudEnv.isFallback) {
        console.warn(`[env] ${cloudEnv.envVersion} 未单独配置 envId，当前回退到 ${cloudEnv.envId}`)
      }
    }
  }
})
