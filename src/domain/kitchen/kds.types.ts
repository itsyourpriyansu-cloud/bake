import type { z } from 'zod'
import type {
  kdsAvailabilityItemSchema, kdsHeartbeatSchema, kdsModifierSchema, kdsOrderItemSchema,
  kdsOrderSchema, kdsPrepTimeResponseSchema, kdsProblemResponseSchema, kdsQueueSectionSchema,
} from './kds.schema'

export type KdsQueueSection = z.infer<typeof kdsQueueSectionSchema>
export type KdsModifier = z.infer<typeof kdsModifierSchema>
export type KdsOrderItem = z.infer<typeof kdsOrderItemSchema>
export type KdsOrder = z.infer<typeof kdsOrderSchema>
export type KdsAvailabilityItem = z.infer<typeof kdsAvailabilityItemSchema>
export type KdsHeartbeat = z.infer<typeof kdsHeartbeatSchema>
export type KdsPrepTimeResponse = z.infer<typeof kdsPrepTimeResponseSchema>
export type KdsProblemResponse = z.infer<typeof kdsProblemResponseSchema>
export type KdsProblemType = 'INGREDIENT_UNAVAILABLE' | 'KITCHEN_DELAY' | 'EQUIPMENT_ISSUE' | 'OTHER'
