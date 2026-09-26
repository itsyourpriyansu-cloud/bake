import { http } from 'msw'
import { db } from '../../database/db'
import { getKitchenQueue, markReady, overridePrepTime, startPrep } from '../../../domain/kitchen/kitchen.logic'
import { toKdsOrder } from '../../../domain/kitchen/kds.projection'
import type { KdsProblemType } from '../../../domain/kitchen/kds.types'
import { createAttentionItem } from '../../../domain/attention/attention.engine'
import { API, boot, error, getStoreConfig, json, logOrderEvent, now } from './_shared'
import { setKdsHeartbeat } from '../../services/kds-heartbeat'
import type { CustomerNotification } from '../../../domain/customer/customer-experience.types'
import { eventBus } from '../../events/event-bus'
import { assertFulfillmentTransition } from '../../../domain/orders/order.machine'

async function queueAndProducts() {
  const [orders, products] = await Promise.all([db.orders.toArray(), db.products.toArray()])
  return { queue: getKitchenQueue(orders), products }
}

async function projectKitchenOrder(orderId: string) {
  const { queue, products } = await queueAndProducts()
  const entry = queue.find((candidate) => candidate.order.id === orderId)
  return entry ? toKdsOrder(entry.order, products, entry.position) : undefined
}

async function notifyCustomer(orderId: string, title: string, message: string, kind: CustomerNotification['kind'] = 'ORDER') {
  const [record, order] = await Promise.all([db.config.get('customerNotifications'), db.orders.get(orderId)])
  const rows = (record?.value as CustomerNotification[] | undefined) ?? []
  rows.unshift({ id: `NOTIF-${crypto.randomUUID()}`, customerId: order?.customerId ?? 'CUST001', kind, title, message, createdAt: now().toISOString(), read: false, orderId })
  await db.config.put({ key: 'customerNotifications', value: rows })
}

