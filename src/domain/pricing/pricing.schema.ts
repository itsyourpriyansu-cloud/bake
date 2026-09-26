import { z } from 'zod'

export const cartQuoteSchema = z.object({
  itemCount: z.number().int().nonnegative(),
  subtotal: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  pointsRequested: z.number().int().nonnegative(),
  pointsUsable: z.number().int().nonnegative(),
  pointsValue: z.number().nonnegative(),
  pointsRedeemed: z.number().int().nonnegative().optional(),
  deliveryFee: z.number().nonnegative(),
  eligibleSpend: z.number().nonnegative(),
  pointsToEarn: z.number().int().nonnegative(),
  total: z.number().nonnegative(),
  offerApplied: z.string().optional(),
  threshold: z.object({ target: z.number().nonnegative(), remaining: z.number().nonnegative(), label: z.string() }).optional(),
  availabilityIssues: z.array(z.object({
    itemId: z.string(), productId: z.string(), entityId: z.string(), kind: z.enum(['PRODUCT', 'MODIFIER']),
    displayName: z.string(), message: z.string(),
  })).optional(),
  warnings: z.array(z.string()),
  valid: z.boolean(),
})
