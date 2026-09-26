import { z } from 'zod'
import { loyaltyTierIdSchema } from '../customer/customer.schema'

export const loyaltyTierSchema = z.object({
  id: loyaltyTierIdSchema, name: z.string(), ordersRequired: z.number().int().nonnegative(),
  spendRequired: z.number().nonnegative(), earnRate: z.number().positive(),
})

export const loyaltyTransactionTypeSchema = z.enum(['EARN_PENDING', 'EARN_AVAILABLE', 'REDEEM', 'REVERSAL', 'BONUS', 'EXPIRY'])
export const loyaltyTransactionStatusSchema = z.enum(['PENDING', 'AVAILABLE', 'REDEEMED', 'REVERSED', 'EXPIRED'])

export const loyaltyTransactionSchema = z.object({
  id: z.string(), customerId: z.string(), orderId: z.string().optional(), type: loyaltyTransactionTypeSchema,
  status: loyaltyTransactionStatusSchema, points: z.number().int(), createdAt: z.string(), expiresAt: z.string().optional(), note: z.string().optional(),
})

export const tierStatusSchema = z.object({
  customerId: z.string(), tier: loyaltyTierIdSchema, since: z.string(), graceExpiresAt: z.string().optional(),
})

export const loyaltySummarySchema = z.object({
  customer: z.object({
    id: z.string(), firstName: z.string(), phone: z.string(), tier: loyaltyTierIdSchema, pointsAvailable: z.number(), pointsPending: z.number(),
    rolling120Orders: z.number(), rolling120Spend: z.number(), lifetimeOrders: z.number(), lifetimeValue: z.number(), averageOrderValue: z.number(),
    preferredCategory: z.string(), tags: z.array(z.string()),
  }),
  nextTier: loyaltyTierIdSchema.optional(), ordersNeeded: z.number().int().nonnegative(), spendNeeded: z.number().nonnegative(),
  progress: z.object({
    currentOrders: z.number().int().nonnegative(), targetOrders: z.number().int().nonnegative(),
    currentSpend: z.number().nonnegative(), targetSpend: z.number().nonnegative(), earnRatePercent: z.number().nonnegative(),
    ordersPercent: z.number().min(0).max(100), spendPercent: z.number().min(0).max(100), message: z.string(),
  }),
})
