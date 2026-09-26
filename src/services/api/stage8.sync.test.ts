import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { getCustomerOrderView } from '../../domain/orders/customer-order.view'
import { db } from '../../prototype/database/db'
import { resetDemoDatabase } from '../../prototype/demo/reset-demo'
import { eventBus } from '../../prototype/events/event-bus'
import { server } from '../../prototype/msw/server'
import { api, apiClient } from './index'

const originalBaseUrl = apiClient.defaults.baseURL

beforeAll(() => {
  apiClient.defaults.baseURL = 'http://pizza-wave.test/api/v1'
  server.listen({ onUnhandledRequest: 'error' })
})

afterAll(() => {
  server.close()
  apiClient.defaults.baseURL = originalBaseUrl
})

beforeEach(async () => {
  server.resetHandlers()
  await resetDemoDatabase()
  await api.auth.verifyCustomerOtp('9876543210', '123456')
})

async function preparePayment(fulfillmentType: 'DELIVERY' | 'PICKUP' = 'DELIVERY', pickupSlot?: string, pointsRequested = 0) {
  await api.cart.addCartItem('PIZZA-VEG-001')
  const options = await api.checkout.getCheckoutOptions(fulfillmentType)
  const checkout = await api.checkout.createCheckoutSession({
    fulfillmentType,
    phone: options.customer.phone,
    addressSnapshot: fulfillmentType === 'DELIVERY' ? options.customer.defaultAddress : undefined,
    pickupSlot: fulfillmentType === 'PICKUP' ? pickupSlot ?? options.pickupSlots[0] : undefined,
    pointsRequested,
  })
  const intent = await api.checkout.createOrderIntent(checkout.id)
  const initiated = await api.payment.initiatePayment(intent.id)
  return { options, intent, payment: initiated.payment }
}

