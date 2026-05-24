import { describe, it, expect } from 'vitest'
import {
  PLAN_STATUS,
  PLAN_STATUS_LABELS,
  PLAN_TYPES,
  PLAN_TYPE_LABELS,
  ACTIVITY_CATEGORIES,
  ACTIVITY_CATEGORY_LABELS,
  REVIEW_METHODS,
  REVIEW_METHOD_LABELS,
  LIVE_PHASES,
  TODO_TYPES,
  STORAGE_KEYS
} from '../../__uts_mirror__/utils/constants'

describe('PLAN_STATUS', () => {
  it('has all required statuses', () => {
    expect(PLAN_STATUS.DRAFT).toBe('draft')
    expect(PLAN_STATUS.CONFIRMED).toBe('confirmed')
    expect(PLAN_STATUS.DELIVERED).toBe('delivered')
    expect(PLAN_STATUS.REVIEWED).toBe('reviewed')
  })

  it('has labels for all statuses', () => {
    expect(PLAN_STATUS_LABELS[PLAN_STATUS.DRAFT]).toBe('草稿')
    expect(PLAN_STATUS_LABELS[PLAN_STATUS.CONFIRMED]).toBe('已确认')
    expect(PLAN_STATUS_LABELS[PLAN_STATUS.DELIVERED]).toBe('已交付')
    expect(PLAN_STATUS_LABELS[PLAN_STATUS.REVIEWED]).toBe('已复盘')
  })
})

describe('PLAN_TYPES', () => {
  it('has all required types', () => {
    expect(PLAN_TYPES.IMPROV_TRAINING).toBe('improv_training')
    expect(PLAN_TYPES.TEAM_BUILDING).toBe('team_building')
    expect(PLAN_TYPES.WORKSHOP).toBe('workshop')
    expect(PLAN_TYPES.LECTURE).toBe('lecture')
    expect(PLAN_TYPES.CUSTOM).toBe('custom')
  })

  it('has labels for all types', () => {
    expect(PLAN_TYPE_LABELS[PLAN_TYPES.IMPROV_TRAINING]).toBe('即兴培训')
    expect(PLAN_TYPE_LABELS[PLAN_TYPES.TEAM_BUILDING]).toBe('团队建设')
    expect(PLAN_TYPE_LABELS[PLAN_TYPES.WORKSHOP]).toBe('工作坊')
    expect(PLAN_TYPE_LABELS[PLAN_TYPES.LECTURE]).toBe('讲座/授课')
    expect(PLAN_TYPE_LABELS[PLAN_TYPES.CUSTOM]).toBe('自定义')
  })
})

describe('ACTIVITY_CATEGORIES', () => {
  it('has all required categories', () => {
    expect(ACTIVITY_CATEGORIES.ICEBREAKER).toBe('icebreaker')
    expect(ACTIVITY_CATEGORIES.ENERGY).toBe('energy')
    expect(ACTIVITY_CATEGORIES.COLLABORATION).toBe('collaboration')
    expect(ACTIVITY_CATEGORIES.CREATIVITY).toBe('creativity')
    expect(ACTIVITY_CATEGORIES.REFLECTION).toBe('reflection')
    expect(ACTIVITY_CATEGORIES.CUSTOM).toBe('custom')
  })

  it('has labels for all categories', () => {
    expect(ACTIVITY_CATEGORY_LABELS[ACTIVITY_CATEGORIES.ICEBREAKER]).toBe('破冰')
    expect(ACTIVITY_CATEGORY_LABELS[ACTIVITY_CATEGORIES.ENERGY]).toBe('能量')
    expect(ACTIVITY_CATEGORY_LABELS[ACTIVITY_CATEGORIES.COLLABORATION]).toBe('协作')
    expect(ACTIVITY_CATEGORY_LABELS[ACTIVITY_CATEGORIES.CREATIVITY]).toBe('创意')
    expect(ACTIVITY_CATEGORY_LABELS[ACTIVITY_CATEGORIES.REFLECTION]).toBe('反思')
    expect(ACTIVITY_CATEGORY_LABELS[ACTIVITY_CATEGORIES.CUSTOM]).toBe('自定义')
  })
})

