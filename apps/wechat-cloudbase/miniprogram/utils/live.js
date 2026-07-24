const TOOL_ICONS = {
  checkin: '/static/icons/icon-tool-checkin.png',
  group: '/static/icons/icon-tool-group.png',
  score: '/static/icons/icon-tool-score.png',
  random: '/static/icons/icon-tool-random.png',
  interact: '/static/icons/icon-tool-interact.png',
  sound: '/static/icons/icon-tool-sound.png',
  timer: '/static/icons/icon-tool-timer.png',
  note: '/static/icons/icon-tool-note.png',
  toolbox: '/static/icons/icon-tool-toolbox.png'
}

const ALL_TOOLS = [
  { key: 'checkin', name: '签到', icon: TOOL_ICONS.checkin },
  { key: 'group', name: '分组', icon: TOOL_ICONS.group },
  { key: 'score', name: '积分', icon: TOOL_ICONS.score },
  { key: 'random', name: '随机', icon: TOOL_ICONS.random },
  { key: 'interact', name: '互动', icon: TOOL_ICONS.interact },
  { key: 'sound', name: '音效', icon: TOOL_ICONS.sound },
  { key: 'timer', name: '计时', icon: TOOL_ICONS.timer },
  { key: 'note', name: '笔记', icon: TOOL_ICONS.note }
]

const QUICK_TOOLS = [
  { key: 'checkin', name: '签到', icon: TOOL_ICONS.checkin },
  { key: 'group', name: '分组', icon: TOOL_ICONS.group },
  { key: 'score', name: '积分', icon: TOOL_ICONS.score },
  { key: 'toolbox', name: '工具箱', icon: TOOL_ICONS.toolbox }
]

const SOUND_SOURCES = {
  '欢呼': '/static/sounds/cheer.wav',
  '鼓掌': '/static/sounds/clap.wav',
  '铃声': '/static/sounds/bell.wav',
  '主题': '/static/sounds/theme.wav'
}

const COUNTDOWN_PRESETS = [60, 180, 300, 600, 900]

const SHEET_TITLES = {
  checkin: '签到管理',
  group: '分组管理',
  score: '积分管理',
  random: '随机抽取',
  interact: '互动工具',
  sound: '音效面板',
  timer: '独立计时',
  note: '培训笔记',
  toolbox: '工具箱'
}

const GROUP_COLORS = ['#4A7CF7', '#FF6B6B', '#51CF66', '#FFD43B', '#CC5DE8', '#FF922B', '#20C997', '#F06595', '#A9E34B', '#748FFC']

function pad(value) {
  return value < 10 ? `0${value}` : `${value}`
}

function formatSeconds(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${pad(mins)}:${pad(secs)}`
}

function formatPresetLabel(seconds) {
  if (seconds % 60 === 0) return `${seconds / 60}分钟`
  return `${seconds}秒`
}

function enrichParticipant(participant) {
  const name = participant.name || '匿名'
  return {
    ...participant,
    name,
    avatarText: name.slice(0, 1),
    checkedInAtText: participant.checkedInAtText || '刚刚'
  }
}

function formatScoreLogTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function normalizeScoreDetails(scoreDetails, groups = []) {
  const source = scoreDetails && typeof scoreDetails === 'object' && !Array.isArray(scoreDetails) ? scoreDetails : {}
  return groups.reduce((acc, group) => {
    const groupId = group.groupId
    const items = Array.isArray(source[groupId]) ? source[groupId] : []
    acc[groupId] = items
      .filter((item) => item && typeof item === 'object')
      .map((item) => {
        const delta = Number(item.delta || 0)
        const safeDelta = delta > 20 ? 20 : (delta < -20 ? -20 : delta)
        const reason = typeof item.reason === 'string' ? item.reason.trim() : ''
        const createdAt = Number(item.createdAt) || Date.now()
        return {
          delta: safeDelta,
          reason: reason || (safeDelta >= 0 ? '现场加分' : '现场扣分'),
          createdAt,
          deltaText: safeDelta > 0 ? `+${safeDelta}` : `${safeDelta}`,
          timeText: formatScoreLogTime(createdAt)
        }
      })
      .filter((item) => item.delta !== 0)
      .slice(0, 20)
    return acc
  }, {})
}

function serializeScoreDetails(scoreDetails = {}) {
  return Object.keys(scoreDetails).reduce((acc, groupId) => {
    const items = Array.isArray(scoreDetails[groupId]) ? scoreDetails[groupId] : []
    acc[groupId] = items.map((item) => ({
      delta: Number(item.delta || 0),
      reason: typeof item.reason === 'string' ? item.reason : '',
      createdAt: Number(item.createdAt) || Date.now()
    }))
    return acc
  }, {})
}

function normalizePhase(phase, index) {
  const name = phase.name || phase.type || `环节${index + 1}`
  const minutes = Math.max(1, Number(phase.duration || phase.minutes || 1))
  const reminders = Array.isArray(phase.reminders) && phase.reminders.length
    ? phase.reminders
    : ['注意时间控制', '关注参与者状态', '按当前目标推进并记录复盘线索']
  const activities = Array.isArray(phase.activities)
    ? phase.activities
      .filter((activity) => activity && typeof activity === 'object' && activity.name)
      .map((activity) => ({
        name: activity.name,
        category: activity.category || '活动'
      }))
    : []
  return { name, minutes, reminders, activities }
}

function shuffleList(list) {
  const next = list.slice()
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = next[i]
    next[i] = next[j]
    next[j] = tmp
  }
  return next
}

function buildGroups(participants, teamCount, method = 'average') {
  const source = method === 'random' ? shuffleList(participants) : participants
  const groups = Array.from({ length: teamCount }, (_, index) => ({
    groupId: `group-${index + 1}`,
    name: `第${index + 1}组`,
    color: GROUP_COLORS[index % GROUP_COLORS.length],
    score: 0,
    members: [],
    membersText: '暂无成员'
  }))
  source.forEach((participant, index) => {
    groups[index % teamCount].members.push(participant.name)
  })
  groups.forEach((group) => {
    group.membersText = group.members.length ? group.members.join('、') : '暂无成员'
  })
  return groups
}

function hydrateGroups(groups) {
  if (!Array.isArray(groups)) return []
  return groups.map((group, index) => {
    const members = Array.isArray(group.members) ? group.members.filter((item) => typeof item === 'string' && item.trim()) : []
    return {
      groupId: group.groupId || `group-${index + 1}`,
      name: group.name || `第${index + 1}组`,
      color: group.color || GROUP_COLORS[index % GROUP_COLORS.length],
      score: Math.max(0, Number(group.score) || 0),
      members,
      membersText: members.length ? members.join('、') : '暂无成员'
    }
  })
}

module.exports = {
  ALL_TOOLS,
  COUNTDOWN_PRESETS,
  QUICK_TOOLS,
  SHEET_TITLES,
  SOUND_SOURCES,
  buildGroups,
  enrichParticipant,
  formatPresetLabel,
  formatScoreLogTime,
  formatSeconds,
  hydrateGroups,
  normalizePhase,
  normalizeScoreDetails,
  pad,
  serializeScoreDetails
}
