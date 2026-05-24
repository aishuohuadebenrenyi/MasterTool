import { describe, it, expect } from 'vitest'
import { formatDate, formatDuration, formatCountdown, formatNumber } from '../../__uts_mirror__/utils/format'

describe('formatDate', () => {
  it('formats date with YYYY-MM-DD', () => {
    const date = new Date(2026, 4, 23)
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2026-05-23')
  })

  it('formats date with full datetime', () => {
    const date = new Date(2026, 4, 23, 14, 30)
    expect(formatDate(date, 'YYYY-MM-DD HH:mm')).toBe('2026-05-23 14:30')
  })

  it('pads single digit months and days', () => {
    const date = new Date(2026, 0, 5)
    expect(formatDate(date, 'YYYY-MM-DD')).toBe('2026-01-05')
  })
})

describe('formatDuration', () => {
  it('formats minutes only', () => {
    expect(formatDuration(30)).toBe('30分钟')
  })

  it('formats hours and minutes', () => {
    expect(formatDuration(90)).toBe('1小时30分钟')
  })

  it('formats exact hours', () => {
    expect(formatDuration(120)).toBe('2小时')
  })

  it('formats zero minutes', () => {
    expect(formatDuration(0)).toBe('0分钟')
  })
})

describe('formatCountdown', () => {
  it('formats seconds', () => {
    expect(formatCountdown(45)).toBe('00:45')
  })

  it('formats minutes and seconds', () => {
    expect(formatCountdown(125)).toBe('02:05')
  })

  it('formats zero', () => {
    expect(formatCountdown(0)).toBe('00:00')
  })
})

describe('formatNumber', () => {
  it('formats small numbers as-is', () => {
    expect(formatNumber(42)).toBe('42')
  })

  it('formats thousands with k', () => {
    expect(formatNumber(1500)).toBe('1.5k')
  })

  it('formats ten-thousands with w', () => {
    expect(formatNumber(25000)).toBe('2.5w')
  })
})
