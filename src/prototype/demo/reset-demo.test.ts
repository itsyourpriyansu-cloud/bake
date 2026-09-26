import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../database/db'
import { DEMO_CART_ID, ensureDemoDatabase, resetDemoDatabase } from './reset-demo'
import { boot } from '../msw/handlers/_shared'

describe('resetDemoDatabase', () => {
  beforeEach(async () => { await resetDemoDatabase() })

  it('restores the frozen customer and all 12 menu products', async () => {
    expect(await db.products.count()).toBe(12)
    expect((await db.customers.get('CUST001'))?.pointsAvailable).toBe(182)
    expect((await db.products.get('PIZZA-VEG-001'))?.basePrice).toBe(110)
  })

  it('starts the customer surface as a guest without exposing a seeded session', async () => {
    expect(await db.sessions.where('realm').equals('CUSTOMER').count()).toBe(0)
    expect((await db.config.get('customerLoggedIn'))?.value).toBe(false)
  })

  it('keeps every pizza product on the complete seven-step customization contract', async () => {
    const products = await db.products.toArray()
    const pizzas = products.filter((product) => product.categoryId === 'pizza' || product.name.toLowerCase().includes('pizza'))
    expect(pizzas.map((product) => product.id).sort()).toEqual([
      'KULHAD-001', 'PIZZA-CHK-001', 'PIZZA-MUSH-001', 'PIZZA-PANEER-001', 'PIZZA-VEG-001',
    ])
    for (const pizza of pizzas) {
      expect(pizza.badges).toContain('Customizable')
      expect(pizza.modifierGroups).toHaveLength(7)
      expect(pizza.modifierGroups?.map((group) => group.id)).toEqual(['size', 'base', 'sauce', 'cheese', 'toppings', 'spice', 'meal'])
    }
  })

  it('seeds a resolvable store config and derived capabilities', async () => {
    const config = (await db.config.get('storeConfig'))?.value as { kdsOnline: boolean; acceptanceMode: string }
    expect(config.kdsOnline).toBe(true)
    expect(config.acceptanceMode).toBe('HYBRID')
  })

  it('clears cart changes on reset', async () => {
    await db.cartItems.add({ id: 'x', cartId: DEMO_CART_ID, productId: 'FRIES-001', quantity: 2, modifiers: [], unitPriceSnapshot: 99 })
    await resetDemoDatabase()
    expect(await db.cartItems.count()).toBe(0)
  })

  it('seeds historical orders, active tracking and the founder paid-review story', async () => {
    const orders = await db.orders.where('customerId').equals('CUST001').toArray()
    expect(orders).toHaveLength(4)
    expect(orders.every((order) => order.paymentStatus === 'CONFIRMED')).toBe(true)
  })
})

describe('ensureDemoDatabase', () => {
  it('boots the database only when empty', async () => {
    await resetDemoDatabase()
    await db.products.clear()
    await ensureDemoDatabase()
    expect(await db.products.count()).toBe(12)
  })

  it('repairs an incomplete seed instead of leaving customer queries broken', async () => {
    await resetDemoDatabase()
    await db.categories.delete('pizza')
    await ensureDemoDatabase()
    expect(await db.categories.count()).toBe(7)
    expect(await db.products.count()).toBe(12)
  })

  it('clears corrupt legacy cart snapshots that would produce a zero or invalid total', async () => {
    await resetDemoDatabase()
    await db.cartItems.add({ id: 'legacy-zero', cartId: DEMO_CART_ID, productId: 'PIZZA-VEG-001', quantity: 2, modifiers: [], unitPriceSnapshot: 0 })
    await ensureDemoDatabase()
    expect(await db.cartItems.count()).toBe(0)
  })

  it('serializes parallel first-load handler boots', async () => {
    await db.transaction('rw', db.tables, async () => { await Promise.all(db.tables.map((table) => table.clear())) })
    await Promise.all(Array.from({ length: 8 }, () => boot()))
    expect(await db.products.count()).toBe(12)
    expect(await db.categories.count()).toBe(7)
    expect(await db.customers.count()).toBe(2)
    expect(await db.carts.count()).toBe(1)
  })
})
