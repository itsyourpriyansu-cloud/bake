import type { z } from 'zod'
import type { refundReasonSchema, refundSchema, refundStatusSchema } from './refund.schema'

export type RefundStatus = z.infer<typeof refundStatusSchema>
export type RefundReason = z.infer<typeof refundReasonSchema>
export type Refund = z.infer<typeof refundSchema>
