import { db } from '../../database/db'
import { createId } from '../../../domain/shared/ids'
import { acceptOrder, applySchedule, createOrderFromIntent, markReviewRequired, rejectOrder } from '../../../domain/orders/order.logic'
import { applyPendingEarnOnPayment, calculateTier } from '../../../domain/loyalty/loyalty.engine'
import { evaluateOrderAcceptance } from '../../../domain/orders/acceptance.engine'
import { getEffectiveAvailability, validateCartAvailability } from '../../../domain/availability/availability.engine'
import { createAttentionItem } from '../../../domain/attention/attention.engine'
import { createRefund } from '../../../domain/refunds/refund.machine'
import type { Order } from '../../../domain/orders/order.types'
import type { PaymentAttempt } from '../../../domain/payment/payment.types'
import type { CustomerNotification } from '../../../domain/customer/customer-experience.types'
import type { LoyaltyTransaction } from '../../../domain/loyalty/loyalty.types'
import { getActiveKitchenOrderCount, getCapabilities, getStoreConfig, logOrderEvent, nextOrderSequence, now } from './_shared'

async function notifyCustomer(order: Order, title: string, message: string, kind: CustomerNotification['kind'] = 'ORDER') {
  const record = await db.config.get('customerNotifications')
  const rows = (record?.value as CustomerNotification[] | undefined) ?? []
  rows.unshift({ id: createId('NOTIF'), customerId: order.customerId, kind, title, message, createdAt: now().toISOString(), read: false, orderId: order.id })
  await db.config.put({ key: 'customerNotifications', value: rows })
}

async function evaluatePaidOrder(order: Order): Promise<Order> {
  const [intent, products, availability, capabilities, store, activeOrderCount] = await Promise.all([
    db.orderIntents.get(order.orderIntentId), db.products.bulkGet(order.items.map((item) => item.productId)),
    db.availability.toArray(), getCapabilities(), getStoreConfig(), getActiveKitchenOrderCount(),
  ])
  if (!intent) return order
  const liveProducts = products.filter((product): product is NonNullable<typeof product> => Boolean(product))
  // The client pitch follows the existing HYBRID policy's capacity-review branch so
  // the paid → Owner review → KDS handoff is deterministic. Development and tests
  // continue to exercise both automatic and reviewed acceptance using live load.
  const acceptanceLoad = import.meta.env.VITE_PITCH_MODE === 'true'
    ? Math.max(activeOrderCount, store.kitchenCapacityCount)
    : activeOrderCount
  const issues = validateCartAvailability(order.items.map((item) => ({ productId: item.productId, productName: item.name })), liveProducts, availability, now())
  for (const item of intent.cartSnapshot.items) {
    const product = liveProducts.find((candidate) => candidate.id === item.productId)
    for (const selection of item.modifiers ?? []) for (const optionId of selection.optionIds) {
      const option = product?.modifierGroups?.find((group) => group.id === selection.groupId)?.options.find((candidate) => candidate.id === optionId)
      const effective = getEffectiveAvailability(optionId, availability, now())
      if (!option || !option.available || effective.status !== 'AVAILABLE') issues.push({ productId: item.productId, productName: item.name, reason: `${option?.name ?? optionId} is unavailable.` })
    }
  }
  const decision = evaluateOrderAcceptance({
    paymentConfirmed: true, capabilities, fulfillmentType: order.fulfillmentType, availabilityIssues: issues,
    kdsOnline: store.kdsOnline, quote: order.financialSnapshot, acceptanceMode: store.acceptanceMode,
    schedule: {
      items: liveProducts.map((product) => ({ productId: product.id, prepMinutes: product.prepMinutes, complexity: product.complexity, station: product.station, quantity: order.items.find((item) => item.productId === product.id)?.quantity ?? 1 })),
      pickupSlot: intent.pickupSlot, activeOrderCount: acceptanceLoad, kitchenCapacityCount: store.kitchenCapacityCount,
      packingMinutes: store.packingMinutes, pickupBufferMinutes: store.pickupBufferMinutes,
      deliveryBufferMinutes: store.deliveryBufferMinutes, now: now(),
    },
  })

  if (decision.decision === 'AUTO_ACCEPT') {
    const accepted = applySchedule(acceptOrder(order, now()), decision.recommendation)
    await db.orders.put(accepted)
    await logOrderEvent(order.id, 'ORDER_ACCEPTED', 'SYSTEM')
    await logOrderEvent(order.id, 'FULFILLMENT_SCHEDULED', 'SYSTEM', { targetReadyAt: accepted.targetReadyAt, promisedAt: accepted.promisedAt })
    await notifyCustomer(accepted, 'Order confirmed', `${accepted.publicOrderNumber} was safely accepted and sent to the kitchen.`)
    return accepted
  }

  if (decision.decision === 'OWNER_REVIEW') {
    const reviewed = markReviewRequired(order)
    await db.orders.put(reviewed)
    await db.attentionItems.add(createAttentionItem('ORDER_REVIEW', `${reviewed.publicOrderNumber} needs a capacity decision`, decision.reasons.join(' '), 'Accept only if the current promise is safe; otherwise reject and refund.', now(), { orderId: reviewed.id, customerId: reviewed.customerId }))
    await logOrderEvent(order.id, 'ORDER_REVIEW_REQUIRED', 'SYSTEM', { reasons: decision.reasons })
    await notifyCustomer(reviewed, 'We are checking your order', `${reviewed.publicOrderNumber} needs a quick kitchen-capacity review.`)
    return reviewed
  }

  const reason = decision.reasons.join(' ') || 'Order could not be accepted safely.'
  const rejected: Order = { ...rejectOrder(order, reason, now()), refundStatus: 'REQUESTED' }
  const refund = createRefund(order.id, order.customerId, order.financialSnapshot.total, order.financialSnapshot.pointsToEarn, 'ORDER_REJECTED', now())
  await db.transaction('rw', db.orders, db.refunds, async () => { await db.orders.put(rejected); await db.refunds.add(refund) })
  await logOrderEvent(order.id, 'ORDER_REJECTED', 'SYSTEM', { reason })
  await logOrderEvent(order.id, 'REFUND_REQUESTED', 'SYSTEM', { refundId: refund.id })
  await notifyCustomer(rejected, 'Order could not be accepted', `A full refund has started for ${rejected.publicOrderNumber}.`, 'SYSTEM')
  return rejected
}

