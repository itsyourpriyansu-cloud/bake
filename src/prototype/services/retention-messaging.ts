import type { ConversationChannel, SimulatedMessageType } from '../../domain/conversation/conversation.types'
import { createId } from '../../domain/shared/ids'
import { demoWhatsAppProvider } from '../../services/messaging/DemoWhatsAppProvider'
import { db } from '../database/db'
import { eventBus } from '../events/event-bus'
import { demoClock } from '../../domain/shared/clock'

/**
 * Records every simulated channel in the customer's existing conversation. The provider
 * outbox is an adapter trace only; the conversation ledger is the source of truth.
 */
export async function appendRetentionMessage(customerId: string, text: string, channel: ConversationChannel, messageType: SimulatedMessageType) {
  let conversation = await db.conversations.where('customerId').equals(customerId).and((row) => row.status === 'OPEN').first()
  const timestamp = demoClock.now().toISOString()
  if (!conversation) {
    conversation = { id: createId('CONV'), customerId, channel: 'PWA_CHAT', status: 'OPEN', node: 'START', createdAt: timestamp, updatedAt: timestamp }
    await db.conversations.add(conversation)
  }
  if (channel === 'WHATSAPP_SIM') {
    const customer = await db.customers.get(customerId)
    await demoWhatsAppProvider.send({ to: customer?.phone ?? 'DEMO-CUSTOMER', text })
  }
  const message = { id: createId('MSG'), conversationId: conversation.id, from: 'SYSTEM' as const, text, channel, messageType, at: timestamp }
  await db.transaction('rw', db.messages, db.conversations, async () => {
    await db.messages.add(message)
    await db.conversations.update(conversation!.id, { updatedAt: timestamp })
  })
  eventBus.emit('CONVERSATION_UPDATED', { conversationId: conversation.id, channel, messageType }, { customerId })
  return message
}

