const { callAction } = require('../../../../services/cloud')
const { navigateTo, showInfo, showSuccess } = require('../../../../utils/page')

function findActivity(page, id) {
  return page.data.filteredActivities.find((item) => item._id === id)
}

function handleActivityTap(page, event) {
  const id = event.detail.id || event.currentTarget.dataset.id
  const activity = findActivity(page, id)
  if (!activity) return
  if (activity.swipeOffset < 0) {
    page.setData({ openedActivityId: '' })
    page.refreshActivities()
    return
  }
  navigateTo(`/pages/plan/activity-detail/index?id=${id || ''}`)
}

function handleActivityOpenChange(page, event) {
  const { id, opened } = event.detail
  page.setData({ openedActivityId: opened ? id : '' })
  page.refreshActivities()
}

function handleActivitySwipeAction(page, event) {
  const action = event.detail.action || event.currentTarget.dataset.action
  const id = event.detail.id || event.currentTarget.dataset.id
  const activity = findActivity(page, id)
  if (!activity) return

  if (action === 'delete') {
    wx.showModal({
      title: '删除活动',
      content: `确认删除「${activity.name}」？`,
      confirmText: '删除',
      confirmColor: '#FF5A5F',
      success: (res) => {
        if (!res.confirm) return
        callAction('trainer-api', 'deleteActivity', { _id: id }).then((response) => {
          if (response.code !== 0) {
            showInfo(response.message || '删除失败')
            return
          }
          page.setData({
            activities: page.data.activities.filter((item) => item._id !== id),
            openedActivityId: ''
          })
          page.refreshActivities()
          showSuccess('已删除')
        })
      }
    })
    return
  }

  if (action === 'pin') {
    const nextPinned = !activity.isPinned
    callAction('trainer-api', 'updateActivityFlags', { _id: id, isPinned: nextPinned }).then((response) => {
      if (response.code !== 0) {
        showInfo(response.message || '操作失败')
        return
      }
      page.setData({
        openedActivityId: '',
        activities: page.data.activities.map((item) => item._id === id ? { ...item, isPinned: nextPinned } : item)
      })
      page.refreshActivities()
      showSuccess(nextPinned ? '已置顶' : '已取消置顶')
    })
    return
  }

  const nextFavorite = !activity.isFavorite
  callAction('trainer-api', 'updateActivityFlags', { _id: id, isFavorite: nextFavorite }).then((response) => {
    if (response.code !== 0) {
      showInfo(response.message || '操作失败')
      return
    }
    page.setData({
      openedActivityId: '',
      activities: page.data.activities.map((item) => item._id === id ? { ...item, isFavorite: nextFavorite } : item)
    })
    page.refreshActivities()
    showSuccess(nextFavorite ? '已收藏' : '已取消收藏')
  })
}

module.exports = {
  handleActivityOpenChange,
  handleActivitySwipeAction,
  handleActivityTap
}
