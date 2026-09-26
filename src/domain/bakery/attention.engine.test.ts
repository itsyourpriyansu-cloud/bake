import { describe, expect, it } from 'vitest'
import type { BakeryBespokeRequest, BakeryOrder } from './bakery.types'
import { buildFounderAttention } from './attention.engine'

const now = new Date('2026-09-24T10:00:00.000Z').getTime()

function order(id: string, status: BakeryOrder['productionStatus'], promiseMinutes: number): BakeryOrder {
  return {
    id, publicNumber: id, customerName: 'Test', customerPhone: '9999999999', fulfillment: 'PICKUP', eventDate: '2026-09-24', slot: '18:00',
    items: [{ id: `${id}-item`, productId: 'cake', quantity: 1, unitPrice: 500, selections: [], product: { category: 'CAKES', name: 'Cake' } as never }],
    quote: { itemCount: 1, subtotal: 500, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, deliveryFee: 0, pointsToEarn: 50, total: 500, valid: true, warnings: [] },
    paymentStatus: 'CONFIRMED', productionStatus: status, promisedAt: new Date(now + promiseMinutes * 60_000).toISOString(), createdAt: new Date(now - 60_000).toISOString(),
  }
}

describe('founder attention engine', () => {
  it('ranks promise risk before paid acceptance and bespoke work', () => {
    const request: BakeryBespokeRequest = { id: 'R1', event: 'WEDDING', eventDate: '2026-10-01', servings: '50', budget: '₹10,000', notes: '', status: 'NEW', createdAt: new Date(now - 3_600_000).toISOString() }
    const result = buildFounderAttention([order('RISK', 'MIXING', 10), order('PAID', 'AWAITING_ACCEPTANCE', 300)], [request], 8, now)
    expect(result.map((item) => item.kind)).toEqual(['PRODUCTION_RISK', 'ORDER_ACCEPTANCE', 'BESPOKE_REQUEST'])
  })

  it('calls out a customer reference that needs replication approval', () => {
    const request: BakeryBespokeRequest = { id: 'R2', event: 'WEDDING', eventDate: '2026-10-01', servings: '50', budget: '₹10,000', notes: '', status: 'NEW', referenceImage: { src: 'data:image/png;base64,test', name: 'cake.png', mimeType: 'image/png', sizeBytes: 1200 }, referenceApprovalStatus: 'PENDING_REVIEW', createdAt: new Date(now - 3_600_000).toISOString() }
    const [result] = buildFounderAttention([], [request], 8, now)
    expect(result).toMatchObject({ eyebrow: 'REFERENCE APPROVAL', actionLabel: 'REVIEW IMAGE', requestId: 'R2' })
    expect(result.detail).toContain('cake.png')
  })
})
