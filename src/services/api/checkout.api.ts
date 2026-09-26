import { apiClient } from './client'
import { endpoints } from './endpoints'
import { checkoutOptionsSchema, checkoutSessionSchema } from '../../domain/checkout/checkout.schema'
import { orderIntentSchema } from '../../domain/orders/order.schema'
import type { CheckoutAddress } from '../../domain/checkout/checkout.types'
import type { FulfillmentMode } from '../../domain/customer/customer.types'

export interface CreateCheckoutSessionInput {
  fulfillmentType: FulfillmentMode
  addressSnapshot?: CheckoutAddress
  pickupSlot?: string
  phone: string
  instructions?: string
  note?: string
  pointsRequested?: number
}

export const getCheckoutOptions = async (fulfillmentType: FulfillmentMode) => checkoutOptionsSchema.parse((await apiClient.get(endpoints.checkoutOptions, { params: { fulfillmentType } })).data)
export const createCheckoutSession = async (input: CreateCheckoutSessionInput) => checkoutSessionSchema.parse((await apiClient.post(endpoints.checkoutSession, input)).data)
export const createOrderIntent = async (checkoutSessionId: string) => orderIntentSchema.parse((await apiClient.post(endpoints.checkoutIntent, { checkoutSessionId })).data)
export const getOrderIntent = async (id: string) => orderIntentSchema.parse((await apiClient.get(`${endpoints.checkoutIntent}/${id}`)).data)
