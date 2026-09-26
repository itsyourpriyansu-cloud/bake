import { http } from 'msw'
import { db } from '../../database/db'
import { API, boot, error, json, logOrderEvent, now } from './_shared'
import { configuredUnitPrice, defaultModifierSelections, validateModifierSelections } from '../../../domain/catalog/modifier.engine'
import { getEffectiveAvailability } from '../../../domain/availability/availability.engine'
import { DEMO_CART_ID } from '../../demo/reset-demo'
import { getQuote } from './cart.handlers'
import { completeOrderFulfillment } from './_fulfillmentCompletion'
import type { CartItemModifierSelection } from '../../../domain/cart/cart.types'
import type { CustomerNotification } from '../../../domain/customer/customer-experience.types'

async function notifyOrder(orderId: string, title: string, message: string, kind: CustomerNotification['kind'] = 'ORDER') {
  const [record, order] = await Promise.all([db.config.get('customerNotifications'), db.orders.get(orderId)])
  const rows = (record?.value as CustomerNotification[] | undefined) ?? []
  rows.unshift({ id: `NOTIF-${crypto.randomUUID()}`, customerId: order?.customerId ?? 'CUST001', kind, title, message, createdAt: now().toISOString(), read: false, orderId })
  await db.config.put({ key: 'customerNotifications', value: rows })
}

export const ordersHandlers = [
  http.get(`${API}/orders`, async ({ request }) => {
    await boot()
    const customerId = new URL(request.url).searchParams.get('customerId') ?? 'CUST001'
    const rows = await db.orders.where('customerId').equals(customerId).sortBy('createdAt')
    return json(rows.reverse())
  }),

  http.get(`${API}/orders/:id`, async ({ params }) => {
    await boot()
    const order = await db.orders.get(String(params.id))
    return order ? json(order) : error('Order not found', 404)
  }),

  http.get(`${API}/orders/:id/events`, async ({ params }) => {
    await boot()
    const events = await db.orderEvents.where('orderId').equals(String(params.id)).sortBy('at')
    return json(events)
  }),

  http.post(`${API}/orders/:id/reorder`, async ({ params, request }) => {
    await boot()
    const order = await db.orders.get(String(params.id))
    if (!order) return error('Order not found', 404)
    const { acceptChanges = false } = await request.json().catch(() => ({})) as { acceptChanges?: boolean }
    const availability = await db.availability.toArray()
    const changes: Array<{ productId: string; name: string; kind: 'PRICE' | 'PRODUCT_UNAVAILABLE' | 'MODIFIER_UNAVAILABLE' | 'MODIFIER_CHANGED'; message: string }> = []
    const prepared: Array<{ productId: string; quantity: number; modifiers: CartItemModifierSelection[]; unitPrice: number }> = []

    for (const item of order.items) {
      const product = await db.products.get(item.productId)
      if (!product || getEffectiveAvailability(item.productId, availability, now(), product).status !== 'AVAILABLE') {
        changes.push({ productId: item.productId, name: item.name, kind: 'PRODUCT_UNAVAILABLE', message: `${item.name} is temporarily unavailable and won't be added.` })
        continue
      }
      let selections = item.modifiers?.length ? item.modifiers : defaultModifierSelections(product.modifierGroups ?? [])
      const validation = validateModifierSelections(product.modifierGroups ?? [], selections)
      if (validation.length) {
        changes.push({ productId: item.productId, name: item.name, kind: 'MODIFIER_CHANGED', message: `${item.name} needs its current default choices.` })
        selections = defaultModifierSelections(product.modifierGroups ?? [])
      }
      const unavailableNames = selections.flatMap((selection) => {
        const group = product.modifierGroups?.find((candidate) => candidate.id === selection.groupId)
        return selection.optionIds.flatMap((optionId) => {
          const option = group?.options.find((candidate) => candidate.id === optionId)
          return !option || !option.available || getEffectiveAvailability(optionId, availability, now()).status !== 'AVAILABLE' ? [option?.name ?? optionId] : []
        })
      })
      if (unavailableNames.length) {
        changes.push({ productId: item.productId, name: item.name, kind: 'MODIFIER_UNAVAILABLE', message: `${unavailableNames.join(', ')} is unavailable on ${item.name}.` })
        selections = defaultModifierSelections(product.modifierGroups ?? [])
      }
      const currentPrice = configuredUnitPrice(product.basePrice, product.modifierGroups ?? [], selections)
      if (currentPrice !== item.unitPrice) changes.push({ productId: item.productId, name: item.name, kind: 'PRICE', message: `${item.name} is now ₹${currentPrice} (was ₹${item.unitPrice}).` })
      prepared.push({ productId: item.productId, quantity: item.quantity, modifiers: selections, unitPrice: currentPrice })
    }

    if (changes.length && !acceptChanges) return json({ status: 'REVIEW_REQUIRED', changes })
    for (const item of prepared) await db.cartItems.add({ id: crypto.randomUUID(), cartId: DEMO_CART_ID, productId: item.productId, quantity: item.quantity, modifiers: item.modifiers, unitPriceSnapshot: item.unitPrice })
    return json({ status: 'ADDED', changes, quote: await getQuote(order.fulfillmentType) })
  }),

  http.post(`${API}/demo/orders/:id/advance`, async ({ params }) => {
    await boot()
    const order = await db.orders.get(String(params.id))
    if (!order) return error('Order not found', 404)
    if (order.fulfillmentStatus === 'PREPARING') {
      const updated = { ...order, fulfillmentStatus: 'READY' as const }
      await db.orders.put(updated); await logOrderEvent(order.id, 'ORDER_READY', 'SYSTEM'); await notifyOrder(order.id, order.fulfillmentType === 'PICKUP' ? 'Ready for pickup' : 'Your order is ready', order.fulfillmentType === 'PICKUP' ? `${order.publicOrderNumber} is waiting at Grand Road.` : `${order.publicOrderNumber} is packed and waiting for the rider.`); return json(updated)
    }
    if (order.fulfillmentStatus === 'READY') {
      if (order.fulfillmentType === 'PICKUP') return json(await completeOrderFulfillment(order, 'PICKED_UP'))
      const updated = { ...order, fulfillmentStatus: 'DISPATCHED' as const }
      await db.orders.put(updated); await logOrderEvent(order.id, 'ORDER_DISPATCHED', 'SYSTEM'); await notifyOrder(order.id, 'Your order is on the way', `${order.publicOrderNumber} has left Grand Road for CT Road.`); return json(updated)
    }
    if (order.fulfillmentStatus === 'DISPATCHED') {
      const completed = await completeOrderFulfillment(order, 'DELIVERED')
      const customer = await db.customers.get(order.customerId)
      await notifyOrder(order.id, `+${order.financialSnapshot.pointsToEarn} Wave Points`, `Your points are now available. You have ${customer?.pointsAvailable ?? 0} points.`, 'POINTS')
      return json(completed)
    }
    return json(order)
  }),

  /** Fulfillment completion belongs to the order domain, not the three-screen KDS surface. */
  http.post(`${API}/orders/:id/complete`, async ({ params, request }) => {
    await boot()
    const order = await db.orders.get(String(params.id))
    if (!order) return error('Order not found', 404)
    const { finalStatus } = await request.json() as { finalStatus: 'DELIVERED' | 'PICKED_UP' | 'STORE_COMPLETED' }
    return json(await completeOrderFulfillment(order, finalStatus))
  }),
]
