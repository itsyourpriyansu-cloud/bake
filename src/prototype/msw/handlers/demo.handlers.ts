import { http } from 'msw'
import { db } from '../../database/db'
import { resetDemoDatabase } from '../../demo/reset-demo'
import { loadScenario, scenarioIds } from '../../scenarios'
import { API, boot, error, getActiveKitchenOrderCount, getDemoKitchenLoadPercent, getStoreConfig, json, logOrderEvent, now } from './_shared'
import { createCustomerSession } from '../../../domain/auth/session.policy'
import { demoClock } from '../../../domain/shared/clock'
import { runAutomationSweep } from '../../automation/automation.engine'
import { setKdsHeartbeat } from '../../services/kds-heartbeat'
import { confirmPayment, failPayment } from '../../../domain/payment/payment.machine'
import { demoPhonePeProvider } from '../../../services/payment/DemoPhonePeProvider'
import { confirmPaymentAndCreateOrder } from './_orderProcessing'
import { eventBus } from '../../events/event-bus'
import { startPrep, markReady } from '../../../domain/kitchen/kitchen.logic'
import { completeOrderFulfillment } from './_fulfillmentCompletion'
import type { Order } from '../../../domain/orders/order.types'

async function demoState() {
  const [store, count, override, payments, orders] = await Promise.all([getStoreConfig(), getActiveKitchenOrderCount(), getDemoKitchenLoadPercent(), db.payments.toArray(), db.orders.toArray()])
  const latestPayment = payments.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
  const activeOrder = orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).find((order) => order.customerId === 'CUST001' && order.acceptanceStatus === 'ACCEPTED' && !['DELIVERED', 'PICKED_UP', 'STORE_COMPLETED', 'CANCELLED'].includes(order.fulfillmentStatus))
  return {
    now: demoClock.now().toISOString(), offsetMinutes: demoClock.offsetMinutes(),
    kitchenLoadPercent: override ?? Math.min(100, Math.round(count / store.kitchenCapacityCount * 100)), kdsOnline: store.kdsOnline,
    latestPayment: latestPayment ? { id: latestPayment.id, status: latestPayment.status } : undefined,
    activeOrder: activeOrder ? { id: activeOrder.id, publicOrderNumber: activeOrder.publicOrderNumber, fulfillmentStatus: activeOrder.fulfillmentStatus } : undefined,
  }
}

async function completeForDemo(order: Order) {
  let current = order
  if (current.fulfillmentStatus === 'SCHEDULED') {
    current = { ...current, fulfillmentStatus: 'PREP_DUE', recommendedStartAt: current.prepStartAt }
    await db.orders.put(current); await logOrderEvent(current.id, 'PREP_DUE', 'SYSTEM')
  }
  if (current.fulfillmentStatus === 'PREP_DUE') {
    current = startPrep(current, now()); await db.orders.put(current); await logOrderEvent(current.id, 'PREP_STARTED', 'SYSTEM')
  }
  if (current.fulfillmentStatus === 'PREPARING') {
    current = markReady(current, now()); await db.orders.put(current); await logOrderEvent(current.id, 'ORDER_READY', 'SYSTEM')
  }
  if (current.fulfillmentStatus === 'READY' && current.fulfillmentType === 'DELIVERY') {
    current = { ...current, fulfillmentStatus: 'DISPATCHED' }; await db.orders.put(current); await logOrderEvent(current.id, 'ORDER_DISPATCHED', 'SYSTEM')
  }
  if (current.fulfillmentStatus === 'DISPATCHED') return completeOrderFulfillment(current, 'DELIVERED')
  if (current.fulfillmentStatus === 'READY' && current.fulfillmentType === 'PICKUP') return completeOrderFulfillment(current, 'PICKED_UP')
  if (current.fulfillmentStatus === 'READY' && current.fulfillmentType === 'STORE') return completeOrderFulfillment(current, 'STORE_COMPLETED')
  return current
}

