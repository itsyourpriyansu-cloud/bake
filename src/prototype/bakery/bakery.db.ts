import Dexie, { type EntityTable } from 'dexie'
import type { BakeryAvailability, BakeryBespokeRequest, BakeryCartItem, BakeryOrder, BakeryProduct } from '../../domain/bakery/bakery.types'
import { bakeryProducts } from './bakery.seed'

interface BakeryConfig { key: string; value: unknown }

class BakeryWaveDatabase extends Dexie {
  products!: EntityTable<BakeryProduct, 'id'>
  cartItems!: EntityTable<BakeryCartItem, 'id'>
  orders!: EntityTable<BakeryOrder, 'id'>
  availability!: EntityTable<BakeryAvailability, 'id'>
  bespokeRequests!: EntityTable<BakeryBespokeRequest, 'id'>
  config!: EntityTable<BakeryConfig, 'key'>

  constructor() {
    super('bakery-wave-prototype-v1')
    this.version(1).stores({
      products: 'id, category, style, readyToday, available',
      cartItems: 'id, productId',
      orders: 'id, publicNumber, productionStatus, createdAt',
      availability: 'id, productId, source, until',
      bespokeRequests: 'id, status, eventDate, createdAt',
      config: 'key',
    })
  }
}

export const bakeryDb = new BakeryWaveDatabase()

export async function ensureBakerySeed() {
  const version = await bakeryDb.config.get('seedVersion')
  if (version?.value === 2 && await bakeryDb.products.count()) return
  await bakeryDb.transaction('rw', [bakeryDb.products, bakeryDb.cartItems, bakeryDb.orders, bakeryDb.availability, bakeryDb.bespokeRequests, bakeryDb.config], async () => {
    await Promise.all([
      bakeryDb.products.clear(), bakeryDb.cartItems.clear(), bakeryDb.orders.clear(),
      bakeryDb.availability.clear(), bakeryDb.bespokeRequests.clear(), bakeryDb.config.clear(),
    ])
    await bakeryDb.products.bulkPut(bakeryProducts)
    await bakeryDb.config.bulkPut([
      { key: 'seedVersion', value: 2 }, { key: 'orderSequence', value: 240 },
      { key: 'pointsAvailable', value: 182 }, { key: 'customerName', value: 'Priyanshu' },
    ])
  })
}

export async function resetBakeryDemo() {
  await bakeryDb.config.delete('seedVersion')
  await ensureBakerySeed()
}
