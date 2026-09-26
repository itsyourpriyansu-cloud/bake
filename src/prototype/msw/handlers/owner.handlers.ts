import { http } from 'msw'
import { db } from '../../database/db'
import { acceptOrder, applySchedule, rejectOrder } from '../../../domain/orders/order.logic'
import { scheduleOrder } from '../../../domain/fulfillment/scheduler'
import { approveRefund, completeRefund, createRefund, processRefund, submitRefund } from '../../../domain/refunds/refund.machine'
import { createAttentionItem, getActiveAttentionQueue, resolveAttentionItem } from '../../../domain/attention/attention.engine'
import { calculateTier } from '../../../domain/loyalty/loyalty.engine'
import { createId } from '../../../domain/shared/ids'
import { closeSupportCase, resolveSupportCase } from '../../../domain/support/support.logic'
import type { Order } from '../../../domain/orders/order.types'
import type { SupportCase } from '../../../domain/support/support.types'
import type { ChatMessage } from '../../../domain/conversation/conversation.types'
import type { CartQuote } from '../../../domain/pricing/pricing.types'
import { API, boot, error, getActiveKitchenOrderCount, getCapabilities, getDemoKitchenLoadPercent, getStoreConfig, json, logOrderEvent, nextOrderSequence, now } from './_shared'
import { eventBus } from '../../events/event-bus'

async function customer360(customerId: string) {
  const customer = await db.customers.get(customerId)
  if (!customer) return undefined
  const [orders, loyalty, support] = await Promise.all([
    db.orders.where('customerId').equals(customerId).sortBy('createdAt'),
    db.loyaltyTransactions.where('customerId').equals(customerId).sortBy('createdAt'),
    db.supportCases.where('customerId').equals(customerId).sortBy('createdAt'),
  ])
  const events = (await Promise.all(orders.map((order) => db.orderEvents.where('orderId').equals(order.id).toArray()))).flat()
  const timeline = [
    ...orders.map((order) => ({ id: `TL-${order.id}`, type: 'ORDER', title: `${order.publicOrderNumber} · ${order.fulfillmentType}`, detail: `${order.fulfillmentStatus.replaceAll('_', ' ')} · ₹${order.financialSnapshot.total}`, at: order.createdAt })),
    ...events.map((event) => ({ id: `TL-${event.id}`, type: 'EVENT', title: event.type.replaceAll('_', ' '), detail: `${event.actor.toLowerCase()} update`, at: event.at })),
    ...loyalty.map((entry) => ({ id: `TL-${entry.id}`, type: 'LOYALTY', title: `${entry.points >= 0 ? '+' : ''}${entry.points} Wave Points`, detail: entry.note ?? entry.type.replaceAll('_', ' '), at: entry.createdAt })),
    ...support.map((entry) => ({ id: `TL-${entry.id}`, type: 'SUPPORT', title: entry.category.replaceAll('_', ' '), detail: entry.status.replaceAll('_', ' '), at: entry.createdAt })),
  ].sort((a, b) => b.at.localeCompare(a.at))
  const fulfilled = orders.filter((order) => ['DELIVERED', 'PICKED_UP', 'STORE_COMPLETED'].includes(order.fulfillmentStatus))
  const total = fulfilled.length || 1
  const count = (mode: string) => Math.round(fulfilled.filter((order) => order.fulfillmentType === mode).length / total * 100)
  return {
    customer, recentOrders: [...orders].reverse().slice(0, 10), loyaltyHistory: [...loyalty].reverse(), timeline,
    sourceSplit: { delivery: count('DELIVERY'), pickup: count('PICKUP'), store: count('STORE') },
    // Redemptions are stored as separate ledger entries, so the sum of positive
    // lots can exceed the spendable wallet. Never present more expiring value
    // than the customer's current available balance.
    pointsExpiring: Math.min(
      customer.pointsAvailable,
      loyalty.filter((entry) => entry.status === 'AVAILABLE' && entry.expiresAt).reduce((sum, entry) => sum + Math.max(0, entry.points), 0),
    ),
  }
}

