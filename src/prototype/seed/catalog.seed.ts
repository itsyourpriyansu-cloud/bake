import type { Category, ModifierGroup, Product, SmartCollection, VariantDependency } from '../../domain/catalog/catalog.types'

export const categorySeed: Category[] = [
  { id: 'pizza', name: 'Pizza', color: 'orange', sortOrder: 1 },
  { id: 'kulhad', name: 'Kulhad', color: 'yellow', sortOrder: 2 },
  { id: 'burger', name: 'Burger', color: 'green', sortOrder: 3 },
  { id: 'wrap', name: 'Wrap', color: 'sky', sortOrder: 4 },
  { id: 'sides', name: 'Sides', color: 'yellow', sortOrder: 5 },
  { id: 'shakes', name: 'Shakes', color: 'sky', sortOrder: 6 },
  { id: 'desserts', name: 'Dessert', color: 'pink', sortOrder: 7 },
]

const option = (groupId: string, id: string, name: string, priceDelta = 0, variantDependencies: VariantDependency[] = []) => ({ id, name, groupId, priceDelta, available: true, variantDependencies })

export const pizzaModifiers: ModifierGroup[] = [
  { id: 'size', name: 'Size', required: true, minSelections: 1, maxSelections: 1, options: [option('size', 'regular', 'Regular'), option('size', 'medium', 'Medium', 80), option('size', 'large', 'Large', 150)] },
  { id: 'base', name: 'Base', required: true, minSelections: 1, maxSelections: 1, options: [option('base', 'normal', 'Normal'), option('base', 'whole-wheat', 'Whole Wheat', 30), option('base', 'multigrain', 'Multigrain', 40)] },
  { id: 'sauce', name: 'Sauce', required: true, minSelections: 1, maxSelections: 1, options: [option('sauce', 'classic-tomato', 'Classic Tomato'), option('sauce', 'smoky-makhani', 'Smoky Makhani', 20), option('sauce', 'fiery-peri-peri', 'Fiery Peri Peri', 20)] },
  { id: 'cheese', name: 'Cheese', required: true, minSelections: 1, maxSelections: 1, options: [option('cheese', 'regular-cheese', 'Regular'), option('cheese', 'extra-cheese', 'Extra', 45), option('cheese', 'double-mozzarella', 'Double Mozzarella', 75, [{ groupId: 'size', optionIds: ['medium', 'large'] }])] },
  { id: 'toppings', name: 'Toppings', required: false, minSelections: 0, maxSelections: 3, multiple: true, options: ['Paneer', 'Mushroom', 'Corn', 'Olives', 'Jalapeño'].map((name) => option('toppings', name.toLowerCase(), name, 30)) },
  { id: 'spice', name: 'Spice', required: true, minSelections: 1, maxSelections: 1, options: ['Mild', 'Medium', 'Spicy'].map((name) => option('spice', `spice-${name.toLowerCase()}`, name)) },
  { id: 'meal', name: 'Complete the Meal', required: false, minSelections: 0, maxSelections: 2, multiple: true, options: [option('meal', 'meal-fries', 'Peri Peri Fries', 79), option('meal', 'meal-garlic-bread', 'Cheesy Garlic Bread', 109), option('meal', 'meal-oreo-shake', 'Oreo Thick Shake', 129)] },
]

/** Kulhad Pizza keeps the same seven-step builder contract with vessel-appropriate size and filling choices. */
export const kulhadPizzaModifiers: ModifierGroup[] = pizzaModifiers.map((group) => {
  if (group.id === 'size') return { ...group, options: [option('size', 'kulhad-classic', 'Classic Kulhad'), option('size', 'kulhad-duo', 'Sharing Duo', 170)] }
  if (group.id === 'base') return { ...group, options: [option('base', 'kulhad-veg', 'Classic Veg Filling'), option('base', 'kulhad-paneer', 'Makhani Paneer Filling', 35), option('base', 'kulhad-corn', 'Cheesy Corn Filling', 25)] }
  if (group.id === 'cheese') return { ...group, options: [option('cheese', 'regular-cheese', 'Regular'), option('cheese', 'extra-cheese', 'Extra', 45), option('cheese', 'double-mozzarella', 'Double Mozzarella', 75, [{ groupId: 'size', optionIds: ['kulhad-duo'] }])] }
  return group
})

const product = (id: string, slug: string, name: string, shortDescription: string, categoryId: string, basePrice: number, veg: boolean, prepMinutes: number, complexity: number, station: Product['station'], imageKey: string, badges: Product['badges'], modifiers: boolean | ModifierGroup[] = false, recommendedPairings: string[] = []): Product => ({
  id, slug, name, shortDescription, categoryId, basePrice, veg, available: true, prepMinutes, complexity, station, imageKey, badges,
  modifierGroups: Array.isArray(modifiers) ? modifiers : modifiers ? pizzaModifiers : undefined, recommendedPairings,
})

