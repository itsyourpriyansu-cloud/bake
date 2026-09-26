import Dexie, { type EntityTable } from 'dexie'
import type { BakeryAvailability, BakeryBespokeRequest, BakeryCartItem, BakeryOrder, BakeryProduct, BakerySavedDesign } from '../../domain/bakery/bakery.types'
import { bakeryAvailabilityOverrides, bakeryBespokeRequests, bakeryOrders, bakeryProducts, bakerySavedDesigns, bakerySeedOrderSequence } from './bakery.seed'

interface BakeryConfig { key: string; value: unknown }

const seedVersion = 3

class BakeryWaveDatabase extends Dexie {
  products!: EntityTable<BakeryProduct, 'id'>
  cartItems!: EntityTable<BakeryCartItem, 'id'>
  orders!: EntityTable<BakeryOrder, 'id'>
  availability!: EntityTable<BakeryAvailability, 'id'>
  bespokeRequests!: EntityTable<BakeryBespokeRequest, 'id'>
  savedDesigns!: EntityTable<BakerySavedDesign, 'id'>
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
    this.version(2).stores({
      savedDesigns: 'id, customerPhone, productId, savedAt',
    })
  }
}

export const bakeryDb = new BakeryWaveDatabase()

const seedTables = [
  bakeryDb.products, bakeryDb.cartItems, bakeryDb.orders, bakeryDb.availability,
  bakeryDb.bespokeRequests, bakeryDb.savedDesigns, bakeryDb.config,
] as const

export async function ensureBakerySeed() {
  const version = await bakeryDb.config.get('seedVersion')
  if (version?.value === seedVersion && await bakeryDb.products.count()) {
    for (const seededRequest of bakeryBespokeRequests.filter((request) => request.referenceImage)) {
      const existing = await bakeryDb.bespokeRequests.get(seededRequest.id)
      if (existing && !existing.referenceImage) await bakeryDb.bespokeRequests.update(existing.id, {
        referenceImage: seededRequest.referenceImage,
        referenceApprovalStatus: seededRequest.referenceApprovalStatus,
        referenceReviewNote: seededRequest.referenceReviewNote,
        referenceReviewedAt: seededRequest.referenceReviewedAt,
      })
    }
    return
  }
  if (version?.value === 2 && await bakeryDb.products.count()) {
    await bakeryDb.transaction('rw', bakeryDb.bespokeRequests, bakeryDb.config, async () => {
      for (const seededRequest of bakeryBespokeRequests.filter((request) => request.referenceImage)) {
        const existing = await bakeryDb.bespokeRequests.get(seededRequest.id)
        if (existing && !existing.referenceImage) await bakeryDb.bespokeRequests.update(existing.id, {
          referenceImage: seededRequest.referenceImage,
          referenceApprovalStatus: seededRequest.referenceApprovalStatus,
          referenceReviewNote: seededRequest.referenceReviewNote,
          referenceReviewedAt: seededRequest.referenceReviewedAt,
        })
      }
      await bakeryDb.config.put({ key: 'seedVersion', value: seedVersion })
    })
    return
  }
  await bakeryDb.transaction('rw', seedTables, async () => {
    await Promise.all(seedTables.map((table) => table.clear()))
    await bakeryDb.products.bulkPut(bakeryProducts)
    await bakeryDb.orders.bulkPut(bakeryOrders)
    await bakeryDb.bespokeRequests.bulkPut(bakeryBespokeRequests)
    await bakeryDb.availability.bulkPut(bakeryAvailabilityOverrides)
    await bakeryDb.savedDesigns.bulkPut(bakerySavedDesigns)
    await bakeryDb.config.bulkPut([
      { key: 'seedVersion', value: seedVersion }, { key: 'orderSequence', value: bakerySeedOrderSequence },
      { key: 'pointsAvailable', value: 182 }, { key: 'customerName', value: 'Priyanshu' },
      { key: 'storeOrderingEnabled', value: true }, { key: 'deliveryEnabled', value: true }, { key: 'pickupEnabled', value: true },
      { key: 'safeAutoAcceptance', value: 'HYBRID' }, { key: 'productionCapacity', value: 8 },
    ])
  })
}

export async function resetBakeryDemo() {
  await bakeryDb.config.delete('seedVersion')
  await ensureBakerySeed()
}
