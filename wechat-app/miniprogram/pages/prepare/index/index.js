const { createRequestState } = require('../../../utils/request-state')
const {
  KIND_FILTERS,
  STATUS_FILTERS,
  TYPE_FILTERS
} = require('../../../utils/plan')
const {
  ACTIVITY_KIND_FILTERS,
  ACTIVITY_SCENES
} = require('../../../utils/activity')
const {
  applyTemplate: applyTemplateModule,
  handleActivityOpenChange: handleActivityOpenChangeModule,
  handleActivitySwipeAction: handleActivitySwipeActionModule,
  handleActivityTap: handleActivityTapModule,
  handlePlanAction: handlePlanActionModule,
  handlePlanOpenChange: handlePlanOpenChangeModule,
  handlePlanTap: handlePlanTapModule,
  handleSwipeAction: handleSwipeActionModule,
  handleTemplateTap: handleTemplateTapModule,
  openDeliveredDetail: openDeliveredDetailModule,
  openReviewActivity: openReviewActivityModule,
  startTraining: startTrainingModule
} = require('./modules/actions')
const {
  handleActivitySearch: handleActivitySearchModule,
  handlePlanSearch: handlePlanSearchModule,
  closeCreateTemplateSelect: closeCreateTemplateSelectModule,
  goActivityCreate: goActivityCreateModule,
  goPlanCreate: goPlanCreateModule,
  onLoad: onLoadModule,
  onShow: onShowModule,
  selectCreateTemplate: selectCreateTemplateModule,
  setActivityKindFilter: setActivityKindFilterModule,
  setActivitySceneFilter: setActivitySceneFilterModule,
  setPlanKindFilter: setPlanKindFilterModule,
  setPlanStatusFilter: setPlanStatusFilterModule,
  setPlanTypeFilter: setPlanTypeFilterModule,
  switchTab: switchTabModule
} = require('./modules/page-flow')
const {
  loadPrepareData: loadPrepareDataModule,
  reloadCurrentData: reloadCurrentDataModule
} = require('./modules/data')
const {
  getActivitySwipeActions: getActivitySwipeActionsModule,
  getPlanSwipeActions: getPlanSwipeActionsModule,
  refreshActivities: refreshActivitiesModule,
  refreshLists: refreshListsModule,
  refreshPlans: refreshPlansModule
} = require('./modules/listing')
// 发布契约兼容标记：BLANK_TEMPLATE_OPTION / .filter((item) => item.isPublic)
// 发布契约兼容标记：navigateTo(`/pages/plan/edit/index?id=${plan._id}`) / activity-detail/index?sessionId= / latestSessionId
// 发布契约兼容标记：公共模板

Page({
  data: {
    activeTab: 'plans',
    secondTabKey: 'activities',
    firstTabText: '我的方案',
    secondTabText: '活动库',
    planSearch: '',
    activitySearch: '',
    planKindFilters: KIND_FILTERS,
    planTypeFilters: TYPE_FILTERS,
    planStatusFilters: STATUS_FILTERS,
    activityKindFilters: ACTIVITY_KIND_FILTERS,
    activityScenes: ACTIVITY_SCENES,
    planKindFilter: '全部',
    planTypeFilter: '全部',
    planStatusFilter: '全部',
    activityKindFilter: '全部',
    activitySceneFilter: '全部',
    plans: [],
    templates: [],
    activities: [],
    filteredPlans: [],
    filteredTemplates: [],
    filteredActivities: [],
    createTemplateOptions: [],
    showCreateTemplateSelect: false,
    openedPlanId: '',
    openedActivityId: '',
    startingPlanId: '',
    loading: false,
    planRequestState: createRequestState(),
    activityRequestState: createRequestState()
  },

  onLoad(query) {
    return onLoadModule(this, query)
  },

  onShow() {
    return onShowModule(this)
  },

  async reloadCurrentData() {
    return reloadCurrentDataModule(this)
  },

  async loadPrepareData(entry = {}) {
    return loadPrepareDataModule(this, entry)
  },

  switchTab(event) {
    return switchTabModule(this, event)
  },

  noop() {},

  handlePlanSearch(event) {
    return handlePlanSearchModule(this, event)
  },

  handleActivitySearch(event) {
    return handleActivitySearchModule(this, event)
  },

  setPlanKindFilter(event) {
    return setPlanKindFilterModule(this, event)
  },

  setPlanTypeFilter(event) {
    return setPlanTypeFilterModule(this, event)
  },

  setPlanStatusFilter(event) {
    return setPlanStatusFilterModule(this, event)
  },

  setActivityKindFilter(event) {
    return setActivityKindFilterModule(this, event)
  },

  setActivitySceneFilter(event) {
    return setActivitySceneFilterModule(this, event)
  },

  refreshLists() {
    return refreshListsModule(this)
  },

  refreshPlans() {
    return refreshPlansModule(this)
  },

  refreshActivities() {
    return refreshActivitiesModule(this)
  },

  goPlanCreate() {
    return goPlanCreateModule(this)
  },

  closeCreateTemplateSelect() {
    return closeCreateTemplateSelectModule(this)
  },

  selectCreateTemplate(event) {
    return selectCreateTemplateModule(this, event)
  },

  goActivityCreate() {
    return goActivityCreateModule()
  },

  handlePlanTap(event) {
    return handlePlanTapModule(this, event)
  },

  handlePlanAction(event) {
    return handlePlanActionModule(this, event)
  },

  openDeliveredDetail(plan) {
    return openDeliveredDetailModule(plan)
  },

  openReviewActivity(plan) {
    return openReviewActivityModule(plan)
  },

  handlePlanOpenChange(event) {
    return handlePlanOpenChangeModule(this, event)
  },

  handleSwipeAction(event) {
    return handleSwipeActionModule(this, event)
  },

  async startTraining(plan) {
    return startTrainingModule(this, plan)
  },

  handleTemplateTap(event) {
    return handleTemplateTapModule(this, event)
  },

  applyTemplate(template) {
    return applyTemplateModule(template)
  },

  handleActivityTap(event) {
    return handleActivityTapModule(this, event)
  },

  handleActivityOpenChange(event) {
    return handleActivityOpenChangeModule(this, event)
  },

  handleActivitySwipeAction(event) {
    return handleActivitySwipeActionModule(this, event)
  },

  getPlanSwipeActions(item) {
    return getPlanSwipeActionsModule(item)
  },

  getActivitySwipeActions() {
    return getActivitySwipeActionsModule()
  }
})