export const productSeed: Product[] = [
  product('PIZZA-VEG-001', 'classic-veg-pizza', 'Classic Veg Pizza', 'Onion, tomato, capsicum, corn and mozzarella on a golden crust.', 'pizza', 110, true, 14, 2, 'PIZZA', 'pizza/classic-veg-pizza.webp', ['Bestseller', 'Veg', 'Customizable'], true, ['COFFEE-001']),
  product('PIZZA-PANEER-001', 'paneer-cheese-pizza', 'Paneer Cheese Pizza', 'Paneer, capsicum and onion with a generous layer of mozzarella.', 'pizza', 229, true, 16, 2, 'PIZZA', 'pizza/paneer-cheese-pizza.webp', ['Bestseller', 'Veg', 'Customizable'], true, ['GARLIC-001', 'SHAKE-001']),
  product('PIZZA-MUSH-001', 'mushroom-cheese-pizza', 'Mushroom Cheese Pizza', 'Sliced mushroom, browned mozzarella and herbs.', 'pizza', 199, true, 16, 2, 'PIZZA', 'pizza/mushroom-cheese-pizza.webp', ['Veg', 'Customizable'], true, ['FRIES-001', 'COFFEE-001']),
  product('PIZZA-CHK-001', 'chicken-tikka-pizza', 'Chicken Tikka Pizza', 'Roasted chicken tikka, onion, capsicum and mozzarella.', 'pizza', 249, false, 18, 3, 'PIZZA', 'pizza/chicken-tikka-pizza.webp', ['Spicy', 'Customizable'], true, ['GARLIC-001', 'SHAKE-001']),
  product('KULHAD-001', 'signature-kulhad-pizza', 'Signature Kulhad Pizza', 'Molten cheese and pizza filling baked in a rustic clay kulhad.', 'kulhad', 199, true, 20, 3, 'ASSEMBLY', 'kulhad/signature-kulhad-pizza.webp', ['Wave Exclusive', 'New', 'Veg', 'Customizable'], kulhadPizzaModifiers, ['FRIES-001', 'SHAKE-001']),
  product('BURGER-001', 'paneer-crunch-burger', 'Paneer Crunch Burger', 'Crisp paneer patty, lettuce, onion and signature sauce.', 'burger', 149, true, 10, 1, 'ASSEMBLY', 'burger/paneer-crunch-burger.webp', ['New', 'Veg']),
  product('WRAP-001', 'chicken-tikka-wrap', 'Chicken Tikka Wrap', 'Chicken tikka, fresh vegetables and sauce in a grilled wrap.', 'wrap', 179, false, 10, 1, 'ASSEMBLY', 'wrap/chicken-tikka-wrap.webp', ['Spicy']),
  product('FRIES-001', 'peri-peri-fries', 'Peri Peri Fries', 'Crisp fries tossed in lively peri-peri seasoning.', 'sides', 99, true, 6, 1, 'FRY', 'sides/peri-peri-fries.webp', ['Bestseller', 'Veg']),
  product('GARLIC-001', 'cheesy-garlic-bread', 'Cheesy Garlic Bread', 'Toasted garlic bread with melted cheese and herbs.', 'sides', 129, true, 8, 1, 'ASSEMBLY', 'sides/cheesy-garlic-bread.webp', ['Veg']),
  product('SHAKE-001', 'oreo-thick-shake', 'Oreo Thick Shake', 'Creamy cookie-crumb thick shake.', 'shakes', 149, true, 4, 1, 'BEVERAGE', 'drinks/oreo-thick-shake.webp', ['Bestseller', 'Veg']),
  product('COFFEE-001', 'cold-coffee', 'Cold Coffee', 'Chilled, creamy and frothy coffee.', 'shakes', 119, true, 4, 1, 'BEVERAGE', 'drinks/cold-coffee.webp', ['Veg']),
  product('BROWNIE-001', 'chocolate-brownie', 'Chocolate Brownie', 'Dense, moist brownie with a lightly cracked top.', 'desserts', 99, true, 2, 1, 'ASSEMBLY', 'desserts/chocolate-brownie.webp', ['Veg']),
]

export const smartCollectionSeed: SmartCollection[] = [
  { id: 'under-199', name: 'Under ₹199' }, { id: 'best-sellers', name: 'Best Sellers' },
  { id: 'veg-favourites', name: 'Veg Favourites' }, { id: 'cheese-lovers', name: 'Cheese Lovers' },
  { id: 'for-two', name: 'For Two' }, { id: 'family', name: 'Family' },
  { id: 'quick-bites', name: 'Quick Bites' }, { id: 'something-sweet', name: 'Something Sweet' },
]
