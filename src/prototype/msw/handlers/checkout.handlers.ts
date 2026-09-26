import { http } from 'msw'
import { db } from '../../database/db'
import { createId } from '../../../domain/shared/ids'
import { buildCartSnapshot } from '../../../domain/cart/cart.logic'
import type { CheckoutAddress, CheckoutSession } from '../../../domain/checkout/checkout.types'
import type { FulfillmentMode } from '../../../domain/customer/customer.types'
import { API, boot, error, getCapabilities, json, now } from './_shared'
import { getCart, getQuote } from './cart.handlers'
import { getActiveCustomerSession } from '../../services/customer-session'

interface CheckoutSessionInput {
  fulfillmentType: FulfillmentMode
  addressSnapshot?: CheckoutAddress
  pickupSlot?: string
  phone: string
  instructions?: string
  note?: string
  pointsRequested?: number
}

function pickupSlots(from: Date): string[] {
  const start = new Date(from)
  start.setSeconds(0, 0)
  start.setMinutes(Math.ceil((start.getMinutes() + 15) / 15) * 15)
  return Array.from({ length: 3 }, (_, index) => {
    const slotStart = new Date(start.getTime() + index * 15 * 60_000)
    const slotEnd = new Date(slotStart.getTime() + 10 * 60_000)
    const time = (date: Date) => date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })
    return `${time(slotStart)}–${time(slotEnd)}`
  })
}

export const checkoutHandlers = [
  http.get(`${API}/checkout/options`, async ({ request }) => {
    await boot()
    const session = await getActiveCustomerSession(now())
    if (!session) return error('Customer authentication required', 401)
    const customer = await db.customers.get(session.customerId)
    if (!customer) return error('Customer not found', 404)
    const mode = (new URL(request.url).searchParams.get('fulfillmentType') ?? 'DELIVERY') as FulfillmentMode
    const current = now()
    const systemEta = new Date(current.getTime() + (mode === 'DELIVERY' ? 40 : 25) * 60_000).toISOString()
    const address = customer.addresses.find((candidate) => candidate.isDefault)
    return json({
      fulfillmentType: mode, systemEta, etaLabel: mode === 'DELIVERY' ? '35–45 min' : 'Ready in 20–30 min',
      pickupSlots: mode === 'PICKUP' ? pickupSlots(current) : [],
      customer: { phone: customer.phone.replace('+91', ''), defaultAddress: address ? { line1: address.line1, city: address.city, pincode: address.pincode } : undefined },
    })
  }),

  http.post(`${API}/checkout/session`, async ({ request }) => {
    await boot()
    const auth = await getActiveCustomerSession(now())
    if (!auth) return error('Customer authentication required', 401)
    const body = await request.json() as CheckoutSessionInput
    if (!['DELIVERY', 'PICKUP'].includes(body.fulfillmentType)) return error('Choose Delivery or Pickup', 422)
    if (body.fulfillmentType === 'DELIVERY' && (!body.addressSnapshot?.line1 || !/^\d{6}$/.test(body.addressSnapshot.pincode))) return error('A valid delivery address is required', 422)
    if (body.fulfillmentType === 'PICKUP' && !body.pickupSlot) return error('Choose a generated pickup slot', 422)
    const capabilities = await getCapabilities()
    if (body.fulfillmentType === 'DELIVERY' && !capabilities.delivery.enabled) return error('Delivery is currently paused', 409)
    if (body.fulfillmentType === 'PICKUP' && !capabilities.pickup.enabled) return error('Pickup is currently paused', 409)
    const cart = await getCart()
    const quote = await getQuote(body.fulfillmentType, body.pointsRequested ?? 0)
    if (!quote.valid) return error(quote.availabilityIssues?.[0]?.message ?? 'Cart needs attention before checkout', 409)
    const current = now()
    const session: CheckoutSession = {
      id: createId('CHECKOUT'), customerId: auth.customerId, cartId: cart.id, fulfillmentType: body.fulfillmentType,
      addressSnapshot: body.addressSnapshot, pickupSlot: body.pickupSlot, phone: body.phone,
      instructions: body.instructions?.trim() || undefined, note: body.note?.trim() || undefined,
      quoteSnapshot: quote, systemEta: new Date(current.getTime() + (body.fulfillmentType === 'DELIVERY' ? 40 : 25) * 60_000).toISOString(),
      status: 'OPEN', createdAt: current.toISOString(), expiresAt: new Date(current.getTime() + 15 * 60_000).toISOString(),
    }
    await db.checkoutSessions.add(session)
    return json(session, 201)
  }),

  http.post(`${API}/checkout/order-intent`, async ({ request }) => {
    await boot()
    const auth = await getActiveCustomerSession(now())
    if (!auth) return error('Customer authentication required', 401)
    const { checkoutSessionId } = await request.json() as { checkoutSessionId: string }
    const checkout = await db.checkoutSessions.get(checkoutSessionId)
    if (!checkout || checkout.customerId !== auth.customerId) return error('Checkout session not found', 404)
    const existing = await db.orderIntents.filter((intent) => intent.checkoutSessionId === checkout.id).first()
    if (existing) return json(existing)
    if (checkout.status !== 'OPEN' || new Date(checkout.expiresAt) <= now()) return error('Checkout session expired', 409)
    const cart = await getCart()
    if (cart.items.length === 0) return error('Cart is empty', 422)
    const quote = await getQuote(checkout.fulfillmentType, checkout.quoteSnapshot.pointsRequested)
    if (!quote.valid) return error(quote.availabilityIssues?.[0]?.message ?? 'Cart needs attention before payment', 409)
    const current = now()
    const intent = {
      id: createId('INTENT'), checkoutSessionId: checkout.id, customerId: auth.customerId, fulfillmentType: checkout.fulfillmentType,
      cartSnapshot: buildCartSnapshot(cart), addressSnapshot: checkout.addressSnapshot, pickupSlot: checkout.pickupSlot,
      customerPhone: checkout.phone, instructions: checkout.instructions, note: checkout.note,
      quoteSnapshot: quote, expectedPromiseAt: checkout.systemEta,
      expiresAt: new Date(current.getTime() + 15 * 60_000).toISOString(), status: 'OPEN' as const, createdAt: current.toISOString(),
    }
    await db.transaction('rw', db.orderIntents, db.checkoutSessions, async () => {
      await db.orderIntents.add(intent)
      await db.checkoutSessions.update(checkout.id, { status: 'CONSUMED' })
    })
    return json(intent, 201)
  }),

  http.get(`${API}/checkout/order-intent/:id`, async ({ params }) => {
    await boot()
    const intent = await db.orderIntents.get(String(params.id))
    return intent ? json(intent) : error('Order intent not found', 404)
  }),
]

export { pickupSlots }
