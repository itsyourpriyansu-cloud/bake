import { z } from 'zod'

export const fulfillmentModeSchema = z.enum(['DELIVERY', 'PICKUP', 'STORE'])
export const loyaltyTierIdSchema = z.enum(['MEMBER', 'SILVER', 'GOLD', 'PLATINUM'])
export const customerStageSchema = z.enum(['NEW', 'FIRST_ORDER', 'SECOND_ORDER', 'REPEAT', 'LOYAL', 'VIP'])
export const customerActivitySchema = z.enum(['ACTIVE', 'AT_RISK', 'DORMANT'])

export const customerAddressSchema = z.object({
  id: z.string(), label: z.string(), line1: z.string(), line2: z.string().optional(),
  city: z.string(), pincode: z.string(), lat: z.number().optional(), lng: z.number().optional(), isDefault: z.boolean(),
})

export const customerPreferenceSchema = z.object({
  veg: z.boolean().optional(), spiceLevel: z.enum(['mild', 'medium', 'spicy']).optional(), notes: z.string().optional(),
})

export const customerStatsSchema = z.object({
  rolling30Orders: z.number().int().nonnegative(),
  rolling120Orders: z.number().int().nonnegative(),
  rolling120EligibleSpend: z.number().nonnegative(),
  lifetimeOrders: z.number().int().nonnegative(),
  lifetimeValue: z.number().nonnegative(),
  averageOrderValue: z.number().nonnegative(),
  preferredCategory: z.string().optional(),
  preferredProducts: z.array(z.string()),
  preferredFulfillment: fulfillmentModeSchema.optional(),
  lastOrderAt: z.string().optional(),
})

export const customerSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  phone: z.string(),
  createdAt: z.string(),
  preferences: customerPreferenceSchema,
  addresses: z.array(customerAddressSchema),
  tier: loyaltyTierIdSchema,
  pointsAvailable: z.number().int().nonnegative(),
  pointsPending: z.number().int().nonnegative(),
  stats: customerStatsSchema,
  customerStage: customerStageSchema,
  activityState: customerActivitySchema,
  tags: z.array(z.string()),
  waveId: z.string(),
})

/** Flat view kept for the current prototype UI (Stage 1 shape) — derived from customerSchema. */
export const demoCustomerViewSchema = z.object({
  id: z.string(), firstName: z.string(), phone: z.string(), tier: loyaltyTierIdSchema,
  pointsAvailable: z.number(), pointsPending: z.number(),
  rolling120Orders: z.number(), rolling120Spend: z.number(),
  lifetimeOrders: z.number(), lifetimeValue: z.number(), averageOrderValue: z.number(),
  preferredCategory: z.string(), tags: z.array(z.string()),
})
