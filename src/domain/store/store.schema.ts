import { z } from 'zod'

export const acceptanceModeSchema = z.enum(['AUTO', 'HYBRID', 'MANUAL'])

export const storeConfigSchema = z.object({
  storeId: z.string(),
  storeName: z.string(),
  city: z.string(),
  timezone: z.literal('Asia/Kolkata'),
  isOpen: z.boolean(),
  acceptanceMode: acceptanceModeSchema,
  deliveryEnabled: z.boolean(),
  pickupEnabled: z.boolean(),
  storeOrderingEnabled: z.boolean(),
  scheduledOrdersEnabled: z.boolean(),
  pointsRedemptionEnabled: z.boolean(),
  maxDeliveryWaitMinutes: z.number().int().positive(),
  maxPickupWaitMinutes: z.number().int().positive(),
  packingMinutes: z.number().int().nonnegative(),
  pickupBufferMinutes: z.number().int().nonnegative(),
  deliveryBufferMinutes: z.number().int().nonnegative(),
  kdsOnline: z.boolean(),
  kitchenCapacityCount: z.number().int().positive(),
  deliveryFeeFlat: z.number().nonnegative(),
  capacityThresholds: z.object({
    lightMaxPercent: z.number(), moderateMaxPercent: z.number(), heavyMaxPercent: z.number(),
  }),
  delayThresholds: z.object({
    customerNoticeMinutes: z.number().int().positive(), founderAttentionMinutes: z.number().int().positive(),
  }),
})

export const capabilitiesSchema = z.object({
  storeOpen: z.boolean(),
  delivery: z.object({ enabled: z.boolean(), reason: z.string().optional() }),
  pickup: z.object({ enabled: z.boolean(), reason: z.string().optional() }),
  storeOrder: z.object({ enabled: z.boolean(), reason: z.string().optional() }),
  scheduledOrders: z.object({ enabled: z.boolean(), reason: z.string().optional() }),
  pointsRedemption: z.object({ enabled: z.boolean(), reason: z.string().optional() }),
  store: z.object({ id: z.string(), name: z.string(), city: z.string(), acceptanceMode: acceptanceModeSchema }),
})
