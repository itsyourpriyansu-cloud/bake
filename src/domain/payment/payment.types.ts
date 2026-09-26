import type { z } from 'zod'
import type { paymentAttemptSchema, paymentProviderSchema, paymentStatusSchema } from './payment.schema'

export type PaymentStatus = z.infer<typeof paymentStatusSchema>
export type PaymentProviderName = z.infer<typeof paymentProviderSchema>
export type PaymentAttempt = z.infer<typeof paymentAttemptSchema>
