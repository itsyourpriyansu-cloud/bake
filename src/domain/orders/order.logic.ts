import { createId, createPublicOrderNumber } from '../shared/ids'
import { assertAcceptanceTransition } from './order.machine'
import type { Order, OrderIntent } from './order.types'
import type { PaymentAttempt } from '../payment/payment.types'
import type { ScheduleOutput } from '../fulfillment/fulfillment.types'

export interface CreateOrderResult { order: Order; created: boolean }

/**
 * Idempotent order creation keyed on orderIntentId: replaying PAYMENT_CONFIRMED for the
 * same intent (webhook retries, duplicate confirmations) must never mint a second order.
 */
export function createOrderFromIntent(intent: OrderIntent, payment: PaymentAttempt, existingOrders: Order[], sequence: number, now: Date): CreateOrderResult {
  const existing = existingOrders.find((order) => order.orderIntentId === intent.id)
  if (existing) return { order: existing, created: false }

  const order: Order = {
    id: createId('ORDER'), publicOrderNumber: createPublicOrderNumber(sequence), customerId: intent.customerId,
    source: 'PWA', fulfillmentType: intent.fulfillmentType,
    paymentStatus: payment.status, acceptanceStatus: 'AWAITING_ACCEPTANCE', fulfillmentStatus: 'NOT_STARTED', refundStatus: 'NONE',
    items: intent.cartSnapshot.items.map((item) => ({ productId: item.productId, name: item.name, quantity: item.quantity, unitPrice: item.unitPrice })),
    financialSnapshot: intent.quoteSnapshot,
    systemPrepMinutes: 0, effectivePrepMinutes: 0,
    createdAt: now.toISOString(), orderIntentId: intent.id, paymentId: payment.id,
  }
  return { order, created: true }
}

export function applySchedule(order: Order, schedule: ScheduleOutput): Order {
  return {
    ...order, systemPrepMinutes: schedule.systemPrepMinutes, effectivePrepMinutes: order.chefOverrideMinutes ?? schedule.systemPrepMinutes,
    prepStartAt: schedule.prepStartAt, targetReadyAt: schedule.targetReadyAt,
    promisedAt: order.fulfillmentType === 'DELIVERY' ? schedule.dispatchTargetAt : schedule.promiseWindowStart,
    fulfillmentStatus: 'SCHEDULED',
  }
}

export function acceptOrder(order: Order, now: Date): Order {
  assertAcceptanceTransition(order.acceptanceStatus, 'ACCEPTED')
  return { ...order, acceptanceStatus: 'ACCEPTED', acceptedAt: now.toISOString() }
}

export function markReviewRequired(order: Order): Order {
  assertAcceptanceTransition(order.acceptanceStatus, 'REVIEW_REQUIRED')
  return { ...order, acceptanceStatus: 'REVIEW_REQUIRED' }
}

export function rejectOrder(order: Order, reason: string, now: Date): Order {
  assertAcceptanceTransition(order.acceptanceStatus, 'REJECTED')
  return { ...order, acceptanceStatus: 'REJECTED', rejectedAt: now.toISOString(), rejectionReason: reason, fulfillmentStatus: 'CANCELLED' }
}
