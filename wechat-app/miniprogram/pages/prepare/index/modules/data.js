const { callAction } = require('../../../../services/cloud')
const { showInfo } = require('../../../../utils/page')
const { buildRequestState } = require('../../../../utils/request-state')
const {
  enrichPlan,
  enrichTemplate,
  enrichTemplateOption,
  sortTemplates
} = require('../../../../utils/plan')
const { enrichActivity } = require('../../../../utils/activity')
const { refreshLists } = require('./listing')

const BLANK_TEMPLATE_OPTION = {
  _id: 'blank',
  name: '空白新建',
  type: '企业培训',
  phaseCount: 0,
  flowText: '从空白方案开始，自定义环节与活动。',
  visibility: 'private',
  icon: '/static/icons/icon-state-document.png',
  templateTagText: '空白方案',
  templateSourceText: '推荐'
}

function normalizeList(list) {
  return Array.isArray(list) ? list : []
}

function extractPrepareResources(responses) {
  const [planResponse, templateResponse, activityResponse] = responses
  const remotePlans = planResponse.code === 0 && planResponse.data
    ? normalizeList(planResponse.data.plans)
    : []
  const remoteTemplates = templateResponse.code === 0 && templateResponse.data
    ? normalizeList(templateResponse.data.templates)
    : []
  const remoteActivities = activityResponse.code === 0 && activityResponse.data
    ? normalizeList(activityResponse.data.activities)
    : []
  const templates = sortTemplates(remoteTemplates.map(enrichTemplate))

  return {
    plans: remotePlans.map(enrichPlan),
    templates,
    activities: remoteActivities.map(enrichActivity),
    createTemplateOptions: [BLANK_TEMPLATE_OPTION, ...templates.filter((item) => item.isPublic).map(enrichTemplateOption)],
    responses: {
      activityResponse,
      planResponse,
      templateResponse
    }
  }
}

async function fetchPrepareResources() {
  const responses = await Promise.all([
    callAction('trainer-api', 'listPlans', { status: '' }),
    callAction('trainer-api', 'listTemplates'),
    callAction('trainer-api', 'listActivities')
  ])
  return extractPrepareResources(responses)
}

function setReloadingState(page) {
  page.setData({
    loading: true,
    openedPlanId: '',
    openedActivityId: '',
    planRequestState: buildRequestState({ loading: true, items: page.data.filteredPlans }),
    activityRequestState: buildRequestState({ loading: true, items: page.data.filteredActivities })
  })
}

function buildPrepareEntryState(entry = {}) {
  const preferredStatus = entry.preferredStatus || entry.status || ''
  return {
    preferredStatus,
    fallbackStatus: entry.fallbackStatus || '',
    activeTab: entry.tab === 'activities' ? 'activities' : 'plans',
    planKindFilter: entry.planKind || '全部',
    planStatusFilter: preferredStatus === 'confirmed' ? '已确认' : (preferredStatus === 'draft' ? '草稿' : '全部')
  }
}

function setEntryLoadingState(page, entryState) {
  page.setData({
    loading: true,
    activeTab: entryState.activeTab,
    firstTabText: '我的方案',
    secondTabKey: 'activities',
    secondTabText: '活动库',
    planKindFilter: entryState.planKindFilter,
    planStatusFilter: entryState.planStatusFilter,
    openedPlanId: '',
    openedActivityId: '',
    planRequestState: buildRequestState({ loading: true, items: [] }),
    activityRequestState: buildRequestState({ loading: true, items: [] })
  })
}

function toastLoadErrors(responses) {
  if (responses.planResponse.code !== 0) showInfo(responses.planResponse.message || '方案加载失败')
  if (responses.templateResponse.code !== 0) showInfo(responses.templateResponse.message || '模板加载失败')
  if (responses.activityResponse.code !== 0) showInfo(responses.activityResponse.message || '活动加载失败')
}

async function reloadCurrentData(page) {
  setReloadingState(page)
  const resources = await fetchPrepareResources()
  page.setData({
    plans: resources.plans,
    templates: resources.templates,
    activities: resources.activities,
    createTemplateOptions: resources.createTemplateOptions,
    loading: false
  })
  refreshLists(page)
}

async function loadPrepareData(page, entry = {}) {
  const entryState = buildPrepareEntryState(entry)
  setEntryLoadingState(page, entryState)

  const resources = await fetchPrepareResources()
  toastLoadErrors(resources.responses)

  page.setData({
    plans: resources.plans,
    templates: resources.templates,
    activities: resources.activities,
    createTemplateOptions: resources.createTemplateOptions,
    loading: false
  })

  if (entryState.preferredStatus === 'confirmed' && entryState.fallbackStatus === 'draft') {
    const confirmedCount = page.data.plans.filter((item) => item.status === 'confirmed').length
    if (confirmedCount === 0) {
      page.setData({ planStatusFilter: '草稿' })
      showInfo('暂无已确认方案，已为你筛选草稿', 2800)
    }
  }

  refreshLists(page)
}

module.exports = {
  BLANK_TEMPLATE_OPTION,
  buildPrepareEntryState,
  fetchPrepareResources,
  loadPrepareData,
  reloadCurrentData
}
