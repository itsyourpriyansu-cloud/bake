import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../prototype/database/db'
import { resetDemoDatabase } from '../../prototype/demo/reset-demo'
import { server } from '../../prototype/msw/server'
import { api, apiClient } from './index'

const originalBaseUrl = apiClient.defaults.baseURL
beforeAll(() => { apiClient.defaults.baseURL = 'http://pizza-wave.test/api/v1'; server.listen({ onUnhandledRequest: 'error' }) })
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseUrl })
beforeEach(async () => { server.resetHandlers(); await resetDemoDatabase(); await api.auth.verifyCustomerOtp('9876543210', '123456') })

describe('Stage 5 customer API flow', () => {
  it('loads the canonical active order, events and backend-shaped tier progress', async () => {
    const [orders, events, loyalty] = await Promise.all([api.orders.getOrders('CUST001'), api.orders.getOrderEvents('ORDER-ACTIVE-1384'), api.loyalty.getLoyalty()])
    expect(orders.find((order) => order.id === 'ORDER-ACTIVE-1384')?.publicOrderNumber).toBe('PW1384')
    expect(events.map((event) => event.type)).toContain('PREP_DUE')
    expect(loyalty.progress).toMatchObject({ currentOrders: 8, targetOrders: 10, currentSpend: 3620, targetSpend: 4500, ordersPercent: 80 })
  })

  it('settles the active order points once when the demo reaches delivery', async () => {
    await api.kds.startPrep('ORDER-ACTIVE-1384')
    await api.orders.advanceDemoOrder('ORDER-ACTIVE-1384')
    await api.orders.advanceDemoOrder('ORDER-ACTIVE-1384')
    const delivered = await api.orders.advanceDemoOrder('ORDER-ACTIVE-1384')
    const customer = await db.customers.get('CUST001')
    expect(delivered.fulfillmentStatus).toBe('DELIVERED')
    expect(customer?.pointsAvailable).toBe(206)
    expect(customer?.pointsPending).toBe(0)
    expect((await db.loyaltyTransactions.where('orderId').equals('ORDER-ACTIVE-1384').toArray()).filter((tx) => tx.type === 'EARN_AVAILABLE')).toHaveLength(1)
  })

  it('revalidates price changes before touching the cart', async () => {
    await db.products.update('PIZZA-VEG-001', { basePrice: 125 })
    const review = await api.orders.reorder('ORDER-HIST-001')
    expect(review.status).toBe('REVIEW_REQUIRED')
    expect(review.changes.some((change) => change.kind === 'PRICE')).toBe(true)
    expect(await db.cartItems.count()).toBe(0)
    const accepted = await api.orders.reorder('ORDER-HIST-001', true)
    expect(accepted.status).toBe('ADDED')
    expect(await db.cartItems.count()).toBe(2)
  })

  it('persists saved-order/profile data and issues a short-lived phone-free Wave ID', async () => {
    const saved = await api.customer.getSavedOrders()
    await api.customer.renameSavedOrder(saved[0].id, 'Friday Usual')
    expect((await api.customer.getSavedOrders())[0].name).toBe('Friday Usual')
    const token = await api.customer.createWaveId()
    expect(token.token).not.toContain('9876543210')
    expect(new Date(token.expiresAt).getTime() - new Date(token.issuedAt).getTime()).toBe(60_000)
  })

  it('stores guided support messages in one conversation', async () => {
    const conversation = await api.chat.createConversation()
    const response = await api.chat.sendIntent(conversation.id, 'TRACK_ORDER', 'TRACK MY ORDER')
    const detail = await api.chat.getConversationDetail(conversation.id)
    const customerOrderNumbers = (await api.orders.getOrders('CUST001')).map((order) => order.publicOrderNumber)
    expect(customerOrderNumbers.some((number) => response.reply.text.includes(number))).toBe(true)
    expect(detail.messages.some((message) => message.from === 'CUSTOMER')).toBe(true)
  })
})
