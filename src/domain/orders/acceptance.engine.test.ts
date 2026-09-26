import { describe, expect, it } from 'vitest'
import { evaluateOrderAcceptance } from './acceptance.engine'
import type { Capabilities } from '../store/store.types'
import type { CartQuote } from '../pricing/pricing.types'

const capabilities: Capabilities = {
  storeOpen: true, delivery: { enabled: true }, pickup: { enabled: true }, storeOrder: { enabled: true },
  scheduledOrders: { enabled: true }, pointsRedemption: { enabled: true },
  store: { id: 'STORE-1', name: 'The Pizza Wave', city: 'Puri', acceptanceMode: 'HYBRID' },
}
const quote: CartQuote = { itemCount: 1, subtotal: 110, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, deliveryFee: 0, eligibleSpend: 110, pointsToEarn: 4, total: 110, warnings: [], valid: true }
const lightSchedule = { items: [{ productId: 'PIZZA-VEG-001', prepMinutes: 14, complexity: 2, station: 'PIZZA', quantity: 1 }], activeOrderCount: 1, kitchenCapacityCount: 8, packingMinutes: 3, pickupBufferMinutes: 5, deliveryBufferMinutes: 15, now: new Date('2026-09-08T12:00:00.000Z') }
const heavySchedule = { ...lightSchedule, activeOrderCount: 8 }

describe('evaluateOrderAcceptance', () => {
  it('rejects outright when payment is not confirmed, without even scheduling review', () => {
    const result = evaluateOrderAcceptance({ paymentConfirmed: false, capabilities, fulfillmentType: 'PICKUP', availabilityIssues: [], kdsOnline: true, quote, acceptanceMode: 'HYBRID', schedule: lightSchedule })
    expect(result.decision).toBe('REJECT')
  })

  it('auto-accepts a normal paid order under HYBRID with light kitchen load', () => {
    const result = evaluateOrderAcceptance({ paymentConfirmed: true, capabilities, fulfillmentType: 'PICKUP', availabilityIssues: [], kdsOnline: true, quote, acceptanceMode: 'HYBRID', schedule: lightSchedule })
    expect(result.decision).toBe('AUTO_ACCEPT')
  })

  it('routes to OWNER_REVIEW when kitchen load exceeds 90%', () => {
    const result = evaluateOrderAcceptance({ paymentConfirmed: true, capabilities, fulfillmentType: 'PICKUP', availabilityIssues: [], kdsOnline: true, quote, acceptanceMode: 'HYBRID', schedule: heavySchedule })
    expect(result.decision).toBe('OWNER_REVIEW')
  })

  it('rejects when the kitchen display is offline, a hard blocker', () => {
    const result = evaluateOrderAcceptance({ paymentConfirmed: true, capabilities, fulfillmentType: 'PICKUP', availabilityIssues: [], kdsOnline: false, quote, acceptanceMode: 'HYBRID', schedule: lightSchedule })
    expect(result.decision).toBe('REJECT')
    expect(result.reasons.some((r) => r.includes('offline'))).toBe(true)
  })

  it('rejects when a cart item is unavailable', () => {
    const result = evaluateOrderAcceptance({ paymentConfirmed: true, capabilities, fulfillmentType: 'PICKUP', availabilityIssues: [{ productId: 'X', productName: 'Mushroom Pizza', reason: 'Out of stock' }], kdsOnline: true, quote, acceptanceMode: 'HYBRID', schedule: lightSchedule })
    expect(result.decision).toBe('REJECT')
  })

  it('always routes to OWNER_REVIEW under MANUAL acceptance mode even with light load', () => {
    const result = evaluateOrderAcceptance({ paymentConfirmed: true, capabilities, fulfillmentType: 'PICKUP', availabilityIssues: [], kdsOnline: true, quote, acceptanceMode: 'MANUAL', schedule: lightSchedule })
    expect(result.decision).toBe('OWNER_REVIEW')
  })

  it('rejects when the requested fulfillment mode is disabled', () => {
    const result = evaluateOrderAcceptance({ paymentConfirmed: true, capabilities: { ...capabilities, delivery: { enabled: false, reason: 'Paused' } }, fulfillmentType: 'DELIVERY', availabilityIssues: [], kdsOnline: true, quote, acceptanceMode: 'HYBRID', schedule: lightSchedule })
    expect(result.decision).toBe('REJECT')
  })
})
