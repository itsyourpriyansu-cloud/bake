import type { SupportCase } from '../../domain/support/support.types'

export const supportCaseSeed: SupportCase[] = [{
  id: 'CASE-MISSING-ITEM', conversationId: 'CONV-SUPPORT-001', orderId: 'ORDER-HIST-002', customerId: 'CUST001',
  category: 'MISSING_ITEM', status: 'FOUNDER_REVIEW', description: 'Cheesy Garlic Bread was missing from my pickup order.',
  createdAt: '2026-09-10T12:24:00.000Z',
}]
