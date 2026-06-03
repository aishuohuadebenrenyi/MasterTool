const { buildRequestState } = require('../../../../utils/request-state')

function getPlanSwipeActions(item) {
  if (!item.canSwipe) return []
  return [
    ...(item.contentKind !== 'template' || item.canDelete ? [{ action: 'delete', text: '删', className: 'delete' }] : []),
    ...(item.contentKind !== 'template' || item.canTogglePinned ? [{ action: 'pin', text: '置', className: 'pin' }] : []),
    ...(item.contentKind !== 'template' || item.canToggleFavorite ? [{ action: 'fav', text: '藏', className: 'fav' }] : [])
  ]
}

function getActivitySwipeActions() {
  return [
    { action: 'delete', text: '删', className: 'delete' },
    { action: 'pin', text: '置', className: 'pin' },
    { action: 'fav', text: '藏', className: 'fav' }
  ]
}

function filterPlans(data) {
  const keyword = (data.planSearch || '').trim()
  const kind = data.planKindFilter
  const type = data.planTypeFilter
  const status = data.planStatusFilter
  const allItems = [...data.plans, ...data.templates]

  return allItems.filter((item) => {
    if (kind === '全部' && item.contentKind === 'template') return false
    if (item.contentKind === 'template' && item.isPublic && kind !== '公共模板') return false
    if ((kind === '方案' || kind === '我的方案') && item.contentKind !== 'plan') return false
    if (kind === '个人模板' && (item.contentKind !== 'template' || item.isPublic)) return false
    if (kind === '公共模板' && (item.contentKind !== 'template' || !item.isPublic)) return false
    if (kind === '收藏' && !item.isFavorite) return false
    if (type !== '全部' && item.typeText !== type) return false
    if (status !== '全部' && item.contentKind === 'plan' && item.statusText !== status) return false
    if (status !== '全部' && item.contentKind === 'template') return false
    if (keyword && !(item.name || '').includes(keyword) && !(item.customerName || '').includes(keyword)) return false
    return true
  })
}

function filterTemplates(data) {
  const keyword = (data.planSearch || '').trim()
  return data.templates.filter((item) => {
    if (item.isPublic) return false
    if (keyword && !(item.name || '').includes(keyword)) return false
    return true
  })
}

function filterActivities(data) {
  const keyword = (data.activitySearch || '').trim()
  const kind = data.activityKindFilter
  const scene = data.activitySceneFilter

  return data.activities.filter((item) => {
    if (kind === '收藏' && !item.isFavorite) return false
    if (scene !== '全部' && item.sceneText !== scene) return false
    if (keyword && !(item.name || '').includes(keyword)) return false
    return true
  })
}

function refreshPlans(page) {
  const filteredPlans = filterPlans(page.data)
  page.setData({
    filteredPlans: filteredPlans.map((item) => ({
      ...item,
      swipeActions: getPlanSwipeActions(item),
      swipeOffset: item._id === page.data.openedPlanId ? -(item.swipeWidth || 0) : 0
    })),
    planRequestState: buildRequestState({
      loading: false,
      items: filteredPlans,
      emptyTitle: '暂无方案或模板',
      emptyDesc: '试试切换筛选条件，或先新建方案。'
    }),
    filteredTemplates: filterTemplates(page.data)
  })
}

function refreshActivities(page) {
  const filteredActivities = filterActivities(page.data)
  page.setData({
    filteredActivities: filteredActivities.map((item) => ({
      ...item,
      swipeActions: getActivitySwipeActions(),
      swipeOffset: item._id === page.data.openedActivityId ? -(item.swipeWidth || 0) : 0
    })),
    activityRequestState: buildRequestState({
      loading: false,
      items: filteredActivities,
      emptyTitle: '暂无活动',
      emptyDesc: '可以先新建活动，或切换筛选条件查看。'
    })
  })
}

function refreshLists(page) {
  refreshPlans(page)
  refreshActivities(page)
}

module.exports = {
  getActivitySwipeActions,
  getPlanSwipeActions,
  refreshActivities,
  refreshLists,
  refreshPlans
}
