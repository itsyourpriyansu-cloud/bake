import { describe, expect, it } from 'vitest'
import { quoteCart } from './pricing.engine'

const deliveryFeeTable = { DELIVERY: 30, PICKUP: 0, STORE: 0 }

describe('quoteCart', () => {
  it('totals items, adds the delivery fee, and computes points to earn at the tier rate', () => {
    const quote = quoteCart({
      items: [{ quantity: 2, unitPrice: 110 }, { quantity: 1, unitPrice: 149 }],
      fulfillmentType: 'DELIVERY', customerTier: 'GOLD', pointsAvailable: 0, pointsRequested: 0, deliveryFeeTable,
    })
    expect(quote.itemCount).toBe(3)
    expect(quote.subtotal).toBe(369)
    expect(quote.deliveryFee).toBe(30)
    expect(quote.total).toBe(399)
    expect(quote.pointsToEarn).toBe(14)
    expect(quote.valid).toBe(true)
  })

  it('is invalid for an empty cart', () => {
    expect(quoteCart({ items: [], fulfillmentType: 'PICKUP', customerTier: 'MEMBER', pointsAvailable: 0, pointsRequested: 0, deliveryFeeTable }).valid).toBe(false)
  })

  it('never lets discount push the total below zero and reflects redemption warnings', () => {
    const quote = quoteCart({
      items: [{ quantity: 1, unitPrice: 100 }], fulfillmentType: 'PICKUP', customerTier: 'GOLD',
      pointsAvailable: 500, pointsRequested: 500, deliveryFeeTable,
    })
    expect(quote.discount).toBeLessThanOrEqual(quote.subtotal)
    expect(quote.total).toBeGreaterThanOrEqual(0)
    expect(quote.warnings.length).toBeGreaterThan(0)
  })

  it('marks a quote invalid when server availability revalidation finds an issue', () => {
    const quote = quoteCart({
      items: [{ quantity: 1, unitPrice: 199 }], fulfillmentType: 'PICKUP', customerTier: 'GOLD',
      pointsAvailable: 182, pointsRequested: 0, deliveryFeeTable,
      availabilityIssues: [{ itemId: 'item', productId: 'pizza', entityId: 'mushroom', kind: 'MODIFIER', displayName: 'Mushroom', message: 'Mushroom topping is temporarily unavailable.' }],
    })
    expect(quote.valid).toBe(false)
    expect(quote.availabilityIssues).toHaveLength(1)
  })
})