describe('Stage 8 synchronized platform', () => {
  it('auto-accepts a safe paid order into Owner, KDS and customer projections', async () => {
    await api.demo.setKitchenLoad(25)
    const { payment } = await preparePayment()
    const result = await api.payment.confirmPaymentDemo(payment.id)

    expect(result.order).toMatchObject({ paymentStatus: 'CONFIRMED', acceptanceStatus: 'ACCEPTED', fulfillmentStatus: 'SCHEDULED' })
    expect((await api.owner.getOwnerOrders()).some((order) => order.id === result.order?.id)).toBe(true)
    expect((await api.kds.getKitchenQueue()).some((order) => order.id === result.order?.id)).toBe(true)
    expect(getCustomerOrderView(await api.orders.getOrder(result.order!.id)).stage).toBe('SCHEDULED')
    expect((await api.orders.getOrderEvents(result.order!.id)).map((event) => event.type)).toEqual([
      'PAYMENT_CONFIRMED', 'ORDER_ACCEPTED', 'FULFILLMENT_SCHEDULED',
    ])
  })

  it('routes high-load paid orders to meaningful owner review without leaking into KDS', async () => {
    await api.demo.setKitchenLoad(100)
    const { payment } = await preparePayment()
    const result = await api.payment.confirmPaymentDemo(payment.id)

    expect(result.order).toMatchObject({ acceptanceStatus: 'REVIEW_REQUIRED', fulfillmentStatus: 'NOT_STARTED' })
    expect(getCustomerOrderView(result.order!).stage).toBe('ACCEPTANCE')
    expect((await api.kds.getKitchenQueue()).some((order) => order.id === result.order?.id)).toBe(false)
    const attention = (await api.owner.getAttentionQueue()).filter((item) => item.orderId === result.order?.id)
    expect(attention).toHaveLength(1)
    expect(attention[0].type).toBe('ORDER_REVIEW')
  })

  it('synchronizes chef preparation, timing override and ready milestones', async () => {
    const before = await api.orders.getOrder('ORDER-ACTIVE-1384')
    await api.kds.startPrep(before.id)
    expect((await api.orders.getOrder(before.id)).fulfillmentStatus).toBe('PREPARING')

    const override = await api.kds.updatePrepTime(before.id, 28, 'Kitchen Load', 'Kitchen Tablet #1')
    const [customerOrder, ownerOrder, kdsOrder] = await Promise.all([
      api.orders.getOrder(before.id),
      api.owner.getOwnerOrders().then((orders) => orders.find((order) => order.id === before.id)),
      api.kds.getKitchenOrder(before.id),
    ])
    expect(customerOrder.promisedAt).not.toBe(before.promisedAt)
    expect(ownerOrder?.effectivePrepMinutes).toBe(28)
    expect(kdsOrder.effectivePrepMinutes).toBe(28)
    expect(override.customerNoticeNeeded).toBe(true)

    await api.kds.markReady(before.id)
    expect((await api.orders.getOrder(before.id)).fulfillmentStatus).toBe('READY')
    expect((await api.owner.getOwnerOrders()).find((order) => order.id === before.id)?.fulfillmentStatus).toBe('READY')
  })

  it('expires chef availability by DemoClock and revalidates customer cart data', async () => {
    await api.cart.addCartItem({ productId: 'PIZZA-CHK-001', modifiers: [
      { groupId: 'size', optionIds: ['medium'] }, { groupId: 'base', optionIds: ['normal'] },
      { groupId: 'sauce', optionIds: ['smoky-makhani'] }, { groupId: 'cheese', optionIds: ['extra-cheese'] },
      { groupId: 'spice', optionIds: ['spice-medium'] },
    ] })
    await api.kds.setKdsAvailability('extra-cheese', 'MODIFIER', 30, 'Ingredient unavailable')

    expect((await api.cart.quoteCart('DELIVERY')).availabilityIssues?.some((issue) => issue.entityId === 'extra-cheese')).toBe(true)
    expect((await api.owner.getOwnerAvailability()).find((row) => row.entityId === 'extra-cheese')).toMatchObject({ source: 'CHEF' })
    expect((await api.catalog.getProduct('PIZZA-CHK-001')).product.modifierGroups
      ?.find((group) => group.id === 'cheese')?.options.find((option) => option.id === 'extra-cheese')?.available).toBe(false)

    await api.demo.advanceTime(31)
    expect((await api.owner.getOwnerAvailability()).some((row) => row.entityId === 'extra-cheese')).toBe(false)
    expect((await api.catalog.getProduct('PIZZA-CHK-001')).product.modifierGroups
      ?.find((group) => group.id === 'cheese')?.options.find((option) => option.id === 'extra-cheese')?.available).toBe(true)
  })

  it('settles loyalty and CRM automatically exactly once on completion', async () => {
    const before = await db.customers.get('CUST001')
    const completed = await api.demo.completeActiveOrder()
    const [order, customer, wallet, notifications] = await Promise.all([
      api.orders.getOrder(completed.orderId), db.customers.get('CUST001'), api.loyalty.getLoyaltyWallet('CUST001'), api.customer.getNotifications(),
    ])

    expect(order.fulfillmentStatus).toBe('DELIVERED')
    expect(customer?.pointsPending).toBe(0)
    expect(customer?.pointsAvailable).toBeGreaterThan(before?.pointsAvailable ?? 0)
    expect(customer?.stats.lifetimeOrders).toBeGreaterThanOrEqual(before?.stats.lifetimeOrders ?? 0)
    expect(wallet.filter((entry) => entry.orderId === order.id && entry.type === 'EARN_AVAILABLE')).toHaveLength(1)
    expect(notifications.some((notification) => notification.orderId === order.id && notification.kind === 'POINTS')).toBe(true)

    const availableAfterFirstCompletion = customer?.pointsAvailable
    await expect(api.orders.completeOrder(order.id, 'DELIVERED')).resolves.toMatchObject({ fulfillmentStatus: 'DELIVERED' })
    expect((await db.customers.get('CUST001'))?.pointsAvailable).toBe(availableAfterFirstCompletion)
  })

  it('automates owner rejection through refund, point reversal, chat and attention resolution', async () => {
    const conversation = await api.chat.createConversation('CUST001')
    await api.demo.setKitchenLoad(100)
    const { payment } = await preparePayment()
    const paid = await api.payment.confirmPaymentDemo(payment.id)
    const pendingBeforeReject = (await db.customers.get('CUST001'))!.pointsPending

    const rejected = await api.owner.rejectOwnerOrder(paid.order!.id, 'Kitchen load is unsafe')
    expect(rejected.order.refundStatus).toBe('REQUESTED')
    expect((await api.chat.getConversationDetail(conversation.id)).messages.some((message) => message.text.includes('Refund started'))).toBe(true)

    await api.demo.advanceTime(1)
    const [refund] = await api.refund.getRefunds(paid.order!.id)
    const customer = await db.customers.get('CUST001')
    const unresolved = (await api.owner.getAttentionQueue()).filter((item) => item.orderId === paid.order!.id)
    const messages = await api.chat.getConversationDetail(conversation.id)
    expect(refund.status).toBe('SUCCESS')
    expect((await api.orders.getOrder(paid.order!.id)).refundStatus).toBe('SUCCESS')
    expect(customer?.pointsPending).toBeLessThan(pendingBeforeReject)
    expect(unresolved).toHaveLength(0)
    expect(messages.messages.some((message) => message.text.includes('refund') && message.text.includes('complete'))).toBe(true)
  })

  it('restores redeemed points when a paid order is rejected and fully refunded', async () => {
    await api.demo.setKitchenLoad(100)
    const before = (await db.customers.get('CUST001'))!
    const { payment } = await preparePayment('DELIVERY', undefined, 50)
    const paid = await api.payment.confirmPaymentDemo(payment.id)
    const afterPayment = (await db.customers.get('CUST001'))!
    expect(afterPayment.pointsAvailable).toBeLessThan(before.pointsAvailable)

    await api.owner.rejectOwnerOrder(paid.order!.id, 'Kitchen load is unsafe')
    await api.demo.advanceTime(1)
    const afterRefund = (await db.customers.get('CUST001'))!
    const wallet = await api.loyalty.getLoyaltyWallet('CUST001')
    expect(afterRefund.pointsAvailable).toBe(before.pointsAvailable)
    expect(wallet).toEqual(expect.arrayContaining([
      expect.objectContaining({ orderId: paid.order!.id, type: 'REDEEM', points: expect.any(Number) }),
      expect.objectContaining({ orderId: paid.order!.id, type: 'REVERSAL', status: 'AVAILABLE', points: expect.any(Number) }),
    ]))
  })

  it('answers track, wallet, availability and refund chat intents from current backend data', async () => {
    const conversation = await api.chat.createConversation('CUST001')
    const tracked = await api.chat.sendIntent(conversation.id, 'TRACK_ORDER', 'Track order')
    const wallet = await api.chat.sendIntent(conversation.id, 'LOYALTY_HELP', 'Points')
    await api.availability.setOwnerAvailability('SHAKE-001', 'PRODUCT', false, 'Sold out')
    const menu = await api.chat.sendIntent(conversation.id, 'PRODUCT_QUESTION', 'What is available?')

    expect((await api.orders.getOrders('CUST001')).some((order) => tracked.reply.text.includes(order.publicOrderNumber))).toBe(true)
    expect(wallet.reply.text).toContain('182 points available')
    expect(menu.reply.text).toContain('Oreo Thick Shake')

    await api.owner.rejectOwnerOrder('ORDER-REVIEW-1382', 'Capacity')
    const refund = await api.chat.sendIntent(conversation.id, 'REFUND_STATUS', 'Refund')
    expect(refund.reply.text).toContain('requested')
  })

  it('uses a scheduled pickup slot when producing the server ETA', async () => {
    await api.demo.setKitchenLoad(25)
    const options = await api.checkout.getCheckoutOptions('PICKUP')
    const slot = options.pickupSlots.at(-1)!
    const { payment } = await preparePayment('PICKUP', slot)
    const result = await api.payment.confirmPaymentDemo(payment.id)

    expect(result.order).toMatchObject({ fulfillmentType: 'PICKUP', acceptanceStatus: 'ACCEPTED' })
    expect(result.order?.promisedAt).toBeDefined()
    expect(new Date(result.order!.promisedAt!).getTime()).toBeGreaterThan(Date.now())
  })

  it('emits the shared event sequence needed by the realtime invalidation layer', async () => {
    const events: string[] = []
    const unsubscribe = eventBus.subscribe((event) => events.push(event.type))
    await api.kds.startPrep('ORDER-ACTIVE-1384')
    await api.kds.updatePrepTime('ORDER-ACTIVE-1384', 23, 'Kitchen Load')
    await api.kds.markReady('ORDER-ACTIVE-1384')
    unsubscribe()

    expect(events).toEqual(expect.arrayContaining(['PREP_STARTED', 'PREP_TIME_OVERRIDDEN', 'ORDER_READY']))
  })
})
