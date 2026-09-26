import { http, HttpResponse } from 'msw'
import type { BakeryBespokeRequest, BakeryCartItem, BakeryEvent, BakeryFulfillment, BakeryOrder, BakeryProductionStatus, BakeryQuote, BakerySavedDesign, BakerySelection, BakerySettings } from '../../domain/bakery/bakery.types'
import { bakeryDb, ensureBakerySeed, resetBakeryDemo } from './bakery.db'
import { publishBakeryEvent } from './bakery.events'

const API = '/api/bakery/v1'
const json = <T,>(value: T, status = 200) => HttpResponse.json(value as never, { status })
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
const DEMO_CUSTOMER_PHONE = '9876543210'

const defaultSettings: BakerySettings = { storeOrderingEnabled: true, deliveryEnabled: true, pickupEnabled: true, safeAutoAcceptance: 'HYBRID', productionCapacity: 8 }

async function readSettings(): Promise<BakerySettings> {
  const keys = Object.keys(defaultSettings) as Array<keyof BakerySettings>
  const values = await Promise.all(keys.map((key) => bakeryDb.config.get(key)))
  return keys.reduce((settings, key, index) => ({ ...settings, [key]: values[index]?.value ?? defaultSettings[key] }), {} as BakerySettings)
}

async function hydratedCart() {
  await ensureBakerySeed()
  const items = await bakeryDb.cartItems.toArray()
  return Promise.all(items.map(async (item) => ({ ...item, product: await bakeryDb.products.get(item.productId) })))
}

function optionPrice(product: NonNullable<BakeryCartItem['product']>, selections: BakerySelection[]) {
  const ids = new Set(selections.flatMap((selection) => selection.optionIds))
  return product.basePrice + product.modifierGroups.flatMap((group) => group.options).filter((option) => ids.has(option.id)).reduce((sum, option) => sum + option.priceDelta, 0)
}

async function quote(fulfillment: BakeryFulfillment, pointsRequested = 0): Promise<BakeryQuote> {
  const items = await hydratedCart()
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const pointsAvailable = Number((await bakeryDb.config.get('pointsAvailable'))?.value ?? 0)
  const pointsUsable = Math.min(pointsAvailable, Math.floor(subtotal * .2), pointsRequested)
  const discount = subtotal >= 1499 ? 150 : 0
  const deliveryFee = fulfillment === 'DELIVERY' && subtotal < 999 ? 59 : 0
  const total = Math.max(0, subtotal - discount - pointsUsable + deliveryFee)
  return { itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotal, discount, pointsRequested, pointsUsable, pointsValue: pointsUsable, deliveryFee, pointsToEarn: Math.floor((subtotal - discount) / 10), total, valid: items.length > 0 && items.every((item) => item.product?.available), warnings: [], }
}

export const getBakeryQuote = quote