async function supportDetail(supportCase: SupportCase) {
  const customer = await db.customers.get(supportCase.customerId)
  if (!customer) throw new Error(`Customer ${supportCase.customerId} missing`)
  const order = supportCase.orderId ? await db.orders.get(supportCase.orderId) : undefined
  const messages = supportCase.conversationId ? await db.messages.where('conversationId').equals(supportCase.conversationId).sortBy('at') : []
  return { supportCase, customer, order, messages }
}

export const ownerHandlers = [
  http.get(`${API}/owner/dashboard`, async () => {
    await boot()
    const [store, orders, customers, loyalty, activeCount, loadOverride] = await Promise.all([
      getStoreConfig(), db.orders.toArray(), db.customers.toArray(), db.loyaltyTransactions.toArray(), getActiveKitchenOrderCount(), getDemoKitchenLoadPercent(),
    ])
    const paid = orders.filter((order) => order.paymentStatus === 'CONFIRMED')
    const revenue = paid.filter((order) => order.refundStatus !== 'SUCCESS').reduce((sum, order) => sum + order.financialSnapshot.total, 0)
    const repeatCustomers = customers.filter((customer) => customer.stats.lifetimeOrders > 1).length
    const tierCount = (tier: string) => customers.filter((customer) => customer.tier === tier).length
    const liveKitchen = orders.filter((order) => ['SCHEDULED', 'PREP_DUE', 'PREPARING', 'READY'].includes(order.fulfillmentStatus))
    const hasReview = orders.some((order) => order.acceptanceStatus === 'REVIEW_REQUIRED')
    return json({
      store,
      kpis: [
        { label: 'Revenue', value: `₹${revenue.toLocaleString('en-IN')}`, detail: 'Confirmed payments today' },
        { label: 'Paid Orders', value: String(paid.length), detail: 'Backend-confirmed' },
        { label: 'AOV', value: `₹${paid.length ? Math.round(revenue / paid.length) : 0}`, detail: 'Average order value' },
        { label: 'Repeat %', value: `${customers.length ? Math.round(repeatCustomers / customers.length * 100) : 0}%`, detail: 'Returning customers' },
        { label: 'First→Second', value: '46%', detail: 'Rolling 30 days' },
      ],
      live: {
        awaitingReview: orders.filter((order) => order.acceptanceStatus === 'REVIEW_REQUIRED').length,
        preparing: orders.filter((order) => order.fulfillmentStatus === 'PREPARING').length,
        ready: orders.filter((order) => order.fulfillmentStatus === 'READY').length,
        deliveryActive: orders.filter((order) => order.fulfillmentType === 'DELIVERY' && ['SCHEDULED', 'PREP_DUE', 'PREPARING', 'READY', 'DISPATCHED'].includes(order.fulfillmentStatus)).length,
        pickupActive: orders.filter((order) => order.fulfillmentType === 'PICKUP' && ['SCHEDULED', 'PREP_DUE', 'PREPARING', 'READY'].includes(order.fulfillmentStatus)).length,
      },
      kitchen: {
        loadPercent: loadOverride ?? (hasReview ? 94 : Math.min(100, Math.round(activeCount / store.kitchenCapacityCount * 100))),
        kdsOnline: store.kdsOnline, nextCapacityAt: liveKitchen.length ? '12 min' : 'Now',
        averagePrepMinutes: liveKitchen.length ? Math.round(liveKitchen.reduce((sum, order) => sum + order.effectivePrepMinutes, 0) / liveKitchen.length) : 0,
        ordersAtRisk: hasReview ? 2 : 0, delayedOrders: orders.filter((order) => order.id === 'ORDER-ACTIVE-1384').length,
        etaAccuracyPercent: 91,
      },
      growth: { newCustomers: customers.filter((customer) => customer.customerStage === 'NEW').length, returningCustomers: repeatCustomers, reactivatedCustomers: 3, secondOrderPending: 8 },
      loyalty: {
        member: tierCount('MEMBER'), silver: tierCount('SILVER'), gold: tierCount('GOLD'), platinum: tierCount('PLATINUM'),
        pointsIssued: loyalty.filter((entry) => entry.points > 0).reduce((sum, entry) => sum + entry.points, 0),
        pointsRedeemed: Math.abs(loyalty.filter((entry) => entry.type === 'REDEEM').reduce((sum, entry) => sum + entry.points, 0)),
        pointsPending: customers.reduce((sum, customer) => sum + customer.pointsPending, 0),
      },
    })
  }),

  http.get(`${API}/owner/orders/live`, async ({ request }) => {
    await boot()
    const status = new URL(request.url).searchParams.get('status')
    const orders = (await db.orders.toArray()).filter((order) => {
      if (!status) return !['DELIVERED', 'PICKED_UP', 'STORE_COMPLETED', 'CANCELLED'].includes(order.fulfillmentStatus)
      if (status === 'AWAITING_REVIEW') return order.acceptanceStatus === 'REVIEW_REQUIRED'
      if (status === 'DELIVERY_ACTIVE') return order.fulfillmentType === 'DELIVERY' && ['SCHEDULED', 'PREP_DUE', 'PREPARING', 'READY', 'DISPATCHED'].includes(order.fulfillmentStatus)
      if (status === 'PICKUP_ACTIVE') return order.fulfillmentType === 'PICKUP' && ['SCHEDULED', 'PREP_DUE', 'PREPARING', 'READY'].includes(order.fulfillmentStatus)
      return order.fulfillmentStatus === status
    })
    return json(orders)
  }),
  http.get(`${API}/owner/orders`, async ({ request }) => {
    await boot()
    const status = new URL(request.url).searchParams.get('acceptanceStatus')
    const rows = await db.orders.toArray()
    return json(status ? rows.filter((order) => order.acceptanceStatus === status) : rows)
  }),

  http.post(`${API}/owner/orders/:id/accept`, async ({ params }) => {
    await boot()
    let order = await db.orders.get(String(params.id))
    if (!order) return error('Order not found', 404)
    const products = await db.products.bulkGet(order.items.map((item) => item.productId))
    const storeConfig = await getStoreConfig()
    const activeOrderCount = await getActiveKitchenOrderCount()
    const schedule = scheduleOrder({
      items: products.filter(Boolean).map((product) => ({ productId: product!.id, prepMinutes: product!.prepMinutes, complexity: product!.complexity, station: product!.station, quantity: order!.items.find((item) => item.productId === product!.id)?.quantity ?? 1 })),
      fulfillmentType: order.fulfillmentType, activeOrderCount, kitchenCapacityCount: storeConfig.kitchenCapacityCount,
      packingMinutes: storeConfig.packingMinutes, pickupBufferMinutes: storeConfig.pickupBufferMinutes, deliveryBufferMinutes: storeConfig.deliveryBufferMinutes, now: now(),
    })
    order = acceptOrder(order, now())
    order = applySchedule(order, schedule)
    await db.orders.put(order)
    await logOrderEvent(order.id, 'ORDER_ACCEPTED', 'OWNER')
    await logOrderEvent(order.id, 'FULFILLMENT_SCHEDULED', 'OWNER', { targetReadyAt: order.targetReadyAt })
    const pending = (await db.attentionItems.toArray()).find((item) => item.orderId === order!.id && item.type === 'ORDER_REVIEW' && !item.resolvedAt)
    if (pending) await db.attentionItems.put(resolveAttentionItem(pending, now()))
    if (pending) eventBus.emit('ATTENTION_CHANGED', { resolvedId: pending.id }, { orderId: order.id, customerId: order.customerId })
    return json(order)
  }),

  http.post(`${API}/owner/orders/:id/reject`, async ({ params, request }) => {
    await boot()
    let order = await db.orders.get(String(params.id))
    if (!order) return error('Order not found', 404)
    const { reason } = await request.json() as { reason: string }
    order = { ...rejectOrder(order, reason, now()), refundStatus: 'REQUESTED' }
    await db.orders.put(order)
    await logOrderEvent(order.id, 'ORDER_REJECTED', 'OWNER', { reason })
    const refund = createRefund(order.id, order.customerId, order.financialSnapshot.total, order.financialSnapshot.pointsToEarn, 'ORDER_REJECTED', now())
    await db.refunds.add(refund)
    await logOrderEvent(order.id, 'REFUND_REQUESTED', 'OWNER', { refundId: refund.id })
    const notificationRecord = await db.config.get('customerNotifications')
    const notifications = (notificationRecord?.value as Array<{ id: string; customerId: string; kind: 'SYSTEM'; title: string; message: string; createdAt: string; read: boolean; orderId?: string }> | undefined) ?? []
    notifications.unshift({ id: createId('NOTIF'), customerId: order.customerId, kind: 'SYSTEM', title: 'Refund started', message: `A full refund has started for ${order.publicOrderNumber}.`, createdAt: now().toISOString(), read: false, orderId: order.id })
    await db.config.put({ key: 'customerNotifications', value: notifications })
    const conversation = await db.conversations.where('customerId').equals(order.customerId).and((row) => row.status === 'OPEN').first()
    if (conversation) {
      await db.messages.add({ id: createId('MSG'), conversationId: conversation.id, from: 'SYSTEM', text: `Refund started for ${order.publicOrderNumber}. Live progress will appear here automatically.`, at: now().toISOString() })
      await db.conversations.update(conversation.id, { updatedAt: now().toISOString() })
      eventBus.emit('CONVERSATION_UPDATED', { conversationId: conversation.id }, { orderId: order.id, customerId: order.customerId })
    }
    const pending = (await db.attentionItems.toArray()).find((item) => item.orderId === order!.id && item.type === 'ORDER_REVIEW' && !item.resolvedAt)
    if (pending) await db.attentionItems.put(resolveAttentionItem(pending, now()))
    if (pending) eventBus.emit('ATTENTION_CHANGED', { resolvedId: pending.id }, { orderId: order.id, customerId: order.customerId })
    eventBus.emit('REFUND_STATUS_CHANGED', { refundId: refund.id, status: refund.status }, { orderId: order.id, customerId: order.customerId })
    return json({ order, refund })
  }),

  http.get(`${API}/owner/attention`, async () => { await boot(); return json(getActiveAttentionQueue(await db.attentionItems.toArray())) }),

  http.post(`${API}/owner/attention/:id/resolve`, async ({ params }) => {
    await boot()
    const item = await db.attentionItems.get(String(params.id))
    if (!item) return error('Attention item not found', 404)
    const resolved = resolveAttentionItem(item, now())
    await db.attentionItems.put(resolved)
    eventBus.emit('ATTENTION_CHANGED', { resolvedId: resolved.id }, { orderId: resolved.orderId, customerId: resolved.customerId })
    return json(resolved)
  }),

  http.get(`${API}/owner/customers/:id`, async ({ params }) => {
    await boot()
    const customer = await db.customers.get(String(params.id))
    return customer ? json(customer) : error('Customer not found', 404)
  }),

  http.get(`${API}/owner/customers`, async ({ request }) => {
    await boot()
    const query = (new URL(request.url).searchParams.get('q') ?? '').trim().toLowerCase()
    const customers = await db.customers.toArray()
    if (!query) return json(customers)
    const matchingOrderCustomers = new Set((await db.orders.toArray()).filter((order) => order.publicOrderNumber.toLowerCase().includes(query)).map((order) => order.customerId))
    return json(customers.filter((customer) => customer.firstName.toLowerCase().includes(query) || customer.phone.replace(/\D/g, '').includes(query.replace(/\D/g, '')) || matchingOrderCustomers.has(customer.id)))
  }),

  http.get(`${API}/owner/customers/:id/timeline`, async ({ params }) => {
    await boot(); const result = await customer360(String(params.id)); return result ? json(result) : error('Customer not found', 404)
  }),

  http.post(`${API}/owner/customers/:id/points-adjustment`, async ({ params, request }) => {
    await boot()
    const customerId = String(params.id); const customer = await db.customers.get(customerId)
    if (!customer) return error('Customer not found', 404)
    const body = await request.json() as { direction: 'ADD' | 'REMOVE'; amount: number; reason: string; note?: string }
    const amount = Math.floor(Math.abs(body.amount))
    if (!amount || !body.reason?.trim()) return error('Amount and reason are required', 422)
    if (body.direction === 'REMOVE' && amount > customer.pointsAvailable) return error('Cannot remove more than the available balance', 409)
    const signed = body.direction === 'ADD' ? amount : -amount; const timestamp = now().toISOString()
    await db.transaction('rw', db.customers, db.loyaltyTransactions, db.auditLogs, async () => {
      await db.customers.update(customerId, { pointsAvailable: customer.pointsAvailable + signed })
      await db.loyaltyTransactions.add({ id: createId('LOY-GOODWILL'), customerId, type: body.direction === 'ADD' ? 'BONUS' : 'REVERSAL', status: body.direction === 'ADD' ? 'AVAILABLE' : 'REVERSED', points: signed, createdAt: timestamp, note: `${body.reason}${body.note ? ` · ${body.note}` : ''}` })
      await db.auditLogs.add({ id: createId('AUDIT'), actor: 'OWNER', action: `POINTS_${body.direction}`, entityType: 'CUSTOMER', entityId: customerId, at: timestamp, metadata: { amount, reason: body.reason, note: body.note } })
    })
    return json(await customer360(customerId))
  }),

  http.get(`${API}/owner/availability`, async () => { await boot(); return json(await db.availability.toArray()) }),

  http.get(`${API}/owner/support`, async () => {
    await boot(); const rows = await db.supportCases.toArray(); return json(await Promise.all(rows.map(supportDetail)))
  }),

  http.post(`${API}/owner/support/:id/action`, async ({ params, request }) => {
    await boot(); const supportCase = await db.supportCases.get(String(params.id)); if (!supportCase) return error('Support case not found', 404)
    const body = await request.json() as { action: 'REFUND_ITEM' | 'REPLACEMENT' | 'ANSWER' | 'CLOSE'; amount?: number; message?: string }
    let nextCase = supportCase; let refund
    if (body.action === 'REFUND_ITEM') {
      if (!supportCase.orderId) return error('A linked order is required for a refund', 409)
      const order = await db.orders.get(supportCase.orderId); if (!order) return error('Order not found', 404)
      const amount = Math.min(Math.max(1, Math.round(body.amount ?? order.items[0]?.unitPrice ?? 0)), order.financialSnapshot.total)
      refund = completeRefund(processRefund(submitRefund(approveRefund(createRefund(order.id, supportCase.customerId, amount, Math.floor(order.financialSnapshot.pointsToEarn * amount / order.financialSnapshot.total), 'COMPLAINT_RESOLUTION', now())))), now())
      nextCase = { ...supportCase, refundId: refund.id, status: 'RESOLVED', resolvedAt: now().toISOString() }
      await db.transaction('rw', db.refunds, db.supportCases, db.orders, async () => { await db.refunds.add(refund!); await db.supportCases.put(nextCase); await db.orders.update(order.id, { refundStatus: 'SUCCESS' }) })
      await logOrderEvent(order.id, 'REFUND_COMPLETED', 'OWNER', { refundId: refund.id, amount })
    } else if (body.action === 'CLOSE') nextCase = closeSupportCase(supportCase)
    else if (body.action === 'REPLACEMENT') nextCase = { ...supportCase, status: 'WAITING_CUSTOMER' }
    else nextCase = resolveSupportCase(supportCase, now())
    await db.supportCases.put(nextCase)
    if (supportCase.conversationId && body.message?.trim()) {
      const message: ChatMessage = { id: createId('MSG'), conversationId: supportCase.conversationId, from: 'OWNER', text: body.message.trim(), at: now().toISOString() }
      await db.messages.add(message)
      await db.conversations.update(supportCase.conversationId, { updatedAt: message.at })
      eventBus.emit('CONVERSATION_UPDATED', { conversationId: supportCase.conversationId }, { orderId: supportCase.orderId, customerId: supportCase.customerId })
    }
    const attention = (await db.attentionItems.toArray()).find((item) => item.orderId === supportCase.orderId && item.type === 'COMPLAINT' && !item.resolvedAt)
    if (attention && ['REFUND_ITEM', 'CLOSE', 'ANSWER'].includes(body.action)) await db.attentionItems.put(resolveAttentionItem(attention, now()))
    return json({ support: await supportDetail(nextCase), refund })
  }),

  http.post(`${API}/owner/store-orders`, async ({ request }) => {
    await boot()
    const body = await request.json() as { customerMode: 'WAVE_ID' | 'PHONE_OTP' | 'GUEST'; customerId?: string; phone?: string; otp?: string; productId: string; quantity: number }
    if (body.customerMode === 'PHONE_OTP' && body.otp !== '123456') return error('Verify the customer before attaching their profile', 401)
    const product = await db.products.get(body.productId); if (!product) return error('Product not found', 404)
    const quantity = Math.max(1, Math.floor(body.quantity)); const current = now(); const subtotal = product.basePrice * quantity
    const customerId = body.customerMode === 'GUEST' ? 'GUEST-STORE' : body.customerId ?? 'CUST001'
    const customer = await db.customers.get(customerId); const tier = calculateTier({ rolling120Orders: customer?.stats.rolling120Orders ?? 0, rolling120EligibleSpend: customer?.stats.rolling120EligibleSpend ?? 0 })
    const quote: CartQuote = { itemCount: quantity, subtotal, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0, pointsRedeemed: 0, deliveryFee: 0, eligibleSpend: subtotal, pointsToEarn: Math.floor(subtotal * tier.earnRate), total: subtotal, warnings: [], valid: true }
    const intentId = createId('INTENT-STORE'); const paymentId = createId('PAY-STORE'); const orderId = createId('ORDER-STORE'); const sequence = await nextOrderSequence()
    const order: Order = {
      id: orderId, publicOrderNumber: `PW${String(1384 + sequence).padStart(4, '0')}`, customerId, source: 'STORE_ASSISTED', fulfillmentType: 'STORE',
      paymentStatus: 'CONFIRMED', acceptanceStatus: 'AWAITING_ACCEPTANCE', fulfillmentStatus: 'NOT_STARTED', refundStatus: 'NONE',
      items: [{ productId: product.id, name: product.name, quantity, unitPrice: product.basePrice }], financialSnapshot: quote,
      systemPrepMinutes: product.prepMinutes, effectivePrepMinutes: product.prepMinutes, createdAt: current.toISOString(), orderIntentId: intentId, paymentId,
    }
    const store = await getStoreConfig(); const capabilities = await getCapabilities(); const activeCount = await getActiveKitchenOrderCount()
    const schedule = scheduleOrder({ items: [{ productId: product.id, prepMinutes: product.prepMinutes, complexity: product.complexity, station: product.station, quantity }], fulfillmentType: 'STORE', activeOrderCount: activeCount, kitchenCapacityCount: store.kitchenCapacityCount, packingMinutes: store.packingMinutes, pickupBufferMinutes: store.pickupBufferMinutes, deliveryBufferMinutes: store.deliveryBufferMinutes, now: current })
    const requiresReview = store.acceptanceMode === 'MANUAL' || schedule.reviewRequired || !capabilities.storeOrder.enabled || !store.kdsOnline
    let finalOrder = requiresReview ? { ...order, acceptanceStatus: 'REVIEW_REQUIRED' as const } : applySchedule(acceptOrder(order, current), schedule)
    await db.transaction('rw', db.orderIntents, db.payments, db.orders, async () => {
      await db.orderIntents.add({ id: intentId, customerId, fulfillmentType: 'STORE', cartSnapshot: { cartId: `STORE-CART-${orderId}`, items: [{ productId: product.id, quantity, unitPrice: product.basePrice, name: product.name }], takenAt: current.toISOString() }, quoteSnapshot: quote, expectedPromiseAt: schedule.promiseWindowStart, expiresAt: new Date(current.getTime() + 900_000).toISOString(), status: 'CONSUMED', createdAt: current.toISOString() })
      await db.payments.add({ id: paymentId, orderIntentId: intentId, provider: 'PHONEPE', merchantOrderId: `MO-${intentId}`, providerTransactionId: `DEMO-${paymentId}`, amount: quote.total, status: 'CONFIRMED', createdAt: current.toISOString(), confirmedAt: current.toISOString() })
      await db.orders.add(finalOrder)
    })
    await logOrderEvent(finalOrder.id, 'PAYMENT_CONFIRMED', 'SYSTEM')
    if (requiresReview) await db.attentionItems.add(createAttentionItem('ORDER_REVIEW', `${finalOrder.publicOrderNumber} store order needs review`, 'Paid in-store order is waiting for the configured acceptance policy.', 'Review before sending it to KDS.', current, { orderId: finalOrder.id, customerId }))
    else { await logOrderEvent(finalOrder.id, 'ORDER_ACCEPTED', 'SYSTEM'); await logOrderEvent(finalOrder.id, 'FULFILLMENT_SCHEDULED', 'SYSTEM') }
    return json({ order: finalOrder, paymentStatus: 'CONFIRMED', acceptanceOutcome: requiresReview ? 'REVIEW_REQUIRED' : 'ACCEPTED', demoOnly: true }, 201)
  }),
]
