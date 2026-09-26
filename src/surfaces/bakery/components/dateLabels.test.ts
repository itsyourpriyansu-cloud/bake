import { describe, expect, it } from 'vitest'
import { countdownParts, weekdayDateLabel, weekdayLabel } from './dateLabels'

describe('countdownParts', () => {
  it('formats time remaining as HH:MM:SS and is not overdue', () => {
    const now = Date.parse('2026-09-24T10:00:00Z')
    const target = new Date(now + (2 * 3600 + 5 * 60 + 30) * 1000).toISOString()
    expect(countdownParts(target, now)).toEqual({ overdue: false, label: '02:05:30' })
  })

  it('flags overdue tickets and formats the elapsed overdue time', () => {
    const now = Date.parse('2026-09-24T10:00:00Z')
    const target = new Date(now - (1 * 3600 + 2 * 60 + 3) * 1000).toISOString()
    expect(countdownParts(target, now)).toEqual({ overdue: true, label: '01:02:03' })
  })

  it('handles the exact promised instant as not overdue', () => {
    const now = Date.parse('2026-09-24T10:00:00Z')
    expect(countdownParts(new Date(now).toISOString(), now)).toEqual({ overdue: false, label: '00:00:00' })
  })
})

describe('weekdayLabel / weekdayDateLabel', () => {
  it('formats an uppercase weekday and a weekday-plus-date label', () => {
    const thursday = new Date('2026-09-24T12:00:00+05:30')
    expect(weekdayLabel(thursday)).toBe('THURSDAY')
    expect(weekdayDateLabel(thursday)).toBe('THURSDAY · 24 SEPTEMBER')
  })
})
