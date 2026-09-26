import type { Capabilities, StoreConfig } from './store.types'

/**
 * The only place allowed to decide what the customer UI may do.
 * UI must never infer capability from store config fields directly.
 */
export function deriveCapabilities(config: StoreConfig): Capabilities {
  const closedReason = config.isOpen ? undefined : 'Store is closed right now.'
  return {
    storeOpen: config.isOpen,
    delivery: { enabled: config.isOpen && config.deliveryEnabled, reason: !config.isOpen ? closedReason : !config.deliveryEnabled ? 'Delivery is paused.' : undefined },
    pickup: { enabled: config.isOpen && config.pickupEnabled, reason: !config.isOpen ? closedReason : !config.pickupEnabled ? 'Pickup is paused.' : undefined },
    storeOrder: { enabled: config.storeOrderingEnabled, reason: config.storeOrderingEnabled ? undefined : 'In-store ordering is paused.' },
    scheduledOrders: { enabled: config.isOpen && config.scheduledOrdersEnabled, reason: !config.scheduledOrdersEnabled ? 'Scheduled orders are paused.' : undefined },
    pointsRedemption: { enabled: config.pointsRedemptionEnabled, reason: config.pointsRedemptionEnabled ? undefined : 'Points redemption is paused.' },
    store: { id: config.storeId, name: config.storeName, city: config.city, acceptanceMode: config.acceptanceMode },
  }
}