/**
 * A backend-confirmed payment creates one idempotent order, then the HYBRID acceptance
 * engine either schedules it, creates one owner exception, or starts a safe refund.
 */
export async function confirmPaymentAndCreateOrder(payment: PaymentAttempt): Promise<Order> {
  if (payment.status !== 'CONFIRMED') throw new Error(`Payment ${payment.id} is not backend-confirmed`)
  const intent = await db.orderIntents.get(payment.orderIntentId)
  if (!intent) throw new Error(`Order intent ${payment.orderIntentId} missing`)

  const existingOrders = await db.orders.where('orderIntentId').equals(intent.id).toArray()
  const sequence = existingOrders.length ? 0 : await nextOrderSequence()
  const { order: created, created: isNew } = createOrderFromIntent(intent, payment, existingOrders, sequence, now())
  if (!isNew) return created

  const order: Order = { ...created, paymentStatus: 'CONFIRMED', acceptanceStatus: 'AWAITING_ACCEPTANCE', fulfillmentStatus: 'NOT_STARTED' }
  const customer = await db.customers.get(order.customerId)
  const tier = calculateTier({ rolling120Orders: customer?.stats.rolling120Orders ?? 0, rolling120EligibleSpend: customer?.stats.rolling120EligibleSpend ?? 0 })
  const pendingEarn = applyPendingEarnOnPayment(order.id, order.customerId, order.financialSnapshot.eligibleSpend, tier, now())
  const redeemedPoints = order.financialSnapshot.pointsRedeemed ?? 0
  const redemption: LoyaltyTransaction | undefined = redeemedPoints > 0 ? {
    id: `LOY-${order.id}-REDEEM`, customerId: order.customerId, orderId: order.id,
    type: 'REDEEM', status: 'REDEEMED', points: -redeemedPoints, createdAt: now().toISOString(),
    note: `Used on ${order.publicOrderNumber}`,
  } : undefined

  await db.transaction('rw', db.orders, db.orderIntents, db.loyaltyTransactions, db.cartItems, db.customers, async () => {
    await db.orders.add(order)
    await db.orderIntents.update(intent.id, { status: 'CONSUMED' })
    await db.loyaltyTransactions.add(pendingEarn)
    if (redemption) await db.loyaltyTransactions.add(redemption)
    if (customer) await db.customers.update(customer.id, {
      pointsAvailable: Math.max(0, customer.pointsAvailable - redeemedPoints),
      pointsPending: customer.pointsPending + pendingEarn.points,
    })
    await db.cartItems.where('cartId').equals(intent.cartSnapshot.cartId).delete()
  })
  await logOrderEvent(order.id, 'PAYMENT_CONFIRMED', 'SYSTEM', { acceptanceStatus: 'AWAITING_ACCEPTANCE' })
  return evaluatePaidOrder(order)
}

export function generateMerchantOrderId(orderIntentId: string): string {
  return `MO-${orderIntentId}-${createId('SEQ')}`
}
