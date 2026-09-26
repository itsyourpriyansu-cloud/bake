import { describe, expect, it } from 'vitest'
import { createOrderFromIntent } from './order.logic'
import type { OrderIntent } from './order.types'
import type { PaymentAttempt } from '../payment/payment.types'

const intent: OrderIntent = {
  id: 'INTENT1', customerId: 'CUST001', fulfillmentType: 'PICKUP',
  cartSnapshot: { cartId: 'CART-DEMO', items: [{ productId: 'PIZZA-VEG-001', quantity: 1, unitPrice: 110, name: 'Classic Veg Pizza' }], takenAt: '2026-09-08T00:00:00.000Z' },
  quoteSnapshot: { itemCount: 1, subtotal: 110, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, deliveryFee: 0, eligibleSpend: 110, pointsToEarn: 4, total: 110, warnings: [], valid: true },
  expectedPromiseAt: '2026-09-08T00:30:00.000Z', expiresAt: '2026-09-08T00:15:00.000Z', status: 'OPEN', createdAt: '2026-09-08T00:00:00.000Z',
}
const payment: PaymentAttempt = { id: 'PAY1', orderIntentId: 'INTENT1', provider: 'PHONEPE', merchantOrderId: 'MO1', amount: 110, status: 'CONFIRMED', createdAt: '2026-09-08T00:00:00.000Z' }

describe('createOrderFromIntent idempotency', () => {
  it('creates exactly one order for a fresh intent', () => {
    const { order, created } = createOrderFromIntent(intent, payment, [], 1, new Date('2026-09-08T00:01:00.000Z'))
    expect(created).toBe(true)
    expect(order.orderIntentId).toBe('INTENT1')
    expect(order.acceptanceStatus).toBe('AWAITING_ACCEPTANCE')
  })

  it('replaying the same confirmation never mints a second order for the same intent', () => {
    const first = createOrderFromIntent(intent, payment, [], 1, new Date('2026-09-08T00:01:00.000Z'))
    const second = createOrderFromIntent(intent, payment, [first.order], 2, new Date('2026-09-08T00:02:00.000Z'))
    expect(second.created).toBe(false)
    expect(second.order.id).toBe(first.order.id)
  })
})
