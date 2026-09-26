import type { z } from 'zod'
import type {
  loyaltySummarySchema, loyaltyTierSchema, loyaltyTransactionSchema, loyaltyTransactionStatusSchema,
  loyaltyTransactionTypeSchema, tierStatusSchema,
} from './loyalty.schema'

export type LoyaltyTier = z.infer<typeof loyaltyTierSchema>
export type LoyaltyTransactionType = z.infer<typeof loyaltyTransactionTypeSchema>
export type LoyaltyTransactionStatus = z.infer<typeof loyaltyTransactionStatusSchema>
export type LoyaltyTransaction = z.infer<typeof loyaltyTransactionSchema>
export type TierStatus = z.infer<typeof tierStatusSchema>
export type LoyaltySummary = z.infer<typeof loyaltySummarySchema>
