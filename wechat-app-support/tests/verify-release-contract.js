const assert = require('assert')
const fs = require('fs')
const path = require('path')

const appRoot = path.resolve(__dirname, '../../wechat-app')
const supportRoot = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf8')
}

function readSupport(relativePath) {
  return fs.readFileSync(path.join(supportRoot, relativePath), 'utf8')
}

function parseJsonLines(source) {
  const lines = source
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  return lines.map((line) => JSON.parse(line))
}

function assertIncludes(source, text, label) {
  assert(source.includes(text), `${label} should include ${text}`)
}

function assertNotIncludes(source, text, label) {
  assert(!source.includes(text), `${label} should not include ${text}`)
}

const trainerApi = read('cloudfunctions/trainer-api/index.js')
const liveApi = read('cloudfunctions/live-api/index.js')
const liveApiShared = read('cloudfunctions/live-api/_shared.js')
const reviewApi = read('cloudfunctions/review-api/index.js')
const liveApiConfig = read('cloudfunctions/live-api/config.json')
const preparePage = read('miniprogram/pages/prepare/index/index.js')
const preparePageView = read('miniprogram/pages/prepare/index/index.wxml')
const homePage = read('miniprogram/pages/home/index/index.js')
const livePage = read('miniprogram/pages/live/index/index.js')
const reviewCenterPage = read('miniprogram/pages/review/index/index.js')
const reviewDetailPage = read('miniprogram/pages/review/detail/index.js')
const planEditPage = read('miniprogram/pages/plan/edit/index.js')
const planEditView = read('miniprogram/pages/plan/edit/index.wxml')
const planPreviewPage = read('miniprogram/pages/plan/preview/index.js')
const planPreviewView = read('miniprogram/pages/plan/preview/index.wxml')
const mineIndexPage = read('miniprogram/pages/mine/index/index.js')
const liveEndPage = read('miniprogram/pages/live/end/index.js')
const pageUtils = read('miniprogram/utils/page.js')
const navigationUtils = read('miniprogram/utils/navigation.js')
const statusUtils = read('miniprogram/utils/status.js')
const planUtils = read('miniprogram/utils/plan.js')
const activityUtils = read('miniprogram/utils/activity.js')
const sessionUtils = read('miniprogram/utils/session.js')
const requestStateUtils = read('miniprogram/utils/request-state.js')
const sceneUtils = read('miniprogram/utils/scene.js')
const livePageView = read('miniprogram/pages/live/index/index.wxml')
const feedbackPageView = read('miniprogram/pages/feedback/index/index.wxml')
const reviewCenterView = read('miniprogram/pages/review/index/index.wxml')
const reviewDetailView = read('miniprogram/pages/review/detail/index.wxml')
const preparePageConfig = read('miniprogram/pages/prepare/index/index.json')
const feedbackPageConfig = read('miniprogram/pages/feedback/index/index.json')
const reviewPageConfig = read('miniprogram/pages/review/index/index.json')
const settingsPageConfig = read('miniprogram/pages/mine/settings/index.json')
const participantCheckinPage = read('miniprogram/pages/participant/checkin/index.js')
const participantFeedbackPage = read('miniprogram/pages/participant/feedback/index.js')
const participantInteractionPage = read('miniprogram/pages/participant/interaction/index.js')
const seed = JSON.parse(readSupport('test-data/cloudbase-seed.json'))
const importableDir = path.join(supportRoot, 'test-data/importable-jsonl')
const importableFiles = fs.readdirSync(importableDir)
const directImportDir = path.join(importableDir, 'direct-import')
const needUserIdDir = path.join(importableDir, 'need-user-id')
const directImportCollections = [
  'participants',
  'feedback',
  'interaction_submissions',
]
const needUserIdCollections = [
  'templates',
  'plans',
  'activities',
  'live_sessions',
  'interactions'
]
const createOnlyCollections = [
  'users',
  'trainer_profiles',
  'reviews',
  'session_notes',
  'support_feedback',
  'operation_logs'
]

