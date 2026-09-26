import type { z } from 'zod'
import type { checkoutAddressSchema, checkoutOptionsSchema, checkoutSessionSchema } from './checkout.schema'

export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>
export type CheckoutSession = z.infer<typeof checkoutSessionSchema>
export type CheckoutOptions = z.infer<typeof checkoutOptionsSchema>
