import type { BakeryAvailability, BakeryBespokeRequest, BakeryCartItem, BakeryFulfillment, BakeryModifierGroup, BakeryOrder, BakeryProduct, BakeryProductionStatus, BakerySavedDesign, BakerySelection } from '../../domain/bakery/bakery.types'

const cakeGroups: BakeryModifierGroup[] = [
  { id: 'size', title: 'Size & servings', description: 'Pick the right size for the guest list.', required: true, min: 1, max: 1, options: [
    { id: 'half-kg', label: '0.5 kg · serves 4–6', priceDelta: 0, recommended: true },
    { id: 'one-kg', label: '1 kg · serves 8–12', priceDelta: 380 },
    { id: 'two-kg', label: '2 kg · serves 18–24', priceDelta: 990 },
  ] },
  { id: 'sponge', title: 'Sponge', description: 'Choose the heart of the cake.', required: true, min: 1, max: 1, options: [
    { id: 'chocolate', label: 'Chocolate', priceDelta: 0, recommended: true }, { id: 'vanilla', label: 'Vanilla', priceDelta: 0 },
    { id: 'red-velvet', label: 'Red velvet', priceDelta: 90 }, { id: 'eggless', label: 'Eggless vanilla', priceDelta: 60 },
  ] },
  { id: 'filling', title: 'Filling', description: 'Add a little surprise inside.', required: true, min: 1, max: 1, options: [
    { id: 'ganache', label: 'Chocolate ganache', priceDelta: 0, recommended: true }, { id: 'berry', label: 'Berry compote', priceDelta: 80 },
    { id: 'caramel', label: 'Salted caramel', priceDelta: 90 }, { id: 'cream-cheese', label: 'Cream cheese', priceDelta: 120 },
  ] },
  { id: 'finish', title: 'Finish & colour', description: 'Set the visual mood.', required: true, min: 1, max: 1, options: [
    { id: 'signature', label: 'Signature buttercream', priceDelta: 0, recommended: true }, { id: 'vintage', label: 'Vintage piping', priceDelta: 180 },
    { id: 'floral', label: 'Edible floral', priceDelta: 220 }, { id: 'fondant', label: 'Fondant finish', priceDelta: 320 },
  ] },
  { id: 'shape', title: 'Shape', description: 'Make the silhouette yours.', required: true, min: 1, max: 1, options: [
    { id: 'round', label: 'Round', priceDelta: 0, recommended: true }, { id: 'heart', label: 'Heart', priceDelta: 120 },
    { id: 'square', label: 'Square', priceDelta: 80 }, { id: 'number', label: 'Number cake', priceDelta: 260 },
  ] },
  { id: 'decor', title: 'Decoration', description: 'Choose one hero treatment.', required: false, min: 0, max: 2, options: [
    { id: 'cherries', label: 'Cherries & piping', priceDelta: 90 }, { id: 'flowers', label: 'Fresh-look florals', priceDelta: 180 },
    { id: 'photo', label: 'Edible photo print', priceDelta: 180 }, { id: 'topper', label: 'Personalised topper', priceDelta: 120 },
  ] },
  { id: 'extras', title: 'Complete the celebration', description: 'Useful extras, not forced bundles.', required: false, min: 0, max: 3, options: [
    { id: 'candles', label: 'Celebration candles', priceDelta: 49 }, { id: 'card', label: 'Handwritten card', priceDelta: 69 },
    { id: 'cupcakes', label: 'Box of 4 cupcakes', priceDelta: 299 }, { id: 'brownies', label: 'Brownie box', priceDelta: 349 },
  ] },
]

const simpleProduct = (input: Omit<BakeryProduct, 'events' | 'available' | 'modifierGroups' | 'egglessAvailable' | 'readyToday' | 'customisable'> & Partial<Pick<BakeryProduct, 'events' | 'available' | 'egglessAvailable' | 'readyToday' | 'customisable' | 'modifierGroups'>>): BakeryProduct => ({
  events: ['BIRTHDAY', 'JUST_BECAUSE'], available: true, egglessAvailable: true, readyToday: true, customisable: false, modifierGroups: [], ...input,
})

