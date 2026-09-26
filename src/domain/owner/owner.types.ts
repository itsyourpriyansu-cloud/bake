import type { z } from 'zod'
import type {
  customerTimelineItemSchema, ownerCustomer360Schema, ownerDashboardSchema, ownerOpportunitySchema,
  ownerOrderDetailSchema, ownerSupportItemSchema, storeOrderResultSchema,
} from './owner.schema'

export type OwnerDashboard = z.infer<typeof ownerDashboardSchema>
export type CustomerTimelineItem = z.infer<typeof customerTimelineItemSchema>
export type OwnerCustomer360 = z.infer<typeof ownerCustomer360Schema>
export type OwnerOrderDetail = z.infer<typeof ownerOrderDetailSchema>
export type OwnerOpportunity = z.infer<typeof ownerOpportunitySchema>
export type OwnerSupportItem = z.infer<typeof ownerSupportItemSchema>
export type StoreOrderResult = z.infer<typeof storeOrderResultSchema>

