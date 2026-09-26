import { describe, expect, it } from 'vitest'
import { productSeed } from '../../prototype/seed/catalog.seed'
import { searchCatalogProducts } from './searchProducts'

describe('customer catalog search', () => {
  it.each(['paneer', 'chicken', 'veg', 'spicy', 'cheese', 'shake', 'combo', 'under 200'])('supports the demo query “%s”', (query) => {
    expect(searchCatalogProducts(productSeed, query).length).toBeGreaterThan(0)
  })

  it('keeps the under-200 query within the promised price', () => {
    expect(searchCatalogProducts(productSeed, 'under 200').every((product) => product.basePrice <= 199)).toBe(true)
  })
})
