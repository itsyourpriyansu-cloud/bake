import { z } from 'zod'

export const stationSchema = z.enum(['PIZZA', 'FRY', 'BEVERAGE', 'ASSEMBLY'])
export const badgeSchema = z.enum(['Bestseller', 'New', 'Veg', 'Spicy', 'Wave Exclusive', 'Customizable'])

export const variantDependencySchema = z.object({ groupId: z.string(), optionIds: z.array(z.string()).min(1) })
export const modifierOptionSchema = z.object({
  id: z.string(), name: z.string(), groupId: z.string(), priceDelta: z.number(),
  available: z.boolean().optional().default(true), variantDependencies: z.array(variantDependencySchema).default([]),
})
export const modifierGroupSchema = z.object({
  id: z.string(), name: z.string(), required: z.boolean(),
  minSelections: z.number().int().nonnegative().optional().default(0),
  maxSelections: z.number().int().positive().optional(),
  multiple: z.boolean().optional(),
  options: z.array(modifierOptionSchema),
})

export const categorySchema = z.object({ id: z.string(), name: z.string(), color: z.string(), sortOrder: z.number() })

export const productSchema = z.object({
  id: z.string(), slug: z.string(), name: z.string(), shortDescription: z.string(),
  categoryId: z.string(), basePrice: z.number().nonnegative(), veg: z.boolean(),
  badges: z.array(badgeSchema), imageKey: z.string(), available: z.boolean(),
  prepMinutes: z.number().int().nonnegative(), complexity: z.number().int().positive(), station: stationSchema,
  modifierGroups: z.array(modifierGroupSchema).optional(),
  recommendedPairings: z.array(z.string()).optional(),
})

export const smartCollectionSchema = z.object({ id: z.string(), name: z.string() })

export const menuResponseSchema = z.object({
  categories: z.array(categorySchema), products: z.array(productSchema), collections: z.array(smartCollectionSchema),
})

/** Flat product shape the Stage 1 UI already renders (mirrors previous shared/types/domain Product). */
export const legacyProductViewSchema = z.object({
  id: z.string(), name: z.string(), description: z.string(), category: z.string(), price: z.number(),
  veg: z.boolean(), available: z.boolean(), prepMinutes: z.number(), complexity: z.number(), station: stationSchema,
  image: z.string(), badges: z.array(badgeSchema), modifierGroups: z.array(modifierGroupSchema).optional(),
})

export const productDetailResponseSchema = z.object({
  product: legacyProductViewSchema,
  pairings: z.array(legacyProductViewSchema),
  pointsPreview: z.number().int().nonnegative(),
})
