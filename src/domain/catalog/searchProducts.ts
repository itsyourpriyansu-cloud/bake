import type { Product } from './catalog.types'

export function searchCatalogProducts(products: Product[], rawQuery: string) {
  const normalized = rawQuery.toLowerCase().trim().replace('₹', '').replace(/\s+/g, ' ')
  if (!normalized) return []
  return products.filter((item) => {
    if (/under\s*200|below\s*200|under\s*199/.test(normalized)) return item.basePrice <= 199
    if (normalized.includes('combo')) return ['PIZZA-VEG-001', 'KULHAD-001', 'GARLIC-001', 'SHAKE-001'].includes(item.id)
    const searchable = `${item.name} ${item.shortDescription} ${item.badges.join(' ')} ${item.categoryId}`.toLowerCase()
    return normalized.split(' ').every((term) => searchable.includes(term))
  })
}
