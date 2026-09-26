export type SupportCategory = 'WRONG_ITEM' | 'FOOD_QUALITY' | 'MISSING_ITEM' | 'DAMAGED' | 'LATE_DELIVERY' | 'PAYMENT' | 'OTHER'
export type SupportCaseStatus = 'OPEN' | 'AUTO_RESOLVED' | 'FOUNDER_REVIEW' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED'

export interface SupportCase {
  id: string; conversationId?: string; orderId?: string; customerId: string; category: SupportCategory;
  status: SupportCaseStatus; description: string; createdAt: string; resolvedAt?: string; refundId?: string
}
