import type { z } from 'zod'
import type { cartItemCustomizationSnapshotSchema, cartItemModifierSelectionSchema, cartItemSchema, cartSchema, legacyCartSchema } from './cart.schema'

export type CartItemModifierSelection = z.infer<typeof cartItemModifierSelectionSchema>
export type CartItemCustomizationSnapshot = z.infer<typeof cartItemCustomizationSnapshotSchema>
export type CartItem = z.infer<typeof cartItemSchema>
export type Cart = z.infer<typeof cartSchema>
export type LegacyCart = z.infer<typeof legacyCartSchema>
