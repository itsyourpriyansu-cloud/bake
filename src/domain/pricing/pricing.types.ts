import type { z } from 'zod'
import type { cartQuoteSchema } from './pricing.schema'
import type { FulfillmentMode, LoyaltyTierId } from '../customer/customer.types'

export type CartQuote = z.infer<typeof cartQuoteSchema>

export interface PricingInput {
  items: Array<{ quantity: number; unitPrice: number }>
  fulfillmentType: FulfillmentMode
  customerTier: LoyaltyTierId
  pointsAvailable: number
  pointsRequested: number
  deliveryFeeTable: { DELIVERY: number; PICKUP: number; STORE: number }
  threshold?: { target: number; label: string }
  availabilityIssues?: NonNullable<CartQuote['availabilityIssues']>
}
