import { db } from '../database/db'
import { DEMO_CART_ID, resetDemoDatabase } from '../demo/reset-demo'
import { demoClock } from '../../domain/shared/clock'
import { setChefTemporaryAvailability } from '../../domain/availability/availability.engine'
import { eventBus } from '../events/event-bus'
import type { ScenarioSummary } from './scenario.types'
import { configuredUnitPrice } from '../../domain/catalog/modifier.engine'
import type { CartItemModifierSelection } from '../../domain/cart/cart.types'

export async function loadUnavailableItem(): Promise<ScenarioSummary> {
  await resetDemoDatabase()
  const now = demoClock.now()
  const product = await db.products.get('PIZZA-VEG-001')
  if (!product) throw new Error('Demo pizza missing')
  const modifiers: CartItemModifierSelection[] = [
    { groupId: 'size', optionIds: ['regular'] }, { groupId: 'base', optionIds: ['normal'] },
    { groupId: 'sauce', optionIds: ['classic-tomato'] }, { groupId: 'cheese', optionIds: ['regular-cheese'] },
    { groupId: 'toppings', optionIds: ['mushroom'] }, { groupId: 'spice', optionIds: ['spice-medium'] },
  ]
  await db.cartItems.add({
    id: 'CART-ITEM-MUSHROOM-CHANGE', cartId: DEMO_CART_ID, productId: product.id, quantity: 1, modifiers,
    unitPriceSnapshot: configuredUnitPrice(product.basePrice, product.modifierGroups ?? [], modifiers),
  })
  const record = setChefTemporaryAvailability('mushroom', 'MODIFIER', 60, now, 'Out of mushrooms')
  await db.availability.put(record)
  eventBus.emit('AVAILABILITY_CHANGED', record)
  return {
    id: 'unavailableItem', title: 'Item Unavailable', appliedAt: now.toISOString(),
    description: 'A pizza with Mushroom topping is in the cart, then Mushroom becomes unavailable for 60 minutes. The cart now requires a customer decision.',
  }
}
