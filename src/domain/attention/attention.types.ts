export type AttentionType = 'ORDER_REVIEW' | 'SEVERE_DELAY' | 'PAYMENT_ISSUE' | 'REFUND_FAILURE' | 'COMPLAINT' | 'KDS_OFFLINE' | 'AVAILABILITY_CONFLICT'
export type AttentionSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface AttentionItem {
  id: string
  type: AttentionType
  severity: AttentionSeverity
  title: string
  summary: string
  orderId?: string
  customerId?: string
  suggestedAction: string
  createdAt: string
  resolvedAt?: string
}
