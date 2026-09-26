import { createId } from '../shared/ids'
import type { AttentionItem, AttentionSeverity, AttentionType } from './attention.types'

const severityByType: Record<AttentionType, AttentionSeverity> = {
  ORDER_REVIEW: 'MEDIUM', SEVERE_DELAY: 'HIGH', PAYMENT_ISSUE: 'HIGH',
  REFUND_FAILURE: 'HIGH', COMPLAINT: 'MEDIUM', KDS_OFFLINE: 'CRITICAL', AVAILABILITY_CONFLICT: 'LOW',
}

export function createAttentionItem(type: AttentionType, title: string, summary: string, suggestedAction: string, now: Date, links: { orderId?: string; customerId?: string } = {}, severity?: AttentionSeverity): AttentionItem {
  return { id: createId('ATTN'), type, severity: severity ?? severityByType[type], title, summary, suggestedAction, createdAt: now.toISOString(), ...links }
}

export function resolveAttentionItem(item: AttentionItem, now: Date): AttentionItem {
  return { ...item, resolvedAt: now.toISOString() }
}

export function getActiveAttentionQueue(items: AttentionItem[]): AttentionItem[] {
  const severityRank: Record<AttentionSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  return items.filter((item) => !item.resolvedAt).sort((a, b) => severityRank[a.severity] - severityRank[b.severity] || a.createdAt.localeCompare(b.createdAt))
}
