import { beforeEach, describe, expect, it } from 'vitest'
import { bakeryDb, ensureBakerySeed, resetBakeryDemo } from './bakery.db'
import { getBakeryQuote } from './bakery.handlers'
import { normalizeBakeryCartResponse } from '../../services/api/bakery.api'

describe('isolated bakery prototype data', () => {
  beforeEach(async () => { await resetBakeryDemo() })

  it('seeds the deterministic bakery catalogue without touching pizza data', async () => {
    await ensureBakerySeed()
    const products = await bakeryDb.products.toArray()
    expect(products).toHaveLength(24)
    expect(products.some((product) => product.id === 'cake-vintage-heart')).toBe(true)
    expect(products.filter((product) => product.customisable).every((product) => product.modifierGroups.length === 7)).toBe(true)
    for (const event of ['BIRTHDAY', 'ANNIVERSARY', 'WEDDING', 'BABY_SHOWER', 'KIDS', 'CORPORATE', 'COUPLES', 'GEN_Z', 'CUSTOM'] as const) {
      expect(products.filter((product) => product.events.includes(event)).length).toBeGreaterThanOrEqual(5)
    }
    expect(new Set(products.filter((product) => product.category === 'CAKES' || product.category === 'BENTO').map((product) => product.style)).size).toBeGreaterThanOrEqual(12)
    expect(products.filter((product) => product.events.includes('BIRTHDAY') && product.basePrice <= 999).length).toBeGreaterThanOrEqual(7)
    expect(products.filter((product) => product.readyToday && product.available).length).toBeGreaterThan(0)
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
})
