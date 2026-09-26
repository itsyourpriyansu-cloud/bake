import { db } from '../database/db'
import { resetDemoDatabase } from '../demo/reset-demo'
import { demoClock } from '../../domain/shared/clock'
import { createId } from '../../domain/shared/ids'
import type { Order } from '../../domain/orders/order.types'
import type { CartQuote } from '../../domain/pricing/pricing.types'
import type { ScenarioSummary } from './scenario.types'

const quote: CartQuote = { itemCount: 1, subtotal: 110, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, deliveryFee: 0, eligibleSpend: 110, pointsToEarn: 4, total: 110, warnings: [], valid: true }

/** Fills the kitchen to >90% load so the next paid order lands in Owner Review instead of auto-accepting. */
export async function loadOwnerReview(): Promise<ScenarioSummary> {
  await resetDemoDatabase()
  const now = demoClock.now()
  const loadOrders: Order[] = Array.from({ length: 8 }, (_, index) => ({
    id: `ORDER-LOAD-${index}`, publicOrderNumber: `PW-LOAD-${index}`, customerId: 'CUST002', source: 'PWA', fulfillmentType: 'DELIVERY',
    paymentStatus: 'CONFIRMED', acceptanceStatus: 'ACCEPTED', fulfillmentStatus: 'SCHEDULED', refundStatus: 'NONE',
    items: [{ productId: 'PIZZA-VEG-001', name: 'Classic Veg Pizza', quantity: 1, unitPrice: 110 }],
    financialSnapshot: quote, systemPrepMinutes: 14, effectivePrepMinutes: 14,
    prepStartAt: now.toISOString(), targetReadyAt: new Date(now.getTime() + 14 * 60_000).toISOString(),
    acceptedAt: now.toISOString(), createdAt: now.toISOString(),
    orderIntentId: createId('INTENT-LOAD'), paymentId: createId('PAY-LOAD'),
  }))
  await db.orders.bulkAdd(loadOrders)
  return {
    id: 'ownerReview', title: 'Owner Review', appliedAt: now.toISOString(),
    description: 'Kitchen load is at 100% (8 active orders against an 8-order capacity). The next paid order requires founder acceptance.',
  }
}
