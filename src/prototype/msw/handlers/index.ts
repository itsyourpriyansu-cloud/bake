import { catalogHandlers } from './catalog.handlers'
import { configHandlers } from './config.handlers'
import { availabilityHandlers } from './availability.handlers'
import { cartHandlers } from './cart.handlers'
import { checkoutHandlers } from './checkout.handlers'
import { paymentHandlers } from './payment.handlers'
import { ordersHandlers } from './orders.handlers'
import { ownerHandlers } from './owner.handlers'
import { kdsHandlers } from './kds.handlers'
import { loyaltyHandlers } from './loyalty.handlers'
import { crmHandlers } from './crm.handlers'
import { chatHandlers } from './chat.handlers'
import { supportHandlers } from './support.handlers'
import { refundHandlers } from './refund.handlers'
import { authHandlers } from './auth.handlers'
import { demoHandlers } from './demo.handlers'
import { customerHandlers } from './customer.handlers'
import { retentionHandlers } from './retention.handlers'

export const handlers = [
  ...catalogHandlers, ...configHandlers, ...availabilityHandlers, ...cartHandlers, ...checkoutHandlers,
  ...paymentHandlers, ...ordersHandlers, ...ownerHandlers, ...kdsHandlers, ...loyaltyHandlers, ...crmHandlers,
  ...chatHandlers, ...supportHandlers, ...refundHandlers, ...authHandlers, ...customerHandlers, ...retentionHandlers, ...demoHandlers,
]
