const { callAction } = require('../../../../services/cloud')
const { navigateTo, showInfo, showSuccess } = require('../../../../utils/page')

function findPlan(page, id) {
  return page.data.filteredPlans.find((item) => item._id === id)
}

function findTemplate(page, id) {
  return page.data.filteredTemplates.find((item) => item._id === id)
}

function applyTemplate(template) {
  navigateTo(`/pages/plan/edit/index?templateId=${template._id}`)
}

function openDeliveredDetail(plan) {
  const sessionId = plan.reviewSessionId || plan.latestSessionId || ''
  if (!sessionId) {
    showInfo('当前方案缺少交付场次，请稍后刷新')
    return
  }
  navigateTo(`/pages/plan/activity-detail/index?sessionId=${sessionId}`)
}

function openReviewActivity(plan) {
  if (!plan.reviewSessionId) {
    showInfo('当前方案还没有可复盘的结束场次')
    return
  }
  navigateTo(`/pages/plan/activity-detail/index?sessionId=${plan.reviewSessionId}`)
}

async function startTraining(plan) {
  if (plan.status !== 'confirmed') {
    showInfo('请先确认方案，再开始培训', 2600)
    return
  }

  showInfo('正在创建培训场次...', 1200)
  const response = await callAction('live-api', 'startSession', { planId: plan._id })
  if (response.code !== 0 || !response.data || !response.data.sessionId) {
    showInfo(response.message || '开课失败')
    return
  }
  const sessionId = response.data.sessionId
  navigateTo(`/pages/live/index/index?sessionId=${sessionId}&title=${encodeURIComponent(plan.name)}`)
}

function handlePlanTap(page, event) {
  const id = event.detail.id || event.currentTarget.dataset.id
  const plan = findPlan(page, id)
  if (!plan) return

  if (plan.swipeOffset < 0) {
    page.setData({ openedPlanId: '' })
    page.refreshPlans()
    return
  }

  if (plan.contentKind === 'template') {
    applyTemplate(plan)
    return
  }

  if (plan.canOpenDeliveredDetail) {
    openDeliveredDetail(plan)
    return
  }

  navigateTo(`/pages/plan/edit/index?id=${plan._id}`)
}

function handlePlanAction(page, event) {
  const id = event.detail.id || event.currentTarget.dataset.id
  const plan = findPlan(page, id)
  if (!plan) return

  if (plan.contentKind === 'template') {
    applyTemplate(plan)
    return
  }
  if (plan.status === 'confirmed') {
    startTraining(plan)
    return
  }
  if (plan.canGoReview) {
    openReviewActivity(plan)
    return
  }
  navigateTo(`/pages/plan/edit/index?id=${plan._id}`)
}

function handlePlanOpenChange(page, event) {
  const { id, opened } = event.detail
  const plan = findPlan(page, id)
  if (!plan) return
  if (plan.contentKind === 'template' && !plan.canDelete && !plan.canTogglePinned && !plan.canToggleFavorite) return
  page.setData({ openedPlanId: opened ? id : '' })
  page.refreshPlans()
}

function updatePlanCollections(page, id, updater) {
  page.setData({
    plans: page.data.plans.map((item) => item._id === id ? { ...item, ...updater(item) } : item),
    templates: page.data.templates.map((item) => item._id === id ? { ...item, ...updater(item) } : item)
  })
}

function handleSwipeAction(page, event) {
  const action = event.detail.action || event.currentTarget.dataset.action
  const id = event.detail.id || event.currentTarget.dataset.id
  const plan = findPlan(page, id)
  if (!plan) return

  if (action === 'delete') {
    if (plan.contentKind === 'template' && !plan.canDelete) return
    wx.showModal({
      title: plan.contentKind === 'template' ? '删除模板' : '删除方案',
      content: `确认删除「${plan.name}」？`,
      confirmText: '删除',
      confirmColor: '#FF5A5F',
      success: (res) => {
        if (!res.confirm) return
        const actionName = plan.contentKind === 'template' ? 'deleteTemplate' : 'deletePlan'
        callAction('trainer-api', actionName, { _id: id }).then((response) => {
          if (response.code !== 0) {
            showInfo(response.message || '删除失败')
            return
          }
          if (plan.contentKind === 'template') {
            page.setData({ templates: page.data.templates.filter((item) => item._id !== id), openedPlanId: '' })
          } else {
            page.setData({ plans: page.data.plans.filter((item) => item._id !== id), openedPlanId: '' })
          }
          page.refreshPlans()
          showSuccess('已删除')
        })
      }
    })
    return
  }

  if (action === 'pin') {
    if (plan.contentKind === 'template' && !plan.canTogglePinned) return
    const nextPinned = !plan.isPinned
    const actionName = plan.contentKind === 'template' ? 'updateTemplateFlags' : 'updatePlanFlags'
    callAction('trainer-api', actionName, { _id: id, isPinned: nextPinned }).then((response) => {
      if (response.code !== 0) {
        showInfo(response.message || '操作失败')
        return
      }
      page.setData({ openedPlanId: '' })
      updatePlanCollections(page, id, () => ({ isPinned: nextPinned }))
      page.refreshPlans()
      showSuccess(nextPinned ? '已置顶' : '已取消置顶')
    })
    return
  }

  const nextFavorite = !plan.isFavorite
  if (plan.contentKind === 'template' && !plan.canToggleFavorite) return
  const actionName = plan.contentKind === 'template' ? 'updateTemplateFlags' : 'updatePlanFlags'
  callAction('trainer-api', actionName, { _id: id, isFavorite: nextFavorite }).then((response) => {
    if (response.code !== 0) {
      showInfo(response.message || '操作失败')
      return
    }
    page.setData({ openedPlanId: '' })
    updatePlanCollections(page, id, () => ({ isFavorite: nextFavorite }))
    page.refreshPlans()
    showSuccess(nextFavorite ? '已收藏' : '已取消收藏')
  })
}

function handleTemplateTap(page, event) {
  const id = event.currentTarget.dataset.id
  const template = findTemplate(page, id)
  if (template) applyTemplate(template)
}

module.exports = {
  applyTemplate,
  handlePlanAction,
  handlePlanOpenChange,
  handlePlanTap,
  handleSwipeAction,
  handleTemplateTap,
  openDeliveredDetail,
  openReviewActivity,
  startTraining
}
