import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reactive } from 'vue'

const mockPlanStore = reactive({
  draftPlans: [],
  confirmedPlans: [],
  deliveredPlans: [],
  reviewedPlans: []
})

vi.mock('../../__uts_mirror__/stores/plan', () => ({
  usePlanStore: () => mockPlanStore
}))

import { useTodoList } from '../../__uts_mirror__/composables/useTodoList'

describe('useTodoList', () => {
  beforeEach(() => {
    mockPlanStore.draftPlans = []
    mockPlanStore.confirmedPlans = []
    mockPlanStore.deliveredPlans = []
    mockPlanStore.reviewedPlans = []
  })

  it('returns empty todo items when no plans', () => {
    const { todoItems, todoCount } = useTodoList()
    expect(todoItems.value).toHaveLength(0)
    expect(todoCount.value).toBe(0)
  })

  it('includes draft plans as confirm actions', () => {
    mockPlanStore.draftPlans = [{ id: '1', name: '方案A', status: 'draft' }]
    const { todoItems, todoCount } = useTodoList()
    expect(todoCount.value).toBe(1)
    expect(todoItems.value[0].type).toBe('draft_plan')
    expect(todoItems.value[0].action).toBe('confirmPlan')
    expect(todoItems.value[0].planName).toBe('方案A')
  })

  it('includes confirmed plans as startLive actions', () => {
    mockPlanStore.confirmedPlans = [{ id: '2', name: '方案B', status: 'confirmed' }]
    const { todoItems, todoCount } = useTodoList()
    expect(todoCount.value).toBe(1)
    expect(todoItems.value[0].type).toBe('confirmed_plan')
    expect(todoItems.value[0].action).toBe('startLive')
  })

  it('includes delivered plans as startReview actions', () => {
    mockPlanStore.deliveredPlans = [{ id: '3', name: '方案C', status: 'delivered' }]
    const { todoItems, todoCount } = useTodoList()
    expect(todoCount.value).toBe(1)
    expect(todoItems.value[0].type).toBe('delivered_plan')
    expect(todoItems.value[0].action).toBe('startReview')
  })

  it('includes reviewed plans as restartReview actions', () => {
    mockPlanStore.reviewedPlans = [{ id: '4', name: '方案D', status: 'reviewed' }]
    const { todoItems, todoCount } = useTodoList()
    expect(todoCount.value).toBe(1)
    expect(todoItems.value[0].type).toBe('reviewed_plan')
    expect(todoItems.value[0].action).toBe('restartReview')
  })

  it('aggregates all plan types', () => {
    mockPlanStore.draftPlans = [{ id: '1', name: 'A', status: 'draft' }]
    mockPlanStore.confirmedPlans = [{ id: '2', name: 'B', status: 'confirmed' }]
    mockPlanStore.deliveredPlans = [{ id: '3', name: 'C', status: 'delivered' }]
    mockPlanStore.reviewedPlans = [{ id: '4', name: 'D', status: 'reviewed' }]
    const { todoCount } = useTodoList()
    expect(todoCount.value).toBe(4)
  })
})