;[
  'listTrainingRecords',
  'getDataOverview',
  'deletePlan',
  'updatePlanFlags',
  'savePlanAsTemplate',
  'getPlanDetail',
  'getActivityDetail'
].forEach((action) => assertIncludes(trainerApi, action, 'trainer-api'))

assertIncludes(liveApi, 'saveNote', 'live-api')
assertIncludes(liveApi, 'createInteraction', 'live-api')
assertIncludes(liveApi, 'getInteractionStats', 'live-api')
assertIncludes(liveApi, 'saveGroupState', 'live-api')
assertIncludes(liveApi, 'saveScoreState', 'live-api')
assertIncludes(liveApi, 'saveRandomState', 'live-api')
assertIncludes(liveApi, 'abandonSession', 'live-api')
assertIncludes(liveApi, 'getSessionEntryCode', 'live-api')
assertIncludes(liveApi, 'getInteractionEntryCode', 'live-api')
assertIncludes(liveApi, 'generateMiniCode', 'live-api')
assertIncludes(liveApi, 'generateUrlLink', 'live-api')
assertIncludes(liveApiShared, 'async function generateMiniCode', 'live-api shared')
assertIncludes(liveApiShared, 'async function generateUrlLink', 'live-api shared')
assertIncludes(liveApiShared, 'cloud.openapi.wxacode.getUnlimited', 'live-api shared')
assertIncludes(liveApi, 'db.runTransaction', 'live-api')
assertIncludes(reviewApi, 'db.runTransaction', 'review-api')
assertIncludes(reviewApi, 'getReviewDetail', 'review-api')
assertIncludes(reviewApi, 'activitySummaryText', 'review-api activity summary')
assertIncludes(liveApiConfig, 'wxacode.getUnlimited', 'live-api config')
assertIncludes(liveApiConfig, 'urlLink.generate', 'live-api config')

