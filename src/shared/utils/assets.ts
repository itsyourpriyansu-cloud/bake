export const pizzaWaveAssets = {
  hero: {
    mainPizza: '/assets/hero/hero-main-pizza.png',
    kulhadPizza: '/assets/hero/hero-kulhad-pizza.png',
    friendsSharing: '/assets/hero/hero-friends-sharing.png',
    familySharing: '/assets/hero/hero-family-sharing.png',
  },
  lifestyle: {
    birthday: '/assets/lifestyle/lifestyle-birthday.png',
    familyCombo: '/assets/lifestyle/lifestyle-family-combo.png',
    pickup: '/assets/lifestyle/lifestyle-pickup.png',
    puriEvening: '/assets/lifestyle/lifestyle-puri-evening.png',
    referralFriends: '/assets/lifestyle/lifestyle-referral-friends.png',
  },
  macro: {
    brownie: '/assets/macro/macro-brownie.png',
    cheesePull: '/assets/macro/macro-cheese-pull.png',
    crust: '/assets/macro/macro-crust.png',
    kulhadScoop: '/assets/macro/macro-kulhad-scoop.png',
    mushroomCheese: '/assets/macro/macro-mushroom-cheese.png',
    paneer: '/assets/macro/macro-paneer.png',
    periFries: '/assets/macro/macro-peri-fries.png',
    shake: '/assets/macro/macro-shake.png',
  },
  loyalty: {
    gold: '/assets/loyalty/gold-wave.svg',
    platinum: '/assets/loyalty/platinum-wave.svg',
    silver: '/assets/loyalty/silver-wave.svg',
    member: '/assets/loyalty/wave-member.svg',
    points: '/assets/loyalty/wave-points.svg',
    waveIdBackground: '/assets/loyalty/wave-id-bg.svg',
  },
  placeholders: {
    cart: '/assets/placeholders/empty-cart.svg',
    favourites: '/assets/placeholders/no-favourites.svg',
    orders: '/assets/placeholders/no-orders.svg',
    rewards: '/assets/placeholders/no-rewards.svg',
    offline: '/assets/placeholders/offline.svg',
  },
} as const

const productPaths: Record<string, string> = {
  'PIZZA-VEG-001': '/assets/products/pizza/classic-veg-pizza.png',
  'PIZZA-PANEER-001': '/assets/products/pizza/paneer-cheese-pizza.png',
  'PIZZA-MUSH-001': '/assets/products/pizza/mushroom-cheese-pizza.png',
  'PIZZA-CHK-001': '/assets/products/pizza/chicken-tikka-pizza.png',
  'KULHAD-001': '/assets/products/kulhad/signature-kulhad-pizza.png',
  'BURGER-001': '/assets/products/burger/paneer-crunch-burger.png',
  'WRAP-001': '/assets/products/wrap/chicken-tikka-wrap.png',
  'FRIES-001': '/assets/products/sides/peri-peri-fries.png',
  'GARLIC-001': '/assets/products/sides/cheesy-garlic-bread.png',
  'SHAKE-001': '/assets/products/drinks/oreo-thick-shake.png',
  'COFFEE-001': '/assets/products/drinks/cold-coffee.png',
  'BROWNIE-001': '/assets/products/desserts/chocolate-brownie.png',
}

function fallbackLabel(productId: string) {
  return productId.split('-')[0]
}

export function getProductAsset(productId: string, requestedPath?: string) {
  const configured = productPaths[productId]
  const stem = requestedPath?.replace(/\.(avif|webp|png|jpe?g)$/i, '')
  return { src: configured ?? (stem ? `${stem}.png` : pizzaWaveAssets.hero.mainPizza), fallbackLabel: fallbackLabel(productId) }
}

export function getProductAssetById(productId: string) {
  return getProductAsset(productId)
}
