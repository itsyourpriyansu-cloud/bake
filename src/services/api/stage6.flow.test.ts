import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../prototype/database/db'
import { resetDemoDatabase } from '../../prototype/demo/reset-demo'
import { server } from '../../prototype/msw/server'
import { api, apiClient } from './index'

const originalBaseUrl = apiClient.defaults.baseURL
beforeAll(() => { apiClient.defaults.baseURL = 'http://pizza-wave.test/api/v1'; server.listen({ onUnhandledRequest: 'error' }) })
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseUrl })
beforeEach(async () => { server.resetHandlers(); await resetDemoDatabase() })

describe('Stage 6 founder control center API flow', () => {
  it('authenticates only the isolated owner realm and loads the business snapshot', async () => {
    const session = await api.auth.ownerLogin('owner@pizzawave.demo', 'PizzaWave@123', '654321')
    const dashboard = await api.owner.getOwnerDashboard()
    expect(session.realm).toBe('OWNER')
    expect(session).not.toHaveProperty('customerId')
    expect(dashboard.store.acceptanceMode).toBe('HYBRID')
    expect(dashboard.live.awaitingReview).toBe(1)
    expect(dashboard.kitchen.loadPercent).toBe(94)
  })

  it('accepts the exact paid review and schedules it for kitchen visibility', async () => {
    const accepted = await api.owner.acceptOwnerOrder('ORDER-REVIEW-1382')
    expect(accepted.publicOrderNumber).toBe('PW1382')
    expect(accepted.acceptanceStatus).toBe('ACCEPTED')
    expect(accepted.fulfillmentStatus).toBe('SCHEDULED')
    expect((await api.owner.getAttentionQueue()).some((item) => item.orderId === accepted.id)).toBe(false)
  })

  it('rejects a paid review without creating a kitchen order and begins a refund', async () => {
    const result = await api.owner.rejectOwnerOrder('ORDER-REVIEW-1382', 'Kitchen cannot protect the promise')
    expect(result.order.acceptanceStatus).toBe('REJECTED')
    expect(result.order.fulfillmentStatus).toBe('CANCELLED')
    expect(result.refund.status).toBe('REQUESTED')
  })

  it('searches Customer 360 and records audited goodwill without assigning tier', async () => {
    expect((await api.owner.searchOwnerCustomers('PW1382'))[0].id).toBe('CUST001')
    const beforeAdjustment = await api.owner.getOwnerCustomer360('CUST001')
    expect(beforeAdjustment.pointsExpiring).toBeLessThanOrEqual(beforeAdjustment.customer.pointsAvailable)
    const updated = await api.owner.adjustOwnerCustomerPoints('CUST001', { direction: 'ADD', amount: 25, reason: 'Service recovery', note: 'Founder reviewed' })
    expect(updated.customer.pointsAvailable).toBe(207)
    expect(updated.customer.tier).toBe('GOLD')
    expect(await db.auditLogs.where('entityId').equals('CUST001').count()).toBe(1)
  })

  it('handles an item refund and creates a paid store order through server-shaped state', async () => {
    const support = (await api.owner.getOwnerSupport())[0]
    const resolved = await api.owner.runOwnerSupportAction(support.supportCase.id, { action: 'REFUND_ITEM', amount: 129, message: 'Refunded the missing item.' })
    expect(resolved.refund?.status).toBe('SUCCESS')
    expect(resolved.support.supportCase.status).toBe('RESOLVED')

    const storeOrder = await api.owner.createOwnerStoreOrder({ customerMode: 'PHONE_OTP', customerId: 'CUST001', phone: '9876543210', otp: '123456', productId: 'PIZZA-PANEER-001', quantity: 1 })
    expect(storeOrder.paymentStatus).toBe('CONFIRMED')
    expect(storeOrder.order.source).toBe('STORE_ASSISTED')
    expect(await db.orderIntents.get(storeOrder.order.orderIntentId)).toBeTruthy()
    expect(await db.payments.get(storeOrder.order.paymentId)).toMatchObject({ status: 'CONFIRMED' })
  })
})
