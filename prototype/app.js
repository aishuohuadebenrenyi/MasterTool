var TEMPLATE_TYPES = {
  corporate: {
    name: '企业培训',
    icon: '🎯',
    desc: '开场→活动→复盘→提炼→承诺',
    tag: '5段式',
    phases: [
      { name: '开场连接', time: 15, color: '#FF6B35', icon: '🤝' },
      { name: '主题导入', time: 20, color: '#007AFF', icon: '⚡' },
      { name: '深度探索', time: 40, color: '#5856D6', icon: '🔍' },
      { name: '实践应用', time: 30, color: '#34C759', icon: '💡' },
      { name: '总结收束', time: 15, color: '#FF9500', icon: '🎯' }
    ],
    toolbar: [
      { icon: '✋', label: '签到', action: 'openCheckin' },
      { icon: '👥', label: '分组', action: 'openGroup' },
      { icon: '🏆', label: '积分', action: 'openScore' },
      { icon: '🧰', label: '工具箱', action: 'openToolbox' }
    ]
  },
  teambuilding: {
    name: '团建活动',
    icon: '🎉',
    desc: '破冰→团队挑战→轻松复盘',
    tag: '三段式',
    phases: [
      { name: '破冰热身', time: 20, color: '#FF6B35', icon: '🤝' },
      { name: '团队挑战', time: 60, color: '#007AFF', icon: '⚡' },
      { name: '分享庆祝', time: 20, color: '#34C759', icon: '🎯' }
    ],
    toolbar: [
      { icon: '👥', label: '分组', action: 'openGroup' },
      { icon: '🏆', label: '积分', action: 'openScore' },
      { icon: '💬', label: '互动', action: 'openInteract' },
      { icon: '🧰', label: '工具箱', action: 'openToolbox' }
    ]
  },
  improv_show: {
    name: '即兴演出',
    icon: '🎭',
    desc: '暖场→即兴表演→观众互动→谢幕',
    tag: '游戏轮',
    phases: [
      { name: '暖场互动', time: 10, color: '#FF6B35', icon: '🤝' },
      { name: '即兴表演', time: 40, color: '#5856D6', icon: '🎭' },
      { name: '观众互动', time: 15, color: '#007AFF', icon: '💬' },
      { name: '谢幕总结', time: 5, color: '#34C759', icon: '🎯' }
    ],
    toolbar: [
      { icon: '🎲', label: '抽取', action: 'openPick' },
      { icon: '⏱', label: '计时', action: 'openStandaloneTimer' },
      { icon: '🔊', label: '音效', action: 'openSound' },
      { icon: '🧰', label: '工具箱', action: 'openToolbox' }
    ]
  },
  improv_training: {
    name: '即兴训练',
    icon: '🏋️',
    desc: '热身→技能训练→综合练习',
    tag: '自由组合',
    phases: [
      { name: '热身练习', time: 10, color: '#FF6B35', icon: '🤝' },
      { name: '技能训练', time: 30, color: '#007AFF', icon: '⚡' },
      { name: '综合练习', time: 30, color: '#5856D6', icon: '🔍' }
    ],
    toolbar: [
      { icon: '⏱', label: '计时', action: 'openStandaloneTimer' },
      { icon: '🎲', label: '抽取', action: 'openPick' },
      { icon: '🧰', label: '工具箱', action: 'openToolbox' }
    ],
    canAddSegments: true
  }
};

var MOCK_PLANS = [
  { id: 1, name: 'XX公司团队融合工作坊', client: 'XX科技', type: 'corporate', status: 'confirmed', people: 28, scenes: ['团队融合', '协作沟通'], phases: TEMPLATE_TYPES.corporate.phases, date: '2026-05-20', duration: 120 },
  { id: 2, name: '年度团建活动', client: 'YY集团', type: 'teambuilding', status: 'draft', people: 40, scenes: ['团队融合'], phases: TEMPLATE_TYPES.teambuilding.phases, date: '2026-05-18', duration: 100 },
  { id: 3, name: '即兴演出之夜', client: '内部活动', type: 'improv_show', status: 'draft', people: 20, scenes: ['创新思维'], phases: TEMPLATE_TYPES.improv_show.phases, date: '2026-05-15', duration: 70 },
  { id: 4, name: '领导力发展培训', client: 'ZZ公司', type: 'corporate', status: 'delivered', people: 16, scenes: ['领导力', '协作沟通'], phases: TEMPLATE_TYPES.corporate.phases, date: '2026-05-22', duration: 120 },
  { id: 5, name: '即兴训练工作坊', client: '内部活动', type: 'improv_training', status: 'draft', people: 12, scenes: ['创新思维'], phases: TEMPLATE_TYPES.improv_training.phases, date: '2026-05-10', duration: 70 }
];

var MOCK_ACTIVITIES = [
  { id: 1, name: '盲人方阵', scenes: ['团队融合', '协作沟通'], difficulty: '中等', people: '8-15人', duration: '30min', goal: '提升团队沟通与协作能力', rules: '全体蒙眼，在规定时间内将绳子拉成指定形状', reviewQuestions: '沟通中遇到了什么困难？如何克服的？', tips: '注意安全，观察者不提示', isCustom: true, favorited: false },
  { id: 2, name: '极速60秒', scenes: ['团队融合', '创新思维'], difficulty: '中等', people: '10-20人', duration: '45min', goal: '培养团队分工与信息共享能力', rules: '60秒内将30张图片按逻辑排序', reviewQuestions: '分工是否合理？信息共享是否充分？', tips: '可设置多轮挑战', isCustom: true, favorited: true },
  { id: 3, name: '信任背摔', scenes: ['团队融合'], difficulty: '困难', people: '8-12人', duration: '20min', goal: '建立团队信任感', rules: '一人背向倒下，队友接住', reviewQuestions: '信任是如何建立的？', tips: '确保安全措施到位', isCustom: false, favorited: false, riskLevel: '高' },
  { id: 4, name: '即兴故事接龙', scenes: ['创新思维', '情绪管理'], difficulty: '简单', people: '5-15人', duration: '15min', goal: '激发创造力与倾听能力', rules: '每人接一句话，共同创作故事', reviewQuestions: '故事走向是否如你预期？', tips: '鼓励天马行空的想法', isCustom: false, favorited: true },
  { id: 5, name: '情绪天气预报', scenes: ['情绪管理'], difficulty: '简单', people: '8-20人', duration: '10min', goal: '觉察和表达情绪状态', rules: '用天气形容当前心情并分享', reviewQuestions: '分享后心情有变化吗？', tips: '营造不评判的氛围', isCustom: false, favorited: false },
  { id: 6, name: '领导力沙盘', scenes: ['领导力', '协作沟通'], difficulty: '困难', people: '6-12人', duration: '60min', goal: '体验不同领导风格的效果', rules: '分组完成沙盘任务，每轮换领导者', reviewQuestions: '不同领导风格带来了什么不同效果？', tips: '观察并记录领导行为', isCustom: false, favorited: false }
];

var MOCK_PARTICIPANTS = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑一', '冯二', '陈三', '褚四', '卫五', '蒋六', '沈七', '韩八', '杨九', '朱十', '秦一', '许二', '何三', '吕四', '施五', '张六', '孔七', '曹八', '严九', '华十'];

var REVIEW_METHODS = {
  ORID: [
    'O-客观：刚才的活动中，你观察到了什么？',
    'R-感受：这让你有什么感受？',
    'I-思考：这让你想到了什么？有什么启发？',
    'D-决定：接下来你会怎么做？'
  ],
  '4F': [
    'Facts-事实：发生了什么事？',
    'Feelings-感受：你有什么感受？',
    'Findings-发现：你发现了什么？',
    'Future-未来：未来你会怎么做？'
  ],
  SSC: [
    'S-Stop：有什么需要停止做的？',
    'S-Start：有什么需要开始做的？',
    'C-Continue：有什么需要继续做的？'
  ]
};

var MOCK_FEEDBACKS = [
  { author: '张三', stars: 5, text: '非常棒的培训体验，收获很大！', anonymous: false },
  { author: '匿名参与者', stars: 4, text: '整体不错，但时间可以再充裕一些', anonymous: true },
  { author: '李四', stars: 5, text: '培训师很专业，互动环节设计得很好', anonymous: false },
  { author: '匿名参与者', stars: 3, text: '有些环节节奏偏快，跟不上', anonymous: true },
  { author: '王五', stars: 5, text: '团队协作环节特别有趣！', anonymous: false }
];

var state = {
  currentPage: 'home',
  pageStack: [],
  currentPlan: null,
  currentActivity: null,
  editingActivity: null,
  templateType: 'corporate',
  livePhaseIndex: 0,
  timerRunning: false,
  timerSeconds: 900,
  timerInterval: null,
  standaloneTimerRunning: false,
  standaloneTimerSeconds: 300,
  standaloneTimerInterval: null,
  confirmCallback: null,
  pickTab: 'actor',
  pickCount: 1,
  pickCategory: '即兴',
  reviewMethod: 'ORID',
  reviewIndex: 0,
  reviewNotes: [],
  activeFilter: '全部',
  searchQuery: '',
  planSearchQuery: '',
  planTypeFilter: '全部',
  planStatusFilter: '全部',
  addingToPhaseIndex: 0,
  prepareSubTab: 'plans',
  quickTemplateType: null,
  anonymousAllowed: true,
  teams: [],
  groups: [],
  checkedIn: [],
  prepConfig: {
    people: 28,
    checkin: '扫码签到',
    groupMethod: '按人数均分',
    teamCount: 0,
    scoreMode: '简化模式'
  },
  liveNotes: []
};

function renderTodoList() {
  var container = document.getElementById('todoList');
  if (!container) return;
  var html = '';
  var pendingPlans = MOCK_PLANS.filter(function(p) { return p.status === 'confirmed'; });
  var draftPlans = MOCK_PLANS.filter(function(p) { return p.status === 'draft'; });
  var deliveredPlans = MOCK_PLANS.filter(function(p) { return p.status === 'delivered'; });
  
  if (pendingPlans.length > 0) {
    var pendingName = pendingPlans.length === 1 ? pendingPlans[0].name : pendingPlans[0].name + '等' + pendingPlans.length + '个方案';
    html += '<div class="todo-item" data-action="gotoPrepConfirm" data-plan-id="' + pendingPlans[0].id + '">' +
      '<div class="todo-icon todo-icon-urgent">🔴</div>' +
      '<div class="todo-info">' +
        '<div class="todo-title">' + pendingName + '待交付</div>' +
        '<div class="todo-desc">已确认，可以开始培训</div>' +
      '</div>' +
      '<span class="todo-arrow">›</span>' +
    '</div>';
  }
  
  if (deliveredPlans.length > 0) {
    var deliveredName = deliveredPlans.length === 1 ? deliveredPlans[0].name : deliveredPlans[0].name + '等' + deliveredPlans.length + '场培训';
    html += '<div class="todo-item" data-action="gotoReviewCenter">' +
      '<div class="todo-icon todo-icon-pending">📋</div>' +
      '<div class="todo-info">' +
        '<div class="todo-title">' + deliveredName + '待复盘</div>' +
        '<div class="todo-desc">查看反馈数据，完成复盘总结</div>' +
      '</div>' +
      '<span class="todo-arrow">›</span>' +
    '</div>';
  }
  
  if (draftPlans.length > 0) {
    var draftName = draftPlans.length === 1 ? draftPlans[0].name : draftPlans[0].name + '等' + draftPlans.length + '个方案';
    html += '<div class="todo-item" data-action="gotoDraftEdit" data-plan-id="' + draftPlans[0].id + '">' +
      '<div class="todo-icon todo-icon-draft">📝</div>' +
      '<div class="todo-info">' +
        '<div class="todo-title">' + draftName + '草稿</div>' +
        '<div class="todo-desc">完善方案信息后即可开课</div>' +
      '</div>' +
      '<span class="todo-arrow">›</span>' +
    '</div>';
  }
  
  if (!html) {
    html = '<div class="todo-empty">🎉 暂无待处理事项</div>';
  }
  
  container.innerHTML = html;

  var reviewCardStatus = document.getElementById('reviewCardStatus');
  if (reviewCardStatus) {
    if (deliveredPlans.length > 0) {
      reviewCardStatus.textContent = deliveredPlans.length + '场待复盘';
    } else {
      reviewCardStatus.textContent = '查看复盘记录';
    }
  }
}

function init() {
  renderPlanCenterList();
  renderActivityList();
  renderPlanSelectSheet();
  renderTemplateGrid();
  renderFlowTemplateList();
  renderTemplateModalList();
  renderToolbar();
  renderCheckinList();
  renderGroupList();
  renderScoreList();
  renderSatisfactionChart();
  renderFeedbackList();
  renderTodoList();
  renderReviewList();
  bindEvents();
}

function navigateTo(pageName, skipAnimation) {
  var pages = document.querySelectorAll('.page');
  var targetPage = document.querySelector('[data-page="' + pageName + '"]');
  if (!targetPage) return;

  if (state.currentPage === pageName) return;

  var currentPage = document.querySelector('.page.active');
  if (currentPage) {
    if (!skipAnimation) {
      currentPage.classList.remove('active');
      currentPage.classList.add('slide-left');
      setTimeout(function() {
        currentPage.classList.remove('slide-left');
      }, 300);
    } else {
      currentPage.classList.remove('active');
    }
  }

  if (state.pageStack.indexOf(pageName) === -1 || skipAnimation) {
    state.pageStack.push(state.currentPage);
  }

  targetPage.classList.add('active');
  state.currentPage = pageName;
}

