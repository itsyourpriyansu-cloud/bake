import { calculatePointsEarned, calculateRedemption } from '../loyalty/loyalty.engine'
import { tierById } from '../loyalty/loyalty.tiers'
import type { CartQuote, PricingInput } from './pricing.types'

/**
 * The single place order totals are computed. The frontend must display this object,
 * never recompute subtotal/discount/total itself.
 */
export function quoteCart(input: PricingInput): CartQuote {
  const warnings: string[] = []
  const itemCount = input.items.reduce((total, item) => total + item.quantity, 0)
  const subtotal = input.items.reduce((total, item) => total + item.quantity * item.unitPrice, 0)
  const deliveryFee = input.deliveryFeeTable[input.fulfillmentType] ?? 0
  const grossEligibleSpend = subtotal

  const redemption = calculateRedemption(input.pointsRequested, input.pointsAvailable, grossEligibleSpend)
  warnings.push(...redemption.warnings)

  const discount = redemption.pointsValue
  const eligibleSpend = Math.max(0, grossEligibleSpend - discount)
  const total = Math.max(0, subtotal - discount + deliveryFee)
  const tier = tierById(input.customerTier)
  const pointsToEarn = calculatePointsEarned(eligibleSpend, tier)

  const valid = itemCount > 0
  const availabilityIssues = input.availabilityIssues ?? []
  const threshold = input.threshold ? {
    ...input.threshold,
    remaining: Math.max(0, input.threshold.target - subtotal),
  } : undefined

  return {
    itemCount, subtotal, discount, pointsRequested: input.pointsRequested, pointsUsable: redemption.pointsUsable,
    pointsValue: redemption.pointsValue, pointsRedeemed: redemption.pointsUsable, deliveryFee, eligibleSpend,
    pointsToEarn, total, threshold, availabilityIssues, warnings, valid: valid && availabilityIssues.length === 0,
  }
}
