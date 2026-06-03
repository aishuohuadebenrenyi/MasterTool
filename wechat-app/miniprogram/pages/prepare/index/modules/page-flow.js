const { navigateTo } = require('../../../../utils/page')

async function onLoad(page, query) {
  return page.loadPrepareData(query || {})
}

async function onShow(page) {
  const entry = wx.getStorageSync('prepareEntry') || {}
  wx.removeStorageSync('prepareEntry')
  if (Object.keys(entry).length > 0) {
    return page.loadPrepareData(entry)
  }
  if (page.data.plans.length || page.data.templates.length || page.data.activities.length) {
    return page.reloadCurrentData()
  }
  return null
}

function switchTab(page, event) {
  const tab = event.currentTarget.dataset.tab
  page.setData({ activeTab: tab })
  page.refreshLists()
}

function handlePlanSearch(page, event) {
  page.setData({ planSearch: event.detail.value })
  page.refreshPlans()
}

function handleActivitySearch(page, event) {
  page.setData({ activitySearch: event.detail.value })
  page.refreshActivities()
}

function setPlanKindFilter(page, event) {
  const value = event.detail.value || event.currentTarget.dataset.value
  page.setData({
    planKindFilter: value,
    planStatusFilter: value === '个人模板' || value === '公共模板' || value === '收藏' ? '全部' : page.data.planStatusFilter,
    openedPlanId: ''
  })
  page.refreshPlans()
}

function setPlanTypeFilter(page, event) {
  page.setData({ planTypeFilter: event.detail.value || event.currentTarget.dataset.value })
  page.refreshPlans()
}

function setPlanStatusFilter(page, event) {
  page.setData({ planStatusFilter: event.detail.value || event.currentTarget.dataset.value })
  page.refreshPlans()
}

function setActivityKindFilter(page, event) {
  page.setData({
    activityKindFilter: event.detail.value || event.currentTarget.dataset.value,
    openedActivityId: ''
  })
  page.refreshActivities()
}

function setActivitySceneFilter(page, event) {
  page.setData({ activitySceneFilter: event.detail.value || event.currentTarget.dataset.value })
  page.refreshActivities()
}

function goPlanCreate(page) {
  wx.hideTabBar({ animation: false })
  page.setData({ showCreateTemplateSelect: true })
}

function closeCreateTemplateSelect(page) {
  wx.showTabBar({ animation: false })
  page.setData({ showCreateTemplateSelect: false })
}

function selectCreateTemplate(page, event) {
  const id = event.currentTarget.dataset.id
  closeCreateTemplateSelect(page)
  if (id === 'blank') {
    navigateTo('/pages/plan/edit/index')
    return
  }
  navigateTo(`/pages/plan/edit/index?templateId=${id}`)
}

function goActivityCreate() {
  navigateTo('/pages/plan/activity-edit/index')
}

module.exports = {
  closeCreateTemplateSelect,
  goActivityCreate,
  goPlanCreate,
  handleActivitySearch,
  handlePlanSearch,
  onLoad,
  onShow,
  selectCreateTemplate,
  setActivityKindFilter,
  setActivitySceneFilter,
  setPlanKindFilter,
  setPlanStatusFilter,
  setPlanTypeFilter,
  switchTab
}