export const bakeryProducts: BakeryProduct[] = [
  simpleProduct({ id: 'cake-vintage-heart', name: 'Vintage Heart Cake', description: 'Romantic cherry-red piping on silky vanilla buttercream.', category: 'CAKES', style: 'VINTAGE', basePrice: 749, imageKey: 'vintage', leadHours: 8, servingLabel: 'Serves 6–8', customisable: true, modifierGroups: cakeGroups, events: ['BIRTHDAY', 'ANNIVERSARY', 'WEDDING'], bestseller: true }),
  simpleProduct({ id: 'cake-floral-lavender', name: 'Lavender Garden Cake', description: 'A joyful floral cake with delicate piping and bright edible blooms.', category: 'CAKES', style: 'FLORAL', basePrice: 899, imageKey: 'floral', leadHours: 12, servingLabel: 'Serves 8–10', customisable: true, modifierGroups: cakeGroups, events: ['BIRTHDAY', 'ANNIVERSARY', 'BABY_SHOWER'], new: true }),
  simpleProduct({ id: 'cake-chocolate-truffle', name: 'Midnight Truffle Cake', description: 'Deep chocolate sponge, glossy ganache and handmade truffles.', category: 'CAKES', style: 'CHOCOLATE', basePrice: 649, imageKey: 'chocolate', leadHours: 4, servingLabel: 'Serves 6–8', customisable: true, modifierGroups: cakeGroups, bestseller: true }),
  simpleProduct({ id: 'cake-black-forest', name: 'Cherry Black Forest', description: 'Chocolate, whipped cream and cherries in a modern finish.', category: 'CAKES', style: 'MINIMAL', basePrice: 549, imageKey: 'chocolate', leadHours: 4, servingLabel: 'Serves 6–8', customisable: true, modifierGroups: cakeGroups }),
  simpleProduct({ id: 'cake-rasmalai', name: 'Rasmalai Celebration Cake', description: 'Saffron cream, pistachio and a soft cardamom sponge.', category: 'CAKES', style: 'FUSION', basePrice: 749, imageKey: 'floral', leadHours: 8, servingLabel: 'Serves 6–8', customisable: true, modifierGroups: cakeGroups, events: ['BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL'], bestseller: true }),
  simpleProduct({ id: 'cake-bento', name: 'Tiny Joy Bento Cake', description: 'A compact personalised cake for small, happy moments.', category: 'BENTO', style: 'BENTO', basePrice: 349, imageKey: 'vintage', leadHours: 4, servingLabel: 'Serves 2–3', customisable: true, modifierGroups: cakeGroups, new: true }),
  simpleProduct({ id: 'cake-photo', name: 'Memory Photo Cake', description: 'Your favourite photograph, printed and finished by hand.', category: 'CAKES', style: 'PHOTO', basePrice: 799, imageKey: 'floral', leadHours: 24, servingLabel: 'Serves 8–10', customisable: true, modifierGroups: cakeGroups, events: ['BIRTHDAY', 'ANNIVERSARY', 'CORPORATE'] }),
  simpleProduct({ id: 'pastry-chocolate', name: 'Chocolate Truffle Pastry', description: 'Fudgy, glossy and baked fresh today.', category: 'PASTRIES', basePrice: 119, imageKey: 'chocolate', leadHours: 0, servingLabel: '1 piece', bestseller: true, available: false }),
  simpleProduct({ id: 'brownie-fudge', name: 'Warm Fudge Brownie', description: 'Crackly top with a molten chocolate centre.', category: 'BROWNIES', basePrice: 129, imageKey: 'chocolate', leadHours: 0, servingLabel: '1 piece' }),
  simpleProduct({ id: 'bread-garlic', name: 'Garlic Herb Loaf', description: 'Slow-proofed loaf with roasted garlic butter.', category: 'BREADS', basePrice: 149, imageKey: 'vintage', leadHours: 0, servingLabel: '1 loaf', egglessAvailable: true }),
  simpleProduct({ id: 'savory-puff', name: 'Garden Veg Puff', description: 'Flaky pastry with a warmly spiced vegetable filling.', category: 'SAVOURIES', basePrice: 69, imageKey: 'floral', leadHours: 0, servingLabel: '1 piece' }),
  simpleProduct({ id: 'gift-celebration', name: 'Little Celebration Box', description: 'Four cupcakes, two brownies and a handwritten card.', category: 'GIFTING', basePrice: 599, imageKey: 'floral', leadHours: 4, servingLabel: 'Gift box', readyToday: true }),
]

