import type { Celebration, CustomerNotification, FamilyMember, Favourite, FoodPreferences, NotificationPreferences, SavedOrder } from '../../domain/customer/customer-experience.types'

const stamp = '2026-09-07T18:00:00.000Z'

export const savedOrderSeed: SavedOrder[] = [
  { id: 'SAVED-USUAL', customerId: 'CUST001', name: 'My Usual', items: [{ productId: 'PIZZA-PANEER-001', quantity: 1, modifiers: [] }, { productId: 'COFFEE-001', quantity: 1, modifiers: [] }], createdAt: stamp, updatedAt: stamp },
  { id: 'SAVED-SATURDAY', customerId: 'CUST001', name: 'Saturday Night', items: [{ productId: 'PIZZA-VEG-001', quantity: 1, modifiers: [] }, { productId: 'GARLIC-001', quantity: 1, modifiers: [] }, { productId: 'SHAKE-001', quantity: 2, modifiers: [] }], createdAt: stamp, updatedAt: stamp },
  { id: 'SAVED-FAMILY', customerId: 'CUST001', name: 'Family Order', items: [{ productId: 'PIZZA-PANEER-001', quantity: 1, modifiers: [] }, { productId: 'PIZZA-VEG-001', quantity: 1, modifiers: [] }, { productId: 'FRIES-001', quantity: 2, modifiers: [] }], createdAt: stamp, updatedAt: stamp },
]

export const favouriteSeed: Favourite[] = [
  { id: 'FAV-PANEER', customerId: 'CUST001', kind: 'PRODUCT', name: 'Paneer Cheese Pizza', productId: 'PIZZA-PANEER-001', createdAt: stamp },
  { id: 'FAV-KULHAD', customerId: 'CUST001', kind: 'PRODUCT', name: 'Signature Kulhad Pizza', productId: 'KULHAD-001', createdAt: stamp },
  { id: 'FAV-COMBO', customerId: 'CUST001', kind: 'COMBINATION', name: 'Cheesy Friday', items: [{ productId: 'PIZZA-VEG-001', quantity: 1, modifiers: [{ groupId: 'cheese', optionIds: ['extra-cheese'] }] }, { productId: 'GARLIC-001', quantity: 1, modifiers: [] }], createdAt: stamp },
]

export const foodPreferencesSeed: FoodPreferences = { diet: 'VEG', spiceLevel: 'MEDIUM', cheese: 'EXTRA', avoid: ['Mushroom'], favouriteCategories: ['Pizza', 'Kulhad', 'Shakes'] }
export const notificationPreferencesSeed: NotificationPreferences = { orderUpdates: true, offers: true, rewards: true, celebrations: true }

export const familySeed: FamilyMember[] = [
  { id: 'FAMILY-ME', customerId: 'CUST001', name: 'Priyanshu', relation: 'Me', diet: 'VEG', spiceLevel: 'MEDIUM', avoid: ['Mushroom'], favouriteProducts: ['Paneer Cheese Pizza', 'Cold Coffee'] },
  { id: 'FAMILY-MOM', customerId: 'CUST001', name: 'Mom', relation: 'Mom', diet: 'VEG', spiceLevel: 'MILD', avoid: ['Jalapeño'], favouriteProducts: ['Classic Veg Pizza'] },
  { id: 'FAMILY-DAD', customerId: 'CUST001', name: 'Dad', relation: 'Dad', diet: 'BOTH', spiceLevel: 'SPICY', avoid: [], favouriteProducts: ['Chicken Tikka Wrap'] },
]

export const celebrationSeed: Celebration[] = [
  { id: 'CELEB-BDAY', customerId: 'CUST001', type: 'BIRTHDAY', label: "Priyanshu's birthday", relation: 'Me', day: 18, month: 11 },
  { id: 'CELEB-ANNIV', customerId: 'CUST001', type: 'ANNIVERSARY', label: "Parents' anniversary", relation: 'Family', day: 6, month: 2 },
]

export const notificationSeed: CustomerNotification[] = [
  { id: 'NOTIF-ORDER', customerId: 'CUST001', kind: 'ORDER', title: 'Your pizza is preparing', message: 'PW1384 is fresh in the kitchen. ETA 7:05 PM.', createdAt: '2026-09-10T12:20:00.000Z', read: false, orderId: 'ORDER-ACTIVE-1384' },
  { id: 'NOTIF-ETA', customerId: 'CUST001', kind: 'ETA', title: 'ETA updated', message: 'Your delivery window is now 7:00–7:10 PM.', createdAt: '2026-09-10T12:15:00.000Z', read: false, orderId: 'ORDER-ACTIVE-1384' },
  { id: 'NOTIF-POINTS', customerId: 'CUST001', kind: 'POINTS', title: '19 points are pending', message: 'They become available when your order is completed.', createdAt: '2026-09-09T17:00:00.000Z', read: true },
  { id: 'NOTIF-REWARD', customerId: 'CUST001', kind: 'REWARD', title: 'You are close to Platinum', message: '2 orders and ₹880 to unlock 5% back.', createdAt: '2026-09-08T10:00:00.000Z', read: true },
]
