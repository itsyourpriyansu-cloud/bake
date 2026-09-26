import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../prototype/database/db'
import { resetDemoDatabase } from '../../prototype/demo/reset-demo'
import { server } from '../../prototype/msw/server'
import { api, apiClient } from './index'

const originalBaseUrl = apiClient.defaults.baseURL
beforeAll(() => { apiClient.defaults.baseURL = 'http://pizza-wave.test/api/v1'; server.listen({ onUnhandledRequest: 'error' }) })
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseUrl })
beforeEach(async () => { server.resetHandlers(); await resetDemoDatabase() })

describe('Stage 7 three-screen Chef KDS flow', () => {
  it('uses an isolated shift realm and returns only kitchen-shaped queue data', async () => {
    const session = await api.auth.kdsLogin('2580')
    const queue = await api.kds.getKitchenQueue()
    const pw1384 = queue.find((order) => order.publicOrderNumber === 'PW1384')
    expect(session).toMatchObject({ realm: 'KDS', device: 'Kitchen Tablet #1' })
    expect(pw1384).toMatchObject({ queueSection: 'START_NOW', systemPrepMinutes: 18, effectivePrepMinutes: 18 })
    expect(pw1384?.items.map((item) => [item.quantity, item.name])).toEqual([[2, 'Chicken Tikka Pizza'], [1, 'Peri Peri Fries']])
    expect(pw1384).not.toHaveProperty('customerId')
    expect(pw1384).not.toHaveProperty('financialSnapshot')
    expect(pw1384).not.toHaveProperty('refundStatus')
  })

  it('starts, overrides and marks PW1384 ready through the existing domain engine', async () => {
    const before = await api.orders.getOrder('ORDER-ACTIVE-1384')
    const started = await api.kds.startPrep(before.id)
    expect(started.fulfillmentStatus).toBe('PREPARING')
    const changed = await api.kds.updatePrepTime(before.id, 28, 'Kitchen Load', 'Kitchen Tablet #1')
    expect(changed.order.effectivePrepMinutes).toBe(28)
    expect(changed.customerNoticeNeeded).toBe(true)
    const customerOrder = await api.orders.getOrder(before.id)
    expect(customerOrder.promisedAt).not.toBe(before.promisedAt)
    expect((await api.owner.getOwnerOrders()).find((order) => order.id === before.id)?.effectivePrepMinutes).toBe(28)
    const ready = await api.kds.markReady(before.id)
    expect(ready.fulfillmentStatus).toBe('READY')
    expect((await db.orderEvents.where('orderId').equals(before.id).toArray()).map((event) => event.type)).toContain('ORDER_READY')
    expect(await db.auditLogs.where('entityId').equals(before.id).count()).toBeGreaterThan(0)
  })

  it('temporarily disables Mushroom for customer/cart/owner views and preserves owner authority', async () => {
    await api.cart.addCartItem({ productId: 'PIZZA-MUSH-001', modifiers: [
      { groupId: 'size', optionIds: ['regular'] }, { groupId: 'base', optionIds: ['normal'] },
      { groupId: 'sauce', optionIds: ['classic-tomato'] }, { groupId: 'cheese', optionIds: ['regular-cheese'] },
      { groupId: 'toppings', optionIds: ['mushroom'] }, { groupId: 'spice', optionIds: ['spice-mild'] },
    ] })
    await api.kds.setKdsAvailability('mushroom', 'MODIFIER', 60, 'Ingredient unavailable')
    expect((await api.kds.getKdsAvailability()).find((item) => item.entityId === 'mushroom')).toMatchObject({ effectiveStatus: 'CHEF_TEMP_UNAVAILABLE', source: 'CHEF' })
    expect((await api.cart.quoteCart('DELIVERY')).availabilityIssues?.[0]).toMatchObject({ entityId: 'mushroom', kind: 'MODIFIER' })
    expect((await api.owner.getOwnerAvailability()).find((item) => item.entityId === 'mushroom')).toMatchObject({ source: 'CHEF' })

    await api.availability.setOwnerAvailability('olives', 'MODIFIER', false, 'Owner policy')
    expect((await api.kds.getKdsAvailability()).find((item) => item.entityId === 'olives')).toMatchObject({ effectiveStatus: 'OWNER_DISABLED', locked: true })
    await expect(api.kds.setKdsAvailability('olives', 'MODIFIER', 30)).rejects.toMatchObject({ response: { status: 423 } })
  })

  it('creates Founder Attention only for severe kitchen problems and for an offline heartbeat', async () => {
    await api.kds.reportKitchenProblem('ORDER-ACTIVE-1384', 'INGREDIENT_UNAVAILABLE', 'Mushroom tray empty')
    expect((await api.owner.getAttentionQueue()).filter((item) => item.orderId === 'ORDER-ACTIVE-1384')).toHaveLength(1)
    const severe = await api.kds.reportKitchenProblem('ORDER-ACTIVE-1384', 'EQUIPMENT_ISSUE', 'Pizza oven recovery')
    expect(severe.attentionCreated).toBe(true)
    await api.kds.setKdsOnline(false)
    expect((await api.owner.getOwnerDashboard()).store.kdsOnline).toBe(false)
    expect((await api.owner.getAttentionQueue()).some((item) => item.type === 'KDS_OFFLINE')).toBe(true)
  })
})
