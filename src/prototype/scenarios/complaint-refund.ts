import { db } from '../database/db'
import { resetDemoDatabase } from '../demo/reset-demo'
import { demoClock } from '../../domain/shared/clock'
import { createSupportCase } from '../../domain/support/support.logic'
import { createAttentionItem } from '../../domain/attention/attention.engine'
import type { ScenarioSummary } from './scenario.types'

export async function loadComplaintRefund(): Promise<ScenarioSummary> {
  await resetDemoDatabase()
  const now = demoClock.now()
  const orderId = 'ORDER-HIST-002'
  const supportCase = createSupportCase('CUST001', 'MISSING_ITEM', 'Cheesy Garlic Bread was missing from the order.', now, { orderId })
  await db.supportCases.add(supportCase)
  await db.attentionItems.add(createAttentionItem('COMPLAINT', 'Missing item — Priyanshu', supportCase.description, 'Review the case and issue a partial refund if appropriate.', now, { orderId, customerId: 'CUST001' }))
  return {
    id: 'complaintRefund', title: 'Complaint & Refund', appliedAt: now.toISOString(),
    description: `Support case ${supportCase.id} is open against completed order ${orderId}. Founder can approve a partial refund from the attention queue.`,
  }
}