function goBack() {
  if (state.pageStack.length > 0) {
    var prevPage = state.pageStack.pop();
    var currentPage = document.querySelector('.page.active');
    if (currentPage) currentPage.classList.remove('active');

    var prevPageEl = document.querySelector('[data-page="' + prevPage + '"]');
    if (prevPageEl) {
      prevPageEl.classList.add('active');
    }
    state.currentPage = prevPage;
  }
}

function switchTab(tabName) {
  var tabPages = ['home', 'prepare', 'mine'];
  if (tabPages.indexOf(tabName) === -1) return;

  document.querySelectorAll('.page').forEach(function(p) { p.classList.remove('active'); });
  var target = document.querySelector('[data-page="' + tabName + '"]');
  if (target) target.classList.add('active');

  state.currentPage = tabName;
  state.pageStack = [];

  document.querySelectorAll('.tab-item').forEach(function(t) { t.classList.remove('active'); });
  document.querySelectorAll('.tab-item[data-tab="' + tabName + '"]').forEach(function(t) { t.classList.add('active'); });
}

function switchSubTab(tabName) {
  state.prepareSubTab = tabName;
  document.querySelectorAll('.sub-tab').forEach(function(t) { t.classList.remove('active'); });
  document.querySelector('.sub-tab[data-sub-tab="' + tabName + '"]').classList.add('active');
  document.querySelectorAll('.sub-tab-content').forEach(function(c) { c.classList.remove('active'); });
  document.getElementById(tabName === 'plans' ? 'plansContent' : 'activitiesContent').classList.add('active');
}

var sheetZIndex = 200;
function openSheet(sheetId) {
  var sheet = document.getElementById(sheetId);
  if (sheet) {
    sheetZIndex += 10;
    sheet.style.zIndex = sheetZIndex;
    sheet.classList.add('open');
  }
}

function closeSheet() {
  var openSheets = document.querySelectorAll('.half-sheet.open');
  if (openSheets.length > 0) {
    var topSheet = openSheets[openSheets.length - 1];
    topSheet.classList.remove('open');
    sheetZIndex = Math.max(200, sheetZIndex - 10);
  }
}

function showActivityPicker() {
  var popup = document.getElementById('activityPickerPopup');
  if (popup) popup.classList.add('open');
  renderActivityPickerList();
}

function hideActivityPicker() {
  var popup = document.getElementById('activityPickerPopup');
  if (popup) popup.classList.remove('open');
}

function showAddToPlanSheet() {
  var popup = document.getElementById('addToPlanSheet');
  document.getElementById('addToPlanTitle').textContent = '选择方案';
  document.getElementById('addToPlanPlanList').style.display = '';
  document.getElementById('addToPlanPhaseList').style.display = 'none';
  renderAddToPlanList();
  popup.classList.add('open');
}

