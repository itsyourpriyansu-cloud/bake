import { createId } from '../shared/ids'
import type { SupportCase, SupportCategory } from './support.types'

/** Only categories that never require judgment auto-resolve; everything else routes to the founder. */
const autoResolvableCategories: SupportCategory[] = []

export function createSupportCase(customerId: string, category: SupportCategory, description: string, now: Date, links: { orderId?: string; conversationId?: string } = {}): SupportCase {
  const autoResolve = autoResolvableCategories.includes(category)
  return {
    id: createId('CASE'), customerId, category, description, createdAt: now.toISOString(),
    status: autoResolve ? 'AUTO_RESOLVED' : 'FOUNDER_REVIEW', resolvedAt: autoResolve ? now.toISOString() : undefined, ...links,
  }
}

export function attachRefund(supportCase: SupportCase, refundId: string): SupportCase {
  return { ...supportCase, refundId, status: 'WAITING_CUSTOMER' }
}

export function resolveSupportCase(supportCase: SupportCase, now: Date): SupportCase {
  return { ...supportCase, status: 'RESOLVED', resolvedAt: now.toISOString() }
}

export function closeSupportCase(supportCase: SupportCase): SupportCase {
  return { ...supportCase, status: 'CLOSED' }
}
