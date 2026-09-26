export type { FulfillmentMode } from '../customer/customer.types'

export interface ScheduleInput {
  items: Array<{ productId: string; prepMinutes: number; complexity: number; station: string; quantity: number }>
  fulfillmentType: 'DELIVERY' | 'PICKUP' | 'STORE'
  pickupSlot?: string
  activeOrderCount: number
  kitchenCapacityCount: number
  packingMinutes: number
  pickupBufferMinutes: number
  deliveryBufferMinutes: number
  now: Date
}

export interface ScheduleOutput {
  systemPrepMinutes: number
  prepStartAt: string
  targetReadyAt: string
  dispatchTargetAt?: string
  promiseWindowStart: string
  promiseWindowEnd: string
  loadPercent: number
  reviewRequired: boolean
  reviewReason?: string
}
