import { assertFulfillmentTransition } from '../orders/order.machine'
import type { Order } from '../orders/order.types'
import type { KitchenQueueEntry } from './kitchen.types'

/** Only paid + accepted orders are ever visible; queue order is system-controlled (createdAt), the chef cannot reorder it. */
export function getKitchenQueue(orders: Order[]): KitchenQueueEntry[] {
  return orders
    .filter((order) => order.paymentStatus === 'CONFIRMED' && order.acceptanceStatus === 'ACCEPTED' && ['SCHEDULED', 'PREP_DUE', 'PREPARING', 'READY'].includes(order.fulfillmentStatus))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((order, index) => ({ order, position: index + 1 }))
}

export function startPrep(order: Order, now: Date): Order {
  assertFulfillmentTransition(order.fulfillmentStatus, 'PREPARING')
  return { ...order, fulfillmentStatus: 'PREPARING', prepStartAt: order.prepStartAt ?? now.toISOString(), actualPrepStartedAt: now.toISOString() }
}

export interface OverridePrepTimeInput { order: Order; requestedMinutes: number; reason: string; chefId: string; now: Date }
export interface OverridePrepTimeResult { order: Order; delayMinutes: number; severeDelay: boolean; customerNoticeNeeded: boolean }

/**
 * The single entry point for a chef changing prep timing. Recomputes the order's effective
 * prep time and target-ready time; callers (MSW handler) are responsible for emitting
 * PREP_TIME_OVERRIDDEN, notifying realtime subscribers, and raising a customer delay
 * notice / founder attention item when this function flags them.
 */
export function overridePrepTime({ order, requestedMinutes, reason, chefId, now }: OverridePrepTimeInput, thresholds: { customerNoticeMinutes: number; founderAttentionMinutes: number }): OverridePrepTimeResult {
  const delayMinutes = requestedMinutes - order.systemPrepMinutes
  const prepStartAt = order.prepStartAt ? new Date(order.prepStartAt) : now
  const targetReadyAt = new Date(prepStartAt.getTime() + requestedMinutes * 60_000)
  const promiseBufferMs = order.promisedAt && order.targetReadyAt
    ? Math.max(0, new Date(order.promisedAt).getTime() - new Date(order.targetReadyAt).getTime())
    : 0
  const updated: Order = {
    ...order, chefOverrideMinutes: requestedMinutes, effectivePrepMinutes: requestedMinutes,
    overrideReason: reason, overrideAt: now.toISOString(), overrideBy: chefId, targetReadyAt: targetReadyAt.toISOString(),
    promisedAt: order.promisedAt ? new Date(targetReadyAt.getTime() + promiseBufferMs).toISOString() : undefined,
  }
  return {
    order: updated, delayMinutes,
    customerNoticeNeeded: delayMinutes >= thresholds.customerNoticeMinutes,
    severeDelay: delayMinutes >= thresholds.founderAttentionMinutes,
  }
}

export function markReady(order: Order, now: Date): Order {
  assertFulfillmentTransition(order.fulfillmentStatus, 'READY')
  return { ...order, fulfillmentStatus: 'READY', actualReadyAt: now.toISOString() }
}
