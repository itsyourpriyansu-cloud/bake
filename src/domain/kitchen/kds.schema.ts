import { z } from 'zod'
import { fulfillmentModeSchema } from '../customer/customer.schema'
import { fulfillmentStatusSchema } from '../orders/order.schema'

export const kdsQueueSectionSchema = z.enum(['START_NOW', 'START_SOON', 'PREPARING', 'READY'])

export const kdsModifierSchema = z.object({
  groupId: z.string(),
  groupName: z.string(),
  optionId: z.string(),
  optionName: z.string(),
  critical: z.boolean(),
})

export const kdsOrderItemSchema = z.object({
  productId: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  size: z.string().optional(),
  base: z.string().optional(),
  modifiers: z.array(kdsModifierSchema),
  criticalInstructions: z.array(z.string()),
})

export const kdsOrderSchema = z.object({
  id: z.string(),
  publicOrderNumber: z.string(),
  fulfillmentType: fulfillmentModeSchema,
  fulfillmentStatus: fulfillmentStatusSchema,
  queuePosition: z.number().int().positive(),
  queueSection: kdsQueueSectionSchema,
  recommendedStartAt: z.string(),
  targetReadyAt: z.string(),
  remainingMinutes: z.number().int().nonnegative(),
  systemPrepMinutes: z.number().int().nonnegative(),
  effectivePrepMinutes: z.number().int().nonnegative(),
  overrideReason: z.string().optional(),
  kitchenNotes: z.array(z.string()),
  items: z.array(kdsOrderItemSchema),
})

export const kdsAvailabilityItemSchema = z.object({
  entityId: z.string(),
  entityType: z.enum(['PRODUCT', 'VARIANT', 'MODIFIER']),
  name: z.string(),
  parentName: z.string().optional(),
  effectiveStatus: z.enum(['AVAILABLE', 'OWNER_DISABLED', 'CHEF_TEMP_UNAVAILABLE', 'SYSTEM_DISABLED']),
  source: z.enum(['OWNER', 'CHEF', 'SYSTEM']).optional(),
  reason: z.string().optional(),
  startsAt: z.string().optional(),
  expiresAt: z.string().optional(),
  locked: z.boolean(),
})

export const kdsHeartbeatSchema = z.object({
  online: z.boolean(),
  device: z.literal('Kitchen Tablet #1'),
  lastSeenAt: z.string(),
})

export const kdsPrepTimeResponseSchema = z.object({
  order: kdsOrderSchema,
  customerNoticeNeeded: z.boolean(),
  severeDelay: z.boolean(),
})

export const kdsProblemResponseSchema = z.object({ ok: z.literal(true), attentionCreated: z.boolean() })
