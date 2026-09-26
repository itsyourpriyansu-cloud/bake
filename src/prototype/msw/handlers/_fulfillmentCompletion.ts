import { db } from '../../database/db'
import { assertFulfillmentTransition } from '../../../domain/orders/order.machine'
import type { FulfillmentStatus, Order } from '../../../domain/orders/order.types'
import { applyOrderCompletion, calculateTier } from '../../../domain/loyalty/loyalty.engine'
import { deriveActivityState, deriveCustomerStage, deriveTags, recalculateCustomerStats } from '../../../domain/crm/crm.engine'
import type { CrmOrderHistoryEntry } from '../../../domain/crm/crm.types'
import { logOrderEvent, now } from './_shared'
import { createId } from '../../../domain/shared/ids'
import { eventBus } from '../../events/event-bus'
import type { CustomerNotification } from '../../../domain/customer/customer-experience.types'
import { appendRetentionMessage } from '../../services/retention-messaging'

/**
 * The moment loyalty points move from pending to available and CRM stats/tier/tags recompute.
 * Never done anywhere else — this is the single settlement point for a completed order.
 */
export async function completeOrderFulfillment(order: Order, finalStatus: Extract<FulfillmentStatus, 'DELIVERED' | 'PICKED_UP' | 'STORE_COMPLETED'>): Promise<Order> {
  // Delivery callbacks and demo controls may be retried. Treat an identical terminal
  // status as an idempotent acknowledgement so points and CRM can never settle twice.
  if (order.fulfillmentStatus === finalStatus) return order
  assertFulfillmentTransition(order.fulfillmentStatus, finalStatus)
  const updatedOrder: Order = { ...order, fulfillmentStatus: finalStatus }
  await db.orders.put(updatedOrder)
  await logOrderEvent(updatedOrder.id, 'ORDER_COMPLETED', 'SYSTEM')

  const customer = await db.customers.get(updatedOrder.customerId)
  if (!customer) return updatedOrder

  const allOrders = await db.orders.where('customerId').equals(customer.id).toArray()
  const history: CrmOrderHistoryEntry[] = allOrders
    .filter((candidate) => ['DELIVERED', 'PICKED_UP', 'STORE_COMPLETED'].includes(candidate.fulfillmentStatus))
    .map((candidate) => ({ fulfillmentType: candidate.fulfillmentType, total: candidate.financialSnapshot.total, category: candidate.items[0]?.productId.split('-')[0] ?? 'OTHER', completedAt: candidate.createdAt }))

  const recalculated = recalculateCustomerStats(customer.stats, history, now())
  // Seeded CRM aggregates represent Priyanshu's full history; the prototype only stores
  // representative orders, so a visible completion must not downgrade the derived wallet.
  const stats = {
    ...recalculated,
    rolling30Orders: Math.max(customer.stats.rolling30Orders, recalculated.rolling30Orders),
    rolling120Orders: Math.max(customer.stats.rolling120Orders, recalculated.rolling120Orders),
    rolling120EligibleSpend: Math.max(customer.stats.rolling120EligibleSpend, recalculated.rolling120EligibleSpend),
    lifetimeOrders: Math.max(customer.stats.lifetimeOrders, recalculated.lifetimeOrders),
    lifetimeValue: Math.max(customer.stats.lifetimeValue, recalculated.lifetimeValue),
  }
  const tier = calculateTier({ rolling120Orders: stats.rolling120Orders, rolling120EligibleSpend: stats.rolling120EligibleSpend })
  const previousTier = customer.tier

  const completedIn30 = history.filter((entry) => new Date(entry.completedAt).getTime() >= now().getTime() - 30 * 86_400_000).length
  const pendingForOrder = await db.loyaltyTransactions.where('orderId').equals(updatedOrder.id).and((tx) => tx.type === 'EARN_PENDING').first()
  const recentFrequencyBonus = await db.loyaltyTransactions
    .where('customerId').equals(customer.id)
    .and((tx) => tx.type === 'BONUS' && tx.note === 'Frequency bonus' && new Date(tx.createdAt).getTime() >= now().getTime() - 30 * 86_400_000)
    .first()
  const generated = applyOrderCompletion({
    orderId: updatedOrder.id, customerId: customer.id, eligibleSubtotal: updatedOrder.financialSnapshot.eligibleSpend,
    tier, completedOrdersInRolling30: recentFrequencyBonus ? 0 : completedIn30, now: now(),
  })
  const transactions = pendingForOrder ? generated.filter((tx) => tx.type !== 'EARN_AVAILABLE') : generated
  if (transactions.length) await db.loyaltyTransactions.bulkAdd(transactions)
  if (pendingForOrder) await db.loyaltyTransactions.update(pendingForOrder.id, { type: 'EARN_AVAILABLE', status: 'AVAILABLE', note: `Earned on ${updatedOrder.publicOrderNumber}`, expiresAt: new Date(now().getTime() + 180 * 86_400_000).toISOString() })

  const earnedNow = (pendingForOrder?.points ?? generated.find((tx) => tx.type === 'EARN_AVAILABLE')?.points ?? 0) + transactions.filter((tx) => tx.type === 'BONUS').reduce((sum, tx) => sum + tx.points, 0)
  const tags = deriveTags({ tier: tier.id, stats }, history)
  const updatedCustomer = {
    ...customer, tier: tier.id, stats, tags,
    customerStage: deriveCustomerStage(stats.lifetimeOrders), activityState: deriveActivityState(stats.lastOrderAt, now()),
    pointsAvailable: customer.pointsAvailable + earnedNow,
    pointsPending: Math.max(0, customer.pointsPending - (pendingForOrder?.points ?? 0)),
  }
  const currentTierStatus = await db.tierStatus.get(customer.id)
  await db.transaction('rw', db.customers, db.tierStatus, async () => {
    await db.customers.put(updatedCustomer)
    await db.tierStatus.put({ customerId: customer.id, tier: tier.id, since: previousTier === tier.id ? currentTierStatus?.since ?? now().toISOString() : now().toISOString() })
  })
  await logOrderEvent(updatedOrder.id, 'POINTS_CREDITED', 'SYSTEM', { points: earnedNow })
  if (previousTier !== tier.id) await logOrderEvent(updatedOrder.id, 'TIER_CHANGED', 'SYSTEM', { from: previousTier, to: tier.id })

  const notificationRecord = await db.config.get('customerNotifications')
  const notifications = (notificationRecord?.value as CustomerNotification[] | undefined) ?? []
  notifications.unshift({
    id: createId('NOTIF'), customerId: customer.id, kind: 'POINTS', title: `+${earnedNow} Wave Points available`,
    message: `${updatedOrder.publicOrderNumber} is complete. Your wallet, tier progress and customer profile updated automatically.`,
    createdAt: now().toISOString(), read: false, orderId: updatedOrder.id,
  })
  await db.config.put({ key: 'customerNotifications', value: notifications })
  eventBus.emit('CUSTOMER_UPDATED', { customerId: customer.id, points: earnedNow, tier: tier.id }, { orderId: updatedOrder.id, customerId: customer.id })

  // The first completion opens the second-order loop. It is stored as derived retention
  // state and delivered through the same conversation ledger as every other channel.
  if (stats.lifetimeOrders === 1) {
    const loop = { title: 'One more order unlocks your next Wave milestone.', message: 'Your first Wave is complete. Come back for the favourite you have not tried yet.', campaignScheduled: true }
    await db.config.put({ key: `secondOrderLoop:${customer.id}`, value: loop })
    await appendRetentionMessage(customer.id, `${loop.title}\n${loop.message}`, 'WHATSAPP_SIM', 'REORDER')
    await db.campaignEvents.put({ id: `CAMPAIGN-SECOND-${updatedOrder.id}`, opportunityId: 'OPP-SECOND_ORDER_PENDING', customerId: customer.id, channel: 'WHATSAPP_SIM', timing: 'TONIGHT_7PM', offer: 'Next Wave milestone', message: loop.message, audience: 'First order completed', estimatedAudience: 1, estimatedCost: .78, estimatedConversions: 1, demoOnly: true, status: 'SIMULATED', createdAt: now().toISOString() })
    eventBus.emit('RETENTION_UPDATED', { kind: 'SECOND_ORDER_LOOP', orderId: updatedOrder.id }, { orderId: updatedOrder.id, customerId: customer.id })
  }

  // A referred friend's completed first order is the qualifying action. Signup alone never
  // enters this branch. Rewarding is automatic and idempotent with order completion.
  const referrals = (await db.referrals.toArray()).filter((row) => row.referredCustomerId === customer.id && row.status === 'FIRST_ORDER_PENDING')
  for (const referral of referrals) {
    const timestamp = now().toISOString(); const referrer = await db.customers.get(referral.referrerCustomerId)
    await db.referrals.put({ ...referral, status: 'REWARDED', rewardPoints: 60, qualifiedAt: timestamp, rewardedAt: timestamp, updatedAt: timestamp })
    if (referrer) {
      await db.customers.update(referrer.id, { pointsAvailable: referrer.pointsAvailable + 60 })
      await db.loyaltyTransactions.add({ id: createId('LOY-REFERRAL'), customerId: referrer.id, type: 'BONUS', status: 'AVAILABLE', points: 60, createdAt: timestamp, note: `Referral reward · ${referral.friendName}'s first completed order` })
    }
    await appendRetentionMessage(referral.referrerCustomerId, `${referral.friendName} completed their first order. You earned 60 Wave Points!`, 'WHATSAPP_SIM', 'POINTS_EARNED')
    eventBus.emit('RETENTION_UPDATED', { kind: 'REFERRAL_REWARDED', referralId: referral.id }, { orderId: updatedOrder.id, customerId: referral.referrerCustomerId })
  }

  return updatedOrder
}