export const bakeryCategoryLabels: Record<string, string> = {
  CAKES: 'Cakes', BENTO: 'Bento', PASTRIES: 'Pastries', BROWNIES: 'Brownies', BREADS: 'Breads', SAVOURIES: 'Savouries', GIFTING: 'Gifting', DRINKS: 'Drinks',
}

// --- Operational seed data: orders, bespoke requests, availability and saved designs -----------
// Populated so Founder Control and the Production board are never empty on a fresh browser
// profile. Every time-based field is relative to `Date.now()` so the demo never looks stale.

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const IST_OFFSET_MS = 5.5 * HOUR

const productById = (id: string): BakeryProduct => {
  const product = bakeryProducts.find((candidate) => candidate.id === id)
  if (!product) throw new Error(`Unknown seed product: ${id}`)
  return product
}

/** Wall-clock IST date/time label for an absolute instant, used only for display fields. */
function istLabel(atMs: number) {
  const shifted = new Date(atMs + IST_OFFSET_MS)
  return { eventDate: shifted.toISOString().slice(0, 10), slot: shifted.toISOString().slice(11, 16) }
}

function seedItem(itemId: string, productId: string, quantity: number, optionIds: string[], message?: string): BakeryCartItem {
  const product = productById(productId)
  const selections: BakerySelection[] = product.modifierGroups
    .map((group) => ({ groupId: group.id, optionIds: group.options.filter((option) => optionIds.includes(option.id)).map((option) => option.id) }))
    .filter((selection) => selection.optionIds.length > 0)
  const delta = product.modifierGroups.flatMap((group) => group.options).filter((option) => optionIds.includes(option.id)).reduce((sum, option) => sum + option.priceDelta, 0)
  return { id: itemId, productId, quantity, unitPrice: product.basePrice + delta, selections, message, product }
}

function seedQuote(items: BakeryCartItem[], fulfillment: BakeryFulfillment) {
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0)
  const discount = subtotal >= 1499 ? 150 : 0
  const deliveryFee = fulfillment === 'DELIVERY' && subtotal < 999 ? 59 : 0
  return {
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotal, discount, pointsRequested: 0, pointsUsable: 0, pointsValue: 0,
    deliveryFee, pointsToEarn: Math.floor((subtotal - discount) / 10), total: Math.max(0, subtotal - discount + deliveryFee), valid: true, warnings: [],
  }
}

function seedOrder(input: {
  id: string; sequence: number; customerName: string; customerPhone: string; fulfillment: BakeryFulfillment
  productionStatus: BakeryProductionStatus; paymentStatus: BakeryOrder['paymentStatus']; items: BakeryCartItem[]
  promisedOffsetMs: number; createdOffsetMs: number; note?: string
}): BakeryOrder {
  const promisedAtMs = Date.now() + input.promisedOffsetMs
  const { eventDate, slot } = istLabel(promisedAtMs)
  return {
    id: input.id, publicNumber: `BW${input.sequence}`, customerName: input.customerName, customerPhone: input.customerPhone,
    fulfillment: input.fulfillment, eventDate, slot, items: input.items, quote: seedQuote(input.items, input.fulfillment),
    paymentStatus: input.paymentStatus, productionStatus: input.productionStatus, promisedAt: new Date(promisedAtMs).toISOString(),
    createdAt: new Date(Date.now() + input.createdOffsetMs).toISOString(), note: input.note,
  }
}

// Four repeat/first-time customers so Owner's Customers/Growth tabs have real data to aggregate —
// live checkout always books as "Priyanshu", so these seed rows are the only source of variety.
const ananya = { name: 'Ananya Rao', phone: '9812345601' }
const rohit = { name: 'Rohit Sahoo', phone: '9812345602' }
const meera = { name: 'Meera Panda', phone: '9812345603' }
const kabir = { name: 'Kabir Nanda', phone: '9812345604' }

