import { describe, expect, it } from 'vitest'
import { applyOrderCompletion, applyRefundReversal, calculateFrequencyBonus, calculatePointsEarned, calculateRedemption, calculateTier, calculateTierProgress } from './loyalty.engine'

describe('calculateTier', () => {
  it('requires both orders and spend thresholds to be met', () => {
    expect(calculateTier({ rolling120Orders: 6, rolling120EligibleSpend: 100 }).id).toBe('MEMBER')
    expect(calculateTier({ rolling120Orders: 0, rolling120EligibleSpend: 5000 }).id).toBe('MEMBER')
    expect(calculateTier({ rolling120Orders: 8, rolling120EligibleSpend: 3620 }).id).toBe('GOLD')
    expect(calculateTier({ rolling120Orders: 10, rolling120EligibleSpend: 4500 }).id).toBe('PLATINUM')
  })
})

describe('calculatePointsEarned', () => {
  it('applies the tier earn rate and floors fractional points', () => {
    expect(calculatePointsEarned(110, { id: 'GOLD', name: 'Gold Wave', ordersRequired: 6, spendRequired: 2500, earnRate: 0.04 })).toBe(4)
  })
})

describe('calculateFrequencyBonus', () => {
  it('awards the highest bonus tier reached, not a cumulative sum', () => {
    expect(calculateFrequencyBonus(2)).toBe(0)
    expect(calculateFrequencyBonus(3)).toBe(25)
    expect(calculateFrequencyBonus(4)).toBe(25)
    expect(calculateFrequencyBonus(5)).toBe(50)
  })
})

describe('calculateRedemption', () => {
  it('rejects redemption below the minimum', () => {
    expect(calculateRedemption(20, 200, 1000)).toEqual({ pointsUsable: 0, pointsValue: 0, warnings: ['Minimum redemption is 50 points.'] })
  })
  it('caps redemption at 20% of eligible subtotal even if the customer has more points', () => {
    const result = calculateRedemption(500, 500, 1000)
    expect(result.pointsUsable).toBe(200)
    expect(result.pointsValue).toBe(200)
    expect(result.warnings).toContain('Points reduced to stay within redemption limits.')
  })
  it('caps redemption at points available even if under the spend cap', () => {
    const result = calculateRedemption(300, 80, 10000)
    expect(result.pointsUsable).toBe(80)
  })
})

describe('calculateTierProgress', () => {
  it('reports remaining orders/spend to the next tier', () => {
    const progress = calculateTierProgress({ rolling120Orders: 8, rolling120EligibleSpend: 3620 })
    expect(progress.tier.id).toBe('GOLD')
    expect(progress.next?.id).toBe('PLATINUM')
    expect(progress.ordersNeeded).toBe(2)
    expect(progress.spendNeeded).toBe(880)
  })
  it('has no next tier at Platinum', () => {
    expect(calculateTierProgress({ rolling120Orders: 20, rolling120EligibleSpend: 9000 }).next).toBeUndefined()
  })
})

describe('applyOrderCompletion', () => {
  it('always emits an EARN_AVAILABLE transaction and only a bonus one when the frequency threshold is met', () => {
    const tier = calculateTier({ rolling120Orders: 8, rolling120EligibleSpend: 3620 })
    const withoutBonus = applyOrderCompletion({ orderId: 'O1', customerId: 'C1', eligibleSubtotal: 200, tier, completedOrdersInRolling30: 1, now: new Date('2026-09-08') })
    expect(withoutBonus).toHaveLength(1)
    expect(withoutBonus[0].type).toBe('EARN_AVAILABLE')

    const withBonus = applyOrderCompletion({ orderId: 'O2', customerId: 'C1', eligibleSubtotal: 200, tier, completedOrdersInRolling30: 3, now: new Date('2026-09-08') })
    expect(withBonus).toHaveLength(2)
    expect(withBonus[1].type).toBe('BONUS')
    expect(withBonus[1].points).toBe(25)
  })
})

describe('applyRefundReversal', () => {
  it('produces a negative REVERSED transaction for the reversed points', () => {
    const reversal = applyRefundReversal('O1', 'C1', 9, new Date('2026-09-08'))
    expect(reversal.type).toBe('REVERSAL')
    expect(reversal.status).toBe('REVERSED')
    expect(reversal.points).toBe(-9)
  })
})
