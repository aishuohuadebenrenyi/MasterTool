const ACTIVITY_KIND_FILTERS = ['全部', '收藏']
const ACTIVITY_SCENES = ['全部', '团队融合', '协作沟通', '领导力', '创新思维', '情绪管理']

function enrichActivity(activity) {
  const sceneText = activity.category || (Array.isArray(activity.scenes) && activity.scenes.length ? activity.scenes[0] : '团队融合')
  return {
    ...activity,
    contentKind: 'activity',
    durationText: `${activity.durationMinutes || 0}分钟 · ${activity.peopleRange || '0-0人'}`,
    difficultyText: activity.difficulty || '中等',
    sceneText,
    isFavorite: !!activity.isFavorite,
    isPinned: !!activity.isPinned,
    canSwipe: true,
    swipeWidth: 360
  }
}

function normalizeActivity(activity) {
  const scenes = Array.isArray(activity.scenes) && activity.scenes.length
    ? activity.scenes
    : [activity.category || '团队融合']
  return {
    ...activity,
    scenes,
    difficulty: activity.difficulty || '中等',
    peopleRange: activity.peopleRange || '8-30人',
    durationText: `${activity.durationMinutes || 10}分钟`,
    objective: activity.objective || '快速建立连接，激活参与者表达。',
    rules: activity.rules || '培训师给出题目，参与者轮流回应；每次回应保持简短，重点放在倾听和接续。',
    reviewQuestions: activity.reviewQuestions || '刚才哪些回应让你印象最深？团队的节奏发生了什么变化？',
    leaderTips: activity.leaderTips || '控制节奏，及时鼓励，避免过早评价答案质量。'
  }
}

function buildPhaseActivityDetails(phases) {
  if (!Array.isArray(phases)) return []
  return phases.map((phase, index) => ({
    name: phase.name || `环节${index + 1}`,
    activities: Array.isArray(phase.activities)
      ? phase.activities
        .filter((activity) => activity && typeof activity === 'object' && activity.name)
        .map((activity) => ({
          activityId: activity.activityId || '',
          name: activity.name,
          category: activity.category || '活动',
          durationText: `${Number(activity.durationMinutes || activity.duration || 0)}分钟`
        }))
      : []
  }))
}

function buildActivitySummaryText(phases) {
  if (!Array.isArray(phases)) return ''
  const names = phases.flatMap((phase) => Array.isArray(phase.activities) ? phase.activities.map((activity) => activity && activity.name).filter(Boolean) : [])
  return names.length ? `关联活动：${names.join('、')}` : ''
}

function getFirstActivityId(phases) {
  for (const phase of phases || []) {
    if (!phase || typeof phase !== 'object') continue
    if (Array.isArray(phase.activities)) {
      const found = phase.activities.find((activity) => activity && typeof activity.activityId === 'string' && activity.activityId.trim())
      if (found) return found.activityId
    }
    if (typeof phase.activityId === 'string' && phase.activityId.trim()) {
      return phase.activityId
    }
  }
  return ''
}

module.exports = {
  ACTIVITY_KIND_FILTERS,
  ACTIVITY_SCENES,
  buildActivitySummaryText,
  buildPhaseActivityDetails,
  enrichActivity,
  getFirstActivityId,
  normalizeActivity
}
