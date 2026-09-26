import { db } from '../database/db'
import { resetDemoDatabase } from '../demo/reset-demo'
import { demoClock } from '../../domain/shared/clock'
import { createId } from '../../domain/shared/ids'
import type { Order } from '../../domain/orders/order.types'
import type { CartQuote } from '../../domain/pricing/pricing.types'
import type { ScenarioSummary } from './scenario.types'

const quote: CartQuote = { itemCount: 1, subtotal: 110, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, deliveryFee: 0, eligibleSpend: 110, pointsToEarn: 4, total: 110, warnings: [], valid: true }
export const CHEF_DELAY_ORDER_ID = 'ORDER-DEMO-CHEFDELAY'

/** Seeds one accepted order already in the kitchen at 18 minutes, ready for a KDS prep-time override demo (18 -> 28). */
export async function loadChefDelay(): Promise<ScenarioSummary> {
  await resetDemoDatabase()
  const now = demoClock.now()
  const order: Order = {
    id: CHEF_DELAY_ORDER_ID, publicOrderNumber: 'PW-DEMO-01', customerId: 'CUST001', source: 'PWA', fulfillmentType: 'DELIVERY',
    paymentStatus: 'CONFIRMED', acceptanceStatus: 'ACCEPTED', fulfillmentStatus: 'PREPARING', refundStatus: 'NONE',
    items: [{ productId: 'PIZZA-VEG-001', name: 'Classic Veg Pizza', quantity: 1, unitPrice: 110 }],
    financialSnapshot: quote, systemPrepMinutes: 18, effectivePrepMinutes: 18,
    prepStartAt: now.toISOString(), targetReadyAt: new Date(now.getTime() + 18 * 60_000).toISOString(), promisedAt: new Date(now.getTime() + 33 * 60_000).toISOString(),
    acceptedAt: now.toISOString(), createdAt: now.toISOString(),
    orderIntentId: createId('INTENT-DEMO'), paymentId: createId('PAY-DEMO'),
  }
  await db.orders.add(order)
  return {
    id: 'chefDelay', title: 'Chef Delay', appliedAt: now.toISOString(),
    description: `Order ${order.publicOrderNumber} is preparing at 18 minutes. Call PATCH /kds/orders/${order.id}/prep-time with minutes: 28 to see the customer ETA update.`,
  }
}
