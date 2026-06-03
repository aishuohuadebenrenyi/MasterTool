Component({
  options: {
    multipleSlots: true,
    styleIsolation: 'shared'
  },
  properties: {
    itemId: {
      type: String,
      value: ''
    },
    opened: {
      type: Boolean,
      value: false
    },
    swipeWidth: {
      type: Number,
      value: 0
    },
    actions: {
      type: Array,
      value: []
    }
  },
  data: {
    touchStartX: 0,
    touchStartY: 0
  },
  methods: {
    onTouchStart(event) {
      const touch = event.touches[0]
      this.setData({
        touchStartX: touch.clientX,
        touchStartY: touch.clientY
      })
    },
    onTouchEnd(event) {
      if (!this.properties.actions.length) return
      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - this.data.touchStartX
      const deltaY = touch.clientY - this.data.touchStartY
      if (Math.abs(deltaY) > Math.abs(deltaX)) return
      this.triggerEvent('openchange', {
        id: this.properties.itemId,
        opened: deltaX < -36
      })
    },
    onItemTap() {
      if (this.properties.opened) {
        this.triggerEvent('openchange', {
          id: this.properties.itemId,
          opened: false
        })
        return
      }
      this.triggerEvent('itemtap', { id: this.properties.itemId })
    },
    onActionTap(event) {
      this.triggerEvent('actiontap', {
        id: this.properties.itemId,
        action: event.currentTarget.dataset.action
      })
    }
  }
})
