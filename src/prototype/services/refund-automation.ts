import { createAttentionItem, resolveAttentionItem } from '../../domain/attention/attention.engine'
import { createId } from '../../domain/shared/ids'
import { approveRefund, completeRefund, failRefund, processRefund, submitRefund } from '../../domain/refunds/refund.machine'
import type { Refund } from '../../domain/refunds/refund.types'
import type { CustomerNotification } from '../../domain/customer/customer-experience.types'
import type { ChatMessage } from '../../domain/conversation/conversation.types'
import { demoPhonePeProvider } from '../../services/payment/DemoPhonePeProvider'
import { db } from '../database/db'
import { eventBus } from '../events/event-bus'

async function addCustomerMessage(refund: Refund, title: string, message: string, at: Date) {
  const notificationRecord = await db.config.get('customerNotifications')
  const notifications = (notificationRecord?.value as CustomerNotification[] | undefined) ?? []
  notifications.unshift({ id: createId('NOTIF'), customerId: refund.customerId, kind: 'SYSTEM', title, message, createdAt: at.toISOString(), read: false, orderId: refund.orderId })
  await db.config.put({ key: 'customerNotifications', value: notifications })
  const conversation = await db.conversations.where('customerId').equals(refund.customerId).and((row) => row.status === 'OPEN').first()
  if (conversation) {
    const chat: ChatMessage = { id: createId('MSG'), conversationId: conversation.id, from: 'SYSTEM', text: message, at: at.toISOString() }
    await db.transaction('rw', db.messages, db.conversations, async () => {
      await db.messages.add(chat)
      await db.conversations.update(conversation.id, { updatedAt: at.toISOString() })
    })
    eventBus.emit('CONVERSATION_UPDATED', { conversationId: conversation.id }, { orderId: refund.orderId, customerId: refund.customerId })
  }
}

export async function processRefundAutomation(refund: Refund, at: Date): Promise<Refund> {
  if (refund.status === 'SUCCESS' || refund.status === 'FAILED') return refund
  let processing = refund
  if (processing.status === 'REQUESTED') processing = approveRefund(processing)
  if (processing.status === 'APPROVED') processing = submitRefund(processing)
  if (processing.status === 'SUBMITTED') processing = processRefund(processing)
  await db.refunds.put(processing)

  const providerResult = await demoPhonePeProvider.refund(processing.id, processing.amount)
  if (providerResult.status === 'FAILED') {
    const failed = failRefund(processing, 'Demo refund provider returned a failure')
    await db.refunds.put(failed)
    await db.orders.update(failed.orderId, { refundStatus: 'FAILED' })
    await db.attentionItems.add(createAttentionItem('REFUND_FAILURE', `Refund failed for order ${failed.orderId}`, 'Provider returned a failure.', 'Retry the refund or contact the customer.', at, { orderId: failed.orderId, customerId: failed.customerId }))
    eventBus.emit('REFUND_STATUS_CHANGED', { refundId: failed.id, status: failed.status }, { orderId: failed.orderId, customerId: failed.customerId })
    eventBus.emit('ATTENTION_CHANGED', { type: 'REFUND_FAILURE' }, { orderId: failed.orderId, customerId: failed.customerId })
    return failed
  }

  const completed = completeRefund(processing, at)
  const customer = await db.customers.get(completed.customerId)
  const pending = await db.loyaltyTransactions.where('orderId').equals(completed.orderId).and((tx) => tx.status === 'PENDING').toArray()
  const pendingPoints = pending.reduce((sum, tx) => sum + Math.max(0, tx.points), 0)
  const availablePoints = Math.max(0, completed.pointsToReverse - pendingPoints)
  const redeemed = completed.reason === 'ORDER_REJECTED'
    ? await db.loyaltyTransactions.where('orderId').equals(completed.orderId).and((tx) => tx.type === 'REDEEM').toArray()
    : []
  const restoredPoints = redeemed.reduce((sum, tx) => sum + Math.abs(tx.points), 0)
  await db.transaction('rw', db.refunds, db.orders, db.loyaltyTransactions, db.customers, db.attentionItems, async () => {
    await db.refunds.put(completed)
    await db.orders.update(completed.orderId, { refundStatus: 'SUCCESS' })
    for (const tx of pending) await db.loyaltyTransactions.update(tx.id, { type: 'REVERSAL', status: 'REVERSED', points: -Math.abs(tx.points), note: 'Refund reversal before fulfillment' })
    if (availablePoints > 0) await db.loyaltyTransactions.add({ id: createId('LOY-REVERSAL'), customerId: completed.customerId, orderId: completed.orderId, type: 'REVERSAL', status: 'REVERSED', points: -availablePoints, createdAt: at.toISOString(), note: 'Refund reversal' })
    if (restoredPoints > 0) await db.loyaltyTransactions.add({ id: `LOY-${completed.orderId}-REDEEM-RESTORE`, customerId: completed.customerId, orderId: completed.orderId, type: 'REVERSAL', status: 'AVAILABLE', points: restoredPoints, createdAt: at.toISOString(), note: 'Redeemed points restored after rejected order' })
    if (customer) await db.customers.update(customer.id, { pointsPending: Math.max(0, customer.pointsPending - pendingPoints), pointsAvailable: Math.max(0, customer.pointsAvailable - availablePoints + restoredPoints) })
    const attention = (await db.attentionItems.toArray()).filter((item) => item.orderId === completed.orderId && !item.resolvedAt)
    for (const item of attention) await db.attentionItems.put(resolveAttentionItem(item, at))
  })
  await db.orderEvents.add({ id: createId('EVT-ORDER'), orderId: completed.orderId, type: 'REFUND_COMPLETED', actor: 'SYSTEM', at: at.toISOString(), metadata: { refundId: completed.id, amount: completed.amount } })
  await addCustomerMessage(completed, 'Refund completed', `Your ₹${completed.amount} refund for order ${completed.orderId} is complete.`, at)
  eventBus.emit('REFUND_COMPLETED', { refundId: completed.id, amount: completed.amount }, { orderId: completed.orderId, customerId: completed.customerId })
  eventBus.emit('REFUND_STATUS_CHANGED', { refundId: completed.id, status: completed.status }, { orderId: completed.orderId, customerId: completed.customerId })
  eventBus.emit('ATTENTION_CHANGED', { resolvedForOrderId: completed.orderId }, { orderId: completed.orderId, customerId: completed.customerId })
  eventBus.emit('CUSTOMER_UPDATED', { customerId: completed.customerId }, { orderId: completed.orderId, customerId: completed.customerId })
  return completed
}
