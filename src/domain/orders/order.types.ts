import type { z } from 'zod'
import type {
  acceptanceStatusSchema, fulfillmentStatusSchema, orderEventSchema, orderEventTypeSchema,
  orderIntentSchema, orderItemSchema, orderSchema, orderSourceSchema,
} from './order.schema'

export type AcceptanceStatus = z.infer<typeof acceptanceStatusSchema>
export type FulfillmentStatus = z.infer<typeof fulfillmentStatusSchema>
export type OrderSource = z.infer<typeof orderSourceSchema>
export type OrderIntent = z.infer<typeof orderIntentSchema>
export type OrderItem = z.infer<typeof orderItemSchema>
export type Order = z.infer<typeof orderSchema>
export type OrderEventType = z.infer<typeof orderEventTypeSchema>
export type OrderEvent = z.infer<typeof orderEventSchema>
