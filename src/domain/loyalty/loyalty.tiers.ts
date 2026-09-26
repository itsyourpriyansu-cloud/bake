import type { LoyaltyTier } from './loyalty.types'

export const LOYALTY_TIERS: LoyaltyTier[] = [
  { id: 'MEMBER', name: 'Wave Member', ordersRequired: 0, spendRequired: 0, earnRate: 0.02 },
  { id: 'SILVER', name: 'Silver Wave', ordersRequired: 3, spendRequired: 1000, earnRate: 0.03 },
  { id: 'GOLD', name: 'Gold Wave', ordersRequired: 6, spendRequired: 2500, earnRate: 0.04 },
  { id: 'PLATINUM', name: 'Platinum Wave', ordersRequired: 10, spendRequired: 4500, earnRate: 0.05 },
]

export const LOYALTY_CONFIG = {
  qualificationWindowDays: 120,
  gracePeriodDays: 30,
  pointsExpiryDays: 180,
  minRedemptionPoints: 50,
  maxRedemptionPercentOfEligibleSubtotal: 0.2,
  pointToRupee: 1,
  frequencyBonuses: [
    { minOrdersInRolling30: 3, bonusPoints: 25 },
    { minOrdersInRolling30: 5, bonusPoints: 50 },
  ],
} as const

export function tierById(id: LoyaltyTier['id']): LoyaltyTier {
  const tier = LOYALTY_TIERS.find((candidate) => candidate.id === id)
  if (!tier) throw new Error(`Unknown loyalty tier: ${id}`)
  return tier
}

export function nextTier(current: LoyaltyTier['id']): LoyaltyTier | undefined {
  const index = LOYALTY_TIERS.findIndex((tier) => tier.id === current)
  return LOYALTY_TIERS[index + 1]
}
