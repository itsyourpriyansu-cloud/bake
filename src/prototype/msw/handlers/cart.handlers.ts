import { http } from 'msw'
import { db, type StoredCartItem } from '../../database/db'
import { DEMO_CART_ID } from '../../demo/reset-demo'
import { quoteCart } from '../../../domain/pricing/pricing.engine'
import { toLegacyProductView } from '../../../domain/catalog/catalog.view'
import { configuredUnitPrice, defaultModifierSelections, validateModifierSelections } from '../../../domain/catalog/modifier.engine'
import { cartItemModifierSelectionSchema } from '../../../domain/cart/cart.schema'
import { getEffectiveAvailability } from '../../../domain/availability/availability.engine'
import type { CartItemModifierSelection, LegacyCart } from '../../../domain/cart/cart.types'
import type { Product } from '../../../domain/catalog/catalog.types'
import type { CartQuote } from '../../../domain/pricing/pricing.types'
import type { FulfillmentMode } from '../../../domain/customer/customer.types'
import type { AvailabilityRecord } from '../../../domain/availability/availability.types'
import { API, boot, error, getStoreConfig, json, now } from './_shared'
import { eventBus } from '../../events/event-bus'
import { cartConfigurationKey, normalizeCartSelections, normalizeSpecialInstructions } from '../../../domain/cart/cart.identity'
import { getActiveCustomerSession } from '../../services/customer-session'

interface CartItemBody { productId: string; quantity?: number; modifiers?: CartItemModifierSelection[]; specialInstructions?: string }
interface CartItemPatch { quantity?: number; modifiers?: CartItemModifierSelection[]; specialInstructions?: string }

type PreparedSelections = { ok: true; selections: CartItemModifierSelection[]; unitPrice: number } | { ok: false; message: string }

function prepareSelections(product: Product, requested?: CartItemModifierSelection[]): PreparedSelections {
  const groups = product.modifierGroups ?? []
  const parsed = requested === undefined
    ? defaultModifierSelections(groups)
    : cartItemModifierSelectionSchema.array().safeParse(requested)
  if ('success' in parsed && !parsed.success) return { ok: false, message: 'Modifier selections are malformed.' }
  const selections = normalizeCartSelections(Array.isArray(parsed) ? parsed : parsed.data)
  const issues = validateModifierSelections(groups, selections)
  if (issues.length) return { ok: false, message: issues[0].message }
  return { ok: true, selections, unitPrice: configuredUnitPrice(product.basePrice, groups, selections) }
}

function unavailableSelectedOption(product: Product, selections: CartItemModifierSelection[], records: AvailabilityRecord[]) {
  for (const selection of selections) {
    const group = product.modifierGroups?.find((candidate) => candidate.id === selection.groupId)
    for (const optionId of selection.optionIds) {
      const option = group?.options.find((candidate) => candidate.id === optionId)
      if (!option || !option.available || getEffectiveAvailability(optionId, records, now()).status !== 'AVAILABLE') return option?.name ?? 'Selected option'
    }
  }
  return undefined
}

async function getCart(): Promise<LegacyCart> {
  const cart = await db.carts.get(DEMO_CART_ID)
  if (!cart) throw new Error('Demo cart missing')
  const rows = await db.cartItems.where('cartId').equals(cart.id).toArray()
  const products = await db.products.bulkGet(rows.map((row) => row.productId))
  const items = rows.flatMap((row, index) => {
    const product = products[index]
    if (!product) return []
    const customizationSummary = row.modifiers.flatMap((selection) => {
      const group = product.modifierGroups?.find((candidate) => candidate.id === selection.groupId)
      return selection.optionIds.flatMap((optionId) => {
        const option = group?.options.find((candidate) => candidate.id === optionId)
        return group && option ? [{ groupId: group.id, groupName: group.name, optionId: option.id, optionName: option.name, priceDelta: option.priceDelta }] : []
      })
    })
    return [{ ...row, configurationKey: row.configurationKey ?? cartConfigurationKey(row.productId, row.modifiers, row.specialInstructions), specialInstructions: row.specialInstructions ?? '', customizationSummary, lineTotal: row.unitPriceSnapshot * row.quantity, product: toLegacyProductView(product) }]
  })
  return { ...cart, items }
}

