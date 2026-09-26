import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../../database/db'
import { DEMO_CART_ID, resetDemoDatabase } from '../../demo/reset-demo'
import { getQuote } from './cart.handlers'
import { storeConfigSeed } from '../../seed/store.seed'
import { loadUnavailableItem } from '../../scenarios/unavailable-item'
import { createCustomerSession } from '../../../domain/auth/session.policy'
import { demoClock } from '../../../domain/shared/clock'

describe('fulfillment-aware cart quote', () => {
  beforeEach(async () => {
    await resetDemoDatabase()
    await db.cartItems.add({ id: 'CART-ITEM-QUOTE', cartId: DEMO_CART_ID, productId: 'PIZZA-VEG-001', quantity: 1, modifiers: [], unitPriceSnapshot: 110 })
    await db.config.put({ key: 'storeConfig', value: { ...storeConfigSeed, deliveryFeeFlat: 30 } })
  })

  it('re-quotes the preserved cart for Delivery and Pickup', async () => {
    const delivery = await getQuote('DELIVERY')
    const pickup = await getQuote('PICKUP')
    expect(delivery.itemCount).toBe(1)
    expect(delivery.deliveryFee).toBe(30)
    expect(delivery.total).toBe(140)
    expect(pickup.deliveryFee).toBe(0)
    expect(pickup.total).toBe(110)
  })

  it('returns server-owned redemption, eligible spend, earning and threshold fields', async () => {
    await db.cartItems.update('CART-ITEM-QUOTE', { quantity: 3 })
    const guestQuote = await getQuote('PICKUP', 50)
    expect(guestQuote.pointsRedeemed).toBe(0)
    expect(guestQuote.total).toBe(330)
    expect(guestQuote.pointsToEarn).toBe(6)

    await db.sessions.add({ id: 'SESSION-QUOTE-MEMBER', realm: 'CUSTOMER', payload: createCustomerSession('CUST001', demoClock.now()) })
    const quote = await getQuote('PICKUP', 50)
    expect(quote.subtotal).toBe(330)
    expect(quote.pointsRedeemed).toBe(50)
    expect(quote.discount).toBe(50)
    expect(quote.eligibleSpend).toBe(280)
    expect(quote.pointsToEarn).toBe(11)
    expect(quote.total).toBe(280)
    expect(quote.threshold?.remaining).toBe(169)
  })

  it('revalidates selected modifiers without silently removing the cart item', async () => {
    await loadUnavailableItem()
    const quote = await getQuote('DELIVERY')
    expect(quote.valid).toBe(false)
    expect(quote.availabilityIssues?.[0]).toMatchObject({ kind: 'MODIFIER', entityId: 'mushroom', message: 'Mushroom topping is temporarily unavailable.' })
    expect(await db.cartItems.get('CART-ITEM-MUSHROOM-CHANGE')).toBeDefined()
  })
})
