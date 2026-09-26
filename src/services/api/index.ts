import * as catalog from './catalog.api'
import * as cart from './cart.api'
import * as checkout from './checkout.api'
import * as payment from './payment.api'
import * as orders from './order.api'
import * as owner from './owner.api'
import * as kds from './kds.api'
import * as loyalty from './loyalty.api'
import * as chat from './chat.api'
import * as support from './support.api'
import * as refund from './refund.api'
import * as auth from './auth.api'
import * as crm from './crm.api'
import * as config from './config.api'
import * as availability from './availability.api'
import * as demo from './demo.api'
import * as customer from './customer.api'
import * as retention from './retention.api'

/**
 * The single import surface the frontend should use: `api.catalog.getMenu()`,
 * `api.owner.acceptOwnerOrder(orderId)`, `api.kds.updatePrepTime(orderId, 28, reason)`, etc.
 * Every function here is a thin, Zod-validated axios call against /api/v1 — swapping MSW for a
 * real FastAPI backend later only touches src/prototype/msw, never this file or its callers.
 */
export const api = { catalog, cart, checkout, payment, orders, owner, kds, loyalty, chat, support, refund, auth, crm, config, availability, demo, customer, retention }

export { endpoints } from './endpoints'
export { apiClient } from './client'