export const bakeryOrders: BakeryOrder[] = [
  seedOrder({
    id: 'BKO-SEED-1', sequence: 241, customerName: ananya.name, customerPhone: ananya.phone, fulfillment: 'DELIVERY',
    productionStatus: 'AWAITING_ACCEPTANCE', paymentStatus: 'CONFIRMED', promisedOffsetMs: 5 * HOUR, createdOffsetMs: -1 * HOUR,
    items: [seedItem('BCI-SEED-1', 'cake-vintage-heart', 1, ['one-kg', 'chocolate', 'ganache', 'vintage', 'heart', 'candles'], 'Happy Birthday Ananya!')],
  }),
  seedOrder({
    id: 'BKO-SEED-2', sequence: 242, customerName: kabir.name, customerPhone: kabir.phone, fulfillment: 'PICKUP',
    productionStatus: 'SCHEDULED', paymentStatus: 'CONFIRMED', promisedOffsetMs: 26 * HOUR, createdOffsetMs: -3 * HOUR,
    items: [seedItem('BCI-SEED-2', 'cake-photo', 1, ['half-kg', 'vanilla', 'berry', 'signature', 'round', 'photo'])],
  }),
  seedOrder({
    id: 'BKO-SEED-3', sequence: 243, customerName: ananya.name, customerPhone: ananya.phone, fulfillment: 'DELIVERY',
    productionStatus: 'MIXING', paymentStatus: 'CONFIRMED', promisedOffsetMs: 2 * HOUR, createdOffsetMs: -2 * HOUR,
    items: [seedItem('BCI-SEED-3', 'cake-rasmalai', 1, ['one-kg', 'signature', 'round'])],
  }),
  seedOrder({
    id: 'BKO-SEED-4', sequence: 244, customerName: meera.name, customerPhone: meera.phone, fulfillment: 'PICKUP',
    productionStatus: 'BAKING', paymentStatus: 'CONFIRMED', promisedOffsetMs: 3 * HOUR, createdOffsetMs: -1 * HOUR,
    items: [seedItem('BCI-SEED-4', 'cake-black-forest', 1, ['half-kg', 'chocolate', 'ganache', 'signature', 'round'])],
  }),
  seedOrder({
    id: 'BKO-SEED-5', sequence: 245, customerName: rohit.name, customerPhone: rohit.phone, fulfillment: 'DELIVERY',
    productionStatus: 'DECORATING', paymentStatus: 'CONFIRMED', promisedOffsetMs: 1 * HOUR, createdOffsetMs: -4 * HOUR,
    items: [
      seedItem('BCI-SEED-5A', 'cake-bento', 1, ['chocolate'], 'Just because!'),
      seedItem('BCI-SEED-5B', 'brownie-fudge', 2, []),
    ],
  }),
  seedOrder({
    id: 'BKO-SEED-6', sequence: 246, customerName: meera.name, customerPhone: meera.phone, fulfillment: 'PICKUP',
    productionStatus: 'READY', paymentStatus: 'CONFIRMED', promisedOffsetMs: -10 * 60 * 1000, createdOffsetMs: -5 * HOUR,
    items: [seedItem('BCI-SEED-6', 'gift-celebration', 1, [])],
  }),
  seedOrder({
    id: 'BKO-SEED-7', sequence: 247, customerName: ananya.name, customerPhone: ananya.phone, fulfillment: 'DELIVERY',
    productionStatus: 'COMPLETED', paymentStatus: 'CONFIRMED', promisedOffsetMs: -1 * DAY, createdOffsetMs: -1 * DAY - 2 * HOUR,
    items: [seedItem('BCI-SEED-7', 'cake-chocolate-truffle', 1, ['half-kg', 'signature', 'round'])],
  }),
  seedOrder({
    id: 'BKO-SEED-8', sequence: 248, customerName: rohit.name, customerPhone: rohit.phone, fulfillment: 'DELIVERY',
    productionStatus: 'REJECTED', paymentStatus: 'REFUNDING', promisedOffsetMs: -2 * DAY, createdOffsetMs: -2 * DAY - 1 * HOUR,
    note: 'Kitchen delay — order rejected and refund initiated for the customer.',
    items: [seedItem('BCI-SEED-8', 'cake-floral-lavender', 1, ['half-kg', 'vanilla', 'signature', 'round'])],
  }),
]

