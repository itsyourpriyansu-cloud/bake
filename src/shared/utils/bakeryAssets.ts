const root = '/assets/bakery'

export const bakeryAssets = {
  hero: `${root}/hero/celebration-studio.webp`,
  product: {
    vintage: `${root}/products/vintage-heart.webp`,
    floral: `${root}/products/floral-lavender.webp`,
    chocolate: `${root}/products/chocolate-truffle.webp`,
    dailyBakes: `${root}/products/daily-bakes.webp`,
  },
} as const

const productAssetMap: Record<string, string> = {
  'cake-vintage-heart': bakeryAssets.product.vintage,
  'cake-floral-lavender': bakeryAssets.product.floral,
  'cake-chocolate-truffle': bakeryAssets.product.chocolate,
  'cake-black-forest': bakeryAssets.product.chocolate,
  'cake-biscoff': bakeryAssets.product.chocolate,
  'cake-rasmalai': bakeryAssets.product.floral,
  'cake-bento': bakeryAssets.product.vintage,
  'cake-photo': bakeryAssets.product.floral,
  'pastry-chocolate': bakeryAssets.product.dailyBakes,
  'brownie-fudge': bakeryAssets.product.dailyBakes,
  'bread-garlic': bakeryAssets.product.dailyBakes,
  'savory-puff': bakeryAssets.product.dailyBakes,
  'gift-celebration': bakeryAssets.product.dailyBakes,
}

export function getBakeryProductAsset(productId: string) {
  return productAssetMap[productId] ?? bakeryAssets.product.vintage
}
