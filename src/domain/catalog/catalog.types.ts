import type { z } from 'zod'
import type {
  badgeSchema, categorySchema, legacyProductViewSchema, menuResponseSchema,
  modifierGroupSchema, modifierOptionSchema, productDetailResponseSchema, productSchema, smartCollectionSchema, stationSchema,
  variantDependencySchema,
} from './catalog.schema'

export type Station = z.infer<typeof stationSchema>
export type ProductBadge = z.infer<typeof badgeSchema>
export type ModifierOption = z.infer<typeof modifierOptionSchema>
export type ModifierGroup = z.infer<typeof modifierGroupSchema>
export type VariantDependency = z.infer<typeof variantDependencySchema>
export type Category = z.infer<typeof categorySchema>
export type Product = z.infer<typeof productSchema>
export type SmartCollection = z.infer<typeof smartCollectionSchema>
export type MenuResponse = z.infer<typeof menuResponseSchema>
export type LegacyProductView = z.infer<typeof legacyProductViewSchema>
export type ProductDetailResponse = z.infer<typeof productDetailResponseSchema>
