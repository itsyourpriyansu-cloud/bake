import { describe, expect, it } from 'vitest'
import { buildCrmOpportunities, deriveCustomerSegments, rankPersonalizedProducts, referralRewardEligible } from './retention.engine'
import { primaryCustomerSeed, secondaryCustomerSeed } from '../../prototype/seed/customers.seed'
import { celebrationSeed, favouriteSeed, foodPreferencesSeed, savedOrderSeed } from '../../prototype/seed/customer-experience.seed'
import { productSeed } from '../../prototype/seed/catalog.seed'

describe('retention domain engine', () => {
  it('derives lifecycle opportunities independently from tier', () => {
    const atRiskGold = { ...primaryCustomerSeed, activityState: 'AT_RISK' as const, stats: { ...primaryCustomerSeed.stats, lifetimeOrders: 1, lastOrderAt: '2026-08-24T00:00:00.000Z' } }
    expect(deriveCustomerSegments(atRiskGold, [], new Date('2026-09-13T00:00:00.000Z'), 12)).toEqual(expect.arrayContaining(['SECOND_ORDER_PENDING', 'INACTIVE_14_30_DAYS', 'POINTS_EXPIRING', 'NEAR_PLATINUM']))
  })

  it('builds every requested segment and the frozen 81-person example', () => {
    const rows = buildCrmOpportunities([primaryCustomerSeed, secondaryCustomerSeed], celebrationSeed, new Date('2026-09-13T00:00:00.000Z'))
    expect(rows.map((row) => row.segment)).toHaveLength(8)
    expect(rows.find((row) => row.segment === 'INACTIVE_14_30_DAYS')).toMatchObject({ title: 'Inactive Pizza Lovers', customerCount: 81, offer: '2X Wave Points' })
  })

  it('ranks saved and favourite vegetarian products without avoided ingredients', () => {
    const ranked = rankPersonalizedProducts(productSeed, foodPreferencesSeed, favouriteSeed, savedOrderSeed, primaryCustomerSeed)
    expect(ranked.slice(0, 3)).toContain('PIZZA-PANEER-001')
    expect(ranked).not.toContain('PIZZA-CHK-001')
    expect(ranked).not.toContain('PIZZA-MUSH-001')
  })

  it('never rewards a referral for signup alone', () => {
    expect(referralRewardEligible('SIGNED_UP')).toBe(false)
    expect(referralRewardEligible('FIRST_ORDER_PENDING')).toBe(false)
    expect(referralRewardEligible('QUALIFIED')).toBe(true)
  })
})