function renderAddToPlanList() {
  var container = document.getElementById('addToPlanPlanList');
  var html = '';
  MOCK_PLANS.forEach(function(plan) {
    var typeInfo = TEMPLATE_TYPES[plan.type];
    html += '<div class="plan-select-card" data-action="selectPlanForAdd" data-plan-id="' + plan.id + '">' +
      '<div class="plan-select-name">' + plan.name + '</div>' +
      '<div class="plan-select-meta">' +
        '<span>' + plan.client + '</span>' +
        '<span>·</span>' +
        '<span>' + typeInfo.icon + ' ' + typeInfo.name + '</span>' +
      '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

function renderAddToPlanPhases(planId) {
  var plan = MOCK_PLANS.find(function(p) { return p.id === planId; });
  if (!plan) return;
  var container = document.getElementById('addToPlanPhaseList');
  document.getElementById('addToPlanTitle').textContent = '选择环节';
  document.getElementById('addToPlanPlanList').style.display = 'none';
  document.getElementById('addToPlanPhaseList').style.display = '';
  
  var html = '<div class="add-to-plan-back" data-action="backToPlanList">‹ 返回方案列表</div>';
  plan.phases.forEach(function(phase, i) {
    html += '<div class="phase-select-item" data-action="selectPhaseForAdd" data-plan-id="' + planId + '" data-phase-index="' + i + '">' +
      '<div class="phase-select-badge" style="background:' + phase.color + '">' + (i + 1) + '</div>' +
      '<div class="phase-select-info">' +
        '<div class="phase-select-name">' + phase.icon + ' ' + phase.name + '</div>' +
        '<div class="phase-select-time">' + phase.time + '分钟</div>' +
      '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

function renderActivityPickerList() {
  var container = document.getElementById('activityPickerList');
  if (!container) return;
  var html = '';
  MOCK_ACTIVITIES.forEach(function(act) {
    html += '<div class="activity-picker-item" data-action="selectActivityForPhase" data-activity-id="' + act.id + '">' +
      '<div class="activity-picker-name">' + act.name + '</div>' +
      '<div class="activity-picker-meta">' + act.scenes.join(' · ') + ' | ' + act.people + ' | ' + act.duration + '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() { toast.classList.remove('show'); }, 2000);
}

function showConfirm(title, msg, callback) {
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmMsg').textContent = msg;
  state.confirmCallback = callback;
  document.getElementById('confirmModal').classList.add('open');
}

function renderPlanCenterList() {
  var container = document.getElementById('planCenterList');
  if (!container) return;
  var html = '';
  var typeNameMap = { corporate: '企业培训', teambuilding: '团建活动', improv_show: '即兴演出', improv_training: '即兴训练' };
  var filtered = MOCK_PLANS.filter(function(plan) {
    var matchType = state.planTypeFilter === '全部' || typeNameMap[plan.type] === state.planTypeFilter;
    var statusText = { draft: '草稿', confirmed: '已确认', delivered: '已交付', reviewed: '已复盘' }[plan.status];
    var matchStatus = state.planStatusFilter === '全部' || statusText === state.planStatusFilter;
    var matchSearch = !state.planSearchQuery || plan.name.indexOf(state.planSearchQuery) !== -1 || plan.client.indexOf(state.planSearchQuery) !== -1;
    return matchType && matchStatus && matchSearch;
  });
  if (filtered.length === 0) {
    html = '<div class="empty-state">没有匹配的方案</div>';
  } else {
    filtered.forEach(function(plan) {
      var typeInfo = TEMPLATE_TYPES[plan.type];
      var statusClass = 'status-' + plan.status;
      var statusText = { draft: '草稿', confirmed: '已确认', delivered: '已交付', reviewed: '已复盘' }[plan.status];
      var phaseIcons = plan.phases.map(function(p) { return p.icon; }).join('');
      var isReadonly = plan.status === 'delivered' || plan.status === 'reviewed';
      var cardAction = isReadonly ? 'viewPlanPreview' : 'editPlan';
      var lockIcon = isReadonly ? ' 🔒' : '';
      html += '<div class="plan-center-card" data-action="' + cardAction + '" data-plan-id="' + plan.id + '">' +
        '<div class="plan-center-header">' +
          '<span class="plan-center-name">' + plan.name + lockIcon + '</span>' +
          '<span class="plan-status ' + statusClass + '">' + statusText + '</span>' +
        '</div>' +
        '<div class="plan-center-meta">' + plan.client + ' · ' + plan.people + '人 · ' + typeInfo.name + '</div>' +
        '<div class="plan-center-tags">' +
          '<span class="activity-tag">' + typeInfo.icon + ' ' + typeInfo.name + '</span>' +
          plan.scenes.map(function(s) { return '<span class="activity-tag">' + s + '</span>'; }).join('') +
          '<span class="plan-phase-icons">' + phaseIcons + '</span>' +
        '</div>' +
      '</div>';
    });
  }
  container.innerHTML = html;
}

function renderActivityList() {
  var container = document.getElementById('activityList');
  if (!container) return;
  var html = '';
  var filtered = MOCK_ACTIVITIES.filter(function(a) {
    var matchFilter = state.activeFilter === '全部' || a.scenes.indexOf(state.activeFilter) !== -1;
    var matchSearch = !state.searchQuery || a.name.indexOf(state.searchQuery) !== -1;
    return matchFilter && matchSearch;
  });
  filtered.forEach(function(activity) {
    var diffClass = 'difficulty-' + { '简单': 'easy', '中等': 'medium', '困难': 'hard' }[activity.difficulty];
    var favIcon = activity.favorited ? '❤️' : '🤍';
    var swipeActions = '';
    if (activity.isCustom) {
      swipeActions = '<div class="swipe-actions">' +
        '<div class="swipe-btn swipe-btn-edit" data-action="editActivity" data-activity-id="' + activity.id + '">✏️</div>' +
        '<div class="swipe-btn swipe-btn-pin" data-action="pinActivity" data-activity-id="' + activity.id + '">📌</div>' +
        '<div class="swipe-btn swipe-btn-fav" data-action="toggleFav" data-activity-id="' + activity.id + '">' + favIcon + '</div>' +
      '</div>';
    } else {
      swipeActions = '<div class="swipe-actions">' +
        '<div class="swipe-btn swipe-btn-fav" data-action="toggleFav" data-activity-id="' + activity.id + '">' + favIcon + '</div>' +
      '</div>';
    }
    var swipeWidth = activity.isCustom ? 180 : 60;
    html += '<div class="swipe-container" data-swipe-id="' + activity.id + '" data-swipe-width="' + swipeWidth + '">' +
      swipeActions +
      '<div class="swipe-content activity-card" data-action="viewActivity" data-activity-id="' + activity.id + '">' +
        '<div class="activity-card-row">' +
          '<span class="activity-name">' + activity.name + '</span>' +
          '<span class="activity-difficulty ' + diffClass + '">' + activity.difficulty + '</span>' +
        '</div>' +
        '<div class="activity-card-row activity-card-sub">' +
          '<span>👥 ' + activity.people + ' · ⏱ ' + activity.duration + ' · ' + activity.scenes.join('·') + '</span>' +
          (activity.riskLevel ? '<span class="activity-risk-tag">⚠️' + activity.riskLevel + '风险</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

function renderPlanSelectSheet() {
  var container = document.getElementById('planSelectList');
  if (!container) return;
  var html = '';
  var plansToShow = MOCK_PLANS.slice(0, 3);
  plansToShow.forEach(function(plan) {
    var typeInfo = TEMPLATE_TYPES[plan.type];
    html += '<div class="plan-select-card" data-action="selectPlanInSheet" data-plan-id="' + plan.id + '">' +
      '<div class="plan-select-name">' + plan.name + '</div>' +
      '<div class="plan-select-meta">' +
        '<span>' + plan.client + '</span>' +
        '<span>·</span>' +
        '<span>' + typeInfo.icon + ' ' + typeInfo.name + '</span>' +
        '<span>·</span>' +
        '<span>' + plan.people + '人</span>' +
      '</div>' +
    '</div>';
  });
  container.innerHTML = html;

  var viewAll = document.getElementById('viewAllPlans');
  var countEl = document.getElementById('planTotalCount');
  if (MOCK_PLANS.length > 3) {
    viewAll.style.display = 'block';
    countEl.textContent = MOCK_PLANS.length;
  } else {
    viewAll.style.display = 'none';
  }
}

function renderTemplateGrid() {
  var container = document.getElementById('templateGrid');
  if (!container) return;
  var html = '';
  Object.keys(TEMPLATE_TYPES).forEach(function(key) {
    var t = TEMPLATE_TYPES[key];
    var toolIcons = t.toolbar.map(function(tool) { return tool.icon; }).join('');
    html += '<div class="template-grid-card" data-action="selectTemplateInSheet" data-template-type="' + key + '">' +
      '<div class="template-grid-icon">' + t.icon + '</div>' +
      '<div class="template-grid-name">' + t.name + '</div>' +
      '<div class="template-grid-tag">' + t.tag + '</div>' +
      '<div class="template-grid-tools">' + toolIcons + '</div>' +
      '<div class="template-grid-desc">' + t.desc + '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

function renderFlowTemplateList() {
  var container = document.getElementById('flowTemplateList');
  if (!container) return;
  var html = '';

  html += '<div class="flow-template-item flow-template-myplans" data-action="gotoMyPlans">' +
    '<div class="flow-template-icon">📋</div>' +
    '<div class="flow-template-info">' +
      '<div class="flow-template-name">从我的方案</div>' +
      '<div class="flow-template-desc">选择已有方案直接开课</div>' +
    '</div>' +
    '<span class="flow-template-arrow">›</span>' +
  '</div>';

  var templates = [
    { key: 'corporate', name: '企业培训', desc: '5段式', icon: '🎯' },
    { key: 'teambuilding', name: '团建活动', desc: '三段式', icon: '🎉' },
    { key: 'improv_show', name: '即兴演出', desc: '游戏轮模式', icon: '🎭' },
    { key: 'improv_training', name: '即兴训练', desc: '自由组合', icon: '🏋️' }
  ];

  templates.forEach(function(t) {
    var typeInfo = TEMPLATE_TYPES[t.key];
    html += '<div class="flow-template-item" data-action="selectTemplateInSheet" data-template-type="' + t.key + '">' +
      '<div class="flow-template-icon">' + typeInfo.icon + '</div>' +
      '<div class="flow-template-info">' +
        '<div class="flow-template-name">' + typeInfo.name + '<span class="flow-template-badge">' + typeInfo.tag + '</span></div>' +
        '<div class="flow-template-steps">' + typeInfo.desc + '</div>' +
      '</div>' +
      '<span class="flow-template-arrow">›</span>' +
    '</div>';
  });

  container.innerHTML = html;
}

function renderTemplateModalList() {
  var container = document.getElementById('templateModalList');
  if (!container) return;
  var html = '';
  Object.keys(TEMPLATE_TYPES).forEach(function(key) {
    var t = TEMPLATE_TYPES[key];
    var toolIcons = t.toolbar.map(function(tool) { return tool.icon; }).join('');
    html += '<div class="template-modal-item" data-action="createFromTemplate" data-template-type="' + key + '">' +
      '<div class="template-modal-icon">' + t.icon + '</div>' +
      '<div class="template-modal-info">' +
        '<div class="template-modal-name">' + t.name + ' <span class="template-modal-tag">' + t.tag + '</span></div>' +
        '<div class="template-modal-desc">' + t.desc + '</div>' +
        '<div class="template-modal-tools">工具：' + toolIcons + '</div>' +
      '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

function renderToolbar() {
  var container = document.getElementById('liveToolbar');
  if (!container) return;
  var typeInfo = TEMPLATE_TYPES[state.templateType];
  var html = '';
  typeInfo.toolbar.forEach(function(tool) {
    html += '<div class="toolbar-btn" data-action="' + tool.action + '">' +
      '<div class="toolbar-icon">' + tool.icon + '</div>' +
      '<div class="toolbar-label">' + tool.label + '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

function renderLiveFlow() {
  var plan = state.currentPlan;
  if (!plan) return;
  var typeInfo = TEMPLATE_TYPES[plan.type];
  var phases = plan.phases;
  var idx = state.livePhaseIndex;

  document.querySelector('.live-nav .nav-title').textContent = plan.name;

  var dotsHtml = '';
  for (var i = 0; i < phases.length; i++) {
    var dotClass = 'phase-dot';
    if (i < idx) dotClass += ' done';
    else if (i === idx) dotClass += ' active';
    dotsHtml += '<div class="' + dotClass + '" data-phase-dot="' + (i + 1) + '"></div>';
  }
  document.querySelector('.phase-indicator').innerHTML = dotsHtml;

  document.querySelector('.phase-progress-text').textContent = '环节 ' + (idx + 1) + '/' + phases.length;

  var phaseNameEl = document.getElementById('currentPhaseName');
  phaseNameEl.textContent = phases[idx].name;
  phaseNameEl.classList.add('phase-transition');
  setTimeout(function() { phaseNameEl.classList.remove('phase-transition'); }, 400);

  state.timerSeconds = phases[idx].time * 60;
  updateTimerDisplay();

  var timerContainer = document.getElementById('timerContainer');
  timerContainer.className = 'timer-container';

  var reminders = document.getElementById('keyReminders');
  reminders.innerHTML = '<div class="reminder-item">💡 热情欢迎，营造安全氛围</div>' +
    '<div class="reminder-item">💡 确保每人都有参与机会</div>';

  document.getElementById('btnPrevPhase').disabled = idx === 0;

  var nextBtn = document.getElementById('btnNextPhase');
  if (idx === phases.length - 1) {
    nextBtn.textContent = '🎉 结束培训';
  } else {
    nextBtn.textContent = '下一环节 ›';
  }

  state.templateType = plan.type;
  renderToolbar();
}

function updateTimerDisplay() {
  var minutes = Math.floor(state.timerSeconds / 60);
  var seconds = state.timerSeconds % 60;
  document.getElementById('timerDisplay').textContent =
    (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

function startTimer() {
  if (state.timerRunning) {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
    document.getElementById('timerContainer').className = 'timer-container';
    return;
  }
  state.timerRunning = true;
  document.getElementById('timerContainer').className = 'timer-container timer-running';
  state.timerInterval = setInterval(function() {
    state.timerSeconds--;
    updateTimerDisplay();
    if (state.timerSeconds <= 60 && state.timerSeconds > 0) {
      document.getElementById('timerContainer').className = 'timer-container timer-warning';
    }
    if (state.timerSeconds <= 0) {
      clearInterval(state.timerInterval);
      state.timerRunning = false;
      document.getElementById('timerContainer').className = 'timer-container timer-ended';
      showToast('⏰ 时间到！');
    }
  }, 1000);
}

function delayTimer() {
  state.timerSeconds += 300;
  updateTimerDisplay();
  showToast('⏱ 延时5分钟');
}

function nextPhase() {
  var plan = state.currentPlan;
  if (!plan) return;
  if (state.livePhaseIndex >= plan.phases.length - 1) {
    if (state.timerRunning) {
      clearInterval(state.timerInterval);
      state.timerRunning = false;
    }
    if (plan.status === 'confirmed') {
      plan.status = 'delivered';
      renderTodoList();
    }
    navigateTo('liveEnd');
    return;
  }
  if (state.timerRunning) {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
  }
  state.livePhaseIndex++;
  renderLiveFlow();
}

function prevPhase() {
  if (state.livePhaseIndex <= 0) return;
  if (state.timerRunning) {
    clearInterval(state.timerInterval);
    state.timerRunning = false;
  }
  state.livePhaseIndex--;
  renderLiveFlow();
}

function renderCheckinList() {
  var container = document.getElementById('checkinList');
  if (!container) return;
  state.checkedIn = MOCK_PARTICIPANTS.slice(0, 18);
  var html = '';
  state.checkedIn.forEach(function(name, i) {
    var dept = ['技术部', '产品部', '市场部', '运营部'][i % 4];
    var time = '9:' + (i < 10 ? '0' : '') + (i * 2 + 10);
    html += '<div class="checkin-item">' +
      '<div class="checkin-item-left">' +
        '<div class="checkin-avatar">' + name.charAt(0) + '</div>' +
        '<span>' + name + '</span>' +
        '<span class="checkin-dept">' + dept + '</span>' +
      '</div>' +
      '<span class="checkin-time">' + time + '</span>' +
    '</div>';
  });
  container.innerHTML = html;
}

function renderGroupList() {
  var container = document.getElementById('groupList');
  if (!container) return;
  var colors = ['#FF6B35', '#007AFF', '#5856D6', '#34C759', '#FF9500', '#FF3B30', '#AF52DE'];
  var shuffled = MOCK_PARTICIPANTS.slice().sort(function() { return Math.random() - 0.5; });
  var groupSize = 4;
  var groupCount = Math.ceil(shuffled.length / groupSize);
  state.groups = [];
  state.teams = [];

  var html = '';
  for (var i = 0; i < groupCount; i++) {
    var members = shuffled.slice(i * groupSize, (i + 1) * groupSize);
    state.groups.push(members);
    state.teams.push({
      id: i + 1,
      name: '第' + (i + 1) + '组',
      members: members,
      score: 0
    });
    var color = colors[i % colors.length];
    html += '<div class="group-item" style="background:' + color + '20">' +
      '<div class="group-header">' +
        '<span class="group-name" style="color:' + color + '">第' + (i + 1) + '组</span>' +
        '<span class="group-count">' + members.length + '人</span>' +
      '</div>' +
      '<div class="group-members">' +
        members.map(function(m) {
          return '<span class="group-member">' + m +
            '<span class="member-adjust">' +
              '<button class="adjust-btn" data-action="moveMemberOut" data-group="' + i + '" data-member="' + m + '">−</button>' +
            '</span>' +
          '</span>';
        }).join('') +
      '</div>' +
    '</div>';
  }
  container.innerHTML = html;
  renderScoreList();
}

function renderScoreList() {
  var container = document.getElementById('scoreList');
  if (!container) return;
  var sorted = state.teams.slice().sort(function(a, b) { return b.score - a.score; });
  var html = '';
  sorted.forEach(function(team, i) {
    var rankClass = i < 3 ? 'score-rank-' + (i + 1) : '';
    html += '<div class="score-item" data-action="showScoreOptions" data-team-id="' + team.id + '">' +
      '<div class="score-rank ' + rankClass + '">' + (i + 1) + '</div>' +
      '<span class="score-name score-name-editable" data-action="editTeamName" data-team-id="' + team.id + '">' + team.name + ' ✏️</span>' +
      '<span class="score-value">' + team.score + '</span>' +
      '<span class="score-plus-hint">点击加分</span>' +
    '</div>';
  });
  container.innerHTML = html;
}

function addScore(teamId, points) {
  var team = state.teams.find(function(t) { return t.id === teamId; });
  if (!team) return;
  team.score += points;
  var item = document.querySelector('.score-item[data-team-id="' + teamId + '"]');
  if (item && points !== 0) {
    var floater = document.createElement('div');
    floater.className = 'float-plus';
    floater.textContent = (points > 0 ? '+' : '') + points;
    floater.style.right = '20px';
    floater.style.top = '10px';
    item.appendChild(floater);
    setTimeout(function() { floater.remove(); }, 800);
  }
  renderScoreList();
}

function showScorePanel(teamId) {
  var team = state.teams.find(function(t) { return t.id === teamId; });
  if (!team) return;
  var popup = document.getElementById('scorePanelSheet');
  if (!popup) return;
  document.getElementById('scorePanelTitle').textContent = team.name + '（当前' + team.score + '分）';
  document.getElementById('scorePanelBtns').innerHTML = 
    '<div class="score-option-btn" data-action="applyScore" data-team-id="' + teamId + '" data-points="5">+5</div>' +
    '<div class="score-option-btn" data-action="applyScore" data-team-id="' + teamId + '" data-points="10">+10</div>' +
    '<div class="score-option-btn" data-action="applyScore" data-team-id="' + teamId + '" data-points="20">+20</div>' +
    '<div class="score-option-btn score-option-neg" data-action="applyScore" data-team-id="' + teamId + '" data-points="-5">-5</div>' +
    '<div class="score-option-btn score-option-neg" data-action="applyScore" data-team-id="' + teamId + '" data-points="-10">-10</div>' +
    '<div class="score-custom-row">' +
      '<input type="number" class="score-custom-input" id="customScoreInput" placeholder="自定义分值">' +
      '<button class="score-custom-btn" data-action="applyCustomScore" data-team-id="' + teamId + '">确定</button>' +
    '</div>';
  openSheet('scorePanelSheet');
}

function renderSatisfactionChart() {
  var container = document.getElementById('satisfactionChart');
  if (!container) return;
  var data = [
    { label: '1⭐', value: 1, color: '#FF3B30' },
    { label: '2⭐', value: 1, color: '#FF9500' },
    { label: '3⭐', value: 2, color: '#FFCC00' },
    { label: '4⭐', value: 4, color: '#34C759' },
    { label: '5⭐', value: 4, color: '#007AFF' }
  ];
  var maxVal = Math.max.apply(null, data.map(function(d) { return d.value; }));
  var html = '';
  data.forEach(function(d) {
    var height = Math.max((d.value / maxVal) * 100, 8);
    html += '<div class="chart-bar-group">' +
      '<div class="chart-value">' + d.value + '</div>' +
      '<div class="chart-bar" style="height:' + height + 'px;background:' + d.color + '"></div>' +
      '<div class="chart-label">' + d.label + '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

function renderFeedbackList() {
  var container = document.getElementById('feedbackList');
  if (!container) return;
  var html = '';
  MOCK_FEEDBACKS.forEach(function(fb) {
    var starsHtml = '';
    for (var i = 0; i < 5; i++) {
      starsHtml += '<span class="star' + (i < fb.stars ? '' : ' empty') + '">★</span>';
    }
    var authorClass = fb.anonymous ? 'feedback-author anonymous' : 'feedback-author';
    html += '<div class="feedback-item">' +
      '<div class="feedback-item-header">' +
        '<span class="' + authorClass + '">' + fb.author + '</span>' +
        '<span class="feedback-stars">' + starsHtml + '</span>' +
      '</div>' +
      '<div class="feedback-text">' + fb.text + '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

function renderReviewList() {
  var container = document.getElementById('reviewList');
  if (!container) return;
  var html = '';
  var reviewablePlans = MOCK_PLANS.filter(function(p) { return p.status === 'delivered' || p.status === 'reviewed'; });
  
  if (reviewablePlans.length === 0) {
    html = '<div class="empty-state">暂无培训记录</div>';
  } else {
    reviewablePlans.forEach(function(plan) {
      var typeInfo = TEMPLATE_TYPES[plan.type];
      var isReviewed = plan.status === 'reviewed';
      var statusTag = isReviewed ? '<span class="review-status reviewed">已复盘</span>' : '<span class="review-status pending">待复盘</span>';
      var dateStr = plan.date || '2026-05-22';
      var avgStars = MOCK_FEEDBACKS.reduce(function(s, f) { return s + f.stars; }, 0) / MOCK_FEEDBACKS.length;
      html += '<div class="review-card" data-action="viewReviewDetail" data-plan-id="' + plan.id + '">' +
        '<div class="review-card-header">' +
          '<span class="review-name">' + plan.name + '</span>' +
          statusTag +
        '</div>' +
        '<div class="review-card-meta">' + typeInfo.icon + ' ' + typeInfo.name + ' · ' + plan.people + '人 · ' + dateStr + '</div>' +
        '<div class="review-card-data">' +
          '<span class="review-card-stat">⭐ ' + avgStars.toFixed(1) + '</span>' +
          '<span class="review-card-stat">💬 ' + MOCK_FEEDBACKS.length + '条反馈</span>' +
        '</div>' +
      '</div>';
    });
  }
  container.innerHTML = html;
}

function renderActivityDetail(activityId) {
  var activity = MOCK_ACTIVITIES.find(function(a) { return a.id === activityId; });
  if (!activity) return;
  state.currentActivity = activity;

  var container = document.getElementById('activityDetailContent');
  var diffClass = 'difficulty-' + { '简单': 'easy', '中等': 'medium', '困难': 'hard' }[activity.difficulty];
  var html = '<div class="detail-header">' +
    '<div class="detail-name">' + activity.name + '</div>' +
    '<div class="detail-tags">' +
      activity.scenes.map(function(s) { return '<span class="activity-tag">' + s + '</span>'; }).join('') +
      '<span class="activity-difficulty ' + diffClass + '">' + activity.difficulty + '</span>' +
      (activity.riskLevel ? '<span class="activity-tag risk">⚠️ ' + activity.riskLevel + '风险</span>' : '') +
    '</div>' +
    '<div class="activity-meta" style="margin-top:8px">' +
      '<span>👥 ' + activity.people + '</span>' +
      '<span>⏱ ' + activity.duration + '</span>' +
    '</div>' +
    '<div class="detail-goal">' + activity.goal + '</div>' +
  '</div>';

  html += '<div class="detail-section">' +
    '<div class="expandable-header" data-action="toggleExpand" data-section="rules">' +
      '<span>📋 规则说明</span>' +
      '<span class="expandable-arrow">›</span>' +
    '</div>' +
    '<div class="expandable-body" id="expand-rules">' +
      '<div class="detail-section-content">' + activity.rules + '</div>' +
    '</div>' +
  '</div>';

  html += '<div class="detail-section">' +
    '<div class="expandable-header" data-action="toggleExpand" data-section="review">' +
      '<span>🔄 复盘引导</span>' +
      '<span class="expandable-arrow">›</span>' +
    '</div>' +
    '<div class="expandable-body" id="expand-review">' +
      '<div class="detail-section-content">' + activity.reviewQuestions + '</div>' +
    '</div>' +
  '</div>';

  html += '<div class="detail-section">' +
    '<div class="expandable-header" data-action="toggleExpand" data-section="tips">' +
      '<span>💡 带领者Tips</span>' +
      '<span class="expandable-arrow">›</span>' +
    '</div>' +
    '<div class="expandable-body" id="expand-tips">' +
      '<div class="detail-section-content">' + activity.tips + '</div>' +
    '</div>' +
  '</div>';

  container.innerHTML = html;

  var favBtn = document.getElementById('btnFavActivity');
  favBtn.textContent = activity.favorited ? '❤️' : '🤍';
  if (activity.favorited) favBtn.classList.add('faved');
  else favBtn.classList.remove('faved');
}

function savePlanEditFields() {
  if (!state.currentPlan) return;
  var nameInput = document.getElementById('editPlanName');
  var peopleInput = document.getElementById('editPlanPeople');
  var clientInput = document.getElementById('editPlanClient');
  if (nameInput && nameInput.value.trim()) state.currentPlan.name = nameInput.value.trim();
  if (peopleInput) state.currentPlan.people = Math.max(1, parseInt(peopleInput.value) || 1);
  if (clientInput && clientInput.value.trim()) state.currentPlan.client = clientInput.value.trim();
}

function renderNoteList() {
  var container = document.getElementById('noteList');
  if (!container) return;
  if (state.liveNotes.length === 0) {
    container.innerHTML = '';
    return;
  }
  var html = '<div class="note-list-title">已保存笔记（' + state.liveNotes.length + '条）</div>';
  state.liveNotes.forEach(function(note, i) {
    html += '<div class="note-item">' +
      '<div class="note-item-header">' +
        '<span class="note-item-phase">' + note.phase + '</span>' +
        '<span class="note-item-time">' + note.time + '</span>' +
      '</div>' +
      '<div class="note-item-text">' + note.text + '</div>' +
    '</div>';
  });
  container.innerHTML = html;
}

function generateQR(imageId, mockId, text) {
  var img = document.getElementById(imageId);
  var mock = document.getElementById(mockId);
  if (img && mock) {
    var url = 'https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=' + encodeURIComponent(text);
    img.src = url;
    img.onload = function() {
      img.style.display = 'block';
      mock.style.display = 'none';
    };
    img.onerror = function() {
      img.style.display = 'none';
      mock.style.display = 'block';
    };
  }
}

function renderPlanEdit(planId) {
  var plan = MOCK_PLANS.find(function(p) { return p.id === planId; });
  if (!plan) return;
  state.currentPlan = plan;

  var typeInfo = TEMPLATE_TYPES[plan.type];
  var headerEl = document.getElementById('planEditHeader');
  headerEl.innerHTML = '<div class="edit-section-title">📋 基本信息</div>' +
    '<div class="edit-form-group">' +
      '<label class="edit-form-label">方案名称</label>' +
      '<input type="text" class="edit-form-input" id="editPlanName" value="' + plan.name + '" data-field="name">' +
    '</div>' +
    '<div class="edit-form-row">' +
      '<div class="edit-form-group edit-form-narrow">' +
        '<label class="edit-form-label">参与人数</label>' +
        '<div class="edit-form-number">' +
          '<button class="edit-num-btn" data-action="planPeopleMinus">−</button>' +
          '<input type="number" class="edit-num-input" id="editPlanPeople" value="' + plan.people + '" data-field="people">' +
          '<button class="edit-num-btn" data-action="planPeoplePlus">+</button>' +
        '</div>' +
      '</div>' +
      '<div class="edit-form-group edit-form-half">' +
        '<label class="edit-form-label">客户名称</label>' +
        '<input type="text" class="edit-form-input" id="editPlanClient" value="' + plan.client + '" data-field="client">' +
      '</div>' +
    '</div>' +
    '<div class="edit-form-group">' +
      '<label class="edit-form-label">方案类型</label>' +
      '<div class="edit-form-tags">' +
        '<span class="activity-tag">' + typeInfo.icon + ' ' + typeInfo.name + '</span>' +
        plan.scenes.map(function(s) { return '<span class="activity-tag">' + s + '</span>'; }).join('') +
      '</div>' +
    '</div>';

  var phasesEl = document.getElementById('planEditPhases');
  var html = '<div class="edit-section-title">🔄 环节列表</div>';
  plan.phases.forEach(function(phase, i) {
    html += '<div class="phase-item">' +
      '<div class="phase-header">' +
        '<div class="phase-badge" style="background:' + phase.color + '">' + (i + 1) + '</div>' +
        '<div class="phase-info">' +
          '<div class="phase-name">' + phase.icon + ' ' + phase.name + '</div>' +
          '<div class="phase-time">⏱ ' + phase.time + '分钟</div>' +
        '</div>' +
        '<div class="phase-actions">' +
          '<button class="reorder-btn" data-action="moveSegmentUp" data-index="' + i + '"' + (i === 0 ? ' disabled' : '') + '>↑</button>' +
          '<button class="reorder-btn" data-action="moveSegmentDown" data-index="' + i + '"' + (i === plan.phases.length - 1 ? ' disabled' : '') + '>↓</button>' +
          '<button class="phase-delete-btn" data-action="deletePhase" data-index="' + i + '">✕</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  });
  html += '<div style="text-align:center;margin-top:4px">' +
    '<span class="phase-add-btn" data-action="showAddSegment">+ 添加环节</span>' +
  '</div>';
  phasesEl.innerHTML = html;

  var actionsEl = document.getElementById('planEditActions');
  var actionsHtml = '';
  if (plan.status === 'draft') {
    actionsHtml += '<button class="btn-secondary btn-block" data-action="confirmPlan" style="margin-bottom:10px">✅ 确认方案</button>';
  }
  actionsHtml += '<button class="btn-primary btn-block btn-large" data-action="startFromEdit">🚀 开始培训</button>';
  actionsEl.innerHTML = actionsHtml;
}

function renderPlanPreview() {
  var plan = state.currentPlan;
  if (!plan) return;
  var typeInfo = TEMPLATE_TYPES[plan.type];
  var container = document.getElementById('planPreviewContent');
  var statusText = { draft: '草稿', confirmed: '已确认', delivered: '已交付', reviewed: '已复盘' }[plan.status];
  var statusClass = 'status-' + plan.status;
  var dateStr = plan.date || '—';
  var durationStr = plan.duration ? Math.floor(plan.duration / 60) + 'h' + (plan.duration % 60 > 0 ? plan.duration % 60 + 'min' : '') : '—';
  var totalTime = plan.phases.reduce(function(s, p) { return s + p.time; }, 0);

  var html = '<div class="preview-summary-card">' +
    '<div class="preview-summary-title">' + plan.name + '</div>' +
    '<div class="preview-summary-meta">' +
      '<span>' + typeInfo.icon + ' ' + typeInfo.name + '</span>' +
      '<span>·</span>' +
      '<span>👥 ' + plan.people + '人</span>' +
      '<span>·</span>' +
      '<span>📅 ' + dateStr + '</span>' +
    '</div>' +
    '<div class="preview-summary-meta" style="margin-top:4px">' +
      '<span>⏱ ' + durationStr + '</span>' +
      '<span>·</span>' +
      '<span>📋 ' + plan.phases.length + '个环节</span>' +
      '<span>·</span>' +
      '<span class="plan-status ' + statusClass + '">' + statusText + '</span>' +
    '</div>' +
    '<div class="preview-summary-tags">' +
      '<span class="activity-tag">' + typeInfo.icon + ' ' + typeInfo.name + '</span>' +
      plan.scenes.map(function(s) { return '<span class="activity-tag">' + s + '</span>'; }).join('') +
    '</div>' +
  '</div>';

  html += '<div class="preview-section-title">🔄 环节流程（总时长 ' + totalTime + ' 分钟）</div>';
  html += '<div class="preview-timeline">';
  plan.phases.forEach(function(phase, i) {
    var pct = Math.round(phase.time / totalTime * 100);
    html += '<div class="timeline-item">' +
      '<div class="timeline-dot" style="background:' + phase.color + '"></div>' +
      '<div class="timeline-line"></div>' +
      '<div class="timeline-content">' +
        '<div class="timeline-header">' +
          '<span class="timeline-phase">' + phase.icon + ' ' + phase.name + '</span>' +
          '<span class="timeline-time">⏱ ' + phase.time + '分钟（' + pct + '%）</span>' +
        '</div>' +
        '<div class="timeline-bar-bg"><div class="timeline-bar-fill" style="width:' + pct + '%;background:' + phase.color + '"></div></div>' +
      '</div>' +
    '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
}

function renderReviewDetail() {
  var plan = state.currentPlan;
  if (!plan) return;
  var typeInfo = TEMPLATE_TYPES[plan.type];
  var isReviewed = plan.status === 'reviewed';

  var summaryEl = document.getElementById('reviewDetailSummary');
  if (summaryEl) {
    var dateStr = plan.date || '2026-05-22';
    var durationStr = plan.duration ? Math.floor(plan.duration / 60) + 'h' + (plan.duration % 60 > 0 ? plan.duration % 60 + 'min' : '') : '2h';
    var phaseCount = plan.phases ? plan.phases.length : 0;
    var completedPhases = isReviewed ? phaseCount : Math.max(1, Math.floor(phaseCount * 0.6));
    var progressPct = Math.round(completedPhases / phaseCount * 100);

    summaryEl.innerHTML =
      '<div class="review-summary-card">' +
        '<div class="review-summary-title">' + plan.name + '</div>' +
        '<div class="review-summary-meta">' +
          '<span>' + typeInfo.icon + ' ' + typeInfo.name + '</span>' +
          '<span>·</span>' +
          '<span>👥 ' + plan.people + '人</span>' +
          '<span>·</span>' +
          '<span>📅 ' + dateStr + '</span>' +
        '</div>' +
        '<div class="review-summary-meta" style="margin-top:4px">' +
          '<span>⏱ ' + durationStr + '</span>' +
          '<span>·</span>' +
          '<span>📊 环节 ' + completedPhases + '/' + phaseCount + ' 完成</span>' +
        '</div>' +
        '<div class="review-phase-progress">' +
          '<div class="review-phase-bar" style="width:' + progressPct + '%"></div>' +
        '</div>' +
      '</div>';
  }

  var feedbackEl = document.getElementById('reviewDetailFeedback');
  if (feedbackEl) {
    var avgStars = MOCK_FEEDBACKS.reduce(function(s, f) { return s + f.stars; }, 0) / MOCK_FEEDBACKS.length;
    var fiveCount = MOCK_FEEDBACKS.filter(function(f) { return f.stars === 5; }).length;
    var fourCount = MOCK_FEEDBACKS.filter(function(f) { return f.stars === 4; }).length;
    var nps = Math.round((fiveCount - MOCK_FEEDBACKS.filter(function(f) { return f.stars <= 3; }).length) / MOCK_FEEDBACKS.length * 100);

    var quotesHtml = '';
    MOCK_FEEDBACKS.slice(0, 3).forEach(function(fb) {
      quotesHtml += '<div class="review-feedback-quote">"' + fb.text + '"</div>';
    });

    feedbackEl.innerHTML =
      '<div class="review-feedback-card">' +
        '<div class="review-feedback-header">' +
          '<span class="review-feedback-section-title">📊 数据回顾</span>' +
          (isReviewed ? '' : '<span class="review-feedback-link" data-action="gotoFeedback">查看完整反馈 ›</span>') +
        '</div>' +
        '<div class="review-feedback-row">' +
          '<div class="review-feedback-item">' +
            '<div class="review-feedback-value">' + avgStars.toFixed(1) + '</div>' +
            '<div class="review-feedback-label">满意度</div>' +
          '</div>' +
          '<div class="review-feedback-item">' +
            '<div class="review-feedback-value">' + MOCK_FEEDBACKS.length + '</div>' +
            '<div class="review-feedback-label">反馈数</div>' +
          '</div>' +
          '<div class="review-feedback-item">' +
            '<div class="review-feedback-value">' + nps + '</div>' +
            '<div class="review-feedback-label">NPS</div>' +
          '</div>' +
          '<div class="review-feedback-item">' +
            '<div class="review-feedback-value">' + Math.round(fiveCount / MOCK_FEEDBACKS.length * 100) + '%</div>' +
            '<div class="review-feedback-label">5星占比</div>' +
          '</div>' +
        '</div>' +
        '<div class="review-feedback-keywords">' +
          '<span class="review-kw">团队协作</span>' +
          '<span class="review-kw">专业</span>' +
          '<span class="review-kw">互动好</span>' +
          '<span class="review-kw">节奏快</span>' +
        '</div>' +
        '<div class="review-feedback-quotes">' + quotesHtml + '</div>' +
      '</div>';
  }

  renderReviewGuide();

  var input = document.getElementById('flipCardInput');
  if (input && state.reviewNotes[state.reviewIndex]) {
    input.value = state.reviewNotes[state.reviewIndex];
  } else if (input) {
    input.value = '';
  }

  var guideSection = document.querySelector('.review-detail-guide');
  if (guideSection) {
    guideSection.style.display = isReviewed ? 'none' : 'block';
  }

  var completeBtn = document.getElementById('btnCompleteReview');
  if (completeBtn) {
    completeBtn.style.display = isReviewed ? 'none' : 'block';
  }

  var reviewedSection = document.getElementById('reviewedNotesSection');
  if (reviewedSection) {
    reviewedSection.style.display = isReviewed ? 'block' : 'none';
    if (isReviewed && plan.reviewNotes) {
      var notesHtml = '';
      plan.reviewNotes.forEach(function(note, i) {
        if (note && note.trim()) {
          notesHtml += '<div class="reviewed-note-item">' +
            '<div class="reviewed-note-index">' + (i + 1) + '</div>' +
            '<div class="reviewed-note-text">' + note + '</div>' +
          '</div>';
        }
      });
      reviewedSection.innerHTML = '<div class="reviewed-notes-title">📝 复盘记录</div>' +
        (notesHtml || '<div class="reviewed-notes-empty">暂无复盘笔记</div>') +
        '<button class="btn-secondary btn-block" data-action="restartReview" style="margin-top:12px">🔄 重新复盘</button>';
    } else if (isReviewed) {
      reviewedSection.innerHTML = '<div class="reviewed-notes-title">📝 复盘记录</div>' +
        '<div class="reviewed-notes-empty">暂无复盘笔记</div>' +
        '<button class="btn-secondary btn-block" data-action="restartReview" style="margin-top:12px">🔄 重新复盘</button>';
    }
  }
}

function renderReviewGuide() {
  var questions = REVIEW_METHODS[state.reviewMethod];
  var q = questions[state.reviewIndex];
  document.getElementById('flipCardNum').textContent = (state.reviewIndex + 1) + '/' + questions.length;
  document.getElementById('flipCardQuestion').textContent = q;

  var input = document.getElementById('flipCardInput');
  if (input) {
    if (state.reviewNotes[state.reviewIndex]) {
      input.value = state.reviewNotes[state.reviewIndex];
    } else {
      input.value = '';
    }
  }

  var nextBtn = document.getElementById('btnFlipNext');
  if (nextBtn) {
    nextBtn.textContent = state.reviewIndex >= questions.length - 1 ? '完成 ›' : '下一题 ›';
  }
}

function completeReview() {
  var input = document.getElementById('flipCardInput');
  if (input) {
    state.reviewNotes[state.reviewIndex] = input.value;
  }

  if (state.currentPlan) {
    state.currentPlan.status = 'reviewed';
    state.currentPlan.reviewNotes = state.reviewNotes.slice();
    state.currentPlan.reviewMethod = state.reviewMethod;
  }
  showToast('🎉 复盘完成！');
  renderReviewList();
  renderTodoList();
  goBack();
}

function showConfigEditor(title, type) {
  document.getElementById('configEditTitle').textContent = title;
  var content = document.getElementById('configEditContent');
  var html = '';

  switch(type) {
    case 'people':
      html = '<div class="config-edit-number">' +
        '<button class="config-num-btn" data-action="configNumMinus">−</button>' +
        '<input type="number" class="config-num-input" id="configPeopleInput" value="' + state.prepConfig.people + '">' +
        '<button class="config-num-btn" data-action="configNumPlus">+</button>' +
      '</div>' +
      '<div class="config-edit-hint">建议人数范围：5-50人</div>' +
      '<button class="btn-primary btn-block" data-action="confirmConfigPeople">确认</button>';
      break;
    case 'checkin':
      html = '<div class="config-option-list">' +
        '<div class="config-option-item' + (state.prepConfig.checkin === '扫码签到' ? ' active' : '') + '" data-action="selectCheckin" data-value="扫码签到">' +
          '<span>📱 扫码签到</span><span class="config-option-check">' + (state.prepConfig.checkin === '扫码签到' ? '✓' : '') + '</span></div>' +
        '<div class="config-option-item' + (state.prepConfig.checkin === '手动签到' ? ' active' : '') + '" data-action="selectCheckin" data-value="手动签到">' +
          '<span>✋ 手动签到</span><span class="config-option-check">' + (state.prepConfig.checkin === '手动签到' ? '✓' : '') + '</span></div>' +
        '<div class="config-option-item' + (state.prepConfig.checkin === '免签到' ? ' active' : '') + '" data-action="selectCheckin" data-value="免签到">' +
          '<span>⚡ 免签到</span><span class="config-option-check">' + (state.prepConfig.checkin === '免签到' ? '✓' : '') + '</span></div>' +
      '</div>';
      break;
    case 'group':
      html = '<div class="config-option-list">' +
        '<div class="config-option-item' + (state.prepConfig.groupMethod === '按人数均分' ? ' active' : '') + '" data-action="selectGroup" data-value="按人数均分">' +
          '<span>👥 按人数均分</span><span class="config-option-check">' + (state.prepConfig.groupMethod === '按人数均分' ? '✓' : '') + '</span></div>' +
        '<div class="config-option-item' + (state.prepConfig.groupMethod === '指定组数' ? ' active' : '') + '" data-action="selectGroup" data-value="指定组数">' +
          '<span>🔢 指定组数</span><span class="config-option-check">' + (state.prepConfig.groupMethod === '指定组数' ? '✓' : '') + '</span></div>' +
        '<div class="config-option-item' + (state.prepConfig.groupMethod === '自由分组' ? ' active' : '') + '" data-action="selectGroup" data-value="自由分组">' +
          '<span>🤝 自由分组</span><span class="config-option-check">' + (state.prepConfig.groupMethod === '自由分组' ? '✓' : '') + '</span></div>' +
      '</div>';
      break;
    case 'teamCount':
      html = '<div class="config-edit-number">' +
        '<button class="config-num-btn" data-action="configTeamMinus">−</button>' +
        '<input type="number" class="config-num-input" id="configTeamInput" value="' + (state.prepConfig.teamCount || 4) + '" min="2" max="10">' +
        '<button class="config-num-btn" data-action="configTeamPlus">+</button>' +
      '</div>' +
      '<div class="config-edit-hint">队伍数量范围：2-10</div>' +
      '<button class="btn-primary btn-block" data-action="confirmConfigTeam">确认</button>';
      break;
    case 'scoreMode':
      html = '<div class="config-option-list">' +
        '<div class="config-option-item' + (state.prepConfig.scoreMode === '简化模式' ? ' active' : '') + '" data-action="selectScore" data-value="简化模式">' +
          '<span>⚡ 简化模式</span><span class="config-option-check">' + (state.prepConfig.scoreMode === '简化模式' ? '✓' : '') + '</span></div>' +
        '<div class="config-option-item' + (state.prepConfig.scoreMode === '标准模式' ? ' active' : '') + '" data-action="selectScore" data-value="标准模式">' +
          '<span>📊 标准模式</span><span class="config-option-check">' + (state.prepConfig.scoreMode === '标准模式' ? '✓' : '') + '</span></div>' +
      '</div>';
      break;
  }

  content.innerHTML = html;
  openSheet('configEditSheet');
}

function updatePrepDisplay() {
  var peopleEl = document.getElementById('prepPeople');
  var checkinEl = document.getElementById('prepCheckin');
  var groupEl = document.getElementById('prepGroupMethod');
  var teamEl = document.getElementById('prepTeamCount');
  var scoreEl = document.getElementById('prepScoreMode');

  if (peopleEl) peopleEl.textContent = state.prepConfig.people + '人';
  if (checkinEl) checkinEl.textContent = state.prepConfig.checkin;
  if (groupEl) groupEl.textContent = state.prepConfig.groupMethod;
  if (teamEl) teamEl.textContent = state.prepConfig.teamCount > 0 ? state.prepConfig.teamCount + '队' : '待分组';
  if (scoreEl) scoreEl.textContent = state.prepConfig.scoreMode;
}

function renderPrepConfirmSheet() {
  var plan = state.currentPlan;
  if (!plan) return;
  var typeInfo = TEMPLATE_TYPES[plan.type];

  if (state.currentPlan) {
    state.prepConfig.people = state.currentPlan.people || 28;
  }
  updatePrepDisplay();

  var infoEl = document.getElementById('prepPlanInfo');
  infoEl.innerHTML = '<div class="prep-plan-name">' + plan.name + '</div>' +
    '<div class="prep-plan-tags">' +
      '<span class="activity-tag">' + typeInfo.icon + ' ' + typeInfo.name + '</span>' +
      '<span class="activity-tag">' + plan.people + '人</span>' +
    '</div>';

  var toolConfigEl = document.getElementById('toolConfigList');
  toolConfigEl.innerHTML = typeInfo.toolbar.map(function(t) {
    return '<span class="tool-config-tag">' + t.icon + ' ' + t.label + '</span>';
  }).join('');
}

function renderQuickCreateSheet() {
  var typeInfo = TEMPLATE_TYPES[state.quickTemplateType];
  var badgeEl = document.getElementById('quickTemplateBadge');
  badgeEl.innerHTML = '<div class="quick-badge-icon">' + typeInfo.icon + '</div>' +
    '<div class="quick-badge-name">' + typeInfo.name + '</div>';
  document.getElementById('quickName').value = '';
  document.getElementById('quickPeople').value = '';
}

function doPick() {
  var pickNameEl = document.getElementById('pickName');
  pickNameEl.className = 'pick-name rolling';

  var count = 0;
  var maxCount = 10;
  var interval = setInterval(function() {
    if (state.pickTab === 'topic') {
      var topics = ['即兴表演一段职场冲突', '用三个词描述你的团队', '模拟一次产品发布会', '即兴创作一首诗', '表演一段无声对话'];
      pickNameEl.textContent = topics[Math.floor(Math.random() * topics.length)];
    } else {
      pickNameEl.textContent = MOCK_PARTICIPANTS[Math.floor(Math.random() * MOCK_PARTICIPANTS.length)];
    }
    count++;
    if (count >= maxCount) {
      clearInterval(interval);
      pickNameEl.className = 'pick-name settled settled-border';
      document.getElementById('btnPickAgain').style.display = 'block';
    }
  }, 100);
}

function toggleExpand(section) {
  var body = document.getElementById('expand-' + section);
  var header = body.previousElementSibling;
  body.classList.toggle('open');
  header.classList.toggle('open');
}

function togglePrepCollapse(collapseName) {
  var body = document.getElementById('collapse-' + collapseName);
  var header = body.previousElementSibling;
  body.classList.toggle('open');
  header.classList.toggle('open');
}

function bindEvents() {
  document.addEventListener('click', function(e) {
    var target = e.target.closest('[data-action]');
    if (!target) return;
    var action = target.getAttribute('data-action');

    switch (action) {
      case 'gotoPlanSelect':
        renderFlowTemplateList();
        openSheet('planSelectSheet');
        break;
      case 'gotoReviewCenter':
        navigateTo('reviewCenter');
        break;
      case 'gotoSettings':
        navigateTo('settings');
        break;
      case 'editProfile':
        showToast('✏️ 编辑个人信息');
        break;
      case 'gotoPrepConfirm':
        var prepPlanId = parseInt(target.getAttribute('data-plan-id'));
        var prepPlan = MOCK_PLANS.find(function(p) { return p.id === prepPlanId; });
        if (prepPlan) {
          state.currentPlan = prepPlan;
          state.templateType = prepPlan.type;
          renderPrepConfirmSheet();
          openSheet('prepConfirmSheet');
        }
        break;
      case 'gotoDraftEdit':
        var draftPlanId = parseInt(target.getAttribute('data-plan-id'));
        var draftPlan = MOCK_PLANS.find(function(p) { return p.id === draftPlanId; });
        if (draftPlan) {
          state.currentPlan = draftPlan;
          renderPlanEdit(draftPlan.id);
          navigateTo('planEdit');
        }
        break;
      case 'gotoMyPlans':
        closeSheet();
        setTimeout(function() {
          switchTab('prepare');
          setTimeout(function() {
            var subTab = document.querySelector('[data-sub-tab="plans"]');
            if (subTab) subTab.click();
          }, 100);
        }, 350);
        break;
      case 'gotoMyActivities':
        switchTab('prepare');
        setTimeout(function() {
          var subTab = document.querySelector('[data-sub-tab="activities"]');
          if (subTab) subTab.click();
        }, 100);
        break;
      case 'gotoParticipants':
        navigateTo('dataDetail');
        break;
      case 'gotoTrainingRecords':
        navigateTo('trainingRecords');
        break;
      case 'gotoDataDetail':
        navigateTo('dataDetail');
        break;
      case 'gotoNameList':
        showToast('📖 名单管理（即将上线）');
        break;
      case 'gotoWordLib':
        showToast('🏷️ 词库管理（即将上线）');
        break;
      case 'gotoHelp':
        navigateTo('helpFeedback');
        break;
      case 'gotoAbout':
        showToast('ℹ️ 培训师工具箱 v1.0');
        break;
      case 'submitFeedback':
        var feedbackInput = document.getElementById('helpFeedbackInput');
        if (feedbackInput && feedbackInput.value.trim()) {
          showToast('✅ 感谢您的反馈！');
          feedbackInput.value = '';
        } else {
          showToast('⚠️ 请输入反馈内容');
        }
        break;
      case 'gotoFeedback':
        navigateTo('feedback');
        if (state.currentPlan) {
          generateQR('feedbackQrImage', 'feedbackQrMock', 'https://train.example.com/feedback/' + state.currentPlan.id);
        }
        break;
      case 'showQR':
        document.getElementById('qrFullscreen').classList.add('open');
        break;
      case 'gotoReport':
        navigateTo('dataDetail');
        break;
      case 'gotoReviewGuide':
        if (!state.currentPlan) {
          state.currentPlan = MOCK_PLANS.find(function(p) { return p.status === 'delivered'; });
        }
        state.reviewMethod = 'ORID';
        state.reviewIndex = 0;
        state.reviewNotes = [];
        document.querySelectorAll('.method-option').forEach(function(m) { m.classList.remove('active'); });
        document.querySelector('.method-option[data-method="ORID"]').classList.add('active');
        renderReviewDetail();
        navigateTo('reviewGuide');
        break;
      case 'gotoHome':
        switchTab('home');
        break;
      case 'gotoActivityEdit':
        state.editingActivity = null;
        document.getElementById('activityEditTitle').textContent = '新增活动';
        document.getElementById('editActivityName').value = '';
        document.getElementById('editActivityPeople').value = '';
        document.getElementById('editActivityDuration').value = '';
        document.getElementById('editActivityGoal').value = '';
        document.getElementById('editActivityRules').value = '';
        document.getElementById('editActivityReview').value = '';
        document.getElementById('editActivityTips').value = '';
        document.querySelectorAll('#editActivityScenes .tag-option, #editActivityDifficulty .tag-option').forEach(function(t) { t.classList.remove('active'); });
        document.getElementById('deleteActivityBtn').style.display = 'none';
        navigateTo('activityEdit');
        break;
      case 'back':
        goBack();
        break;
      case 'closeSheet':
        closeSheet();
        break;
      case 'selectPlanInSheet':
        var planId = parseInt(target.getAttribute('data-plan-id'));
        var plan = MOCK_PLANS.find(function(p) { return p.id === planId; });
        if (plan) {
          state.currentPlan = plan;
          state.templateType = plan.type;
          closeSheet();
          setTimeout(function() {
            renderPrepConfirmSheet();
            openSheet('prepConfirmSheet');
          }, 350);
        }
        break;
      case 'selectTemplateInSheet':
        var templateType = target.getAttribute('data-template-type');
        state.quickTemplateType = templateType;
        closeSheet();
        setTimeout(function() {
          renderQuickCreateSheet();
          openSheet('quickCreateSheet');
        }, 350);
        break;
      case 'quickCreateSubmit':
        var name = document.getElementById('quickName').value || '未命名培训';
        var people = parseInt(document.getElementById('quickPeople').value) || 20;
        var newPlan = {
          id: MOCK_PLANS.length + 1,
          name: name,
          client: '新客户',
          type: state.quickTemplateType,
          status: 'draft',
          people: people,
          scenes: [],
          phases: TEMPLATE_TYPES[state.quickTemplateType].phases
        };
        MOCK_PLANS.push(newPlan);
        state.currentPlan = newPlan;
        state.templateType = state.quickTemplateType;
        closeSheet();
        renderTodoList();
        setTimeout(function() {
          renderPrepConfirmSheet();
          openSheet('prepConfirmSheet');
        }, 350);
        break;
      case 'viewAllPlans':
        closeSheet();
        setTimeout(function() {
          switchTab('prepare');
          switchSubTab('plans');
        }, 350);
        break;
      case 'startLive':
        closeSheet();
        setTimeout(function() {
          state.livePhaseIndex = 0;
          renderLiveFlow();
          navigateTo('liveFlow');
        }, 350);
        break;
      case 'planPeopleMinus':
        var peopleInput = document.getElementById('editPlanPeople');
        if (peopleInput) peopleInput.value = Math.max(1, parseInt(peopleInput.value) - 1);
        break;
      case 'planPeoplePlus':
        var peopleInput2 = document.getElementById('editPlanPeople');
        if (peopleInput2) peopleInput2.value = Math.min(99, parseInt(peopleInput2.value) + 1);
        break;
      case 'confirmPlan':
        savePlanEditFields();
        if (state.currentPlan && state.currentPlan.status === 'draft') {
          state.currentPlan.status = 'confirmed';
          showToast('✅ 方案已确认');
          renderTodoList();
          renderPlanEdit(state.currentPlan.id);
          renderPlanCenterList();
        }
        break;
      case 'startFromEdit':
        savePlanEditFields();
        state.livePhaseIndex = 0;
        renderLiveFlow();
        navigateTo('liveFlow');
        break;
      case 'confirmExitLive':
        showConfirm('确认退出？', '退出后当前进度将保存', function() {
          if (state.timerRunning) {
            clearInterval(state.timerInterval);
            state.timerRunning = false;
          }
          switchTab('home');
        });
        break;
      case 'confirmCancel':
        document.getElementById('confirmModal').classList.remove('open');
        state.confirmCallback = null;
        break;
      case 'confirmOk':
        document.getElementById('confirmModal').classList.remove('open');
        if (state.confirmCallback) {
          state.confirmCallback();
          state.confirmCallback = null;
        }
        break;
      case 'openCheckin':
        closeSheet();
        setTimeout(function() {
          openSheet('checkinSheet');
          if (state.currentPlan) {
            generateQR('checkinQrImage', 'checkinQrMock', 'https://train.example.com/checkin/' + state.currentPlan.id);
          }
        }, 200);
        break;
      case 'openGroup':
        closeSheet();
        setTimeout(function() { openSheet('groupSheet'); }, 200);
        break;
      case 'openScore':
        closeSheet();
        setTimeout(function() { openSheet('scoreSheet'); }, 200);
        break;
      case 'openPick':
      case 'openPickPerson':
        state.pickTab = 'actor';
        document.querySelectorAll('.pick-tab').forEach(function(t) { t.classList.remove('active'); });
        document.querySelector('.pick-tab[data-pick-tab="actor"]').classList.add('active');
        document.getElementById('pickCountSection').style.display = '';
        document.getElementById('pickTopicSection').style.display = 'none';
        closeSheet();
        setTimeout(function() {
          document.getElementById('pickName').textContent = '?';
          document.getElementById('pickName').className = 'pick-name';
          document.getElementById('btnPickAgain').style.display = 'none';
          openSheet('pickSheet');
        }, 200);
        break;
      case 'openPickTopic':
        state.pickTab = 'topic';
        document.querySelectorAll('.pick-tab').forEach(function(t) { t.classList.remove('active'); });
        document.querySelector('.pick-tab[data-pick-tab="topic"]').classList.add('active');
        document.getElementById('pickCountSection').style.display = 'none';
        document.getElementById('pickTopicSection').style.display = '';
        closeSheet();
        setTimeout(function() {
          document.getElementById('pickName').textContent = '?';
          document.getElementById('pickName').className = 'pick-name';
          document.getElementById('btnPickAgain').style.display = 'none';
          openSheet('pickSheet');
        }, 200);
        break;
      case 'openInteract':
        openSheet('interactSheet');
        break;
      case 'openStandaloneTimer':
        closeSheet();
        setTimeout(function() { openSheet('standaloneTimerSheet'); }, 200);
        break;
      case 'openSound':
        closeSheet();
        setTimeout(function() { openSheet('soundSheet'); }, 200);
        break;
      case 'openToolbox':
        openSheet('toolboxSheet');
        break;
      case 'openNote':
        var notePhaseLabel = document.getElementById('notePhaseLabel');
        if (notePhaseLabel && state.currentPlan && state.currentPlan.phases[state.livePhaseIndex]) {
          notePhaseLabel.textContent = '当前环节：' + state.currentPlan.phases[state.livePhaseIndex].name;
        }
        renderNoteList();
        openSheet('noteSheet');
        break;
      case 'saveNote':
        var noteInput = document.getElementById('noteInput');
        if (noteInput && noteInput.value.trim()) {
          var phaseName = state.currentPlan && state.currentPlan.phases[state.livePhaseIndex]
            ? state.currentPlan.phases[state.livePhaseIndex].name : '—';
          state.liveNotes.push({
            phase: phaseName,
            text: noteInput.value.trim(),
            time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
          });
          noteInput.value = '';
          renderNoteList();
          showToast('✅ 笔记已保存');
        } else {
          showToast('⚠️ 请输入笔记内容');
        }
        break;
      case 'openWordCloud':
        closeSheet();
        showToast('☁️ 词云功能开发中');
        break;
      case 'openVote':
        closeSheet();
        showToast('👍 投票功能开发中');
        break;
      case 'openCommitment':
        closeSheet();
        showToast('🤝 承诺功能开发中');
        break;
      case 'openHighlight':
        closeSheet();
        showToast('⭐ 已记录亮点');
        break;
      case 'openLiveNote':
        closeSheet();
        setTimeout(function() {
          var notePhaseLabel = document.getElementById('notePhaseLabel');
          if (notePhaseLabel && state.currentPlan && state.currentPlan.phases[state.livePhaseIndex]) {
            notePhaseLabel.textContent = '当前环节：' + state.currentPlan.phases[state.livePhaseIndex].name;
          }
          renderNoteList();
          openSheet('noteSheet');
        }, 200);
        break;
      case 'playSound':
        var soundName = target.getAttribute('data-sound') || target.closest('[data-sound]').getAttribute('data-sound');
        var soundLabels = { clap: '👏 鼓掌', cheer: '🎉 欢呼', countdown: '⏰ 倒计时', laugh: '😂 笑声', tension: '🥁 紧张', success: '🎊 成功' };
        showToast('播放音效：' + (soundLabels[soundName] || soundName));
        break;
      case 'addScore':
        var scoreTeamIdx = parseInt(target.getAttribute('data-team-index'));
        addScore(state.teams[scoreTeamIdx] ? state.teams[scoreTeamIdx].id : -1, 10);
        break;
      case 'showScoreOptions':
        var optTeamId = parseInt(target.getAttribute('data-team-id'));
        showScorePanel(optTeamId);
        break;
      case 'applyScore':
        var scorePoints = parseInt(target.getAttribute('data-points'));
        var scoreTargetId = parseInt(target.getAttribute('data-team-id'));
        addScore(scoreTargetId, scorePoints);
        closeSheet();
        break;
      case 'applyCustomScore':
        var customTeamId = parseInt(target.getAttribute('data-team-id'));
        var customInput = document.getElementById('customScoreInput');
        var customPoints = parseInt(customInput.value);
        if (isNaN(customPoints) || customPoints === 0) {
          showToast('⚠️ 请输入有效分值');
          return;
        }
        addScore(customTeamId, customPoints);
        closeSheet();
        break;
      case 'editTeamName':
        e.stopPropagation();
        var editTeamId = parseInt(target.getAttribute('data-team-id'));
        var editTeam = state.teams.find(function(t) { return t.id === editTeamId; });
        if (editTeam) {
          var newName = prompt('修改队伍名称', editTeam.name);
          if (newName && newName.trim()) {
            editTeam.name = newName.trim();
            renderScoreList();
            renderGroupList();
            showToast('✅ 队伍名称已更新');
          }
        }
        break;
      case 'regroup':
        renderGroupList();
        showToast('🔄 已重新分组');
        break;
      case 'enlargeQR':
        document.getElementById('qrFullscreen').classList.add('open');
        break;
      case 'closeQRFullscreen':
        document.getElementById('qrFullscreen').classList.remove('open');
        break;
      case 'editPlan':
        var editPlanId = parseInt(target.getAttribute('data-plan-id'));
        var editPlan = MOCK_PLANS.find(function(p) { return p.id === editPlanId; });
        if (editPlan && (editPlan.status === 'delivered' || editPlan.status === 'reviewed')) {
          state.currentPlan = editPlan;
          renderPlanPreview();
          navigateTo('planPreview');
        } else {
          renderPlanEdit(editPlanId);
          navigateTo('planEdit');
        }
        break;
      case 'viewPlanPreview':
        var previewPlanId = parseInt(target.getAttribute('data-plan-id'));
        var previewPlan = MOCK_PLANS.find(function(p) { return p.id === previewPlanId; });
        if (previewPlan) {
          state.currentPlan = previewPlan;
        }
        renderPlanPreview();
        navigateTo('planPreview');
        break;
      case 'viewActivity':
        if (target.closest('.swipe-btn')) return;
        if (target.closest('.activity-fav-icon')) return;
        var actId = parseInt(target.getAttribute('data-activity-id'));
        renderActivityDetail(actId);
        navigateTo('activityDetail');
        break;
      case 'pinActivity':
        var pinId = parseInt(target.getAttribute('data-activity-id'));
        var pinIdx = MOCK_ACTIVITIES.findIndex(function(a) { return a.id === pinId; });
        if (pinIdx > 0) {
          var pinAct = MOCK_ACTIVITIES.splice(pinIdx, 1)[0];
          MOCK_ACTIVITIES.unshift(pinAct);
          renderActivityList();
          showToast('📌 已置顶');
        }
        break;
      case 'editActivity':
        e.stopPropagation();
        var editActId = parseInt(target.getAttribute('data-activity-id'));
        var act = MOCK_ACTIVITIES.find(function(a) { return a.id === editActId; });
        if (act) {
          state.editingActivity = act;
          document.getElementById('activityEditTitle').textContent = '编辑活动';
          document.getElementById('editActivityName').value = act.name;
          document.getElementById('editActivityPeople').value = act.people;
          document.getElementById('editActivityDuration').value = act.duration;
          document.getElementById('editActivityGoal').value = act.goal;
          document.getElementById('editActivityRules').value = act.rules;
          document.getElementById('editActivityReview').value = act.reviewQuestions;
          document.getElementById('editActivityTips').value = act.tips;
          document.querySelectorAll('#editActivityScenes .tag-option').forEach(function(t) {
            t.classList.toggle('active', act.scenes.indexOf(t.getAttribute('data-tag')) !== -1);
          });
          document.querySelectorAll('#editActivityDifficulty .tag-option').forEach(function(t) {
            t.classList.toggle('active', t.getAttribute('data-tag') === act.difficulty);
          });
          document.getElementById('deleteActivityBtn').style.display = act.isCustom ? 'block' : 'none';
          navigateTo('activityEdit');
        }
        break;
      case 'toggleFav':
        e.stopPropagation();
        var favActId = parseInt(target.getAttribute('data-activity-id'));
        var favAct = MOCK_ACTIVITIES.find(function(a) { return a.id === favActId; });
        if (favAct) {
          favAct.favorited = !favAct.favorited;
          renderActivityList();
          showToast(favAct.favorited ? '❤️ 已收藏' : '🤍 已取消收藏');
        }
        break;
      case 'saveActivity':
        var actName = document.getElementById('editActivityName').value;
        if (!actName.trim()) {
          showToast('⚠️ 请输入活动名称');
          return;
        }
        if (state.editingActivity) {
          state.editingActivity.name = actName;
          showToast('✅ 活动已更新');
        } else {
          MOCK_ACTIVITIES.push({
            id: MOCK_ACTIVITIES.length + 1,
            name: actName,
            scenes: [],
            difficulty: '中等',
            people: document.getElementById('editActivityPeople').value || '',
            duration: document.getElementById('editActivityDuration').value || '',
            goal: document.getElementById('editActivityGoal').value || '',
            rules: document.getElementById('editActivityRules').value || '',
            reviewQuestions: document.getElementById('editActivityReview').value || '',
            tips: document.getElementById('editActivityTips').value || '',
            isCustom: true,
            favorited: false
          });
          showToast('✅ 活动已保存');
        }
        renderActivityList();
        goBack();
        break;
      case 'deleteActivity':
        if (!state.editingActivity || !state.editingActivity.isCustom) return;
        showConfirm('确认删除？', '删除后无法恢复', function() {
          var delIdx = MOCK_ACTIVITIES.findIndex(function(a) { return a.id === state.editingActivity.id; });
          if (delIdx !== -1) {
            MOCK_ACTIVITIES.splice(delIdx, 1);
            renderActivityList();
            goBack();
            showToast('🗑️ 活动已删除');
          }
        });
        break;
      case 'selectPlanForAdd':
        var addPlanId = parseInt(target.getAttribute('data-plan-id'));
        renderAddToPlanPhases(addPlanId);
        break;
      case 'backToPlanList':
        document.getElementById('addToPlanTitle').textContent = '选择方案';
        document.getElementById('addToPlanPlanList').style.display = '';
        document.getElementById('addToPlanPhaseList').style.display = 'none';
        break;
      case 'selectPhaseForAdd':
        var targetPlanId = parseInt(target.getAttribute('data-plan-id'));
        var targetPhaseIdx = parseInt(target.getAttribute('data-phase-index'));
        var targetPlan = MOCK_PLANS.find(function(p) { return p.id === targetPlanId; });
        if (targetPlan && state.currentActivity) {
          closeSheet();
          showToast('✅ 已添加到「' + targetPlan.name + '」的' + targetPlan.phases[targetPhaseIdx].name);
        }
        break;
      case 'previewPlan':
        savePlanEditFields();
        renderPlanPreview();
        navigateTo('planPreview');
        break;
      case 'showTemplateModal':
        openSheet('templateSelectSheet');
        break;
      case 'createFromTemplate':
        var tmplType = target.getAttribute('data-template-type');
        var tmplInfo = TEMPLATE_TYPES[tmplType];
        var newPlanFromTemplate = {
          id: MOCK_PLANS.length + 1,
          name: '新' + tmplInfo.name + '方案',
          client: '待定',
          type: tmplType,
          status: 'draft',
          people: 20,
          scenes: [],
          phases: JSON.parse(JSON.stringify(tmplInfo.phases))
        };
        MOCK_PLANS.push(newPlanFromTemplate);
        closeSheet();
        renderPlanCenterList();
        renderPlanSelectSheet();
        renderTodoList();
        renderPlanEdit(newPlanFromTemplate.id);
        navigateTo('planEdit');
        showToast('✅ 方案已创建');
        break;
      case 'showAddSegment':
        var customForm = document.getElementById('customSegmentForm');
        if (customForm) customForm.style.display = 'none';
        openSheet('addSegmentSheet');
        break;
      case 'addSegment':
        var segType = target.getAttribute('data-segment-type');
        if (segType === 'custom') {
          document.getElementById('customSegmentForm').style.display = 'block';
          return;
        }
        var segNames = { timer: '计时练习', random: '随机抽取', scene: '场景模拟', reflect: '反思分享' };
        var segIcons = { timer: '⏱', random: '🎲', scene: '🎭', reflect: '📝' };
        if (state.currentPlan) {
          state.currentPlan.phases.push({
            name: segNames[segType],
            time: 15,
            color: '#5856D6',
            icon: segIcons[segType]
          });
          renderPlanEdit(state.currentPlan.id);
        }
        closeSheet();
        showToast('✅ 已添加环节');
        break;
      case 'addCustomSegment':
        var customName = document.getElementById('customSegmentName').value || '自定义环节';
        var customTime = parseInt(document.getElementById('customSegmentTime').value) || 15;
        if (state.currentPlan) {
          state.currentPlan.phases.push({
            name: customName,
            time: customTime,
            color: '#5856D6',
            icon: '✏️'
          });
          renderPlanEdit(state.currentPlan.id);
        }
        closeSheet();
        showToast('✅ 已添加环节');
        break;
      case 'removeActivity':
        target.closest('.phase-activity-item').remove();
        break;
      case 'deletePhase':
        var delIdx = parseInt(target.getAttribute('data-index'));
        if (state.currentPlan && state.currentPlan.phases.length > 1) {
          state.currentPlan.phases.splice(delIdx, 1);
          renderPlanEdit(state.currentPlan.id);
          showToast('🗑️ 已删除环节');
        } else {
          showToast('⚠️ 至少保留一个环节');
        }
        break;
      case 'addActivityToPhase':
        var phaseIdx = parseInt(target.getAttribute('data-phase-index'));
        state.addingToPhaseIndex = phaseIdx;
        showActivityPicker();
        break;
      case 'selectActivityForPhase':
        var actId = parseInt(target.getAttribute('data-activity-id'));
        var act = MOCK_ACTIVITIES.find(function(a) { return a.id === actId; });
        if (act && state.currentPlan) {
          var phaseItem = document.querySelector('[data-phase-index="' + state.addingToPhaseIndex + '"]');
          if (phaseItem) {
            phaseItem.querySelector('span').textContent = act.name + ' · ' + act.people + ' · ' + act.duration;
            phaseItem.querySelector('span').style.color = 'var(--text-primary)';
          }
        }
        hideActivityPicker();
        break;
      case 'moveSegmentUp':
        var upIdx = parseInt(target.getAttribute('data-index'));
        if (upIdx > 0 && state.currentPlan) {
          var temp = state.currentPlan.phases[upIdx];
          state.currentPlan.phases[upIdx] = state.currentPlan.phases[upIdx - 1];
          state.currentPlan.phases[upIdx - 1] = temp;
          renderPlanEdit(state.currentPlan.id);
        }
        break;
      case 'moveSegmentDown':
        var downIdx = parseInt(target.getAttribute('data-index'));
        if (state.currentPlan && downIdx < state.currentPlan.phases.length - 1) {
          var temp2 = state.currentPlan.phases[downIdx];
          state.currentPlan.phases[downIdx] = state.currentPlan.phases[downIdx + 1];
          state.currentPlan.phases[downIdx + 1] = temp2;
          renderPlanEdit(state.currentPlan.id);
        }
        break;
      case 'toggleExpand':
        var section = target.getAttribute('data-section');
        toggleExpand(section);
        break;
      case 'togglePrepCollapse':
        var collapseName = target.getAttribute('data-collapse');
        togglePrepCollapse(collapseName);
        break;
      case 'editPrepPeople':
        showConfigEditor('预计人数', 'people');
        break;
      case 'editPrepCheckin':
        showConfigEditor('签到方式', 'checkin');
        break;
      case 'editPrepGroup':
        showConfigEditor('分组方式', 'group');
        break;
      case 'editPrepTeamCount':
        showConfigEditor('队伍数量', 'teamCount');
        break;
      case 'editPrepScoreMode':
        showConfigEditor('积分模式', 'scoreMode');
        break;
      case 'configNumMinus':
        var peopleInput = document.getElementById('configPeopleInput');
        peopleInput.value = Math.max(1, parseInt(peopleInput.value) - 1);
        break;
      case 'configNumPlus':
        var peopleInput2 = document.getElementById('configPeopleInput');
        peopleInput2.value = Math.min(99, parseInt(peopleInput2.value) + 1);
        break;
      case 'confirmConfigPeople':
        var peopleInput3 = document.getElementById('configPeopleInput');
        state.prepConfig.people = parseInt(peopleInput3.value) || 28;
        if (state.currentPlan) state.currentPlan.people = state.prepConfig.people;
        updatePrepDisplay();
        closeSheet();
        break;
      case 'configTeamMinus':
        var teamInput = document.getElementById('configTeamInput');
        teamInput.value = Math.max(2, parseInt(teamInput.value) - 1);
        break;
      case 'configTeamPlus':
        var teamInput2 = document.getElementById('configTeamInput');
        teamInput2.value = Math.min(10, parseInt(teamInput2.value) + 1);
        break;
      case 'confirmConfigTeam':
        var teamInput3 = document.getElementById('configTeamInput');
        state.prepConfig.teamCount = parseInt(teamInput3.value) || 4;
        updatePrepDisplay();
        closeSheet();
        break;
      case 'selectCheckin':
        state.prepConfig.checkin = target.getAttribute('data-value');
        updatePrepDisplay();
        closeSheet();
        break;
      case 'selectGroup':
        state.prepConfig.groupMethod = target.getAttribute('data-value');
        updatePrepDisplay();
        closeSheet();
        break;
      case 'selectScore':
        state.prepConfig.scoreMode = target.getAttribute('data-value');
        updatePrepDisplay();
        closeSheet();
        break;
      case 'completeReview':
        completeReview();
        break;
      case 'switchReviewMethod':
        var input2 = document.getElementById('flipCardInput');
        if (input2) {
          state.reviewNotes[state.reviewIndex] = input2.value;
        }
        state.reviewMethod = target.getAttribute('data-method');
        state.reviewIndex = 0;
        state.reviewNotes = [];
        document.querySelectorAll('.method-option').forEach(function(m) { m.classList.remove('active'); });
        target.classList.add('active');
        renderReviewGuide();
        break;
      case 'viewReviewDetail':
        var reviewPlanId = parseInt(target.getAttribute('data-plan-id'));
        var reviewPlan = MOCK_PLANS.find(function(p) { return p.id === reviewPlanId; });
        if (reviewPlan) {
          state.currentPlan = reviewPlan;
        }
        state.reviewMethod = 'ORID';
        state.reviewIndex = 0;
        state.reviewNotes = [];
        document.querySelectorAll('.method-option').forEach(function(m) { m.classList.remove('active'); });
        document.querySelector('.method-option[data-method="ORID"]').classList.add('active');
        renderReviewDetail();
        navigateTo('reviewGuide');
        break;
      case 'restartReview':
        if (state.currentPlan) {
          state.currentPlan.status = 'delivered';
          state.currentPlan.reviewNotes = null;
          state.currentPlan.reviewMethod = null;
        }
        state.reviewMethod = 'ORID';
        state.reviewIndex = 0;
        state.reviewNotes = [];
        document.querySelectorAll('.method-option').forEach(function(m) { m.classList.remove('active'); });
        document.querySelector('.method-option[data-method="ORID"]').classList.add('active');
        renderTodoList();
        renderReviewList();
        renderReviewDetail();
        break;
    }
  });

  document.querySelectorAll('.tab-item[data-tab]').forEach(function(tab) {
    tab.addEventListener('click', function() {
      switchTab(this.getAttribute('data-tab'));
    });
  });

  document.querySelectorAll('.sub-tab[data-sub-tab]').forEach(function(tab) {
    tab.addEventListener('click', function() {
      switchSubTab(this.getAttribute('data-sub-tab'));
    });
  });

  document.getElementById('btnNextPhase').addEventListener('click', nextPhase);
  document.getElementById('btnPrevPhase').addEventListener('click', prevPhase);

  document.getElementById('timerContainer').addEventListener('click', startTimer);
  document.getElementById('timerContainer').addEventListener('dblclick', function(e) {
    e.preventDefault();
    delayTimer();
  });

  document.getElementById('btnPick').addEventListener('click', doPick);
  document.getElementById('btnPickAgain').addEventListener('click', function() {
    document.getElementById('pickName').className = 'pick-name';
    document.getElementById('pickName').textContent = '?';
    document.getElementById('btnPickAgain').style.display = 'none';
    doPick();
  });

  document.querySelectorAll('.pick-tab[data-pick-tab]').forEach(function(tab) {
    tab.addEventListener('click', function() {
      state.pickTab = this.getAttribute('data-pick-tab');
      document.querySelectorAll('.pick-tab').forEach(function(t) { t.classList.remove('active'); });
      this.classList.add('active');
      if (state.pickTab === 'topic') {
        document.getElementById('pickCountSection').style.display = 'none';
        document.getElementById('pickTopicSection').style.display = '';
      } else {
        document.getElementById('pickCountSection').style.display = '';
        document.getElementById('pickTopicSection').style.display = 'none';
      }
      document.getElementById('pickName').textContent = '?';
      document.getElementById('pickName').className = 'pick-name';
      document.getElementById('btnPickAgain').style.display = 'none';
    });
  });

  document.querySelectorAll('.count-option[data-count]').forEach(function(opt) {
    opt.addEventListener('click', function() {
      state.pickCount = parseInt(this.getAttribute('data-count'));
      document.querySelectorAll('.count-option').forEach(function(o) { o.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  document.querySelectorAll('.topic-cat[data-cat]').forEach(function(cat) {
    cat.addEventListener('click', function() {
      state.pickCategory = this.getAttribute('data-cat');
      document.querySelectorAll('.topic-cat').forEach(function(c) { c.classList.remove('active'); });
      this.classList.add('active');
    });
  });


  document.getElementById('btnFlipNext').addEventListener('click', function() {
    var input = document.getElementById('flipCardInput');
    if (input) {
      state.reviewNotes[state.reviewIndex] = input.value;
    }

    var questions = REVIEW_METHODS[state.reviewMethod];
    if (state.reviewIndex < questions.length - 1) {
      state.reviewIndex++;
      renderReviewGuide();
    } else {
      completeReview();
    }
  });

  document.getElementById('btnFlipPrev').addEventListener('click', function() {
    var input = document.getElementById('flipCardInput');
    if (input) {
      state.reviewNotes[state.reviewIndex] = input.value;
    }

    if (state.reviewIndex > 0) {
      state.reviewIndex--;
      renderReviewGuide();
    }
  });

  document.querySelectorAll('.filter-item[data-filter]').forEach(function(item) {
    item.addEventListener('click', function() {
      state.activeFilter = this.getAttribute('data-filter');
      document.querySelectorAll('.filter-item').forEach(function(f) { f.classList.remove('active'); });
      this.classList.add('active');
      renderActivityList();
    });
  });

  var searchInput = document.getElementById('activitySearch');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      state.searchQuery = this.value;
      renderActivityList();
    });
  }

  var planSearchInput = document.getElementById('planSearch');
  if (planSearchInput) {
    planSearchInput.addEventListener('input', function() {
      state.planSearchQuery = this.value;
      renderPlanCenterList();
    });
  }

  document.querySelectorAll('#planTypeFilter .filter-item').forEach(function(item) {
    item.addEventListener('click', function() {
      this.parentElement.querySelectorAll('.filter-item').forEach(function(f) { f.classList.remove('active'); });
      this.classList.add('active');
      state.planTypeFilter = this.getAttribute('data-filter');
      renderPlanCenterList();
    });
  });

  document.querySelectorAll('#planStatusFilter .filter-item').forEach(function(item) {
    item.addEventListener('click', function() {
      this.parentElement.querySelectorAll('.filter-item').forEach(function(f) { f.classList.remove('active'); });
      this.classList.add('active');
      state.planStatusFilter = this.getAttribute('data-filter');
      renderPlanCenterList();
    });
  });

  document.querySelectorAll('.toggle-switch').forEach(function(sw) {
    sw.addEventListener('click', function() {
      this.classList.toggle('active');
    });
  });

  document.querySelectorAll('.filter-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      this.parentElement.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  document.querySelectorAll('.range-option').forEach(function(opt) {
    opt.addEventListener('click', function() {
      this.parentElement.querySelectorAll('.range-option').forEach(function(o) { o.classList.remove('active'); });
      this.classList.add('active');
    });
  });

  document.querySelectorAll('.tag-option[data-tag]').forEach(function(tag) {
    tag.addEventListener('click', function() {
      var parent = this.parentElement;
      if (parent.id === 'editActivityDifficulty') {
        parent.querySelectorAll('.tag-option').forEach(function(t) { t.classList.remove('active'); });
        this.classList.add('active');
      } else {
        this.classList.toggle('active');
      }
    });
  });

  var activeSwipe = null;
  document.addEventListener('touchstart', function(e) {
    var container = e.target.closest('.swipe-container');
    if (activeSwipe && activeSwipe !== container) {
      activeSwipe.querySelector('.swipe-content').style.transform = 'translateX(0)';
      activeSwipe.classList.remove('swiped');
      activeSwipe = null;
    }
    if (!container) return;
    container._startX = e.touches[0].clientX;
    container._startY = e.touches[0].clientY;
    container._moved = false;
  }, { passive: true });

  document.addEventListener('touchmove', function(e) {
    var container = e.target.closest('.swipe-container');
    if (!container || container._startX === undefined) return;
    var dx = e.touches[0].clientX - container._startX;
    var dy = e.touches[0].clientY - container._startY;
    if (Math.abs(dy) > Math.abs(dx)) return;
    container._moved = true;
    var content = container.querySelector('.swipe-content');
    var maxSwipe = parseInt(container.getAttribute('data-swipe-width')) || 60;
    if (dx < 0) {
      content.style.transform = 'translateX(' + Math.max(dx, -maxSwipe) + 'px)';
    } else {
      content.style.transform = 'translateX(0)';
    }
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    var container = e.target.closest('.swipe-container');
    if (!container || container._startX === undefined) return;
    var content = container.querySelector('.swipe-content');
    var dx = e.changedTouches[0].clientX - container._startX;
    var maxSwipe = parseInt(container.getAttribute('data-swipe-width')) || 60;
    if (container._moved && dx < -80) {
      content.style.transform = 'translateX(-' + maxSwipe + 'px)';
      content.style.transition = 'transform 0.3s ease';
      container.classList.add('swiped');
      activeSwipe = container;
    } else {
      content.style.transform = 'translateX(0)';
      content.style.transition = 'transform 0.3s ease';
      container.classList.remove('swiped');
      if (activeSwipe === container) activeSwipe = null;
    }
    setTimeout(function() { content.style.transition = ''; }, 300);
    container._startX = undefined;
  }, { passive: true });

  document.addEventListener('mousedown', function(e) {
    var container = e.target.closest('.swipe-container');
    if (activeSwipe && activeSwipe !== container) {
      activeSwipe.querySelector('.swipe-content').style.transform = 'translateX(0)';
      activeSwipe.classList.remove('swiped');
      activeSwipe = null;
    }
    if (!container) return;
    container._mouseStartX = e.clientX;
    container._mouseMoved = false;
  });

  document.addEventListener('mousemove', function(e) {
    var container = e.target.closest('.swipe-container');
    if (!container || container._mouseStartX === undefined) return;
    var dx = e.clientX - container._mouseStartX;
    container._mouseMoved = true;
    var content = container.querySelector('.swipe-content');
    var maxSwipe = parseInt(container.getAttribute('data-swipe-width')) || 60;
    if (dx < 0) {
      content.style.transform = 'translateX(' + Math.max(dx, -maxSwipe) + 'px)';
    } else {
      content.style.transform = 'translateX(0)';
    }
  });

  document.addEventListener('mouseup', function(e) {
    var container = e.target.closest('.swipe-container');
    if (!container || container._mouseStartX === undefined) return;
    var content = container.querySelector('.swipe-content');
    var dx = e.clientX - container._mouseStartX;
    var maxSwipe = parseInt(container.getAttribute('data-swipe-width')) || 60;
    if (container._mouseMoved && dx < -80) {
      content.style.transform = 'translateX(-' + maxSwipe + 'px)';
      content.style.transition = 'transform 0.3s ease';
      container.classList.add('swiped');
      activeSwipe = container;
    } else {
      content.style.transform = 'translateX(0)';
      content.style.transition = 'transform 0.3s ease';
      container.classList.remove('swiped');
      if (activeSwipe === container) activeSwipe = null;
    }
    setTimeout(function() { content.style.transition = ''; }, 300);
    container._mouseStartX = undefined;
  });

  document.querySelectorAll('.timer-preset[data-action="setTimerPreset"]').forEach(function(preset) {
    preset.addEventListener('click', function() {
      var minutes = parseInt(this.getAttribute('data-minutes'));
      state.standaloneTimerSeconds = minutes * 60;
      document.querySelectorAll('.timer-preset').forEach(function(p) { p.classList.remove('active'); });
      this.classList.add('active');
      updateStandaloneTimerDisplay();
    });
  });

  document.getElementById('btnStandaloneTimer').addEventListener('click', function() {
    if (state.standaloneTimerRunning) {
      clearInterval(state.standaloneTimerInterval);
      state.standaloneTimerRunning = false;
      this.textContent = '▶ 开始计时';
      return;
    }
    state.standaloneTimerRunning = true;
    this.textContent = '⏸ 暂停';
    state.standaloneTimerInterval = setInterval(function() {
      state.standaloneTimerSeconds--;
      updateStandaloneTimerDisplay();
      if (state.standaloneTimerSeconds <= 0) {
        clearInterval(state.standaloneTimerInterval);
        state.standaloneTimerRunning = false;
        document.getElementById('btnStandaloneTimer').textContent = '▶ 开始计时';
        showToast('⏰ 计时结束！');
      }
    }, 1000);
  });

  document.getElementById('btnFavActivity').addEventListener('click', function() {
    if (state.currentActivity) {
      state.currentActivity.favorited = !state.currentActivity.favorited;
      this.textContent = state.currentActivity.favorited ? '❤️' : '🤍';
      if (state.currentActivity.favorited) this.classList.add('faved');
      else this.classList.remove('faved');
      showToast(state.currentActivity.favorited ? '❤️ 已收藏' : '🤍 已取消收藏');
    }
  });

  document.getElementById('btnAddToPlan').addEventListener('click', function() {
    if (state.currentActivity) {
      showAddToPlanSheet();
    }
  });

  document.querySelectorAll('.view-toggle .toggle-option').forEach(function(opt) {
    opt.addEventListener('click', function() {
      document.querySelectorAll('.view-toggle .toggle-option').forEach(function(o) { o.classList.remove('active'); });
      this.classList.add('active');
      var view = this.getAttribute('data-view');
      if (view === 'client') {
        showToast('👤 客户视角（隐藏培训师备注）');
      }
    });
  });

  var liveFlow = document.getElementById('liveFlow');
  var touchStartX = 0;
  liveFlow.addEventListener('touchstart', function(e) {
    touchStartX = e.touches[0].clientX;
  });
  liveFlow.addEventListener('touchend', function(e) {
    var touchEndX = e.changedTouches[0].clientX;
    var diff = touchEndX - touchStartX;
    if (Math.abs(diff) > 60) {
      if (diff < 0) nextPhase();
      else prevPhase();
    }
  });
}

function updateStandaloneTimerDisplay() {
  var minutes = Math.floor(state.standaloneTimerSeconds / 60);
  var seconds = state.standaloneTimerSeconds % 60;
  var display = document.getElementById('standaloneTimerDisplay');
  if (display) {
    display.textContent = (minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
}

init();
