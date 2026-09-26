import { beforeEach, describe, expect, it } from 'vitest'
import { bakeryDb, ensureBakerySeed, resetBakeryDemo } from './bakery.db'
import { getBakeryQuote } from './bakery.handlers'
import { normalizeBakeryCartResponse } from '../../services/api/bakery.api'

describe('isolated bakery prototype data', () => {
  beforeEach(async () => { await resetBakeryDemo() })

  it('seeds the deterministic bakery catalogue without touching pizza data', async () => {
    await ensureBakerySeed()
    const products = await bakeryDb.products.toArray()
    expect(products).toHaveLength(12)
    expect(products.some((product) => product.id === 'cake-vintage-heart')).toBe(true)
    expect(products.filter((product) => product.customisable).every((product) => product.modifierGroups.length === 7)).toBe(true)
  })

  it('quotes delivery and pickup on the mock server shape', async () => {
    await bakeryDb.cartItems.put({ id: 'TEST-ITEM', productId: 'cake-chocolate-truffle', quantity: 1, unitPrice: 649, selections: [] })
    const delivery = await getBakeryQuote('DELIVERY')
    const pickup = await getBakeryQuote('PICKUP')
    expect(delivery).toMatchObject({ subtotal: 649, deliveryFee: 59, total: 708, valid: true })
    expect(pickup).toMatchObject({ subtotal: 649, deliveryFee: 0, total: 649, valid: true })
    expect(delivery.pointsToEarn).toBe(64)
  })

  it('reset clears bakery operations and restores the exact seed', async () => {
    await bakeryDb.cartItems.put({ id: 'RESET-ME', productId: 'cake-bento', quantity: 2, unitPrice: 349, selections: [] })
    await bakeryDb.products.update('cake-bento', { available: false })
    await resetBakeryDemo()
    expect(await bakeryDb.cartItems.count()).toBe(0)
    expect((await bakeryDb.products.get('cake-bento'))?.available).toBe(true)
    expect((await bakeryDb.config.get('pointsAvailable'))?.value).toBe(182)
  })

  it('normalizes stale cart responses instead of crashing the bakery shell', async () => {
    const quote = await getBakeryQuote('DELIVERY')
    expect(normalizeBakeryCartResponse({ quote }).items).toEqual([])
    expect(normalizeBakeryCartResponse(undefined)).toMatchObject({ items: [], quote: { valid: false, total: 0 } })
    expect(normalizeBakeryCartResponse({ item: { id: 'LEGACY', productId: 'cake-bento', quantity: 1, unitPrice: 349, selections: [] }, quote }).items).toHaveLength(1)
  })

  it('seeds operational data so Founder Control and the production board are never empty on first load', async () => {
    await ensureBakerySeed()
    const orders = await bakeryDb.orders.toArray()
    const requests = await bakeryDb.bespokeRequests.toArray()
    const overrides = await bakeryDb.availability.toArray()
    const savedDesigns = await bakeryDb.savedDesigns.toArray()

    expect(orders.length).toBeGreaterThan(0)
    expect(requests.length).toBeGreaterThan(0)
    expect(overrides.length).toBeGreaterThan(0)
    expect(savedDesigns.length).toBeGreaterThan(0)
    expect(requests.filter((request) => request.referenceImage)).toHaveLength(2)
    expect(requests.some((request) => request.referenceApprovalStatus === 'PENDING_REVIEW')).toBe(true)
    expect(requests.some((request) => request.referenceApprovalStatus === 'APPROVED')).toBe(true)

    const statuses = new Set(orders.map((order) => order.productionStatus))
    expect(statuses.has('AWAITING_ACCEPTANCE')).toBe(true)
    expect(statuses.has('READY')).toBe(true)
    expect(statuses.has('COMPLETED')).toBe(true)
    expect(statuses.has('REJECTED')).toBe(true)

    const confirmedRevenue = orders.filter((order) => order.paymentStatus === 'CONFIRMED').reduce((sum, order) => sum + order.quote.total, 0)
    expect(confirmedRevenue).toBeGreaterThan(0)
    const rejected = orders.find((order) => order.productionStatus === 'REJECTED')
    expect(rejected?.paymentStatus).not.toBe('CONFIRMED')

    const customers = new Set(orders.map((order) => order.customerPhone))
    expect(customers.size).toBeGreaterThan(1)

    const paused = await bakeryDb.products.get(overrides[0].productId)
    expect(paused?.available).toBe(overrides[0].available)
  })

  it('agrees on seed order sequence so a live checkout never collides with a seeded order number', async () => {
    await ensureBakerySeed()
    const orders = await bakeryDb.orders.toArray()
    const highestSeeded = Math.max(...orders.map((order) => Number(order.publicNumber.replace('BW', ''))))
    const sequence = Number((await bakeryDb.config.get('orderSequence'))?.value)
    expect(sequence).toBeGreaterThanOrEqual(highestSeeded)
  })
})