function availabilityIssues(rows: StoredCartItem[], products: Product[], records: AvailabilityRecord[]): NonNullable<CartQuote['availabilityIssues']> {
  const checkedAt = now()
  return rows.flatMap((row) => {
    const product = products.find((candidate) => candidate.id === row.productId)
    if (!product) return [{ itemId: row.id, productId: row.productId, entityId: row.productId, kind: 'PRODUCT' as const, displayName: 'This item', message: 'This item is no longer available.' }]
    const issues: NonNullable<CartQuote['availabilityIssues']> = []
    const productStatus = getEffectiveAvailability(product.id, records, checkedAt, product)
    if (productStatus.status !== 'AVAILABLE') issues.push({
      itemId: row.id, productId: product.id, entityId: product.id, kind: 'PRODUCT', displayName: product.name,
      message: `${product.name} is temporarily unavailable.`,
    })
    for (const selection of row.modifiers) {
      const group = product.modifierGroups?.find((candidate) => candidate.id === selection.groupId)
      for (const optionId of selection.optionIds) {
        const option = group?.options.find((candidate) => candidate.id === optionId)
        const status = getEffectiveAvailability(optionId, records, checkedAt)
        if (!option || !option.available || status.status !== 'AVAILABLE') {
          const displayName = option?.name ?? 'A selected option'
          issues.push({
            itemId: row.id, productId: product.id, entityId: optionId, kind: 'MODIFIER', displayName,
            message: group?.id === 'toppings' ? `${displayName} topping is temporarily unavailable.` : `${displayName} is temporarily unavailable.`,
          })
        }
      }
    }
    return issues
  })
}

async function getQuote(fulfillmentType: FulfillmentMode = 'DELIVERY', pointsRequested = 0) {
  const [cart, storeConfig, records, thresholdRecord] = await Promise.all([
    getCart(), getStoreConfig(), db.availability.toArray(), db.config.get('cartThreshold'),
  ])
  const customerSession = await getActiveCustomerSession(now())
  const customer = customerSession ? await db.customers.get(customerSession.customerId) : undefined
  const products = await db.products.bulkGet(cart.items.map((item) => item.productId))
  const liveProducts = products.filter((product): product is Product => Boolean(product))
  const reprices: Array<Promise<number>> = []
  const liveItems = cart.items.map((item) => {
    const product = liveProducts.find((candidate) => candidate.id === item.productId)
    const unitPrice = product ? configuredUnitPrice(product.basePrice, product.modifierGroups ?? [], item.modifiers) : item.unitPriceSnapshot
    if (unitPrice !== item.unitPriceSnapshot) reprices.push(db.cartItems.update(item.id, { unitPriceSnapshot: unitPrice }))
    return { quantity: item.quantity, unitPrice }
  })
  await Promise.all(reprices)
  const threshold = thresholdRecord?.value as { target: number; label: string } | undefined
  return quoteCart({
    items: liveItems,
    fulfillmentType, customerTier: customer?.tier ?? 'MEMBER', pointsAvailable: customer?.pointsAvailable ?? 0,
    pointsRequested: customer ? pointsRequested : 0, deliveryFeeTable: { DELIVERY: storeConfig.deliveryFeeFlat, PICKUP: 0, STORE: 0 },
    threshold, availabilityIssues: availabilityIssues(cart.items, liveProducts, records),
  })
}

