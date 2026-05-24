import { describe, it, expect } from 'vitest'
import { isRequired, isInRange, isMaxLength, validatePlan, validateActivity } from '../../__uts_mirror__/utils/validate'

describe('isRequired', () => {
  it('returns invalid for null', () => {
    expect(isRequired(null, '名称').valid).toBe(false)
  })

  it('returns invalid for empty string', () => {
    expect(isRequired('', '名称').valid).toBe(false)
  })

  it('returns valid for non-empty string', () => {
    expect(isRequired('test', '名称').valid).toBe(true)
  })

  it('returns valid for zero', () => {
    expect(isRequired(0, '数量').valid).toBe(true)
  })
})

describe('isInRange', () => {
  it('returns invalid for non-number', () => {
    expect(isInRange('abc', 1, 100, '数量').valid).toBe(false)
  })

  it('returns invalid for below min', () => {
    expect(isInRange(0, 1, 100, '数量').valid).toBe(false)
  })

  it('returns invalid for above max', () => {
    expect(isInRange(101, 1, 100, '数量').valid).toBe(false)
  })

  it('returns valid for in range', () => {
    expect(isInRange(50, 1, 100, '数量').valid).toBe(true)
  })

  it('returns valid for boundary values', () => {
    expect(isInRange(1, 1, 100, '数量').valid).toBe(true)
    expect(isInRange(100, 1, 100, '数量').valid).toBe(true)
  })
})

describe('isMaxLength', () => {
  it('returns invalid when exceeds max', () => {
    expect(isMaxLength('a'.repeat(101), 100, '名称').valid).toBe(false)
  })

  it('returns valid when within max', () => {
    expect(isMaxLength('test', 100, '名称').valid).toBe(true)
  })
})

describe('validatePlan', () => {
  it('returns valid for complete plan data', () => {
    const result = validatePlan({ name: '测试方案', people: 20, phases: [{ name: '环节1' }] })
    expect(result.valid).toBe(true)
  })

  it('returns invalid for missing name', () => {
    const result = validatePlan({ phases: [{ name: '环节1' }] })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('方案名称'))).toBe(true)
  })

  it('returns invalid for invalid people count', () => {
    const result = validatePlan({ name: '测试', people: -1, phases: [{ name: '环节1' }] })
    expect(result.valid).toBe(false)
  })

  it('returns invalid for empty phases', () => {
    const result = validatePlan({ name: '测试', phases: [] })
    expect(result.valid).toBe(false)
  })
})

describe('validateActivity', () => {
  it('returns valid for complete activity data', () => {
    const result = validateActivity({ name: '测试活动', duration: 15 })
    expect(result.valid).toBe(true)
  })

  it('returns invalid for missing name', () => {
    const result = validateActivity({ duration: 15 })
    expect(result.valid).toBe(false)
  })

  it('returns invalid for out-of-range duration', () => {
    const result = validateActivity({ name: '测试', duration: 500 })
    expect(result.valid).toBe(false)
  })
})
