import type { z } from 'zod'
import type {
  customerActivitySchema, customerAddressSchema, customerPreferenceSchema, customerSchema,
  customerStageSchema, customerStatsSchema, demoCustomerViewSchema, fulfillmentModeSchema, loyaltyTierIdSchema,
} from './customer.schema'

export type FulfillmentMode = z.infer<typeof fulfillmentModeSchema>
export type LoyaltyTierId = z.infer<typeof loyaltyTierIdSchema>
export type CustomerStage = z.infer<typeof customerStageSchema>
export type CustomerActivity = z.infer<typeof customerActivitySchema>
export type CustomerAddress = z.infer<typeof customerAddressSchema>
export type CustomerPreference = z.infer<typeof customerPreferenceSchema>
export type CustomerStats = z.infer<typeof customerStatsSchema>
export type Customer = z.infer<typeof customerSchema>
export type DemoCustomerView = z.infer<typeof demoCustomerViewSchema>
