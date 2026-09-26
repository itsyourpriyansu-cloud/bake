import { describe, expect, it } from 'vitest'
import { getDeliveryTrackingView, getFounderDeliveryWatch, isTrackableDelivery } from './delivery-tracking'
import type { Order } from './order.types'

const order = (patch: Partial<Order> = {}): Order => ({
  id: 'ORDER-1', publicOrderNumber: 'PW1384', customerId: 'CUST001', source: 'PWA', fulfillmentType: 'DELIVERY',
  paymentStatus: 'CONFIRMED', acceptanceStatus: 'ACCEPTED', fulfillmentStatus: 'PREPARING', refundStatus: 'NONE',
  items: [], financialSnapshot: { itemCount: 0, subtotal: 0, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, deliveryFee: 0, eligibleSpend: 0, pointsToEarn: 0, total: 0, warnings: [], valid: true },
  systemPrepMinutes: 18, effectivePrepMinutes: 18, createdAt: '2026-09-10T10:00:00.000Z', orderIntentId: 'INTENT-1', paymentId: 'PAY-1',
  ...patch,
})

describe('delivery tracking projection', () => {
  it('keeps the route at the store until dispatch and moves it on dispatch', () => {
    expect(getDeliveryTrackingView(order()).phase).toBe('KITCHEN')
    expect(getDeliveryTrackingView(order({ fulfillmentStatus: 'READY' })).riderVisible).toBe(true)
    expect(getDeliveryTrackingView(order({ fulfillmentStatus: 'DISPATCHED' }))).toMatchObject({ phase: 'ON_ROUTE', progress: 0.68 })
  })

  it('surfaces chef timing impact to the founder without reading wall-clock time', () => {
    expect(getFounderDeliveryWatch(order({ chefOverrideMinutes: 28, effectivePrepMinutes: 28 }))).toMatchObject({ level: 'DELAY', impactMinutes: 10 })
    expect(getFounderDeliveryWatch(order({ fulfillmentStatus: 'PREP_DUE' })).level).toBe('WATCH')
  })

  it('only selects active delivery orders', () => {
    expect(isTrackableDelivery(order())).toBe(true)
    expect(isTrackableDelivery(order({ fulfillmentType: 'PICKUP' }))).toBe(false)
    expect(isTrackableDelivery(order({ fulfillmentStatus: 'DELIVERED' }))).toBe(false)
  })
})
