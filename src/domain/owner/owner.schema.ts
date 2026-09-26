import { z } from 'zod'
import { storeConfigSchema } from '../store/store.schema'
import { customerSchema } from '../customer/customer.schema'
import { orderEventSchema, orderSchema } from '../orders/order.schema'
import { loyaltyTransactionSchema } from '../loyalty/loyalty.schema'
import { crmOpportunitySchema } from '../retention/retention.schema'

export const ownerKpiSchema = z.object({ label: z.string(), value: z.string(), detail: z.string() })

export const ownerDashboardSchema = z.object({
  store: storeConfigSchema,
  kpis: z.array(ownerKpiSchema),
  live: z.object({
    awaitingReview: z.number().int().nonnegative(), preparing: z.number().int().nonnegative(),
    ready: z.number().int().nonnegative(), deliveryActive: z.number().int().nonnegative(), pickupActive: z.number().int().nonnegative(),
  }),
  kitchen: z.object({
    loadPercent: z.number().nonnegative(), kdsOnline: z.boolean(), nextCapacityAt: z.string(),
    averagePrepMinutes: z.number().nonnegative(), ordersAtRisk: z.number().int().nonnegative(),
    delayedOrders: z.number().int().nonnegative(), etaAccuracyPercent: z.number().nonnegative(),
  }),
  growth: z.object({
    newCustomers: z.number().int().nonnegative(), returningCustomers: z.number().int().nonnegative(),
    reactivatedCustomers: z.number().int().nonnegative(), secondOrderPending: z.number().int().nonnegative(),
  }),
  loyalty: z.object({
    member: z.number().int().nonnegative(), silver: z.number().int().nonnegative(), gold: z.number().int().nonnegative(),
    platinum: z.number().int().nonnegative(), pointsIssued: z.number().int(), pointsRedeemed: z.number().int(), pointsPending: z.number().int(),
  }),
})

export const customerTimelineItemSchema = z.object({
  id: z.string(), type: z.string(), title: z.string(), detail: z.string(), at: z.string(),
})

export const ownerCustomer360Schema = z.object({
  customer: customerSchema,
  recentOrders: z.array(orderSchema),
  loyaltyHistory: z.array(loyaltyTransactionSchema),
  timeline: z.array(customerTimelineItemSchema),
  sourceSplit: z.object({ delivery: z.number(), pickup: z.number(), store: z.number() }),
  pointsExpiring: z.number().int().nonnegative(),
})

export const ownerOrderDetailSchema = z.object({ order: orderSchema, events: z.array(orderEventSchema) })

export const ownerOpportunitySchema = crmOpportunitySchema

export const ownerSupportItemSchema = z.object({
  supportCase: z.object({
    id: z.string(), conversationId: z.string().optional(), orderId: z.string().optional(), customerId: z.string(),
    category: z.string(), status: z.string(), description: z.string(), createdAt: z.string(), resolvedAt: z.string().optional(), refundId: z.string().optional(),
  }),
  customer: customerSchema,
  order: orderSchema.optional(),
  messages: z.array(z.object({ id: z.string(), conversationId: z.string(), from: z.string(), text: z.string(), intent: z.string().optional(), channel: z.string().optional(), messageType: z.string().optional(), at: z.string() })),
})

export const storeOrderResultSchema = z.object({
  order: orderSchema, paymentStatus: z.literal('CONFIRMED'), acceptanceOutcome: z.enum(['ACCEPTED', 'REVIEW_REQUIRED']), demoOnly: z.literal(true),
})
