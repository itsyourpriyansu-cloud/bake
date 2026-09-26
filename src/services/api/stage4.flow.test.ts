import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../prototype/database/db'
import { resetDemoDatabase } from '../../prototype/demo/reset-demo'
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

async function preparePayment() {
  await api.cart.addCartItem('PIZZA-VEG-001')
  const options = await api.checkout.getCheckoutOptions('DELIVERY')
  const checkout = await api.checkout.createCheckoutSession({
    fulfillmentType: 'DELIVERY', phone: options.customer.phone,
    addressSnapshot: options.customer.defaultAddress,
  })
  const intent = await api.checkout.createOrderIntent(checkout.id)
  const initiated = await api.payment.initiatePayment(intent.id)
  return { intent, payment: initiated.payment }
}

describe('Stage 4 customer API flow', () => {
  it('keeps personal rewards private and ignores redemption after logout', async () => {
    await api.auth.logoutCustomer()
    await api.cart.addCartItem('PIZZA-VEG-001')
    await expect(api.loyalty.getLoyalty()).rejects.toMatchObject({ response: { status: 401 } })
    const quote = await api.cart.quoteCart('PICKUP', 50)
    expect(quote.pointsRedeemed).toBe(0)
    expect(quote.discount).toBe(0)
  })

  it('loads a newly initiated payment through the typed status contract', async () => {
    const { payment } = await preparePayment()
    const result = await api.payment.getPaymentStatus(payment.id)
    expect(result.payment.status).toBe('PENDING')
    expect(result.order).toBeUndefined()
  })

  it('creates exactly one automatically accepted order after safe backend success', async () => {
    const { intent, payment } = await preparePayment()
    expect(await db.orders.where('orderIntentId').equals(intent.id).count()).toBe(0)

    const result = await api.payment.confirmPaymentDemo(payment.id)
    expect(result.payment.status).toBe('CONFIRMED')
    expect(result.order?.acceptanceStatus).toBe('ACCEPTED')
    expect(result.order?.fulfillmentStatus).toBe('SCHEDULED')
    expect(await db.cartItems.count()).toBe(0)
  })

  it('keeps the cart and creates no order after payment failure', async () => {
    const { intent, payment } = await preparePayment()
    const result = await api.payment.failPaymentDemo(payment.id)
    expect(result.payment.status).toBe('FAILED')
    expect(await db.cartItems.count()).toBe(1)
    expect(await db.orders.where('orderIntentId').equals(intent.id).count()).toBe(0)
  })

  it('keeps pending payments in a distinct reconciliation state', async () => {
    const { intent, payment } = await preparePayment()
    const result = await api.payment.keepPaymentPendingDemo(payment.id)
    expect(result.payment.status).toBe('RECONCILING')
    expect(await db.cartItems.count()).toBe(1)
    expect(await db.orders.where('orderIntentId').equals(intent.id).count()).toBe(0)
  })
})
