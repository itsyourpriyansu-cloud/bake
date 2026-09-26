import type { Customer, DemoCustomerView } from './customer.types'

/** Adapts the full domain Customer to the flat shape Stage 1 UI already consumes. */
export function toDemoCustomerView(customer: Customer): DemoCustomerView {
  return {
    id: customer.id, firstName: customer.firstName, phone: customer.phone, tier: customer.tier,
    pointsAvailable: customer.pointsAvailable, pointsPending: customer.pointsPending,
    rolling120Orders: customer.stats.rolling120Orders, rolling120Spend: customer.stats.rolling120EligibleSpend,
    lifetimeOrders: customer.stats.lifetimeOrders, lifetimeValue: customer.stats.lifetimeValue,
    averageOrderValue: customer.stats.averageOrderValue, preferredCategory: customer.stats.preferredCategory ?? 'Pizza',
    tags: customer.tags,
  }
}
