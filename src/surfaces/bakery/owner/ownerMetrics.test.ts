import { describe, expect, it } from 'vitest'
import type { BakeryBespokeRequest, BakeryOrder, BakeryProduct, BakerySavedDesign } from '../../../domain/bakery/bakery.types'
import { aggregateOwnerCustomers, buildCalendarStrip, calendarAttentionNote, computeGrowthSegments, productionHealthPercent, productionLoad } from './ownerMetrics'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

function order(overrides: Partial<BakeryOrder> & Pick<BakeryOrder, 'id' | 'customerPhone' | 'customerName' | 'productionStatus' | 'paymentStatus'>): BakeryOrder {
  const promisedAt = overrides.promisedAt ?? new Date(Date.now() + HOUR).toISOString()
  return {
    publicNumber: overrides.id, fulfillment: 'DELIVERY', eventDate: promisedAt.slice(0, 10), slot: promisedAt.slice(11, 16),
    items: [], quote: { itemCount: 1, subtotal: 500, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, deliveryFee: 0, pointsToEarn: 50, total: 500, valid: true, warnings: [] },
    promisedAt, createdAt: promisedAt, ...overrides,
  }
}

describe('productionHealthPercent', () => {
  it('is 100 when there are no trackable orders', () => {
    expect(productionHealthPercent([])).toBe(100)
    expect(productionHealthPercent([order({ id: 'A', customerPhone: '1', customerName: 'A', productionStatus: 'AWAITING_ACCEPTANCE', paymentStatus: 'CONFIRMED' })])).toBe(100)
  })

  it('counts completed and future-promised orders as on-track', () => {
    const orders = [
      order({ id: 'A', customerPhone: '1', customerName: 'A', productionStatus: 'COMPLETED', paymentStatus: 'CONFIRMED', promisedAt: new Date(Date.now() - DAY).toISOString() }),
      order({ id: 'B', customerPhone: '1', customerName: 'A', productionStatus: 'BAKING', paymentStatus: 'CONFIRMED', promisedAt: new Date(Date.now() + HOUR).toISOString() }),
      order({ id: 'C', customerPhone: '1', customerName: 'A', productionStatus: 'BAKING', paymentStatus: 'CONFIRMED', promisedAt: new Date(Date.now() - HOUR).toISOString() }),
    ]
    expect(productionHealthPercent(orders)).toBe(67)
  })
})

describe('productionLoad', () => {
  it('caps at 100% and labels by threshold', () => {
    const orders = ['MIXING', 'BAKING', 'DECORATING', 'PACKING'].map((status, index) => order({ id: `T${index}`, customerPhone: '1', customerName: 'A', productionStatus: status as BakeryOrder['productionStatus'], paymentStatus: 'CONFIRMED' }))
    expect(productionLoad(orders, 4)).toEqual({ inProgress: 4, percent: 100, label: 'FULL' })
    expect(productionLoad(orders, 8)).toEqual({ inProgress: 4, percent: 50, label: 'HEALTHY' })
    expect(productionLoad([], 8)).toEqual({ inProgress: 0, percent: 0, label: 'HEALTHY' })
  })
})

describe('buildCalendarStrip / calendarAttentionNote', () => {
  it('builds 7 days starting today and counts orders per day', () => {
    const todayIso = new Date().toISOString().slice(0, 10)
    const orders = [order({ id: 'A', customerPhone: '1', customerName: 'A', productionStatus: 'SCHEDULED', paymentStatus: 'CONFIRMED', eventDate: todayIso, slot: '18:00' })]
    const days = buildCalendarStrip(orders)
    expect(days).toHaveLength(7)
    expect(days[0].isToday).toBe(true)
    expect(days[0].count).toBe(1)
  })

  it('only surfaces a clash note when two orders share a slot on the same day', () => {
    const todayIso = new Date().toISOString().slice(0, 10)
    const noClash = [order({ id: 'A', customerPhone: '1', customerName: 'A', productionStatus: 'SCHEDULED', paymentStatus: 'CONFIRMED', eventDate: todayIso, slot: '18:00' })]
    expect(calendarAttentionNote(buildCalendarStrip(noClash), noClash)).toBeNull()

    const clash = [
      order({ id: 'A', customerPhone: '1', customerName: 'A', productionStatus: 'SCHEDULED', paymentStatus: 'CONFIRMED', eventDate: todayIso, slot: '18:00' }),
      order({ id: 'B', customerPhone: '2', customerName: 'B', productionStatus: 'SCHEDULED', paymentStatus: 'CONFIRMED', eventDate: todayIso, slot: '18:00' }),
    ]
    expect(calendarAttentionNote(buildCalendarStrip(clash), clash)).toContain('2 orders share the 18:00')
  })
})

describe('aggregateOwnerCustomers', () => {
  it('aggregates lifetime value only from confirmed orders and tracks favourites', () => {
    const orders = [
      order({ id: 'A', customerPhone: '1', customerName: 'Ananya', productionStatus: 'COMPLETED', paymentStatus: 'CONFIRMED', items: [{ id: 'i1', productId: 'p1', quantity: 2, unitPrice: 100, selections: [], product: { style: 'VINTAGE' } as BakeryProduct }] }),
      order({ id: 'B', customerPhone: '1', customerName: 'Ananya', productionStatus: 'REJECTED', paymentStatus: 'REFUNDING' }),
    ]
    const [customer] = aggregateOwnerCustomers(orders)
    expect(customer.orderCount).toBe(2)
    expect(customer.confirmedOrderCount).toBe(1)
    expect(customer.lifetimeValue).toBe(500)
    expect(customer.favourite).toBe('vintage')
  })
})

describe('computeGrowthSegments', () => {
  it('flags second-cake-pending only for exactly one confirmed order, and saved designs without a confirmed order', () => {
    const orders: BakeryOrder[] = [
      order({ id: 'A', customerPhone: '1', customerName: 'One-timer', productionStatus: 'COMPLETED', paymentStatus: 'CONFIRMED' }),
      order({ id: 'B', customerPhone: '2', customerName: 'Loyal', productionStatus: 'COMPLETED', paymentStatus: 'CONFIRMED' }),
      order({ id: 'C', customerPhone: '2', customerName: 'Loyal', productionStatus: 'COMPLETED', paymentStatus: 'CONFIRMED' }),
    ]
    const requests: BakeryBespokeRequest[] = []
    const savedDesigns: BakerySavedDesign[] = [
      { id: 's1', customerPhone: '3', productId: 'p1', selections: [], savedAt: new Date().toISOString() },
      { id: 's2', customerPhone: '1', productId: 'p1', selections: [], savedAt: new Date().toISOString() },
    ]
    const segments = computeGrowthSegments(orders, requests, savedDesigns)
    expect(segments.secondCakePending).toBe(1)
    expect(segments.savedDesignNoOrder).toBe(1)
  })
})
