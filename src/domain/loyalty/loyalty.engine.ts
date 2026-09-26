import { LOYALTY_CONFIG, LOYALTY_TIERS, nextTier, tierById } from './loyalty.tiers'
import type { LoyaltyTier, LoyaltyTransaction } from './loyalty.types'

export interface TierInputs { rolling120Orders: number; rolling120EligibleSpend: number }

/** Highest tier whose BOTH thresholds (orders AND spend) are met by rolling-120-day activity. Never assigned manually. */
export function calculateTier({ rolling120Orders, rolling120EligibleSpend }: TierInputs): LoyaltyTier {
  let current = LOYALTY_TIERS[0]
  for (const tier of LOYALTY_TIERS) {
    if (rolling120Orders >= tier.ordersRequired && rolling120EligibleSpend >= tier.spendRequired) current = tier
  }
  return current
}

export function calculatePointsEarned(eligibleSubtotal: number, tier: LoyaltyTier): number {
  return Math.floor(eligibleSubtotal * tier.earnRate)
}

export function calculateFrequencyBonus(completedOrdersInRolling30: number): number {
  let bonus = 0
  for (const rule of LOYALTY_CONFIG.frequencyBonuses) if (completedOrdersInRolling30 >= rule.minOrdersInRolling30) bonus = rule.bonusPoints
  return bonus
}

export interface RedemptionResult { pointsUsable: number; pointsValue: number; warnings: string[] }

export function calculateRedemption(pointsRequested: number, pointsAvailable: number, eligibleSubtotal: number): RedemptionResult {
  const warnings: string[] = []
  if (pointsRequested === 0) return { pointsUsable: 0, pointsValue: 0, warnings }
  if (pointsRequested < LOYALTY_CONFIG.minRedemptionPoints) {
    warnings.push(`Minimum redemption is ${LOYALTY_CONFIG.minRedemptionPoints} points.`)
    return { pointsUsable: 0, pointsValue: 0, warnings }
  }
  const maxValue = Math.floor(eligibleSubtotal * LOYALTY_CONFIG.maxRedemptionPercentOfEligibleSubtotal)
  const capped = Math.min(pointsRequested, pointsAvailable, maxValue)
  if (capped < pointsRequested) warnings.push('Points reduced to stay within redemption limits.')
  return { pointsUsable: capped, pointsValue: capped * LOYALTY_CONFIG.pointToRupee, warnings }
}

export interface TierProgress { tier: LoyaltyTier; next?: LoyaltyTier; ordersNeeded: number; spendNeeded: number }

export function calculateTierProgress(inputs: TierInputs): TierProgress {
  const tier = calculateTier(inputs)
  const next = nextTier(tier.id)
  if (!next) return { tier, ordersNeeded: 0, spendNeeded: 0 }
  return {
    tier, next,
    ordersNeeded: Math.max(0, next.ordersRequired - inputs.rolling120Orders),
    spendNeeded: Math.max(0, next.spendRequired - inputs.rolling120EligibleSpend),
  }
}

export interface OrderCompletionInput { orderId: string; customerId: string; eligibleSubtotal: number; tier: LoyaltyTier; completedOrdersInRolling30: number; now: Date }

/** Fulfillment completion converts the order's pending points to available and applies any frequency bonus. Call once per order. */
export function applyOrderCompletion({ orderId, customerId, eligibleSubtotal, tier, completedOrdersInRolling30, now }: OrderCompletionInput): LoyaltyTransaction[] {
  const earned = calculatePointsEarned(eligibleSubtotal, tier)
  const bonus = calculateFrequencyBonus(completedOrdersInRolling30)
  const expiresAt = new Date(now.getTime() + LOYALTY_CONFIG.pointsExpiryDays * 86_400_000).toISOString()
  const transactions: LoyaltyTransaction[] = [
    { id: `LOY-${orderId}-EARN`, customerId, orderId, type: 'EARN_AVAILABLE', status: 'AVAILABLE', points: earned, createdAt: now.toISOString(), expiresAt },
  ]
  if (bonus > 0) transactions.push({ id: `LOY-${orderId}-BONUS`, customerId, orderId, type: 'BONUS', status: 'AVAILABLE', points: bonus, createdAt: now.toISOString(), expiresAt, note: 'Frequency bonus' })
  return transactions
}

/** A refund reverses only the eligible (non-discounted) portion of points the linked order earned. */
export function applyRefundReversal(orderId: string, customerId: string, pointsToReverse: number, now: Date): LoyaltyTransaction {
  return { id: `LOY-${orderId}-REVERSAL-${now.getTime()}`, customerId, orderId, type: 'REVERSAL', status: 'REVERSED', points: -Math.abs(pointsToReverse), createdAt: now.toISOString(), note: 'Refund reversal' }
}

export function applyPendingEarnOnPayment(orderId: string, customerId: string, eligibleSubtotal: number, tier: LoyaltyTier, now: Date): LoyaltyTransaction {
  return { id: `LOY-${orderId}-PENDING`, customerId, orderId, type: 'EARN_PENDING', status: 'PENDING', points: calculatePointsEarned(eligibleSubtotal, tier), createdAt: now.toISOString() }
}

export { tierById }
