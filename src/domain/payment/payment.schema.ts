import { z } from 'zod'

export const paymentStatusSchema = z.enum(['NOT_STARTED', 'PENDING', 'CONFIRMED', 'FAILED', 'RECONCILING'])
export const paymentProviderSchema = z.literal('PHONEPE')

export const paymentAttemptSchema = z.object({
  id: z.string(), orderIntentId: z.string(), provider: paymentProviderSchema,
  merchantOrderId: z.string(), providerTransactionId: z.string().optional(),
  amount: z.number().nonnegative(), status: paymentStatusSchema,
  createdAt: z.string(), confirmedAt: z.string().optional(), failureReason: z.string().optional(),
})