assertNotIncludes(preparePage, 'mock-data', 'prepare page')
assertNotIncludes(livePage, 'mock-data', 'live page')
assertIncludes(homePage, 'hasTodoItems', 'home page todo visibility')
assertIncludes(homePage, "planKind: '我的方案'", 'home page prepare entry kind')
assertIncludes(mineIndexPage, "navigateTo('/pages/review/index/index?filter=pending')", 'mine page pending review redirect')
assertIncludes(liveEndPage, 'activity-detail/index?sessionId=', 'live end review entry')
assertIncludes(livePage, 'createInteraction', 'live page')
assertIncludes(livePage, 'playSound', 'live page')
assertIncludes(livePage, 'COUNTDOWN_PRESETS', 'live page countdown presets')
assertIncludes(livePage, 'loadCheckinCode', 'live page')
assertIncludes(livePage, 'generateInteractionCode', 'live page')
assertIncludes(livePage, 'phaseActivities', 'live page phase activities')
assertIncludes(livePage, 'scoreDetails', 'live page detailed score state')
assertIncludes(livePage, 'applyDetailedScore', 'live page detailed score action')
assertIncludes(livePageView, '本环节活动', 'live page phase activity section')
assertIncludes(livePageView, 'entry-code-card', 'live page entry code component')
assertIncludes(livePageView, '积分流水', 'live page detailed score history')
assertNotIncludes(livePage, 'previewCheckinEntry()', 'live page checkin preview handler removal')
assertNotIncludes(livePageView, 'bindprimarytap="previewCheckinEntry"', 'live page checkin preview binding removal')
assertIncludes(preparePage, "navigateTo(`/pages/plan/edit/index?id=${plan._id}`)", 'prepare page confirmed plan edit entry')
assertIncludes(preparePage, '.filter((item) => item.isPublic)', 'prepare page public create templates')
assertIncludes(preparePage, "firstTabText: '我的方案'", 'prepare page first tab label')
assertIncludes(preparePage, "secondTabText: '活动库'", 'prepare page second tab label')
assertIncludes(preparePage, 'setActivityKindFilter', 'prepare page activity favorite filter')
assertIncludes(preparePage, 'handleActivitySwipeAction', 'prepare page activity swipe actions')
assertIncludes(preparePage, 'BLANK_TEMPLATE_OPTION', 'prepare page blank create option')
assertIncludes(preparePageView, 'swipe-action-item', 'prepare page swipe component')
assertIncludes(preparePageView, 'empty-state', 'prepare page empty state component')
assertIncludes(preparePageConfig, 'swipe-action-item', 'prepare page using components')
assertIncludes(planEditPage, 'openPhaseActivityPicker', 'plan edit phase activity picker')
assertIncludes(planEditPage, 'selectActivityPhase', 'plan edit select activity phase')
assertIncludes(planEditPage, 'removePhaseActivity', 'plan edit remove phase activity')
assertIncludes(planEditPage, 'saveDraft', 'plan edit save draft action')
assertIncludes(planEditPage, 'icon-phase-opening.png', 'plan edit existing icon fallback')
assertIncludes(planEditPage, 'icon-phase-summary.png', 'plan edit existing summary icon fallback')
assertIncludes(planEditView, '选活动', 'plan edit phase activity add entry')
assertIncludes(planEditView, '保存草稿', 'plan edit save draft button')
assertIncludes(planUtils, 'activityCountText', 'plan utils phase activity summary')
assertIncludes(planUtils, 'canOpenDeliveredDetail', 'plan utils delivered detail state')
assertIncludes(planUtils, 'canGoReview', 'plan utils review action state')
assertIncludes(planPreviewView, '关联活动', 'plan preview activity display')
assertIncludes(planPreviewPage, 'savePlanDraft', 'plan preview auto save before template')
assertIncludes(preparePage, 'activity-detail/index?sessionId=', 'prepare page delivered review detail entry')
assertIncludes(preparePage, 'openDeliveredDetail', 'prepare page delivered detail entry handler')
assertIncludes(preparePage, 'latestSessionId', 'prepare page delivered detail fallback session')
assertIncludes(preparePageView, 'item.actionText', 'prepare page dynamic review action')
assertIncludes(reviewCenterPage, "filters: ['待复盘', '已复盘']", 'review center filters')
assertIncludes(sessionUtils, 'flowText', 'session utils flow details')
assertIncludes(reviewCenterView, 'sub-page-layout', 'review center layout component')
assertIncludes(reviewCenterView, 'empty-state', 'review center empty state component')
assertIncludes(reviewPageConfig, 'sub-page-layout', 'review page using components')
assertIncludes(reviewApi, 'customerName', 'review api session customer details')
assertIncludes(trainerApi, 'reviewSessionId', 'trainer-api plan review session mapping')
assertIncludes(trainerApi, 'latestSessionStatus', 'trainer-api latest session mapping')
assertIncludes(trainerApi, 'isPinned', 'trainer-api activity pin support')
assertIncludes(trainerApi, 'activityId', 'trainer-api phase activity binding')
assertIncludes(trainerApi, 'activities:', 'trainer-api phase multi-activities')
assertIncludes(reviewDetailPage, '当前活动尚未结束', 'review detail page review status guard')
assertIncludes(reviewDetailPage, 'persistCurrentAnswer()', 'review detail framework switch save')
assertIncludes(read('miniprogram/pages/plan/activity-detail/index.js'), '当前交付场次缺失，暂时无法复盘', 'activity detail review missing session hint')
assertIncludes(read('miniprogram/pages/plan/activity-detail/index.js'), '进入复盘失败，请稍后重试', 'activity detail review navigation fail hint')
assertIncludes(reviewDetailView, 'sub-page-layout', 'review detail layout component')
assertIncludes(feedbackPageView, 'entry-code-card', 'feedback page entry code component')
assertIncludes(feedbackPageView, 'sub-page-layout', 'feedback page layout component')
assertIncludes(feedbackPageConfig, 'entry-code-card', 'feedback page using components')
assertIncludes(settingsPageConfig, 'sub-page-layout', 'settings page using components')
assertIncludes(pageUtils, 'goBackOrSwitchTab', 'page utils navigation re-export')
assertIncludes(navigationUtils, 'goBackOrNavigate', 'navigation utils goBackOrNavigate')
assertIncludes(statusUtils, 'getPlanStatusText', 'status utils plan text')
assertIncludes(statusUtils, 'getSessionStatusText', 'status utils session text')
assertIncludes(planUtils, 'normalizePreviewPhase', 'plan utils preview phase helper')
assertIncludes(activityUtils, 'buildPhaseActivityDetails', 'activity utils phase activity helper')
assertIncludes(sessionUtils, 'normalizeReviewSession', 'session utils review session helper')
assertIncludes(requestStateUtils, 'buildRequestState', 'request state utils')
assertIncludes(sceneUtils, 'resolveSceneParams', 'scene utils resolver')
assertIncludes(participantCheckinPage, 'resolveSceneParams', 'participant checkin page')
assertIncludes(participantFeedbackPage, 'resolveSceneParams', 'participant feedback page')
assertIncludes(participantInteractionPage, 'resolveSceneParams', 'participant interaction page')
assertIncludes(participantInteractionPage, 'entryKey', 'participant interaction short entry key')
assertIncludes(trainerApi, "visibility: 'private'", 'trainer-api template visibility')
assertIncludes(trainerApi, '公共模板不允许删除', 'trainer-api public template delete guard')
assertIncludes(preparePage, '公共模板', 'prepare page public template filter')
assertIncludes(liveApi, 'scoreDetails', 'live-api detailed score persistence')
assertNotIncludes(liveApi, "status: 'delivered',\n            latestSessionId: created._id", 'live-api start session delivered status removal')
assertIncludes(liveApi, "status: 'delivered'", 'live-api delivered status still exists for end session')
assertIncludes(reviewApi, "status: 'reviewed'", 'review-api reviewed status update')
assertIncludes(reviewApi, 'latest.data.planId', 'review-api plan status sync')

