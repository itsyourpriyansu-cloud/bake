import { z } from 'zod'
import { fulfillmentModeSchema } from '../customer/customer.schema'
import { cartQuoteSchema } from '../pricing/pricing.schema'

export const checkoutAddressSchema = z.object({ line1: z.string().min(2), city: z.string().min(2), pincode: z.string().regex(/^\d{6}$/) })

export const checkoutSessionSchema = z.object({
  id: z.string(), customerId: z.string(), cartId: z.string(), fulfillmentType: fulfillmentModeSchema,
  addressSnapshot: checkoutAddressSchema.optional(), pickupSlot: z.string().optional(), phone: z.string(),
  instructions: z.string().optional(), note: z.string().optional(), quoteSnapshot: cartQuoteSchema,
  systemEta: z.string(), status: z.enum(['OPEN', 'CONSUMED', 'EXPIRED']), createdAt: z.string(), expiresAt: z.string(),
})

export const checkoutOptionsSchema = z.object({
  fulfillmentType: fulfillmentModeSchema, systemEta: z.string(), etaLabel: z.string(), pickupSlots: z.array(z.string()),
  customer: z.object({ phone: z.string(), defaultAddress: checkoutAddressSchema.optional() }),
})