export const bakeryBespokeRequests: BakeryBespokeRequest[] = [
  { id: 'BRQ-SEED-1', event: 'WEDDING', eventDate: istLabel(Date.now() + 6 * DAY).eventDate, servings: '80–100', budget: '₹12,000–18,000', notes: 'Three-tier fondant cake, ivory and gold, fresh florals to match the mandap.', status: 'NEW', customerPhone: ananya.phone, referenceImage: { src: '/assets/bakery/products/floral-lavender.webp', name: 'ivory-floral-inspiration.webp', mimeType: 'image/webp', sizeBytes: 428000 }, referenceApprovalStatus: 'PENDING_REVIEW', createdAt: new Date(Date.now() - 3 * HOUR).toISOString() },
  { id: 'BRQ-SEED-2', event: 'CORPORATE', eventDate: istLabel(Date.now() + 3 * DAY).eventDate, servings: '40', budget: '₹5,000–7,000', notes: 'Logo-topped sheet cake for a product launch, eggless required.', status: 'NEW', customerPhone: '9812345605', createdAt: new Date(Date.now() - 20 * HOUR).toISOString() },
  { id: 'BRQ-SEED-3', event: 'BABY_SHOWER', eventDate: istLabel(Date.now() + 9 * DAY).eventDate, servings: '25', budget: '₹3,000–4,500', notes: 'Pastel bento cakes, boy-or-girl reveal inside.', status: 'REVIEWING', customerPhone: meera.phone, referenceImage: { src: '/assets/bakery/products/vintage-heart.webp', name: 'pastel-piping-reference.webp', mimeType: 'image/webp', sizeBytes: 386000 }, referenceApprovalStatus: 'APPROVED', referenceReviewNote: 'Replicate the piping rhythm and pastel palette; adapt the topper for the baby shower.', referenceReviewedAt: new Date(Date.now() - DAY).toISOString(), createdAt: new Date(Date.now() - 2 * DAY).toISOString() },
]

export const bakeryAvailabilityOverrides: BakeryAvailability[] = [
  { id: 'BA-pastry-chocolate', productId: 'pastry-chocolate', available: false, source: 'BAKER', reason: 'Ran out of couverture chocolate this morning', until: new Date(Date.now() + 3 * HOUR).toISOString() },
]

// Two customers with a saved design but no order (the Growth tab's real "no order yet" signal)
// plus one existing customer saving a second idea, so the feature reads true for both cases.
export const bakerySavedDesigns: BakerySavedDesign[] = [
  { id: 'BSD-SEED-1', customerPhone: '9812345605', productId: 'cake-vintage-heart', selections: [{ groupId: 'size', optionIds: ['one-kg'] }, { groupId: 'finish', optionIds: ['vintage'] }], eventType: 'ANNIVERSARY', eventDate: istLabel(Date.now() + 11 * DAY).eventDate, savedAt: new Date(Date.now() - 2 * DAY).toISOString() },
  { id: 'BSD-SEED-2', customerPhone: '9812345606', productId: 'cake-floral-lavender', selections: [{ groupId: 'size', optionIds: ['two-kg'] }, { groupId: 'finish', optionIds: ['floral'] }], eventType: 'BIRTHDAY', eventDate: istLabel(Date.now() + 4 * DAY).eventDate, savedAt: new Date(Date.now() - 5 * HOUR).toISOString() },
  { id: 'BSD-SEED-3', customerPhone: ananya.phone, productId: 'cake-photo', selections: [{ groupId: 'decor', optionIds: ['photo'] }], eventType: 'JUST_BECAUSE', savedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
]

export const bakerySeedOrderSequence = 248
