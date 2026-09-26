import { http } from 'msw'
import { db } from '../../database/db'
import { API, boot, json, now } from './_shared'
import { toLegacyProductView } from '../../../domain/catalog/catalog.view'
import { searchCatalogProducts } from '../../../domain/catalog/searchProducts'
import { calculatePointsEarned } from '../../../domain/loyalty/loyalty.engine'
import { tierById } from '../../../domain/loyalty/loyalty.tiers'
import { getEffectiveAvailability } from '../../../domain/availability/availability.engine'
import type { Product } from '../../../domain/catalog/catalog.types'
import type { AvailabilityRecord } from '../../../domain/availability/availability.types'

const applyLiveAvailability = (product: Product, records: AvailabilityRecord[]) => ({
  ...product,
  available: getEffectiveAvailability(product.id, records, now(), product).status === 'AVAILABLE',
  modifierGroups: product.modifierGroups?.map((group) => ({
    ...group,
    options: group.options.map((option) => ({ ...option, available: option.available && getEffectiveAvailability(option.id, records, now()).status === 'AVAILABLE' })),
  })),
})

export const catalogHandlers = [
  http.get(`${API}/categories`, async () => { await boot(); return json(await db.categories.orderBy('sortOrder').toArray()) }),

  http.get(`${API}/products`, async ({ request }) => {
    await boot()
    const url = new URL(request.url)
    let rows = await db.products.toArray()
    const category = url.searchParams.get('category')
    if (category) rows = rows.filter((item) => item.categoryId === category)
    const availability = await db.availability.toArray()
    return json(rows.map((product) => toLegacyProductView(applyLiveAvailability(product, availability))))
  }),

  http.get(`${API}/products/:id`, async ({ params }) => {
    await boot()
    const item = await db.products.get(String(params.id))
    if (!item) return json({ message: 'Product not found' }, 404)
    const [pairings, customer, availability] = await Promise.all([
      db.products.bulkGet(item.recommendedPairings ?? []), db.customers.get('CUST001'), db.availability.toArray(),
    ])
    const liveItem = applyLiveAvailability(item, availability)
    return json({
      product: toLegacyProductView(liveItem),
      pairings: pairings.filter((pairing): pairing is NonNullable<typeof pairing> => Boolean(pairing)).map((pairing) => toLegacyProductView(applyLiveAvailability(pairing, availability))),
      pointsPreview: calculatePointsEarned(liveItem.basePrice, tierById(customer?.tier ?? 'MEMBER')),
    })
  }),

  http.get(`${API}/menu`, async () => {
    await boot()
    const collectionsRecord = await db.config.get('smartCollections')
    const availability = await db.availability.toArray()
    return json({
      categories: await db.categories.orderBy('sortOrder').toArray(),
      products: (await db.products.toArray()).map((product) => toLegacyProductView(applyLiveAvailability(product, availability))),
      collections: collectionsRecord?.value ?? [],
    })
  }),

  http.get(`${API}/recommendations`, async ({ request }) => {
    await boot()
    const [rows, availability] = await Promise.all([db.products.toArray(), db.availability.toArray()])
    const context = new URL(request.url).searchParams.get('context')
    const selected = context === 'popular'
      ? ['PIZZA-PANEER-001', 'KULHAD-001', 'FRIES-001', 'SHAKE-001'].map((id) => rows.find((item) => item.id === id)).filter((item): item is NonNullable<typeof item> => Boolean(item))
      : rows.filter((item) => item.badges.includes('Bestseller') || item.id === 'PIZZA-VEG-001').slice(0, 4)
    return json(selected.map((product) => toLegacyProductView(applyLiveAvailability(product, availability))))
  }),

  http.get(`${API}/search`, async ({ request }) => {
    await boot()
    const q = new URL(request.url).searchParams.get('q')?.toLowerCase().trim() ?? ''
    const [rows, availability] = await Promise.all([db.products.toArray(), db.availability.toArray()])
    return json(searchCatalogProducts(rows, q).map((product) => toLegacyProductView(applyLiveAvailability(product, availability))))
  }),
]
