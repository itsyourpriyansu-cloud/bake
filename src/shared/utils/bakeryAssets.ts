const root = '/assets/bakery'

export const bakeryAssets = {
  hero: `${root}/hero/celebration-studio.webp`,
  gallery: {
    celebrationChocolate: `${root}/gallery/celebration-chocolate.webp`,
    minimalWhite: `${root}/gallery/minimal-white.webp`,
    pastelParty: `${root}/gallery/pastel-party.webp`,
    pinkCelebration: `${root}/gallery/pink-celebration.webp`,
    berryLayer: `${root}/gallery/berry-layer.webp`,
    darkTruffle: `${root}/gallery/dark-truffle.webp`,
  },
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
  'cake-couple-duet': bakeryAssets.gallery.pinkCelebration,
  'cake-date-night-bento': bakeryAssets.gallery.berryLayer,
  'cake-trending-bow': bakeryAssets.gallery.pastelParty,
  'cake-retro-cherry': bakeryAssets.gallery.minimalWhite,
  'cake-custom-canvas': bakeryAssets.hero,
  'cake-kids-confetti': bakeryAssets.gallery.pastelParty,
  'cake-baby-cloud': bakeryAssets.product.floral,
  'cake-wedding-pearl': bakeryAssets.gallery.celebrationChocolate,
  'cake-corporate-logo': bakeryAssets.gallery.celebrationChocolate,
  'cake-festival-rasmalai': bakeryAssets.product.floral,
  'cake-minimalist': bakeryAssets.gallery.minimalWhite,
  'cake-photo-strip': bakeryAssets.hero,
  'pastry-chocolate': bakeryAssets.product.dailyBakes,
  'brownie-fudge': bakeryAssets.product.dailyBakes,
  'bread-garlic': bakeryAssets.product.dailyBakes,
  'savory-puff': bakeryAssets.product.dailyBakes,
  'gift-celebration': bakeryAssets.product.dailyBakes,
}

export function getBakeryProductAsset(productId: string) {
  return productAssetMap[productId] ?? bakeryAssets.product.vintage
}
