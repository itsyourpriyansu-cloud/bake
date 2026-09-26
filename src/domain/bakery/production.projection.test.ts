import { describe, expect, it } from 'vitest'
import type { BakeryOrder } from './bakery.types'
import { buildBakeryProductionQueue, projectBakeryOrder } from './production.projection'

const now = new Date('2026-09-24T10:00:00.000Z').getTime()

function order(id: string, status: BakeryOrder['productionStatus'], promiseMinutes: number): BakeryOrder {
  return {
    id,
    publicNumber: id,
    customerName: 'Test',
    customerPhone: '9999999999',
    fulfillment: 'PICKUP',
    eventDate: '2026-09-24',
    slot: '18:00',
    items: [{ id: `${id}-item`, productId: 'cake', quantity: 1, unitPrice: 500, selections: [], product: { category: 'CAKES', name: 'Cake' } as never }],
    quote: { itemCount: 1, subtotal: 500, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, deliveryFee: 0, pointsToEarn: 50, total: 500, valid: true, warnings: [] },
    paymentStatus: 'CONFIRMED',
    productionStatus: status,
    promisedAt: new Date(now + promiseMinutes * 60_000).toISOString(),
    createdAt: new Date(now - 60_000).toISOString(),
  }
}

describe('bakery production projection', () => {
  it('keeps future scheduled work out of start now', () => {
    expect(projectBakeryOrder(order('FUTURE', 'SCHEDULED', 600), now)?.lane).toBe('START_SOON')
  })

  it('moves due scheduled work into start now', () => {
    const result = projectBakeryOrder(order('DUE', 'SCHEDULED', 90), now)
    expect(result?.lane).toBe('START_NOW')
    expect(result?.risk).toBe('CRITICAL')
  })

  it('projects active and ready work into distinct lanes', () => {
    const queue = buildBakeryProductionQueue([order('ACTIVE', 'BAKING', 180), order('READY', 'READY', 20)], now)
    expect(queue.map((item) => item.lane)).toEqual(['IN_PROGRESS', 'READY'])
  })

  it('excludes founder-gated and finished work', () => {
    const queue = buildBakeryProductionQueue([order('WAIT', 'AWAITING_ACCEPTANCE', 180), order('DONE', 'COMPLETED', -10)], now)
    expect(queue).toHaveLength(0)
  })
})