export const bakeryHandlers = [
  http.get(`${API}/catalog`, async () => { await ensureBakerySeed(); return json({ products: await bakeryDb.products.toArray() }) }),
  http.get(`${API}/products/:productId`, async ({ params }) => { await ensureBakerySeed(); const product = await bakeryDb.products.get(String(params.productId)); return product ? json(product) : json({ message: 'Product not found' }, 404) }),
  http.get(`${API}/cart`, async () => json({ items: await hydratedCart(), quote: await quote('DELIVERY') })),
  http.post(`${API}/cart/items`, async ({ request }) => {
    await ensureBakerySeed()
    const body = await request.json() as { productId: string; quantity?: number; selections?: BakerySelection[]; message?: string; eventType?: BakeryEvent; eventDate?: string }
    const product = await bakeryDb.products.get(body.productId)
    if (!product?.available) return json({ message: 'This bake is temporarily unavailable.' }, 409)
    const selections = body.selections ?? product.modifierGroups.filter((group) => group.required).map((group) => ({ groupId: group.id, optionIds: [group.options.find((option) => option.recommended)?.id ?? group.options[0].id] }))
    const item: BakeryCartItem = { id: id('BCI'), productId: product.id, quantity: body.quantity ?? 1, unitPrice: optionPrice(product, selections), selections, message: body.message, eventType: body.eventType, eventDate: body.eventDate }
    await bakeryDb.cartItems.put(item); publishBakeryEvent('CART_UPDATED', item)
    return json({ item: { ...item, product }, quote: await quote('DELIVERY') }, 201)
  }),
  http.patch(`${API}/cart/items/:itemId`, async ({ params, request }) => {
    const body = await request.json() as { quantity: number }; const itemId = String(params.itemId)
    if (body.quantity <= 0) await bakeryDb.cartItems.delete(itemId); else await bakeryDb.cartItems.update(itemId, { quantity: body.quantity })
    publishBakeryEvent('CART_UPDATED'); return json({ items: await hydratedCart(), quote: await quote('DELIVERY') })
  }),
  http.delete(`${API}/cart/items/:itemId`, async ({ params }) => { await bakeryDb.cartItems.delete(String(params.itemId)); publishBakeryEvent('CART_UPDATED'); return json({ items: await hydratedCart(), quote: await quote('DELIVERY') }) }),
  http.post(`${API}/cart/quote`, async ({ request }) => { const body = await request.json() as { fulfillment?: BakeryFulfillment; pointsRequested?: number }; return json(await quote(body.fulfillment ?? 'DELIVERY', body.pointsRequested ?? 0)) }),
  http.post(`${API}/auth/request-otp`, async ({ request }) => { const { phone } = await request.json() as { phone: string }; return /^\d{10}$/.test(phone) ? json({ challengeId: 'BAKERY-OTP-DEMO', sentVia: 'WHATSAPP_SIMULATION' }) : json({ message: 'Enter a valid 10-digit phone number.' }, 400) }),
  http.post(`${API}/auth/verify-otp`, async ({ request }) => { const body = await request.json() as { phone: string; otp: string }; return body.phone === '9876543210' && body.otp === '123456' ? json({ customerId: 'BAKERY-CUSTOMER-PRIYANSHU', name: 'Priyanshu', points: 182, expiresAt: new Date(Date.now() + 86400000).toISOString() }) : json({ message: 'Incorrect demo OTP.' }, 401) }),
  http.post(`${API}/checkout`, async ({ request }) => {
    const body = await request.json() as { fulfillment: BakeryFulfillment; eventDate: string; slot: string; note?: string; pointsRequested?: number }
    const settings = await readSettings()
    if (!settings.storeOrderingEnabled) return json({ message: 'Ordering is paused right now. Please check back shortly.' }, 409)
    if (body.fulfillment === 'DELIVERY' && !settings.deliveryEnabled) return json({ message: 'Delivery is paused right now. Try pickup instead.' }, 409)
    if (body.fulfillment === 'PICKUP' && !settings.pickupEnabled) return json({ message: 'Pickup is paused right now. Try delivery instead.' }, 409)
    const cartItems = await hydratedCart(); if (!cartItems.length) return json({ message: 'Your basket is empty.' }, 409)
    const paymentId = id('BAKERY-PAY'); await bakeryDb.config.put({ key: `payment:${paymentId}`, value: { ...body, items: cartItems, quote: await quote(body.fulfillment, body.pointsRequested) } })
    return json({ paymentId })
  }),
  http.post(`${API}/payments/:paymentId/simulate`, async ({ params, request }) => {
    const { outcome } = await request.json() as { outcome: 'SUCCESS' | 'FAILURE' | 'PENDING' }
    const record = await bakeryDb.config.get(`payment:${String(params.paymentId)}`)
    if (!record) return json({ message: 'Payment session expired.' }, 404)
    if (outcome !== 'SUCCESS') return json({ status: outcome })
    const pending = record.value as { fulfillment: BakeryFulfillment; eventDate: string; slot: string; note?: string; items: BakeryCartItem[]; quote: BakeryQuote }
    const sequenceRecord = await bakeryDb.config.get('orderSequence'); const sequence = Number(sequenceRecord?.value ?? 240) + 1
    const order: BakeryOrder = { id: id('BKO'), publicNumber: `BW${sequence}`, customerName: 'Priyanshu', customerPhone: '9876543210', fulfillment: pending.fulfillment, eventDate: pending.eventDate, slot: pending.slot, items: pending.items, quote: pending.quote, paymentStatus: 'CONFIRMED', productionStatus: 'AWAITING_ACCEPTANCE', promisedAt: `${pending.eventDate}T${pending.slot}:00+05:30`, createdAt: new Date().toISOString(), note: pending.note }
    await bakeryDb.transaction('rw', bakeryDb.orders, bakeryDb.cartItems, bakeryDb.config, async () => { await bakeryDb.orders.put(order); await bakeryDb.cartItems.clear(); await bakeryDb.config.put({ key: 'orderSequence', value: sequence }) })
    publishBakeryEvent('ORDER_PAID', order); return json({ status: 'SUCCESS', order })
  }),
  http.get(`${API}/orders`, async () => { await ensureBakerySeed(); return json({ orders: (await bakeryDb.orders.orderBy('createdAt').reverse().toArray()) }) }),
  http.get(`${API}/orders/:orderId`, async ({ params }) => { const order = await bakeryDb.orders.get(String(params.orderId)); return order ? json(order) : json({ message: 'Order not found' }, 404) }),
  http.patch(`${API}/orders/:orderId/status`, async ({ params, request }) => {
    const { status } = await request.json() as { status: BakeryProductionStatus }
    const orderId = String(params.orderId)
    const current = await bakeryDb.orders.get(orderId)
    if (!current) return json({ message: 'Order not found' }, 404)
    const transitions: Partial<Record<BakeryProductionStatus, BakeryProductionStatus[]>> = {
      AWAITING_ACCEPTANCE: ['SCHEDULED', 'REJECTED'], SCHEDULED: ['MIXING'], MIXING: ['BAKING'], BAKING: ['COOLING'],
      COOLING: ['DECORATING'], DECORATING: ['PACKING'], PACKING: ['READY'], READY: ['COMPLETED'],
    }
    if (!transitions[current.productionStatus]?.includes(status)) return json({ message: `Cannot move ${current.productionStatus} to ${status}. Refresh the order and try again.` }, 409)
    await bakeryDb.orders.update(orderId, { productionStatus: status, ...(status === 'REJECTED' ? { paymentStatus: 'REFUNDING' as const } : {}) })
    publishBakeryEvent('ORDER_UPDATED', { orderId, status })
    return json(await bakeryDb.orders.get(orderId))
  }),
  http.patch(`${API}/orders/:orderId/note`, async ({ params, request }) => { const { note } = await request.json() as { note: string }; const orderId = String(params.orderId); await bakeryDb.orders.update(orderId, { note }); publishBakeryEvent('ORDER_UPDATED', { orderId, note }); return json(await bakeryDb.orders.get(orderId)) }),
  http.post(`${API}/bespoke`, async ({ request }) => { const body = await request.json() as Omit<BakeryBespokeRequest, 'id' | 'status' | 'createdAt'>; const value: BakeryBespokeRequest = { ...body, id: id('BRQ'), status: 'NEW', createdAt: new Date().toISOString() }; await bakeryDb.bespokeRequests.put(value); publishBakeryEvent('BESPOKE_REQUEST', value); return json(value, 201) }),
  http.patch(`${API}/bespoke/:requestId`, async ({ params, request }) => {
    const body = await request.json() as Partial<Pick<BakeryBespokeRequest, 'status' | 'quoteAmount' | 'referenceApprovalStatus' | 'referenceReviewNote' | 'referenceReviewedAt'>>
    const requestId = String(params.requestId)
    const changes: Partial<BakeryBespokeRequest> = {}
    if (body.status !== undefined) changes.status = body.status
    if (body.quoteAmount !== undefined) changes.quoteAmount = body.quoteAmount
    if (body.referenceApprovalStatus !== undefined) changes.referenceApprovalStatus = body.referenceApprovalStatus
    if (body.referenceReviewNote !== undefined) changes.referenceReviewNote = body.referenceReviewNote
    if (body.referenceReviewedAt !== undefined) changes.referenceReviewedAt = body.referenceReviewedAt
    await bakeryDb.bespokeRequests.update(requestId, changes)
    publishBakeryEvent('BESPOKE_UPDATED', { requestId, ...changes })
    return json(await bakeryDb.bespokeRequests.get(requestId))
  }),
  http.get(`${API}/admin/summary`, async () => {
    await ensureBakerySeed()
    const orders = await bakeryDb.orders.toArray(); const requests = await bakeryDb.bespokeRequests.toArray(); const savedDesigns = await bakeryDb.savedDesigns.toArray()
    return json({
      orders, requests, savedDesigns, settings: await readSettings(),
      revenue: orders.filter((order) => order.paymentStatus === 'CONFIRMED').reduce((sum, order) => sum + order.quote.total, 0),
      points: Number((await bakeryDb.config.get('pointsAvailable'))?.value ?? 182),
    })
  }),
  http.get(`${API}/settings`, async () => { await ensureBakerySeed(); return json(await readSettings()) }),
  http.patch(`${API}/settings`, async ({ request }) => {
    const body = await request.json() as Partial<BakerySettings>
    await bakeryDb.config.bulkPut(Object.entries(body).map(([key, value]) => ({ key, value })))
    publishBakeryEvent('SETTINGS_UPDATED', body)
    return json(await readSettings())
  }),
  http.get(`${API}/availability`, async () => { await ensureBakerySeed(); return json({ products: await bakeryDb.products.toArray(), overrides: await bakeryDb.availability.toArray() }) }),
  http.patch(`${API}/availability/:productId`, async ({ params, request }) => { const body = await request.json() as { available: boolean; source: 'OWNER' | 'BAKER'; reason?: string; until?: string }; const productId = String(params.productId); await bakeryDb.products.update(productId, { available: body.available }); await bakeryDb.availability.put({ id: `BA-${productId}`, productId, ...body }); publishBakeryEvent('AVAILABILITY_UPDATED', { productId, ...body }); return json({ ok: true }) }),
  http.get(`${API}/saved-designs`, async () => { await ensureBakerySeed(); return json({ designs: await bakeryDb.savedDesigns.where('customerPhone').equals(DEMO_CUSTOMER_PHONE).toArray() }) }),
  http.post(`${API}/saved-designs`, async ({ request }) => {
    const body = await request.json() as Omit<BakerySavedDesign, 'id' | 'customerPhone' | 'savedAt'>
    const value: BakerySavedDesign = { ...body, id: id('BSD'), customerPhone: DEMO_CUSTOMER_PHONE, savedAt: new Date().toISOString() }
    await bakeryDb.savedDesigns.put(value); publishBakeryEvent('SAVED_DESIGN_ADDED', value)
    return json(value, 201)
  }),
  http.delete(`${API}/saved-designs/:designId`, async ({ params }) => { await bakeryDb.savedDesigns.delete(String(params.designId)); publishBakeryEvent('SAVED_DESIGN_REMOVED', { designId: params.designId }); return json({ ok: true }) }),
  http.post(`${API}/demo/reset`, async () => { await resetBakeryDemo(); publishBakeryEvent('DEMO_RESET'); return json({ ok: true }) }),
]