assert(Array.isArray(seed.templates) && seed.templates.length > 0, 'seed templates are required')
assert(Array.isArray(seed.plans) && seed.plans.length > 0, 'seed plans are required')
assert(Array.isArray(seed.activities) && seed.activities.length > 0, 'seed activities are required')
assert(seed.plans.every((plan) => Array.isArray(plan.phases) && plan.phases.length > 0), 'seed plans need phases')
assert(seed.templates.some((template) => template.visibility === 'public'), 'seed templates need public templates')
assert(seed.templates.some((template) => template.visibility === 'private'), 'seed templates need private templates')
assert(seed.templates.filter((template) => template.visibility === 'public').length === 4, 'seed templates need exactly four public templates')

assert(importableFiles.includes('direct-import'), 'direct-import folder is required')
assert(importableFiles.includes('need-user-id'), 'need-user-id folder is required')

directImportCollections.forEach((name) => {
  assert(fs.existsSync(path.join(directImportDir, `${name}.json`)), `missing direct-import file for ${name}`)
  const content = parseJsonLines(readSupport(`test-data/importable-jsonl/direct-import/${name}.json`))
  assert(Array.isArray(content) && content.length > 0, `${name}.json should be JSON Lines data`)
})

needUserIdCollections.forEach((name) => {
  assert(fs.existsSync(path.join(needUserIdDir, `${name}.json`)), `missing need-user-id file for ${name}`)
  const raw = readSupport(`test-data/importable-jsonl/need-user-id/${name}.json`)
  const content = parseJsonLines(raw)
  assert(Array.isArray(content) && content.length > 0, `${name}.json should be JSON Lines data`)
  const hasPlaceholder = raw.includes('REPLACE_WITH_USER_ID')
  const hasResolvedUserId = /[a-f0-9]{32}/.test(raw)
  assert(hasPlaceholder || hasResolvedUserId, `${name}.json should include REPLACE_WITH_USER_ID or the resolved test user id`)
})

;['participants', 'interaction_submissions', 'feedback'].forEach((name) => {
  const raw = readSupport(`test-data/importable-jsonl/direct-import/${name}.json`)
  assert(!raw.includes('REPLACE_WITH_USER_ID'), `${name}.json should not include REPLACE_WITH_USER_ID`)
})

createOnlyCollections.forEach((name) => {
  assert(!fs.existsSync(path.join(directImportDir, `${name}.json`)), `${name}.json should be removed from direct-import`)
})

assert(fs.existsSync(path.join(importableDir, 'README.md')), 'importable README is required')

console.log('release contract ok')
