import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
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
})

async function createCheckoutPayment(fulfillmentType: 'DELIVERY' | 'PICKUP', productId = 'FRIES-001') {
  await api.auth.verifyCustomerOtp('9876543210', '123456')
  await api.cart.addCartItem(productId)
  const options = await api.checkout.getCheckoutOptions(fulfillmentType)
  const checkout = await api.checkout.createCheckoutSession({
    fulfillmentType,
    phone: options.customer.phone,
    addressSnapshot: fulfillmentType === 'DELIVERY' ? options.customer.defaultAddress : undefined,
    pickupSlot: fulfillmentType === 'PICKUP' ? options.pickupSlots[0] : undefined,
  })
  const intent = await api.checkout.createOrderIntent(checkout.id)
  const initiated = await api.payment.initiatePayment(intent.id)
  return { options, intent, payment: initiated.payment }
}

describe('Final pitch end-to-end reliability', () => {
  it('runs Delivery from OTP and customization through Owner, KDS, ETA and loyalty settlement', async () => {
    const otp = await api.auth.requestCustomerOtp('9876543210')
    expect(otp.requestId).toBeTruthy()
    await expect(api.auth.verifyCustomerOtp('9876543210', '123456')).resolves.toMatchObject({ realm: 'CUSTOMER', customerId: 'CUST001' })

    await api.cart.addCartItem({
      productId: 'PIZZA-MUSH-001',
      modifiers: [
        { groupId: 'size', optionIds: ['regular'] }, { groupId: 'base', optionIds: ['normal'] },
        { groupId: 'sauce', optionIds: ['classic-tomato'] }, { groupId: 'cheese', optionIds: ['regular-cheese'] },
        { groupId: 'toppings', optionIds: ['mushroom'] }, { groupId: 'spice', optionIds: ['spice-mild'] },
      ],
    })
    expect((await api.cart.quoteCart('DELIVERY')).valid).toBe(true)
    await api.demo.setKitchenLoad(100)
    const options = await api.checkout.getCheckoutOptions('DELIVERY')
    const checkout = await api.checkout.createCheckoutSession({ fulfillmentType: 'DELIVERY', phone: options.customer.phone, addressSnapshot: options.customer.defaultAddress })
    const intent = await api.checkout.createOrderIntent(checkout.id)
    const initiated = await api.payment.initiatePayment(intent.id)
    const paid = await api.payment.confirmPaymentDemo(initiated.payment.id)
    expect(paid.order).toMatchObject({ paymentStatus: 'CONFIRMED', acceptanceStatus: 'REVIEW_REQUIRED', fulfillmentStatus: 'NOT_STARTED' })
    expect((await api.kds.getKitchenQueue()).some((row) => row.id === paid.order!.id)).toBe(false)

    const accepted = await api.owner.acceptOwnerOrder(paid.order!.id)
    expect(accepted).toMatchObject({ acceptanceStatus: 'ACCEPTED', fulfillmentStatus: 'SCHEDULED' })
    expect((await api.kds.getKitchenQueue()).some((row) => row.id === accepted.id)).toBe(true)
    const beforeEta = accepted.promisedAt
    const started = await api.kds.startPrep(accepted.id)
    const override = await api.kds.updatePrepTime(accepted.id, started.effectivePrepMinutes + 10, 'Kitchen Load', 'Kitchen Tablet #1')
    expect(override.customerNoticeNeeded).toBe(true)
    expect((await api.orders.getOrder(accepted.id)).promisedAt).not.toBe(beforeEta)
    await api.kds.markReady(accepted.id)
    expect((await api.orders.getOrder(accepted.id)).fulfillmentStatus).toBe('READY')

    const customerBefore = (await db.customers.get('CUST001'))!
    expect(customerBefore.pointsPending).toBeGreaterThan(0)
    expect((await api.orders.advanceDemoOrder(accepted.id)).fulfillmentStatus).toBe('DISPATCHED')
    expect((await api.orders.advanceDemoOrder(accepted.id)).fulfillmentStatus).toBe('DELIVERED')
    const customerAfter = (await db.customers.get('CUST001'))!
    expect(customerAfter.pointsPending).toBeLessThan(customerBefore.pointsPending)
    expect(customerAfter.pointsAvailable).toBeGreaterThan(customerBefore.pointsAvailable)
  })

  it('runs Pickup through its generated slot, KDS and loyalty settlement', async () => {
    await api.demo.setKitchenLoad(25)
    const before = (await db.customers.get('CUST001'))!
    const { options, payment } = await createCheckoutPayment('PICKUP', 'BURGER-001')
    expect(options.pickupSlots.length).toBeGreaterThan(0)
    const paid = await api.payment.confirmPaymentDemo(payment.id)
    expect(paid.order).toMatchObject({ fulfillmentType: 'PICKUP', acceptanceStatus: 'ACCEPTED', fulfillmentStatus: 'SCHEDULED' })
    expect(paid.order?.promisedAt).toBeDefined()
    await api.kds.startPrep(paid.order!.id)
    await api.kds.markReady(paid.order!.id)
    expect((await api.orders.advanceDemoOrder(paid.order!.id)).fulfillmentStatus).toBe('PICKED_UP')
    const after = (await db.customers.get('CUST001'))!
    expect(after.pointsAvailable).toBeGreaterThan(before.pointsAvailable)
    expect(after.pointsPending).toBeLessThanOrEqual(before.pointsPending)
  })

  it('keeps a reviewed rejection out of KDS and completes its automated refund', async () => {
    await api.demo.setKitchenLoad(100)
    const { payment } = await createCheckoutPayment('DELIVERY')
    const paid = await api.payment.confirmPaymentDemo(payment.id)
    expect(paid.order?.acceptanceStatus).toBe('REVIEW_REQUIRED')
    const rejected = await api.owner.rejectOwnerOrder(paid.order!.id, 'Kitchen load is unsafe')
    expect(rejected.order).toMatchObject({ acceptanceStatus: 'REJECTED', fulfillmentStatus: 'CANCELLED', refundStatus: 'REQUESTED' })
    expect((await api.kds.getKitchenQueue()).some((row) => row.id === rejected.order.id)).toBe(false)
    await api.demo.advanceTime(1)
    expect((await api.refund.getRefunds(rejected.order.id))[0]).toMatchObject({ status: 'SUCCESS' })
    expect((await api.customer.getNotifications()).some((row) => row.orderId === rejected.order.id && row.title.includes('Refund'))).toBe(true)
  })

  it('preserves the cart and creates no order or KDS ticket after payment failure', async () => {
    const { intent, payment } = await createCheckoutPayment('DELIVERY', 'COFFEE-001')
    const countBefore = await db.cartItems.count()
    await api.payment.failPaymentDemo(payment.id)
    expect(await db.cartItems.count()).toBe(countBefore)
    expect(await db.orders.where('orderIntentId').equals(intent.id).count()).toBe(0)
    expect((await api.kds.getKitchenQueue()).some((row) => row.id === intent.id)).toBe(false)
  })

  it('propagates temporary and permanent availability authority across all surfaces', async () => {
    await api.cart.addCartItem({
      productId: 'PIZZA-MUSH-001',
      modifiers: [
        { groupId: 'size', optionIds: ['regular'] }, { groupId: 'base', optionIds: ['normal'] },
        { groupId: 'sauce', optionIds: ['classic-tomato'] }, { groupId: 'cheese', optionIds: ['regular-cheese'] },
        { groupId: 'toppings', optionIds: ['mushroom'] }, { groupId: 'spice', optionIds: ['spice-mild'] },
      ],
    })
    await api.kds.setKdsAvailability('mushroom', 'MODIFIER', 60, 'Ingredient unavailable')
    expect((await api.cart.quoteCart('DELIVERY')).availabilityIssues?.some((row) => row.entityId === 'mushroom')).toBe(true)
    expect((await api.owner.getOwnerAvailability()).find((row) => row.entityId === 'mushroom')).toMatchObject({ source: 'CHEF' })
    expect((await api.catalog.getProduct('PIZZA-MUSH-001')).product.modifierGroups?.flatMap((group) => group.options).find((option) => option.id === 'mushroom')?.available).toBe(false)

    await api.availability.setOwnerAvailability('mushroom', 'MODIFIER', false, 'Owner policy')
    expect((await api.kds.getKdsAvailability()).find((row) => row.entityId === 'mushroom')).toMatchObject({ effectiveStatus: 'OWNER_DISABLED', locked: true })
    await expect(api.kds.clearKdsAvailability('mushroom')).rejects.toMatchObject({ response: { status: 423 } })
  })

  it('resolves a short-lived Wave ID into Priyanshu and keeps store points in one wallet', async () => {
    const token = await api.customer.createWaveId()
    const scanned = await api.loyalty.getByWaveId(token.token)
    expect(scanned).toMatchObject({ id: 'CUST001', firstName: 'Priyanshu', tier: 'GOLD', pointsAvailable: 182 })
    const before = (await db.customers.get('CUST001'))!
    const storeOrder = await api.owner.createOwnerStoreOrder({ customerMode: 'WAVE_ID', customerId: scanned.id, productId: 'PIZZA-PANEER-001', quantity: 1 })
    expect(storeOrder).toMatchObject({ paymentStatus: 'CONFIRMED', demoOnly: true })
    expect(storeOrder.order).toMatchObject({ source: 'STORE_ASSISTED', customerId: 'CUST001' })
    if (storeOrder.order.acceptanceStatus === 'REVIEW_REQUIRED') await api.owner.acceptOwnerOrder(storeOrder.order.id)
    await api.kds.startPrep(storeOrder.order.id)
    await api.kds.markReady(storeOrder.order.id)
    await api.orders.completeOrder(storeOrder.order.id, 'STORE_COMPLETED')
    const after = (await db.customers.get('CUST001'))!
    expect(after.pointsAvailable).toBeGreaterThan(before.pointsAvailable)
    expect((await api.loyalty.getLoyaltyWallet('CUST001')).some((row) => row.orderId === storeOrder.order.id && row.status === 'AVAILABLE')).toBe(true)
  })

  it('updates the shared customer thread when the founder refunds a missing item', async () => {
    const support = (await api.owner.getOwnerSupport()).find((row) => row.supportCase.category === 'MISSING_ITEM')!
    const result = await api.owner.runOwnerSupportAction(support.supportCase.id, { action: 'REFUND_ITEM', amount: 129, message: 'Your missing item has been refunded.' })
    expect(result.refund).toMatchObject({ status: 'SUCCESS', amount: 129 })
    expect(result.support.supportCase.status).toBe('RESOLVED')
    const thread = await api.chat.getConversationDetail(support.supportCase.conversationId!)
    expect(thread.messages.some((row) => row.from === 'OWNER' && row.text.includes('refunded'))).toBe(true)
    expect(eventBus.recent().some((event) => event.type === 'CONVERSATION_UPDATED')).toBe(true)
  })

  it('defines a customer-only installable shell and a pitch environment without visible tooling', () => {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'public/app.webmanifest'), 'utf8')) as { start_url: string; scope: string; icons: unknown[] }
    const worker = readFileSync(join(process.cwd(), 'src/services/pwa/sw.ts'), 'utf8')
    const pitchEnv = readFileSync(join(process.cwd(), '.env.pitch'), 'utf8')
    expect(manifest).toMatchObject({ start_url: '/app/', scope: '/app/' })
    expect(manifest.icons).toHaveLength(2)
    expect(worker).toContain("!url.startsWith('/api/')")
    expect(worker).toContain("url.pathname.startsWith('/app/')")
    expect(worker).not.toContain("url.pathname.startsWith('/owner')")
    expect(worker).not.toContain("url.pathname.startsWith('/kds')")
    expect(pitchEnv).toContain('VITE_PITCH_MODE=true')
    expect(pitchEnv).toContain('VITE_ENABLE_DEMO_TOOLS=false')
  })
})
