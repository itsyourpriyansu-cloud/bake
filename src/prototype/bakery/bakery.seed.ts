import type { BakeryModifierGroup, BakeryProduct } from '../../domain/bakery/bakery.types'

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

const simpleProduct = (input: Omit<BakeryProduct, 'events' | 'available' | 'modifierGroups' | 'egglessAvailable' | 'readyToday' | 'customisable'> & Partial<Pick<BakeryProduct, 'events' | 'egglessAvailable' | 'readyToday' | 'customisable' | 'modifierGroups'>>): BakeryProduct => ({
  events: ['BIRTHDAY', 'JUST_BECAUSE'], available: true, egglessAvailable: true, readyToday: true, customisable: false, modifierGroups: [], ...input,
})

export const bakeryProducts: BakeryProduct[] = [
  simpleProduct({ id: 'cake-vintage-heart', name: 'Vintage Heart Cake', description: 'Romantic cherry-red piping on silky vanilla buttercream.', category: 'CAKES', style: 'VINTAGE', basePrice: 749, imageKey: 'vintage', leadHours: 8, servingLabel: 'Serves 6–8', customisable: true, modifierGroups: cakeGroups, events: ['BIRTHDAY', 'ANNIVERSARY', 'WEDDING', 'COUPLES'], bestseller: true }),
  simpleProduct({ id: 'cake-floral-lavender', name: 'Lavender Garden Cake', description: 'A joyful floral cake with delicate piping and bright edible blooms.', category: 'CAKES', style: 'FLORAL', basePrice: 899, imageKey: 'floral', leadHours: 12, servingLabel: 'Serves 8–10', customisable: true, modifierGroups: cakeGroups, events: ['BIRTHDAY', 'ANNIVERSARY', 'BABY_SHOWER', 'WEDDING', 'CUSTOM'], new: true }),
  simpleProduct({ id: 'cake-chocolate-truffle', name: 'Midnight Truffle Cake', description: 'Deep chocolate sponge, glossy ganache and handmade truffles.', category: 'CAKES', style: 'CHOCOLATE', basePrice: 649, imageKey: 'chocolate', leadHours: 4, servingLabel: 'Serves 6–8', customisable: true, modifierGroups: cakeGroups, events: ['BIRTHDAY', 'JUST_BECAUSE', 'CORPORATE'], bestseller: true }),
  simpleProduct({ id: 'cake-black-forest', name: 'Cherry Black Forest', description: 'Chocolate, whipped cream and cherries in a modern finish.', category: 'CAKES', style: 'MINIMAL', basePrice: 549, imageKey: 'chocolate', leadHours: 4, servingLabel: 'Serves 6–8', customisable: true, modifierGroups: cakeGroups }),
  simpleProduct({ id: 'cake-rasmalai', name: 'Rasmalai Celebration Cake', description: 'Saffron cream, pistachio and a soft cardamom sponge.', category: 'CAKES', style: 'FUSION', basePrice: 749, imageKey: 'floral', leadHours: 8, servingLabel: 'Serves 6–8', customisable: true, modifierGroups: cakeGroups, events: ['BIRTHDAY', 'ANNIVERSARY', 'FESTIVAL'], bestseller: true }),
  simpleProduct({ id: 'cake-bento', name: 'Tiny Joy Bento Cake', description: 'A compact personalised cake for small, happy moments.', category: 'BENTO', style: 'BENTO', basePrice: 349, imageKey: 'vintage', leadHours: 4, servingLabel: 'Serves 2–3', customisable: true, modifierGroups: cakeGroups, events: ['BIRTHDAY', 'JUST_BECAUSE', 'KIDS', 'BABY_SHOWER', 'GEN_Z'], new: true }),
  simpleProduct({ id: 'cake-photo', name: 'Memory Photo Cake', description: 'Your favourite photograph, printed and finished by hand.', category: 'CAKES', style: 'PHOTO', basePrice: 799, imageKey: 'floral', leadHours: 24, servingLabel: 'Serves 8–10', customisable: true, modifierGroups: cakeGroups, events: ['BIRTHDAY', 'ANNIVERSARY', 'CORPORATE', 'WEDDING', 'KIDS', 'BABY_SHOWER'] }),
  simpleProduct({ id: 'cake-couple-duet', name: 'The Duet Heart Cake', description: 'Two-tone heart piping made for anniversaries and quiet date nights.', category: 'CAKES', style: 'COQUETTE', basePrice: 849, imageKey: 'couple', leadHours: 8, servingLabel: 'Serves 6–8', customisable: true, modifierGroups: cakeGroups, events: ['COUPLES', 'ANNIVERSARY', 'JUST_BECAUSE', 'WEDDING'], bestseller: true }),
  simpleProduct({ id: 'cake-date-night-bento', name: 'Date Night Bento Set', description: 'Two mini cakes with complementary flavours and personal notes.', category: 'BENTO', style: 'BENTO', basePrice: 599, imageKey: 'date-night', leadHours: 6, servingLabel: 'Serves 2–4', customisable: true, modifierGroups: cakeGroups, events: ['COUPLES', 'GEN_Z', 'ANNIVERSARY', 'JUST_BECAUSE'], new: true }),
  simpleProduct({ id: 'cake-trending-bow', name: 'Main Character Bow Cake', description: 'Pastel bows, glossy piping and a camera-ready celebration finish.', category: 'CAKES', style: 'COQUETTE', basePrice: 799, imageKey: 'trending', leadHours: 8, servingLabel: 'Serves 6–8', customisable: true, modifierGroups: cakeGroups, events: ['GEN_Z', 'BIRTHDAY', 'COUPLES'], new: true }),
  simpleProduct({ id: 'cake-retro-cherry', name: 'Retro Cherry Flash Cake', description: 'Bold piping, bright cherries and unapologetic throwback energy.', category: 'CAKES', style: 'RETRO', basePrice: 729, imageKey: 'retro', leadHours: 8, servingLabel: 'Serves 6–8', customisable: true, modifierGroups: cakeGroups, events: ['GEN_Z', 'BIRTHDAY', 'JUST_BECAUSE', 'KIDS'] }),
  simpleProduct({ id: 'cake-custom-canvas', name: 'Your Canvas Celebration Cake', description: 'A flexible base for colours, references, messages and meaningful details.', category: 'CAKES', style: 'MINIMAL', basePrice: 999, imageKey: 'canvas', leadHours: 24, servingLabel: 'Serves 10–12', customisable: true, modifierGroups: cakeGroups, events: ['CUSTOM', 'BIRTHDAY', 'CORPORATE', 'WEDDING', 'BABY_SHOWER'] }),
  simpleProduct({ id: 'cake-kids-confetti', name: 'Confetti Party Cake', description: 'Bright sprinkles, soft vanilla layers and a playful party crown.', category: 'CAKES', style: 'KIDS', basePrice: 699, imageKey: 'kids', leadHours: 6, servingLabel: 'Serves 6–8', customisable: true, modifierGroups: cakeGroups, events: ['KIDS', 'BIRTHDAY', 'GEN_Z'], bestseller: true }),
  simpleProduct({ id: 'cake-baby-cloud', name: 'Little Cloud Welcome Cake', description: 'Soft cloud piping and gentle colours for the newest family moment.', category: 'CAKES', style: 'MINIMAL', basePrice: 849, imageKey: 'baby', leadHours: 12, servingLabel: 'Serves 8–10', customisable: true, modifierGroups: cakeGroups, events: ['BABY_SHOWER', 'KIDS', 'CUSTOM', 'BIRTHDAY'] }),
  simpleProduct({ id: 'cake-wedding-pearl', name: 'Pearl Promise Cake', description: 'A refined pearl finish with clean tiers and delicate floral detail.', category: 'CAKES', style: 'LUXE', basePrice: 1499, imageKey: 'wedding', leadHours: 36, servingLabel: 'Serves 18–24', customisable: true, modifierGroups: cakeGroups, events: ['WEDDING', 'ANNIVERSARY', 'CUSTOM'], new: true }),
  simpleProduct({ id: 'cake-corporate-logo', name: 'Brand Moment Cake', description: 'A polished celebration cake with your team colours and edible logo.', category: 'CAKES', style: 'PHOTO', basePrice: 1199, imageKey: 'corporate', leadHours: 24, servingLabel: 'Serves 12–16', customisable: true, modifierGroups: cakeGroups, events: ['CORPORATE', 'CUSTOM', 'FESTIVAL'] }),
  simpleProduct({ id: 'cake-festival-rasmalai', name: 'Saffron Festival Crown', description: 'Rasmalai, pistachio and saffron finished for festive tables.', category: 'CAKES', style: 'FUSION', basePrice: 899, imageKey: 'festival', leadHours: 12, servingLabel: 'Serves 8–10', customisable: true, modifierGroups: cakeGroups, events: ['FESTIVAL', 'CUSTOM', 'ANNIVERSARY'] }),
  simpleProduct({ id: 'cake-minimalist', name: 'Soft Launch Minimal Cake', description: 'Clean lines, quiet colour and one confident statement on top.', category: 'CAKES', style: 'KOREAN', basePrice: 649, imageKey: 'minimal', leadHours: 6, servingLabel: 'Serves 4–6', customisable: true, modifierGroups: cakeGroups, events: ['GEN_Z', 'CORPORATE', 'JUST_BECAUSE', 'BIRTHDAY'], bestseller: true }),
  simpleProduct({ id: 'cake-photo-strip', name: 'Photo Dump Story Cake', description: 'Your favourite snapshots arranged as an edible celebration reel.', category: 'CAKES', style: 'PHOTO', basePrice: 899, imageKey: 'photo-strip', leadHours: 24, servingLabel: 'Serves 8–10', customisable: true, modifierGroups: cakeGroups, events: ['GEN_Z', 'CUSTOM', 'COUPLES', 'BIRTHDAY'] }),
  simpleProduct({ id: 'pastry-chocolate', name: 'Chocolate Truffle Pastry', description: 'Fudgy, glossy and baked fresh today.', category: 'PASTRIES', basePrice: 119, imageKey: 'chocolate', leadHours: 0, servingLabel: '1 piece', bestseller: true }),
  simpleProduct({ id: 'brownie-fudge', name: 'Warm Fudge Brownie', description: 'Crackly top with a molten chocolate centre.', category: 'BROWNIES', basePrice: 129, imageKey: 'chocolate', leadHours: 0, servingLabel: '1 piece' }),
  simpleProduct({ id: 'bread-garlic', name: 'Garlic Herb Loaf', description: 'Slow-proofed loaf with roasted garlic butter.', category: 'BREADS', basePrice: 149, imageKey: 'vintage', leadHours: 0, servingLabel: '1 loaf', egglessAvailable: true }),
  simpleProduct({ id: 'savory-puff', name: 'Garden Veg Puff', description: 'Flaky pastry with a warmly spiced vegetable filling.', category: 'SAVOURIES', basePrice: 69, imageKey: 'floral', leadHours: 0, servingLabel: '1 piece' }),
  simpleProduct({ id: 'gift-celebration', name: 'Little Celebration Box', description: 'Four cupcakes, two brownies and a handwritten card.', category: 'GIFTING', basePrice: 599, imageKey: 'floral', leadHours: 4, servingLabel: 'Gift box', readyToday: true }),
]

export const bakeryCategoryLabels: Record<string, string> = {
  CAKES: 'Cakes', BENTO: 'Bento', PASTRIES: 'Pastries', BROWNIES: 'Brownies', BREADS: 'Breads', SAVOURIES: 'Savouries', GIFTING: 'Gifting', DRINKS: 'Drinks',
}
