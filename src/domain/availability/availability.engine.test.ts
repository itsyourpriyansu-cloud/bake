import { describe, expect, it } from 'vitest'
import { clearChefAvailability, expireAvailabilityOverrides, getEffectiveAvailability, setChefTemporaryAvailability, setOwnerAvailability, validateCartAvailability } from './availability.engine'
import type { AvailabilityRecord } from './availability.types'
import type { Product } from '../catalog/catalog.types'

const now = new Date('2026-09-08T12:00:00.000Z')
const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'PIZZA-VEG-001', slug: 'x', name: 'Classic Veg Pizza', shortDescription: 'x', categoryId: 'pizza',
  basePrice: 110, veg: true, available: true, badges: [], imageKey: 'x', prepMinutes: 14, complexity: 2, station: 'PIZZA', ...overrides,
})

describe('getEffectiveAvailability priority', () => {
  it('is AVAILABLE with no records', () => {
    expect(getEffectiveAvailability('PIZZA-VEG-001', [], now, product()).status).toBe('AVAILABLE')
  })

  it('an owner override always wins, even over a live chef temp-unavailable record', () => {
    const records: AvailabilityRecord[] = [
      setChefTemporaryAvailability('PIZZA-VEG-001', 'PRODUCT', 60, now, 'Out of dough'),
      setOwnerAvailability('PIZZA-VEG-001', 'PRODUCT', true, now),
    ]
    expect(getEffectiveAvailability('PIZZA-VEG-001', records, now, product()).status).toBe('AVAILABLE')
  })

  it('falls back to the catalog "available" flag as an owner-level disable', () => {
    expect(getEffectiveAvailability('PIZZA-VEG-001', [], now, product({ available: false })).status).toBe('OWNER_DISABLED')
  })

  it('a chef temp-unavailable record applies when there is no owner override', () => {
    const record = setChefTemporaryAvailability('PIZZA-VEG-001', 'PRODUCT', 60, now, 'Out of dough')
    expect(getEffectiveAvailability('PIZZA-VEG-001', [record], now, product()).status).toBe('CHEF_TEMP_UNAVAILABLE')
  })

  it('an expired chef record is ignored', () => {
    const record = setChefTemporaryAvailability('PIZZA-VEG-001', 'PRODUCT', 60, now, 'Out of dough')
    const later = new Date(now.getTime() + 61 * 60_000)
    expect(getEffectiveAvailability('PIZZA-VEG-001', [record], later, product()).status).toBe('AVAILABLE')
  })

  it('clearing a chef record restores AVAILABLE', () => {
    const cleared = clearChefAvailability('PIZZA-VEG-001', 'PRODUCT', now)
    expect(getEffectiveAvailability('PIZZA-VEG-001', [cleared], now, product()).status).toBe('AVAILABLE')
  })
})

describe('expireAvailabilityOverrides', () => {
  it('drops only the records whose expiresAt has passed', () => {
    const live = setChefTemporaryAvailability('A', 'PRODUCT', 60, now)
    const expired = setChefTemporaryAvailability('B', 'PRODUCT', 30, now)
    const later = new Date(now.getTime() + 45 * 60_000)
    const result = expireAvailabilityOverrides([live, expired], later)
    expect(result.map((r) => r.entityId)).toEqual(['A'])
  })
})

describe('validateCartAvailability', () => {
  it('flags unavailable items with a reason and leaves available ones out', () => {
    const record = setChefTemporaryAvailability('PIZZA-MUSH-001', 'PRODUCT', 60, now, 'Out of mushrooms')
    const products = [product(), product({ id: 'PIZZA-MUSH-001', name: 'Mushroom Cheese Pizza' })]
    const issues = validateCartAvailability(
      [{ productId: 'PIZZA-VEG-001', productName: 'Classic Veg Pizza' }, { productId: 'PIZZA-MUSH-001', productName: 'Mushroom Cheese Pizza' }],
      products, [record], now,
    )
    expect(issues).toEqual([{ productId: 'PIZZA-MUSH-001', productName: 'Mushroom Cheese Pizza', reason: 'Out of mushrooms' }])
  })
})
