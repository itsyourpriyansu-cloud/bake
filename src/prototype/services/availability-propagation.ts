import { overridePrepTime } from '../../domain/kitchen/kitchen.logic'
import { createAttentionItem } from '../../domain/attention/attention.engine'
import { createId } from '../../domain/shared/ids'
import type { CustomerNotification } from '../../domain/customer/customer-experience.types'
import { db } from '../database/db'
import { eventBus } from '../events/event-bus'

export async function propagateAvailabilityIssue(entityId: string, displayName: string, at: Date) {
  const storeRecord = await db.config.get('storeConfig')
  const store = storeRecord?.value as { delayThresholds: { customerNoticeMinutes: number; founderAttentionMinutes: number } }
  const orders = (await db.orders.toArray()).filter((order) => ['SCHEDULED', 'PREP_DUE', 'PREPARING'].includes(order.fulfillmentStatus) && order.items.some((item) => item.productId === entityId || item.modifiers?.some((selection) => selection.optionIds.includes(entityId))))
  for (const order of orders) {
    const result = overridePrepTime({ order, requestedMinutes: order.effectivePrepMinutes + 8, reason: `${displayName} availability issue`, chefId: 'SYSTEM_AVAILABILITY', now: at }, store.delayThresholds)
    await db.orders.put(result.order)
    await db.orderEvents.add({ id: createId('EVT-ORDER'), orderId: order.id, type: 'PREP_TIME_OVERRIDDEN', actor: 'SYSTEM', at: at.toISOString(), metadata: { reason: `${displayName} availability issue`, minutes: result.order.effectivePrepMinutes } })
    const record = await db.config.get('customerNotifications')
    const notifications = (record?.value as CustomerNotification[] | undefined) ?? []
    notifications.unshift({ id: createId('NOTIF'), customerId: order.customerId, kind: 'ETA', title: 'Availability changed your ETA', message: `${displayName} needs a kitchen adjustment. ${order.publicOrderNumber}'s live ETA has been updated.`, createdAt: at.toISOString(), read: false, orderId: order.id })
    await db.config.put({ key: 'customerNotifications', value: notifications })
    if (result.severeDelay) await db.attentionItems.add(createAttentionItem('AVAILABILITY_CONFLICT', `${displayName} affects ${order.publicOrderNumber}`, 'An unavailable selection is already in an active kitchen order.', 'Review the replacement plan with the kitchen.', at, { orderId: order.id, customerId: order.customerId }))
    eventBus.emit('PREP_TIME_OVERRIDDEN', { reason: 'AVAILABILITY_ISSUE', entityId, minutes: result.order.effectivePrepMinutes }, { orderId: order.id, customerId: order.customerId })
    if (result.severeDelay) eventBus.emit('ATTENTION_CHANGED', { type: 'AVAILABILITY_CONFLICT' }, { orderId: order.id, customerId: order.customerId })
  }
  return orders.length
}
