import type { Customer, CustomerStats } from '../customer/customer.types'
import type { CrmOrderHistoryEntry, CustomerActivity, CustomerLifecycle } from './crm.types'

const DAY_MS = 86_400_000

export function deriveCustomerStage(lifetimeOrders: number): CustomerLifecycle {
  if (lifetimeOrders === 0) return 'NEW'
  if (lifetimeOrders === 1) return 'FIRST_ORDER'
  if (lifetimeOrders === 2) return 'SECOND_ORDER'
  if (lifetimeOrders <= 5) return 'REPEAT'
  if (lifetimeOrders <= 12) return 'LOYAL'
  return 'VIP'
}

/** ACTIVE within 14 days, AT_RISK 15-30 days, DORMANT beyond 30 days since last order. */
export function deriveActivityState(lastOrderAt: string | undefined, now: Date): CustomerActivity {
  if (!lastOrderAt) return 'DORMANT'
  const days = (now.getTime() - new Date(lastOrderAt).getTime()) / DAY_MS
  if (days <= 14) return 'ACTIVE'
  if (days <= 30) return 'AT_RISK'
  return 'DORMANT'
}

export function deriveTags(customer: Pick<Customer, 'tier' | 'stats'>, history: CrmOrderHistoryEntry[]): string[] {
  const tags = new Set<string>()
  if (customer.tier === 'GOLD') tags.add('Gold Wave')
  if (customer.tier === 'PLATINUM') tags.add('Platinum Wave')

  if (history.length >= 3) {
    const categoryCounts = new Map<string, number>()
    for (const entry of history) categoryCounts.set(entry.category, (categoryCounts.get(entry.category) ?? 0) + 1)
    const [topCategory, topCount] = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1])[0] ?? []
    if (topCategory && topCount && topCount / history.length >= 0.5) tags.add(`${topCategory} Lover`)
  }

  const weekendOrders = history.filter((entry) => [0, 6].includes(new Date(entry.completedAt).getDay())).length
  if (history.length > 0 && weekendOrders / history.length >= 0.5) tags.add('Weekend Buyer')

  const deliveryCount = history.filter((entry) => entry.fulfillmentType === 'DELIVERY').length
  const pickupCount = history.filter((entry) => entry.fulfillmentType === 'PICKUP').length
  const storeCount = history.filter((entry) => entry.fulfillmentType === 'STORE').length
  if (history.length >= 3) {
    if (deliveryCount / history.length >= 0.7) tags.add('Delivery Regular')
    if (pickupCount / history.length >= 0.7) tags.add('Pickup Regular')
    if (storeCount / history.length >= 0.7) tags.add('In-store Regular')
    const channelsUsed = [deliveryCount, pickupCount, storeCount].filter((count) => count > 0).length
    if (channelsUsed >= 2) tags.add('Cross-channel')
  }

  if (customer.stats.averageOrderValue >= 400) tags.add('High AOV')
  if (history.length >= 2) tags.add('Repeat Customer')

  return [...tags]
}

export function recalculateCustomerStats(current: CustomerStats, history: CrmOrderHistoryEntry[], now: Date): CustomerStats {
  const rolling30Cutoff = now.getTime() - 30 * DAY_MS
  const rolling120Cutoff = now.getTime() - 120 * DAY_MS
  const rolling30 = history.filter((entry) => new Date(entry.completedAt).getTime() >= rolling30Cutoff)
  const rolling120 = history.filter((entry) => new Date(entry.completedAt).getTime() >= rolling120Cutoff)
  const lifetimeValue = history.reduce((sum, entry) => sum + entry.total, 0)
  const lastOrderAt = history.length ? history.reduce((latest, entry) => (entry.completedAt > latest ? entry.completedAt : latest), history[0].completedAt) : current.lastOrderAt

  return {
    ...current,
    rolling30Orders: rolling30.length,
    rolling120Orders: rolling120.length,
    rolling120EligibleSpend: rolling120.reduce((sum, entry) => sum + entry.total, 0),
    lifetimeOrders: history.length,
    lifetimeValue,
    averageOrderValue: history.length ? Math.round(lifetimeValue / history.length) : 0,
    lastOrderAt,
  }
}
