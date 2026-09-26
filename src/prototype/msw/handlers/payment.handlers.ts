import { http } from 'msw'
import { db } from '../../database/db'
import { createId } from '../../../domain/shared/ids'
import { confirmPayment, failPayment, reconcilePayment } from '../../../domain/payment/payment.machine'
import { demoPhonePeProvider } from '../../../services/payment/DemoPhonePeProvider'
import { API, boot, error, getAndClearNextPaymentOutcome, json, now } from './_shared'
import { confirmPaymentAndCreateOrder, generateMerchantOrderId } from './_orderProcessing'
import { eventBus } from '../../events/event-bus'

async function paymentResult(paymentId: string) {
  const payment = await db.payments.get(paymentId)
  if (!payment) return undefined
  const order = await db.orders.where('paymentId').equals(payment.id).first()
  return { payment, order }
}

export const paymentHandlers = [
  http.post(`${API}/payments/phonepe/initiate`, async ({ request }) => {
    await boot()
    const { orderIntentId } = await request.json() as { orderIntentId: string }
    const intent = await db.orderIntents.get(orderIntentId)
    if (!intent) return error('Order intent not found', 404)
    if (intent.status !== 'OPEN') return error('Order intent already used or expired', 409)

    const merchantOrderId = generateMerchantOrderId(orderIntentId)
    const outcome = await getAndClearNextPaymentOutcome()
    demoPhonePeProvider.setNextOutcome(merchantOrderId, outcome)
    const providerResult = await demoPhonePeProvider.initiate({ merchantOrderId, amount: intent.quoteSnapshot.total })
    const payment = {
      id: createId('PAY'), orderIntentId, provider: 'PHONEPE' as const, merchantOrderId,
      amount: intent.quoteSnapshot.total, status: 'PENDING' as const, createdAt: now().toISOString(),
    }
    await db.payments.add(payment)
    eventBus.emit('PAYMENT_STATUS_CHANGED', { paymentId: payment.id, status: payment.status })
    return json({ payment, redirectUrl: providerResult.redirectUrl, demoOnly: true }, 201)
  }),

  http.get(`${API}/payments/:paymentId`, async ({ params }) => {
    await boot()
    const result = await paymentResult(String(params.paymentId))
    return result ? json(result) : error('Payment attempt not found', 404)
  }),

  http.post(`${API}/demo/payments/:paymentId/succeed`, async ({ params }) => {
    await boot()
    const paymentId = String(params.paymentId)
    const attempt = await db.payments.get(paymentId)
    if (!attempt) return error('Payment attempt not found', 404)
    if (attempt.status === 'CONFIRMED') {
      // Repair safely after an interrupted write: confirmation is authoritative and
      // order creation is idempotent by orderIntentId.
      await confirmPaymentAndCreateOrder(attempt)
      return json(await paymentResult(paymentId))
    }
    demoPhonePeProvider.succeedDemoPayment(attempt.merchantOrderId, attempt.amount)
    const providerStatus = await demoPhonePeProvider.getStatus(attempt.merchantOrderId)
    if (providerStatus.status !== 'CONFIRMED') return error('Backend has not confirmed payment', 409)
    const { attempt: confirmed } = confirmPayment(attempt, providerStatus.providerTransactionId ?? createId('PHONEPE-TXN'), now())
    await db.payments.put(confirmed)
    await confirmPaymentAndCreateOrder(confirmed)
    eventBus.emit('PAYMENT_STATUS_CHANGED', { paymentId, status: 'CONFIRMED' })
    return json(await paymentResult(paymentId))
  }),

  http.post(`${API}/demo/payments/:paymentId/fail`, async ({ params }) => {
    await boot()
    const paymentId = String(params.paymentId)
    const attempt = await db.payments.get(paymentId)
    if (!attempt) return error('Payment attempt not found', 404)
    if (attempt.status === 'FAILED') return json(await paymentResult(paymentId))
    if (attempt.status === 'CONFIRMED') return error('Confirmed payment cannot be failed', 409)
    demoPhonePeProvider.failDemoPayment(attempt.merchantOrderId, attempt.amount)
    await db.payments.put(failPayment(attempt, 'Demo payment marked as failed'))
    eventBus.emit('PAYMENT_STATUS_CHANGED', { paymentId, status: 'FAILED' })
    return json(await paymentResult(paymentId))
  }),

  http.post(`${API}/demo/payments/:paymentId/pending`, async ({ params }) => {
    await boot()
    const paymentId = String(params.paymentId)
    const attempt = await db.payments.get(paymentId)
    if (!attempt) return error('Payment attempt not found', 404)
    if (attempt.status === 'CONFIRMED' || attempt.status === 'FAILED') return error('Payment is already resolved', 409)
    demoPhonePeProvider.keepDemoPaymentPending(attempt.merchantOrderId, attempt.amount)
    await db.payments.put(reconcilePayment(attempt))
    eventBus.emit('PAYMENT_STATUS_CHANGED', { paymentId, status: 'RECONCILING' })
    return json(await paymentResult(paymentId))
  }),
]

export { paymentResult }