export const demoHandlers = [
  http.post(`${API}/demo/reset`, async () => { await resetDemoDatabase(); return json({ ok: true }) }),

  http.get(`${API}/demo/scenarios`, async () => json(scenarioIds)),

  http.get(`${API}/demo/state`, async () => { await boot(); return json(await demoState()) }),

  http.post(`${API}/demo/clock/advance`, async ({ request }) => {
    await boot(); const { minutes } = await request.json() as { minutes: number }
    const safeMinutes = Math.max(1, Math.min(24 * 60, Math.floor(minutes)))
    demoClock.advanceMinutes(safeMinutes)
    await db.config.put({ key: 'demoClockMinutes', value: demoClock.offsetMinutes() })
    await runAutomationSweep(demoClock.now())
    eventBus.emit('DEMO_CLOCK_ADVANCED', { minutes: safeMinutes, totalMinutes: demoClock.offsetMinutes(), now: demoClock.now().toISOString() })
    return json(await demoState())
  }),

  http.post(`${API}/demo/kitchen-load`, async ({ request }) => {
    await boot(); const { percent } = await request.json() as { percent: number }
    const safePercent = Math.max(0, Math.min(100, Math.round(percent)))
    await db.config.put({ key: 'demoKitchenLoadPercent', value: safePercent })
    eventBus.emit('KITCHEN_LOAD_CHANGED', { percent: safePercent })
    return json(await demoState())
  }),

  http.post(`${API}/demo/kds-offline`, async ({ request }) => {
    await boot(); const { offline } = await request.json() as { offline: boolean }
    await setKdsHeartbeat(!offline, now())
    return json(await demoState())
  }),

  http.post(`${API}/demo/payment-outcome`, async ({ request }) => {
    await boot(); const { outcome } = await request.json() as { outcome: 'SUCCESS' | 'FAILURE' }
    const payment = (await db.payments.toArray()).filter((candidate) => ['PENDING', 'RECONCILING'].includes(candidate.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    if (!payment) return error('No pending payment is available', 409)
    if (outcome === 'FAILURE') {
      demoPhonePeProvider.failDemoPayment(payment.merchantOrderId, payment.amount)
      const failed = failPayment(payment, 'Demo toolbar marked payment as failed')
      await db.payments.put(failed)
      eventBus.emit('PAYMENT_STATUS_CHANGED', { paymentId: failed.id, status: failed.status })
      return json({ ok: true, paymentId: failed.id, status: failed.status })
    }
    demoPhonePeProvider.succeedDemoPayment(payment.merchantOrderId, payment.amount)
    const { attempt: confirmed } = confirmPayment(payment, `DEMO-${payment.id}`, now())
    await db.payments.put(confirmed)
    const order = await confirmPaymentAndCreateOrder(confirmed)
    eventBus.emit('PAYMENT_STATUS_CHANGED', { paymentId: confirmed.id, status: confirmed.status }, { orderId: order.id, customerId: order.customerId })
    return json({ ok: true, paymentId: confirmed.id, orderId: order.id, status: confirmed.status })
  }),

  http.post(`${API}/demo/complete-order`, async () => {
    await boot(); const order = (await db.orders.toArray()).filter((candidate) => candidate.customerId === 'CUST001' && candidate.acceptanceStatus === 'ACCEPTED' && !['DELIVERED', 'PICKED_UP', 'STORE_COMPLETED', 'CANCELLED'].includes(candidate.fulfillmentStatus)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    if (!order) return error('No accepted active order is available', 409)
    const completed = await completeForDemo(order)
    return json({ ok: true, orderId: completed.id, fulfillmentStatus: completed.fulfillmentStatus })
  }),

  http.post(`${API}/demo/scenario/:name`, async ({ params }) => {
    const name = String(params.name)
    if (!scenarioIds.includes(name as never)) return error(`Unknown scenario: ${name}`, 404)
    const summary = await loadScenario(name as never)
    return json(summary)
  }),

  /** Legacy Stage-1 toggle kept for the current DemoToolbar. */
  http.patch(`${API}/demo/session`, async ({ request }) => {
    await boot()
    const { loggedIn } = await request.json() as { loggedIn: boolean }
    await db.config.put({ key: 'customerLoggedIn', value: loggedIn })
    await db.sessions.where('realm').equals('CUSTOMER').delete()
    const session = loggedIn ? createCustomerSession('CUST001', demoClock.now()) : undefined
    if (session) await db.sessions.add({ id: 'SESSION-CUSTOMER-DEMO', realm: 'CUSTOMER', payload: session })
    return json({ loggedIn, session })
  }),
]
