import { z } from 'zod'

export const refundStatusSchema = z.enum(['REQUESTED', 'APPROVED', 'SUBMITTED', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVIEW_REQUIRED'])
export const refundReasonSchema = z.enum(['ORDER_REJECTED', 'CANCELLATION', 'COMPLAINT_RESOLUTION'])

export const refundSchema = z.object({
  id: z.string(), orderId: z.string(), customerId: z.string(), amount: z.number().nonnegative(),
  pointsToReverse: z.number().int().nonnegative(), reason: refundReasonSchema, status: refundStatusSchema,
  createdAt: z.string(), resolvedAt: z.string().optional(), failureReason: z.string().optional(),
})
