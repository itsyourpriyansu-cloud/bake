import { describe, expect, it } from 'vitest'
import { deriveActivityState, deriveCustomerStage, deriveTags, recalculateCustomerStats } from './crm.engine'
import type { CrmOrderHistoryEntry } from './crm.types'

describe('deriveCustomerStage', () => {
  it('maps lifetime order count to a lifecycle stage', () => {
    expect(deriveCustomerStage(0)).toBe('NEW')
    expect(deriveCustomerStage(1)).toBe('FIRST_ORDER')
    expect(deriveCustomerStage(2)).toBe('SECOND_ORDER')
    expect(deriveCustomerStage(5)).toBe('REPEAT')
    expect(deriveCustomerStage(12)).toBe('LOYAL')
    expect(deriveCustomerStage(13)).toBe('VIP')
  })
})

describe('deriveActivityState', () => {
  const now = new Date('2026-09-08T00:00:00.000Z')
  it('is ACTIVE within 14 days, AT_RISK within 30, DORMANT beyond', () => {
    expect(deriveActivityState('2026-09-01T00:00:00.000Z', now)).toBe('ACTIVE')
    expect(deriveActivityState('2026-08-20T00:00:00.000Z', now)).toBe('AT_RISK')
    expect(deriveActivityState('2026-07-01T00:00:00.000Z', now)).toBe('DORMANT')
    expect(deriveActivityState(undefined, now)).toBe('DORMANT')
  })
})

describe('deriveTags and recalculateCustomerStats', () => {
  const history: CrmOrderHistoryEntry[] = [
    { fulfillmentType: 'DELIVERY', total: 400, category: 'PIZZA', completedAt: '2026-09-05T12:00:00.000Z' }, // Saturday
    { fulfillmentType: 'DELIVERY', total: 500, category: 'PIZZA', completedAt: '2026-08-30T12:00:00.000Z' }, // Sunday
    { fulfillmentType: 'DELIVERY', total: 300, category: 'PIZZA', completedAt: '2026-08-01T12:00:00.000Z' },
  ]

  it('recomputes rolling windows, lifetime totals and average order value', () => {
    const stats = recalculateCustomerStats({ rolling30Orders: 0, rolling120Orders: 0, rolling120EligibleSpend: 0, lifetimeOrders: 0, lifetimeValue: 0, averageOrderValue: 0, preferredProducts: [] }, history, new Date('2026-09-08T00:00:00.000Z'))
    expect(stats.lifetimeOrders).toBe(3)
    expect(stats.lifetimeValue).toBe(1200)
    expect(stats.averageOrderValue).toBe(400)
    expect(stats.rolling120Orders).toBe(3)
  })

  it('derives Gold Wave, category-love and weekend/delivery tags from tier and history', () => {
    const tags = deriveTags({ tier: 'GOLD', stats: { rolling30Orders: 0, rolling120Orders: 3, rolling120EligibleSpend: 1200, lifetimeOrders: 3, lifetimeValue: 1200, averageOrderValue: 400, preferredProducts: [] } }, history)
    expect(tags).toContain('Gold Wave')
    expect(tags).toContain('PIZZA Lover')
    expect(tags).toContain('Weekend Buyer')
    expect(tags).toContain('Delivery Regular')
    expect(tags).toContain('High AOV')
  })
})
