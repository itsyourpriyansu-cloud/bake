import { apiClient } from './client'
import { endpoints } from './endpoints'
import { legacyCartSchema } from '../../domain/cart/cart.schema'
import { cartQuoteSchema } from '../../domain/pricing/pricing.schema'
import type { FulfillmentMode } from '../../domain/customer/customer.types'
import type { CartItemModifierSelection } from '../../domain/cart/cart.types'

export const getCart = async () => legacyCartSchema.parse((await apiClient.get(endpoints.cart)).data)
export interface CartItemWrite { productId: string; quantity?: number; modifiers?: CartItemModifierSelection[]; specialInstructions?: string }
export interface CartItemPatch { quantity?: number; modifiers?: CartItemModifierSelection[]; specialInstructions?: string }

export const addCartItem = async (input: string | CartItemWrite, quantity = 1, modifiers?: CartItemModifierSelection[]) => {
  const payload = typeof input === 'string' ? { productId: input, quantity, modifiers } : input
  return legacyCartSchema.parse((await apiClient.post(endpoints.cartItems, payload)).data)
}
export const updateCartItem = async (itemId: string, patch: CartItemPatch) => legacyCartSchema.parse((await apiClient.patch(`${endpoints.cartItems}/${itemId}`, patch)).data)
export const removeCartItem = async (itemId: string) => legacyCartSchema.parse((await apiClient.delete(`${endpoints.cartItems}/${itemId}`)).data)
export const quoteCart = async (fulfillmentMode: FulfillmentMode = 'DELIVERY', pointsRequested = 0) => cartQuoteSchema.parse((await apiClient.post(endpoints.cartQuote, { fulfillmentMode, pointsRequested })).data)
