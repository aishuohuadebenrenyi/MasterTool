const { getPlanStatusText, normalizeStatusValue } = require('./status')

const TEMPLATE_ORDER = ['企业培训', '团建活动', '即兴演出', '即兴培训']
const TYPE_FILTERS = ['全部', '企业培训', '团建活动', '即兴演出', '即兴培训']
const KIND_FILTERS = ['全部', '我的方案', '个人模板', '公共模板', '收藏']
const STATUS_FILTERS = ['全部', '草稿', '已确认', '已交付', '已复盘']
const PHASE_COLORS = ['#4A7CF7', '#34C759', '#FF9500', '#AF52DE', '#FF3B30', '#5AC8FA']

function templateIcon(type) {
  if (type === '团建活动') return '/static/icons/icon-type-team.png'
  if (type === '即兴演出') return '/static/icons/icon-type-show.png'
  if (type === '即兴培训') return '/static/icons/icon-type-training.png'
  return '/static/icons/icon-type-corporate.png'
}

function enrichTemplateOption(template) {
  return {
    ...template,
    icon: template.icon || templateIcon(template.type),
    templateTagText: template.tagText || `${template.phaseCount || 0}段式`,
    templateSourceText: template.visibility === 'public' ? '公共模板' : '个人模板'
  }
}

function enrichPlan(plan) {
  const status = plan.status || 'draft'
  const type = plan.type || '企业培训'
  const normalizedStatus = normalizeStatusValue(status)
  const canOpenDeliveredDetail = normalizedStatus === 'delivered' || normalizedStatus === 'reviewed'
  const canGoReview = Boolean(plan.reviewSessionId) && canOpenDeliveredDetail
  const actionText = normalizedStatus === 'confirmed'
    ? '开课'
    : (normalizedStatus === 'reviewed' && canGoReview ? '查看复盘' : (normalizedStatus === 'delivered' && canGoReview ? '去复盘' : ''))
  return {
    ...plan,
    contentKind: 'plan',
    status: normalizedStatus,
    statusText: getPlanStatusText(status),
    typeText: type,
    kindText: '方案',
    metaText: `${type} · ${plan.participantCount || 0}人 · ${plan.durationMinutes || 0}分钟`,
    flowText: Array.isArray(plan.phases) ? plan.phases.map((phase) => phase.name).join(' -> ') : '',
    isFavorite: !!plan.isFavorite,
    canOpenDeliveredDetail,
    canGoReview,
    actionText,
    showPrimaryAction: normalizedStatus === 'confirmed' || canGoReview,
    canSwipe: true,
    actionCount: 3,
    swipeWidth: 360
  }
}

function enrichTemplate(template) {
  const type = template.type || '流程模板'
  const isPublic = template.visibility === 'public' || !!template.isPublic
  const actionCount = [template.canDelete, template.canTogglePinned, template.canToggleFavorite].filter(Boolean).length || 0
  return {
    ...template,
    contentKind: 'template',
    status: 'template',
    statusText: '模板',
    typeText: type,
    kindText: isPublic ? '公共模板' : '个人模板',
    badgeText: isPublic ? '公共模板' : '个人模板',
    phaseBadgeText: `${template.phaseCount || 0}段式`,
    metaText: `${type} · ${template.phaseCount || 0} 个环节`,
    icon: templateIcon(type),
    templateTagText: template.tagText || `${template.phaseCount || 0}段式`,
    templateSourceText: isPublic ? '公共模板' : '个人模板',
    isFavorite: !!template.isFavorite,
    isPublic,
    canDelete: !!template.canDelete,
    canTogglePinned: !!template.canTogglePinned,
    canToggleFavorite: !!template.canToggleFavorite,
    canSwipe: actionCount > 0,
    actionCount,
    swipeWidth: actionCount * 120
  }
}

function sortTemplates(list) {
  return list.slice().sort((left, right) => {
    const leftIndex = TEMPLATE_ORDER.indexOf(left.type || '')
    const rightIndex = TEMPLATE_ORDER.indexOf(right.type || '')
    const safeLeftIndex = leftIndex === -1 ? TEMPLATE_ORDER.length : leftIndex
    const safeRightIndex = rightIndex === -1 ? TEMPLATE_ORDER.length : rightIndex
    if (safeLeftIndex !== safeRightIndex) return safeLeftIndex - safeRightIndex
    return String(left.name || '').localeCompare(String(right.name || ''), 'zh-Hans-CN')
  })
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}分钟`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest > 0 ? `${hours}小时${rest}分钟` : `${hours}小时`
}

function buildPlan(source) {
  const phases = Array.isArray(source.phases) ? source.phases : []
  const duration = Number(source.durationMinutes || source.duration || phases.reduce((sum, item) => sum + Number(item.duration || item.minutes || 0), 0))
  return {
    _id: source._id || '',
    name: source.name || '培训方案',
    type: source.type || '企业培训',
    customerName: source.customerName || source.client || '',
    participantCount: Number(source.participantCount || source.people || 0),
    status: source.status || 'draft',
    duration,
    phases
  }
}

function normalizePreviewPhase(phase, index, totalDuration, viewMode) {
  const duration = Number(phase.duration || phase.minutes || 0)
  const percent = totalDuration > 0 ? Math.round((duration / totalDuration) * 100) : 0
  const activities = Array.isArray(phase.activities) ? phase.activities : []
  const activitySummary = activities.map((activity) => activity.name).filter(Boolean).join('、')
  return {
    ...phase,
    activities,
    activitySummary,
    hasActivities: activities.length > 0,
    activityCountText: `${activities.length}个活动`,
    indexText: `${index + 1}`,
    name: phase.name || `环节${index + 1}`,
    duration,
    durationText: `${duration}分钟 · ${percent}%`,
    percent,
    percentStyle: `width: ${percent}%; background-color: ${PHASE_COLORS[index % PHASE_COLORS.length]};`,
    dotStyle: `background-color: ${PHASE_COLORS[index % PHASE_COLORS.length]};`,
    note: viewMode === 'client'
      ? `参与体验：围绕「${phase.name || `环节${index + 1}`}」完成体验、交流与沉淀。`
      : '控场重点：说明目标、观察参与状态、按时间推进并记录复盘线索。'
  }
}

module.exports = {
  KIND_FILTERS,
  PHASE_COLORS,
  STATUS_FILTERS,
  TEMPLATE_ORDER,
  TYPE_FILTERS,
  buildPlan,
  enrichPlan,
  enrichTemplate,
  enrichTemplateOption,
  formatDuration,
  normalizePreviewPhase,
  sortTemplates,
  templateIcon
}