export const kdsHandlers = [
  http.get(`${API}/kds/queue`, async () => {
    await boot()
    const { queue, products } = await queueAndProducts()
    return json(queue.map((entry) => toKdsOrder(entry.order, products, entry.position)))
  }),

  http.get(`${API}/kds/orders/:id`, async ({ params }) => {
    await boot()
    const order = await projectKitchenOrder(String(params.id))
    return order ? json(order) : error('Kitchen order not found', 404)
  }),

  http.post(`${API}/kds/orders/:id/start-prep`, async ({ params }) => {
    await boot()
    let order = await db.orders.get(String(params.id))
    if (!order) return error('Order not found', 404)
    // The system-controlled first queue position is presented as START NOW even when
    // its scheduled timestamp has only just been assigned. Preserve the state machine
    // by recording PREP_DUE before honoring the chef's explicit start action.
    if (order.fulfillmentStatus === 'SCHEDULED') {
      assertFulfillmentTransition(order.fulfillmentStatus, 'PREP_DUE')
      order = { ...order, fulfillmentStatus: 'PREP_DUE', recommendedStartAt: now().toISOString() }
      await db.orders.put(order)
      await logOrderEvent(order.id, 'PREP_DUE', 'SYSTEM', { recommendedStartAt: order.recommendedStartAt })
    }
    const updated = startPrep(order, now())
    await db.orders.put(updated)
    await logOrderEvent(updated.id, 'PREP_STARTED', 'CHEF')
    await notifyCustomer(updated.id, 'Preparation started', `${updated.publicOrderNumber} is now being prepared at Grand Road.`)
    return json(await projectKitchenOrder(updated.id))
  }),

  http.patch(`${API}/kds/orders/:id/prep-time`, async ({ params, request }) => {
    await boot()
    const order = await db.orders.get(String(params.id))
    if (!order) return error('Order not found', 404)
    const { minutes, reason, chefId } = await request.json() as { minutes: number; reason: string; chefId?: string }
    const storeConfig = await getStoreConfig()
    const result = overridePrepTime({ order, requestedMinutes: minutes, reason, chefId: chefId ?? 'Kitchen Tablet #1', now: now() }, storeConfig.delayThresholds)
    await db.orders.put(result.order)
    await logOrderEvent(result.order.id, 'PREP_TIME_OVERRIDDEN', 'CHEF', { minutes, reason, delayMinutes: result.delayMinutes })
    if (result.customerNoticeNeeded) {
      await notifyCustomer(result.order.id, 'Your ETA changed', `${result.order.publicOrderNumber} needs a little more kitchen time. Your live ETA has been updated.`, 'ETA')
      await db.auditLogs.add({ id: crypto.randomUUID(), actor: 'SYSTEM', action: 'WHATSAPP_DEMO_QUEUED', entityType: 'ORDER', entityId: result.order.id, at: now().toISOString(), metadata: { reason, minutes } })
    }
    if (result.severeDelay) {
      await db.attentionItems.add(createAttentionItem('SEVERE_DELAY', `Order ${result.order.publicOrderNumber} delayed ${result.delayMinutes}m`, reason, 'Consider proactively contacting the customer.', now(), { orderId: result.order.id, customerId: result.order.customerId }))
      eventBus.emit('ATTENTION_CHANGED', { type: 'SEVERE_DELAY' }, { orderId: result.order.id, customerId: result.order.customerId })
    }
    return json({ order: await projectKitchenOrder(result.order.id), customerNoticeNeeded: result.customerNoticeNeeded, severeDelay: result.severeDelay })
  }),

  http.post(`${API}/kds/orders/:id/ready`, async ({ params }) => {
    await boot()
    const order = await db.orders.get(String(params.id))
    if (!order) return error('Order not found', 404)
    const updated = markReady(order, now())
    await db.orders.put(updated)
    await logOrderEvent(updated.id, 'ORDER_READY', 'CHEF', { whatsapp: 'QUEUED' })
    await notifyCustomer(updated.id, updated.fulfillmentType === 'PICKUP' ? 'Ready for pickup' : 'Your order is ready', updated.fulfillmentType === 'PICKUP' ? `${updated.publicOrderNumber} is ready at Grand Road.` : `${updated.publicOrderNumber} is packed and waiting for the rider.`)
    await db.auditLogs.add({ id: crypto.randomUUID(), actor: 'SYSTEM', action: 'WHATSAPP_DEMO_QUEUED', entityType: 'ORDER', entityId: updated.id, at: now().toISOString(), metadata: { milestone: 'ORDER_READY' } })
    return json(await projectKitchenOrder(updated.id))
  }),

  http.post(`${API}/kds/orders/:id/problem`, async ({ params, request }) => {
    await boot()
    const order = await db.orders.get(String(params.id))
    if (!order) return error('Order not found', 404)
    const { type, detail } = await request.json() as { type: KdsProblemType; detail?: string }
    const labels: Record<KdsProblemType, string> = { INGREDIENT_UNAVAILABLE: 'Ingredient unavailable', KITCHEN_DELAY: 'Kitchen delay', EQUIPMENT_ISSUE: 'Equipment issue', OTHER: 'Other' }
    const reason = detail?.trim() || labels[type]
    await logOrderEvent(order.id, 'KITCHEN_PROBLEM_REPORTED', 'CHEF', { type, detail: reason })
    const severe = type === 'KITCHEN_DELAY' || type === 'EQUIPMENT_ISSUE'
    if (severe) {
      await db.attentionItems.add(createAttentionItem('SEVERE_DELAY', `${labels[type]} on ${order.publicOrderNumber}`, reason, 'Check with the kitchen and update the customer only if the promise changes.', now(), { orderId: order.id, customerId: order.customerId }))
      eventBus.emit('ATTENTION_CHANGED', { type: 'SEVERE_DELAY' }, { orderId: order.id, customerId: order.customerId })
    }
    return json({ ok: true, attentionCreated: severe })
  }),

  http.get(`${API}/kds/heartbeat`, async () => {
    await boot()
    const config = await getStoreConfig()
    const saved = await db.config.get('kdsHeartbeat')
    return json(saved?.value ?? { online: config.kdsOnline, device: 'Kitchen Tablet #1', lastSeenAt: now().toISOString() })
  }),

  http.post(`${API}/kds/heartbeat`, async ({ request }) => {
    await boot()
    const { online } = await request.json() as { online: boolean }
    return json(await setKdsHeartbeat(online, now()))
  }),
]