export const cartHandlers = [
  http.get(`${API}/cart`, async () => { await boot(); return json(await getCart()) }),

  http.post(`${API}/cart/items`, async ({ request }) => {
    await boot()
    const body = await request.json() as CartItemBody
    const product = await db.products.get(body.productId)
    if (!product) return error('Product not found', 404)
    const records = await db.availability.toArray()
    if (getEffectiveAvailability(product.id, records, now(), product).status !== 'AVAILABLE') return error('Product is unavailable', 409)
    const prepared = prepareSelections(product, body.modifiers)
    if (!prepared.ok) return error(prepared.message, 400)
    const unavailableOption = unavailableSelectedOption(product, prepared.selections, records)
    if (unavailableOption) return error(`${unavailableOption} is unavailable`, 409)
    const specialInstructions = normalizeSpecialInstructions(body.specialInstructions)
    const configurationKey = cartConfigurationKey(body.productId, prepared.selections, specialInstructions)
    const rows = await db.cartItems.where('cartId').equals(DEMO_CART_ID).toArray()
    const existing = rows.find((row) => (row.configurationKey ?? cartConfigurationKey(row.productId, row.modifiers, row.specialInstructions)) === configurationKey)
    if (existing) await db.cartItems.update(existing.id, { quantity: Math.min(99, existing.quantity + (body.quantity ?? 1)), unitPriceSnapshot: prepared.unitPrice, configurationKey, specialInstructions })
    else await db.cartItems.add({ id: crypto.randomUUID(), cartId: DEMO_CART_ID, productId: body.productId, quantity: body.quantity ?? 1, modifiers: prepared.selections, unitPriceSnapshot: prepared.unitPrice, configurationKey, specialInstructions })
    eventBus.emit('CART_UPDATED', { productId: body.productId })
    return json(await getCart(), 201)
  }),

  http.patch(`${API}/cart/items/:itemId`, async ({ params, request }) => {
    await boot()
    const id = String(params.itemId)
    const body = await request.json() as CartItemPatch
    const row = await db.cartItems.get(id)
    if (!row) return error('Cart item not found', 404)
    if (body.quantity !== undefined && body.quantity <= 0) await db.cartItems.delete(id)
    else {
      const changes: Partial<StoredCartItem> = {}
      if (body.quantity !== undefined) changes.quantity = body.quantity
      if (body.modifiers !== undefined || body.specialInstructions !== undefined) {
        const product = await db.products.get(row.productId)
        if (!product) return error('Product not found', 404)
        const prepared = prepareSelections(product, body.modifiers ?? row.modifiers)
        if (!prepared.ok) return error(prepared.message, 400)
        const unavailableOption = unavailableSelectedOption(product, prepared.selections, await db.availability.toArray())
        if (unavailableOption) return error(`${unavailableOption} is unavailable`, 409)
        const specialInstructions = normalizeSpecialInstructions(body.specialInstructions ?? row.specialInstructions)
        const configurationKey = cartConfigurationKey(row.productId, prepared.selections, specialInstructions)
        const rows = await db.cartItems.where('cartId').equals(row.cartId).toArray()
        const mergeTarget = rows.find((candidate) => candidate.id !== id && (candidate.configurationKey ?? cartConfigurationKey(candidate.productId, candidate.modifiers, candidate.specialInstructions)) === configurationKey)
        if (mergeTarget) {
          await db.cartItems.update(mergeTarget.id, { quantity: Math.min(99, mergeTarget.quantity + (body.quantity ?? row.quantity)), unitPriceSnapshot: prepared.unitPrice, configurationKey, specialInstructions })
          await db.cartItems.delete(id)
          eventBus.emit('CART_UPDATED', { itemId: id, mergedInto: mergeTarget.id })
          return json(await getCart())
        }
        changes.modifiers = prepared.selections
        changes.unitPriceSnapshot = prepared.unitPrice
        changes.configurationKey = configurationKey
        changes.specialInstructions = specialInstructions
      }
      await db.cartItems.update(id, changes)
    }
    eventBus.emit('CART_UPDATED', { itemId: id })
    return json(await getCart())
  }),

  http.delete(`${API}/cart/items/:itemId`, async ({ params }) => {
    await boot()
    await db.cartItems.delete(String(params.itemId))
    eventBus.emit('CART_UPDATED', { itemId: params.itemId, removed: true })
    return json(await getCart())
  }),

  http.post(`${API}/cart/quote`, async ({ request }) => {
    await boot()
    const body = await request.json().catch(() => ({})) as { fulfillmentMode?: FulfillmentMode; pointsRequested?: number }
    const mode = body.fulfillmentMode && ['DELIVERY', 'PICKUP', 'STORE'].includes(body.fulfillmentMode) ? body.fulfillmentMode : 'DELIVERY'
    return json(await getQuote(mode, Math.max(0, Math.floor(body.pointsRequested ?? 0))))
  }),
]

export { getCart, getQuote, prepareSelections }
