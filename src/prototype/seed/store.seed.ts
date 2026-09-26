import type { StoreConfig } from '../../domain/store/store.types'

export const storeConfigSeed: StoreConfig = {
  storeId: 'STORE-PURI-GRAND-ROAD', storeName: 'The Pizza Wave', city: 'Puri', timezone: 'Asia/Kolkata',
  isOpen: true, acceptanceMode: 'HYBRID',
  deliveryEnabled: true, pickupEnabled: true, storeOrderingEnabled: true, scheduledOrdersEnabled: true, pointsRedemptionEnabled: true,
  maxDeliveryWaitMinutes: 45, maxPickupWaitMinutes: 25,
  packingMinutes: 3, pickupBufferMinutes: 5, deliveryBufferMinutes: 15,
  kdsOnline: true,
  kitchenCapacityCount: 8,
  deliveryFeeFlat: 0,
  capacityThresholds: { lightMaxPercent: 50, moderateMaxPercent: 75, heavyMaxPercent: 90 },
  delayThresholds: { customerNoticeMinutes: 8, founderAttentionMinutes: 15 },
}
