Component({
  options: {
    styleIsolation: 'shared'
  },
  properties: {
    title: {
      type: String,
      value: ''
    },
    icon: {
      type: String,
      value: '/static/icons/icon-state-qr.png'
    },
    codeUrl: {
      type: String,
      value: ''
    },
    path: {
      type: String,
      value: ''
    },
    emptyHint: {
      type: String,
      value: '生成正式小程序码'
    },
    primaryText: {
      type: String,
      value: ''
    },
    secondaryText: {
      type: String,
      value: ''
    },
    tertiaryText: {
      type: String,
      value: ''
    }
  },
  methods: {
    handlePrimary() {
      this.triggerEvent('primarytap')
    },
    handleSecondary() {
      this.triggerEvent('secondarytap')
    },
    handleTertiary() {
      this.triggerEvent('tertiarytap')
    }
  }
})