describe('REVIEW_METHODS', () => {
  it('has all required methods', () => {
    expect(REVIEW_METHODS.ORID).toBe('orid')
    expect(REVIEW_METHODS.FOUR_F).toBe('4f')
    expect(REVIEW_METHODS.SSC).toBe('ssc')
  })

  it('has labels for all methods', () => {
    expect(REVIEW_METHOD_LABELS[REVIEW_METHODS.ORID]).toBe('ORID')
    expect(REVIEW_METHOD_LABELS[REVIEW_METHODS.FOUR_F]).toBe('4F')
    expect(REVIEW_METHOD_LABELS[REVIEW_METHODS.SSC]).toBe('SSC')
  })
})

describe('LIVE_PHASES', () => {
  it('has all required phases', () => {
    expect(LIVE_PHASES.NOT_STARTED).toBe('not_started')
    expect(LIVE_PHASES.IN_PROGRESS).toBe('in_progress')
    expect(LIVE_PHASES.PAUSED).toBe('paused')
    expect(LIVE_PHASES.ENDED).toBe('ended')
  })
})

describe('STORAGE_KEYS', () => {
  it('has all required keys', () => {
    expect(STORAGE_KEYS.TOKEN).toBe('auth_token')
    expect(STORAGE_KEYS.USER_INFO).toBe('user_info')
    expect(STORAGE_KEYS.CURRENT_PLAN).toBe('current_plan')
    expect(STORAGE_KEYS.LIVE_SESSION).toBe('live_session')
    expect(STORAGE_KEYS.DRAFT_NOTES).toBe('draft_notes')
  })
})

describe('TODO_TYPES', () => {
  it('has all required todo types', () => {
    expect(TODO_TYPES.DRAFT_PLAN).toBe('draft_plan')
    expect(TODO_TYPES.CONFIRMED_PLAN).toBe('confirmed_plan')
    expect(TODO_TYPES.DELIVERED_PLAN).toBe('delivered_plan')
    expect(TODO_TYPES.REVIEWED_PLAN).toBe('reviewed_plan')
  })

  it('maps each todo type to a plan status', () => {
    expect(TODO_TYPES.DRAFT_PLAN).toContain(PLAN_STATUS.DRAFT)
    expect(TODO_TYPES.CONFIRMED_PLAN).toContain(PLAN_STATUS.CONFIRMED)
    expect(TODO_TYPES.DELIVERED_PLAN).toContain(PLAN_STATUS.DELIVERED)
    expect(TODO_TYPES.REVIEWED_PLAN).toContain(PLAN_STATUS.REVIEWED)
  })
})

describe('PLAN_TYPE_LABELS completeness', () => {
  it('has a label for every PLAN_TYPES key', () => {
    Object.keys(PLAN_TYPES).forEach(key => {
      expect(PLAN_TYPE_LABELS[PLAN_TYPES[key]]).toBeDefined()
    })
  })

  it('LECTURE type has correct label', () => {
    expect(PLAN_TYPES.LECTURE).toBe('lecture')
    expect(PLAN_TYPE_LABELS[PLAN_TYPES.LECTURE]).toBe('讲座/授课')
  })
})

describe('ACTIVITY_CATEGORY_LABELS completeness', () => {
  it('has a label for every ACTIVITY_CATEGORIES key', () => {
    Object.keys(ACTIVITY_CATEGORIES).forEach(key => {
      expect(ACTIVITY_CATEGORY_LABELS[ACTIVITY_CATEGORIES[key]]).toBeDefined()
    })
  })
})

describe('REVIEW_METHOD_LABELS completeness', () => {
  it('has a label for every REVIEW_METHODS key', () => {
    Object.keys(REVIEW_METHODS).forEach(key => {
      expect(REVIEW_METHOD_LABELS[REVIEW_METHODS[key]]).toBeDefined()
    })
  })

  it('FOUR_F label uses uppercase 4F', () => {
    expect(REVIEW_METHOD_LABELS[REVIEW_METHODS.FOUR_F]).toBe('4F')
  })
})

describe('PLAN_STATUS_LABELS completeness', () => {
  it('has a label for every PLAN_STATUS key', () => {
    Object.keys(PLAN_STATUS).forEach(key => {
      expect(PLAN_STATUS_LABELS[PLAN_STATUS[key]]).toBeDefined()
    })
  })
})

describe('LIVE_PHASES completeness', () => {
  it('has exactly 4 phases', () => {
    expect(Object.keys(LIVE_PHASES)).toHaveLength(4)
  })
})
