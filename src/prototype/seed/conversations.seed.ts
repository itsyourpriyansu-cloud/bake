import type { ChatMessage, Conversation } from '../../domain/conversation/conversation.types'

export const conversationSeed: Conversation[] = [{
  id: 'CONV-SUPPORT-001', customerId: 'CUST001', channel: 'PWA_CHAT', status: 'OPEN', node: 'HUMAN_HANDOFF',
  createdAt: '2026-09-10T12:20:00.000Z', updatedAt: '2026-09-10T12:24:00.000Z',
}]
export const messageSeed: ChatMessage[] = [
  { id: 'MSG-SUPPORT-001', conversationId: 'CONV-SUPPORT-001', from: 'CUSTOMER', text: 'My Cheesy Garlic Bread was missing from the pickup bag.', intent: 'REPORT_PROBLEM', at: '2026-09-10T12:20:00.000Z' },
  { id: 'MSG-SUPPORT-002', conversationId: 'CONV-SUPPORT-001', from: 'SYSTEM', text: 'I’ve raised this for founder review and kept your order details attached.', at: '2026-09-10T12:24:00.000Z' },
]
