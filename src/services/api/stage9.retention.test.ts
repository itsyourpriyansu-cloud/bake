import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import type { Order } from '../../domain/orders/order.types'
import { db } from '../../prototype/database/db'
import { resetDemoDatabase } from '../../prototype/demo/reset-demo'
import { completeOrderFulfillment } from '../../prototype/msw/handlers/_fulfillmentCompletion'
import { server } from '../../prototype/msw/server'
import { api, apiClient } from './index'

const originalBaseUrl = apiClient.defaults.baseURL
beforeAll(() => { apiClient.defaults.baseURL = 'http://pizza-wave.test/api/v1'; server.listen({ onUnhandledRequest: 'error' }) })
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseUrl })
beforeEach(async () => { server.resetHandlers(); await resetDemoDatabase() })

describe('Stage 9 retention platform', () => {
  it('serves all eight typed CRM opportunities and previews the example economics', async () => {
    const opportunities = await api.owner.getOwnerOpportunities()
    expect(opportunities).toHaveLength(8)
    const inactive = opportunities.find((row) => row.segment === 'INACTIVE_14_30_DAYS')!
    expect(inactive).toMatchObject({ title: 'Inactive Pizza Lovers', customerCount: 81, offer: '2X Wave Points' })
    const preview = await api.owner.previewOwnerCampaign({ opportunityId: inactive.id, channel: 'WHATSAPP_SIM', timing: 'TONIGHT_7PM', offer: inactive.offer, message: inactive.message })
    expect(preview).toMatchObject({ estimatedAudience: 81, demoOnly: true })
    expect(preview.estimatedCost).toBeGreaterThan(0)
  })

  it('writes In-App and WhatsApp simulations into the same conversation history', async () => {
    const conversation = (await api.chat.getConversations('CUST001'))[0]
    const inactive = (await api.owner.getOwnerOpportunities()).find((row) => row.segment === 'INACTIVE_14_30_DAYS')!
    await api.owner.simulateOwnerCampaign({ opportunityId: inactive.id, channel: 'WHATSAPP_SIM', timing: 'NOW', offer: inactive.offer, message: inactive.message })
    await api.owner.simulateOwnerCampaign({ opportunityId: inactive.id, channel: 'IN_APP', timing: 'NOW', offer: inactive.offer, message: inactive.message })
    const detail = await api.chat.getConversationDetail(conversation.id)
    expect(new Set(detail.messages.filter((row) => row.messageType === 'CAMPAIGN').map((row) => row.channel))).toEqual(new Set(['WHATSAPP_SIM', 'PWA_CHAT']))
    expect(await db.conversations.where('customerId').equals('CUST001').count()).toBe(1)
  })

  it('renders every documented WhatsApp message type from current demo facts', async () => {
    const types = ['ORDER_CONFIRMATION', 'DELAY', 'READY_FOR_PICKUP', 'ON_THE_WAY', 'POINTS_EARNED', 'BIRTHDAY', 'REORDER', 'REFUND', 'SUPPORT'] as const
    const results = await Promise.all(types.map((type) => api.owner.simulateOwnerWhatsApp(type)))
    expect(results.map((row) => row.messageType)).toEqual(types)
    expect(results.every((row) => row.channel === 'WHATSAPP_SIM' && row.demoOnly)).toBe(true)
    expect(new Set(results.map((row) => row.conversationId)).size).toBe(1)
  })

  it('keeps signup unrewarded and only credits the qualified transition', async () => {
    const before = (await db.customers.get('CUST001'))!.pointsAvailable
    const pending = await api.retention.advanceReferral('REF-SIGNED')
    expect(pending).toMatchObject({ status: 'FIRST_ORDER_PENDING', rewardPoints: 0 })
    expect((await db.customers.get('CUST001'))!.pointsAvailable).toBe(before)
    const rewarded = await api.retention.advanceReferral('REF-QUALIFIED')
    expect(rewarded).toMatchObject({ status: 'REWARDED', rewardPoints: 60 })
    expect((await db.customers.get('CUST001'))!.pointsAvailable).toBe(before + 60)
  })

  it('simulates T-7 through birthday with DemoClock and one WhatsApp thread', async () => {
    for (const stage of ['T_MINUS_7', 'T_MINUS_3', 'T_MINUS_1', 'BIRTHDAY'] as const) await api.retention.simulateCelebrationStage(stage)
    const automation = await api.retention.getCelebrationAutomation()
    expect(automation.touchpoints.every((row) => row.sent)).toBe(true)
    const conversation = (await api.chat.getConversations('CUST001'))[0]
    const messages = (await api.chat.getConversationDetail(conversation.id)).messages.filter((row) => row.messageType === 'BIRTHDAY')
    expect(messages).toHaveLength(4)
    expect(messages.every((row) => row.channel === 'WHATSAPP_SIM')).toBe(true)
  })

  it('creates the second-order loop and referral reward from first fulfillment completion', async () => {
    const template = (await db.orders.get('ORDER-ACTIVE-1384'))!
    const order: Order = { ...template, id: 'ORDER-ANANYA-FIRST', publicOrderNumber: 'PW2001', customerId: 'CUST002', fulfillmentStatus: 'DISPATCHED', createdAt: '2026-09-13T10:00:00.000Z' }
    await db.orders.put(order)
    const pointsBefore = (await db.customers.get('CUST001'))!.pointsAvailable
    await completeOrderFulfillment(order, 'DELIVERED')
    expect((await db.config.get('secondOrderLoop:CUST002'))?.value).toMatchObject({ campaignScheduled: true })
    expect(await db.referrals.get('REF-PENDING')).toMatchObject({ status: 'REWARDED', rewardPoints: 60 })
    expect((await db.customers.get('CUST001'))!.pointsAvailable).toBe(pointsBefore + 60)
  })

  it('returns deterministic non-AI personalization from existing preferences', async () => {
    const summary = await api.retention.getRetentionSummary()
    expect(summary).toMatchObject({ favouriteCategory: 'Pizza', method: 'RULE_BASED', savedOrderName: 'My Usual' })
    expect(summary.usualProductIds).toEqual(['PIZZA-PANEER-001', 'COFFEE-001'])
    expect(summary.recommendedProductIds).not.toContain('PIZZA-CHK-001')
    expect(summary.recommendedProductIds).not.toContain('PIZZA-MUSH-001')
  })
})
