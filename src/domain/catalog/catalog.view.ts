import type { LegacyProductView, Product } from './catalog.types'

/** Adapts the domain Product (slug/basePrice/imageKey/categoryId) to the flat shape Stage 1 UI renders. */
export function toLegacyProductView(product: Product): LegacyProductView {
  return {
    id: product.id, name: product.name, description: product.shortDescription, category: product.categoryId,
    price: product.basePrice, veg: product.veg, available: product.available, prepMinutes: product.prepMinutes,
    complexity: product.complexity, station: product.station, image: `/assets/products/${product.imageKey}`,
    badges: product.badges, modifierGroups: product.modifierGroups,
  }
}
