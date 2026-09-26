import { describe, expect, it } from 'vitest'
import { getKitchenQueue, overridePrepTime } from './kitchen.logic'
import type { Order } from '../orders/order.types'

const quote = { itemCount: 1, subtotal: 110, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, deliveryFee: 0, eligibleSpend: 110, pointsToEarn: 4, total: 110, warnings: [], valid: true }
const order = (overrides: Partial<Order> = {}): Order => ({
  id: 'ORDER1', publicOrderNumber: 'PW-00001', customerId: 'CUST001', source: 'PWA', fulfillmentType: 'DELIVERY',
  paymentStatus: 'CONFIRMED', acceptanceStatus: 'ACCEPTED', fulfillmentStatus: 'PREPARING', refundStatus: 'NONE',
  items: [{ productId: 'PIZZA-VEG-001', name: 'Classic Veg Pizza', quantity: 1, unitPrice: 110 }],
  financialSnapshot: quote, systemPrepMinutes: 18, effectivePrepMinutes: 18, prepStartAt: '2026-09-08T18:00:00.000Z',
  createdAt: '2026-09-08T17:58:00.000Z', orderIntentId: 'INTENT1', paymentId: 'PAY1', ...overrides,
})
const thresholds = { customerNoticeMinutes: 8, founderAttentionMinutes: 15 }

describe('getKitchenQueue', () => {
  it('only surfaces paid + accepted, in-flight orders, oldest first', () => {
    const unpaid = order({ id: 'U', paymentStatus: 'PENDING', createdAt: '2026-09-08T17:00:00.000Z' })
    const rejected = order({ id: 'R', acceptanceStatus: 'REJECTED', fulfillmentStatus: 'CANCELLED' })
    const delivered = order({ id: 'D', fulfillmentStatus: 'DELIVERED' })
    const older = order({ id: 'OLD', createdAt: '2026-09-08T17:00:00.000Z' })
    const newer = order({ id: 'NEW', createdAt: '2026-09-08T17:59:00.000Z' })
    const queue = getKitchenQueue([unpaid, rejected, delivered, older, newer])
    expect(queue.map((entry) => entry.order.id)).toEqual(['OLD', 'NEW'])
    expect(queue[0].position).toBe(1)
  })
})

describe('overridePrepTime', () => {
  it('recomputes effective prep time and target-ready time from the override', () => {
    const result = overridePrepTime({ order: order({ targetReadyAt: '2026-09-08T18:18:00.000Z', promisedAt: '2026-09-08T18:36:00.000Z' }), requestedMinutes: 28, reason: 'Extra busy', chefId: 'Kitchen Tablet #1', now: new Date('2026-09-08T18:10:00.000Z') }, thresholds)
    expect(result.order.chefOverrideMinutes).toBe(28)
    expect(result.order.effectivePrepMinutes).toBe(28)
    expect(result.order.targetReadyAt).toBe('2026-09-08T18:28:00.000Z')
    expect(result.order.promisedAt).toBe('2026-09-08T18:46:00.000Z')
    expect(result.delayMinutes).toBe(10)
  })

  it('flags a customer notice once past the notice threshold but not the founder threshold', () => {
    const result = overridePrepTime({ order: order(), requestedMinutes: 27, reason: 'Busy', chefId: 'Chef', now: new Date('2026-09-08T18:10:00.000Z') }, thresholds)
    expect(result.delayMinutes).toBe(9)
    expect(result.customerNoticeNeeded).toBe(true)
    expect(result.severeDelay).toBe(false)
  })

  it('flags a severe delay once past the founder-attention threshold', () => {
    const result = overridePrepTime({ order: order(), requestedMinutes: 34, reason: 'Fryer down', chefId: 'Chef', now: new Date('2026-09-08T18:10:00.000Z') }, thresholds)
    expect(result.delayMinutes).toBe(16)
    expect(result.severeDelay).toBe(true)
  })
})
