import { describe, expect, it } from 'vitest'
import { buildPlanMarkdown, getPlanDocumentFileName } from '../../__uts_mirror__/utils/planDocument'

describe('planDocument', () => {
  const plan = {
    name: '即兴训练方案',
    type: 'improv_training',
    client: '测试客户',
    people: 20,
    duration: 60,
    phases: [
      { name: '热身练习', duration: 10 },
      { name: '综合练习', duration: 50, reminders: ['控制节奏'] }
    ]
  }

  it('builds trainer markdown with internal execution notes', () => {
    const markdown = buildPlanMarkdown(plan, 'trainer')
    expect(markdown).toContain('导出视角：培训师视角')
    expect(markdown).toContain('控场重点')
    expect(markdown).toContain('提醒：控制节奏')
  })

  it('builds client markdown without trainer reminders', () => {
    const markdown = buildPlanMarkdown(plan, 'client')
    expect(markdown).toContain('导出视角：客户视角')
    expect(markdown).toContain('参与体验')
    expect(markdown).not.toContain('提醒：控制节奏')
  })

  it('returns a safe markdown filename', () => {
    expect(getPlanDocumentFileName({ name: 'A/B:方案' })).toBe('A-B-方案.md')
  })
})
