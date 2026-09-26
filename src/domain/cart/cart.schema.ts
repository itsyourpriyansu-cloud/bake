import { z } from 'zod'
import { fulfillmentModeSchema } from '../customer/customer.schema'
import { legacyProductViewSchema, productSchema } from '../catalog/catalog.schema'

export const cartItemModifierSelectionSchema = z.object({ groupId: z.string(), optionIds: z.array(z.string()) })
export const cartItemCustomizationSnapshotSchema = z.object({
  groupId: z.string(), groupName: z.string(), optionId: z.string(), optionName: z.string(), priceDelta: z.number(),
})

export const cartItemSchema = z.object({
  id: z.string(), cartId: z.string(), productId: z.string(),
  modifiers: z.array(cartItemModifierSelectionSchema).default([]),
  quantity: z.number().int().positive(), unitPriceSnapshot: z.number().nonnegative(),
  configurationKey: z.string().optional(), specialInstructions: z.string().optional(),
  customizationSummary: z.array(cartItemCustomizationSnapshotSchema).optional(), lineTotal: z.number().nonnegative().optional(),
})

export const cartSchema = z.object({
  id: z.string(), customerId: z.string().optional(), fulfillmentType: fulfillmentModeSchema,
  status: z.literal('ACTIVE'), couponCode: z.string().optional(), pointsRequested: z.number().int().nonnegative().default(0),
  createdAt: z.string(), updatedAt: z.string(),
  items: z.array(cartItemSchema.extend({ product: productSchema })),
})

/** Flat shape the Stage 1 UI already renders (CartItem + Product, no modifiers/quote fields). */
export const legacyCartSchema = z.object({
  id: z.string(), customerId: z.string().optional(), status: z.literal('ACTIVE'), updatedAt: z.string(),
  items: z.array(z.object({
    id: z.string(), cartId: z.string(), productId: z.string(), quantity: z.number().int().positive(),
    modifiers: z.array(cartItemModifierSelectionSchema).default([]), unitPriceSnapshot: z.number().nonnegative(),
    configurationKey: z.string().optional(), specialInstructions: z.string().optional(),
    customizationSummary: z.array(cartItemCustomizationSnapshotSchema).optional(), lineTotal: z.number().nonnegative().optional(),
    product: legacyProductViewSchema,
  })),
})
