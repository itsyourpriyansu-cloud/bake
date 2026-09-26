import { z } from 'zod'
import { fulfillmentModeSchema } from '../customer/customer.schema'
import { paymentStatusSchema } from '../payment/payment.schema'
import { cartQuoteSchema } from '../pricing/pricing.schema'

export const acceptanceStatusSchema = z.enum(['NOT_APPLICABLE', 'AWAITING_ACCEPTANCE', 'REVIEW_REQUIRED', 'ACCEPTED', 'REJECTED'])
export const fulfillmentStatusSchema = z.enum(['NOT_STARTED', 'SCHEDULED', 'PREP_DUE', 'PREPARING', 'READY', 'DISPATCHED', 'PICKED_UP', 'DELIVERED', 'STORE_COMPLETED', 'CANCELLED'])
export const orderSourceSchema = z.enum(['PWA', 'STORE_SELF', 'STORE_ASSISTED', 'WHATSAPP_DRAFT'])

export const orderIntentSchema = z.object({
  id: z.string(), customerId: z.string(), fulfillmentType: fulfillmentModeSchema,
  checkoutSessionId: z.string().optional(),
  cartSnapshot: z.object({ cartId: z.string(), items: z.array(z.object({ productId: z.string(), quantity: z.number(), unitPrice: z.number(), name: z.string(), modifiers: z.array(z.object({ groupId: z.string(), optionIds: z.array(z.string()) })).optional() })), takenAt: z.string() }),
  addressSnapshot: z.object({ line1: z.string(), city: z.string(), pincode: z.string() }).optional(),
  pickupSlot: z.string().optional(),
  customerPhone: z.string().optional(), instructions: z.string().optional(), note: z.string().optional(),
  quoteSnapshot: cartQuoteSchema,
  expectedPromiseAt: z.string(),
  expiresAt: z.string(),
  status: z.enum(['OPEN', 'CONSUMED', 'EXPIRED']),
  createdAt: z.string(),
})

export const orderItemSchema = z.object({
  productId: z.string(), name: z.string(), quantity: z.number().int().positive(), unitPrice: z.number().nonnegative(),
  modifiers: z.array(z.object({ groupId: z.string(), optionIds: z.array(z.string()) })).optional(),
})

export const orderSchema = z.object({
  id: z.string(), publicOrderNumber: z.string(), customerId: z.string(), source: orderSourceSchema,
  fulfillmentType: fulfillmentModeSchema,
  paymentStatus: paymentStatusSchema, acceptanceStatus: acceptanceStatusSchema, fulfillmentStatus: fulfillmentStatusSchema,
  refundStatus: z.enum(['NONE', 'REQUESTED', 'APPROVED', 'SUBMITTED', 'PROCESSING', 'SUCCESS', 'FAILED', 'REVIEW_REQUIRED']),
  items: z.array(orderItemSchema),
  financialSnapshot: cartQuoteSchema,
  systemPrepMinutes: z.number().int().nonnegative(),
  chefOverrideMinutes: z.number().int().nonnegative().optional(),
  effectivePrepMinutes: z.number().int().nonnegative(),
  overrideReason: z.string().optional(),
  overrideAt: z.string().optional(),
  overrideBy: z.string().optional(),
  recommendedStartAt: z.string().optional(),
  prepStartAt: z.string().optional(),
  actualPrepStartedAt: z.string().optional(),
  targetReadyAt: z.string().optional(),
  actualReadyAt: z.string().optional(),
  promisedAt: z.string().optional(),
  kitchenNotes: z.array(z.string()).optional(),
  acceptedAt: z.string().optional(),
  rejectedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  createdAt: z.string(),
  orderIntentId: z.string(),
  paymentId: z.string(),
})

export const orderEventTypeSchema = z.enum([
  'PAYMENT_CONFIRMED', 'ORDER_REVIEW_REQUIRED', 'ORDER_ACCEPTED', 'ORDER_REJECTED',
  'FULFILLMENT_SCHEDULED', 'PREP_DUE', 'PREP_STARTED', 'PREP_TIME_OVERRIDDEN', 'ORDER_READY',
  'ORDER_DISPATCHED', 'ORDER_COMPLETED', 'CANCELLATION_REQUESTED', 'REFUND_REQUESTED', 'REFUND_COMPLETED',
  'COMPLAINT_CREATED', 'COMPLAINT_RESOLVED', 'AVAILABILITY_CHANGED', 'POINTS_CREDITED', 'TIER_CHANGED',
  'KITCHEN_PROBLEM_REPORTED',
])

export const orderEventSchema = z.object({
  id: z.string(), orderId: z.string(), type: orderEventTypeSchema, actor: z.enum(['CUSTOMER', 'OWNER', 'CHEF', 'SYSTEM']),
  at: z.string(), metadata: z.record(z.string(), z.unknown()).optional(),
})
