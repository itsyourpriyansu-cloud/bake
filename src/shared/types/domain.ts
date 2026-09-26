/**
 * Stage 1 UI compatibility barrel. These are the flat "legacy view" shapes the current
 * customer surfaces render — real business logic and validation live in src/domain/*.
 * New frontend work should import directly from src/domain/* and src/services/api/*.
 */
export type { FulfillmentMode } from '../../domain/customer/customer.types'
export type { Station, ProductBadge, ModifierOption, ModifierGroup, Category, LegacyProductView as Product } from '../../domain/catalog/catalog.types'
export type { LegacyCart as Cart } from '../../domain/cart/cart.types'
export type { CartQuote } from '../../domain/pricing/pricing.types'
export type { DemoCustomerView } from '../../domain/customer/customer.types'
export type { LoyaltySummary } from '../../domain/loyalty/loyalty.types'
export type { Capabilities } from '../../domain/store/store.types'

export interface CartItem { id: string; cartId: string; productId: string; quantity: number }

/** Browser-session shapes only (sessionStorage), deliberately separate from the server-side domain/auth session records. */
export interface CustomerSession { realm: 'customer'; customerId: string; expiresAt: string }
export interface OwnerSession { realm: 'owner'; email: string; expiresAt: string }
export interface KdsSession { realm: 'kds'; device: string; expiresAt: string }
