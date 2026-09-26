import { z } from 'zod'
import { cartItemModifierSelectionSchema } from '../cart/cart.schema'
import { cartQuoteSchema } from '../pricing/pricing.schema'

export const savedOrderItemSchema = z.object({
  productId: z.string(), quantity: z.number().int().positive(), modifiers: z.array(cartItemModifierSelectionSchema).default([]),
})

export const savedOrderSchema = z.object({
  id: z.string(), customerId: z.string(), name: z.string().min(1), items: z.array(savedOrderItemSchema).min(1),
  createdAt: z.string(), updatedAt: z.string(),
})

export const favouriteSchema = z.object({
  id: z.string(), customerId: z.string(), kind: z.enum(['PRODUCT', 'COMBINATION']), name: z.string(),
  productId: z.string().optional(), items: z.array(savedOrderItemSchema).optional(), createdAt: z.string(),
})

export const foodPreferencesSchema = z.object({
  diet: z.enum(['VEG', 'NON_VEG', 'BOTH']), spiceLevel: z.enum(['MILD', 'MEDIUM', 'SPICY']),
  cheese: z.enum(['LIGHT', 'REGULAR', 'EXTRA']), avoid: z.array(z.string()), favouriteCategories: z.array(z.string()),
})

export const familyMemberSchema = z.object({
  id: z.string(), customerId: z.string(), name: z.string(), relation: z.string(),
  diet: z.enum(['VEG', 'NON_VEG', 'BOTH']), spiceLevel: z.enum(['MILD', 'MEDIUM', 'SPICY']),
  avoid: z.array(z.string()), favouriteProducts: z.array(z.string()),
})

export const celebrationSchema = z.object({
  id: z.string(), customerId: z.string(), type: z.enum(['BIRTHDAY', 'ANNIVERSARY', 'CUSTOM']),
  label: z.string(), relation: z.string(), day: z.number().int().min(1).max(31), month: z.number().int().min(1).max(12),
})

export const customerNotificationSchema = z.object({
  id: z.string(), customerId: z.string(), kind: z.enum(['ORDER', 'ETA', 'POINTS', 'REWARD', 'SYSTEM']),
  title: z.string(), message: z.string(), createdAt: z.string(), read: z.boolean(), orderId: z.string().optional(),
})

export const notificationPreferencesSchema = z.object({
  orderUpdates: z.boolean(), offers: z.boolean(), rewards: z.boolean(), celebrations: z.boolean(),
})

export const customerProfileSchema = z.object({
  id: z.string(), firstName: z.string(), maskedPhone: z.string(), tier: z.string(), pointsAvailable: z.number(),
  pointsPending: z.number(), defaultAddress: z.string().optional(), foodPreferences: foodPreferencesSchema,
  notificationPreferences: notificationPreferencesSchema,
})

export const waveIdTokenSchema = z.object({
  token: z.string(), issuedAt: z.string(), expiresAt: z.string(), firstName: z.string(), tier: z.string(), pointsAvailable: z.number(),
})

export const reorderChangeSchema = z.object({
  productId: z.string(), name: z.string(), kind: z.enum(['PRICE', 'PRODUCT_UNAVAILABLE', 'MODIFIER_UNAVAILABLE', 'MODIFIER_CHANGED']),
  message: z.string(),
})

export const reorderResultSchema = z.object({
  status: z.enum(['ADDED', 'REVIEW_REQUIRED']), changes: z.array(reorderChangeSchema), quote: cartQuoteSchema.optional(),
})

