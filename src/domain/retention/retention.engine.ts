import type { Product } from '../catalog/catalog.types'
import type { Celebration, Favourite, FoodPreferences, SavedOrder } from '../customer/customer-experience.types'
import type { Customer } from '../customer/customer.types'
import type { CampaignChannel, CampaignPreview, CampaignPreviewInput, CelebrationStage, CrmOpportunity, CrmSegment, ReferralStatus } from './retention.types'

const DAY = 86_400_000
const segmentLabels: Record<CrmSegment, string> = {
  SECOND_ORDER_PENDING: 'SECOND ORDER PENDING', INACTIVE_14_30_DAYS: 'INACTIVE 14–30 DAYS',
  POINTS_EXPIRING: 'POINTS EXPIRING', BIRTHDAY_UPCOMING: 'BIRTHDAY UPCOMING', NEAR_GOLD: 'NEAR GOLD',
  NEAR_PLATINUM: 'NEAR PLATINUM', DORMANT_GOLD: 'DORMANT GOLD', DORMANT_PLATINUM: 'DORMANT PLATINUM',
}

function daysSince(value: string | undefined, now: Date): number { return value ? Math.floor((now.getTime() - new Date(value).getTime()) / DAY) : Number.POSITIVE_INFINITY }

export function nextAnnualDate(day: number, month: number, now: Date): Date {
  const candidate = new Date(now.getFullYear(), month - 1, day, 12)
  return candidate.getTime() >= now.getTime() ? candidate : new Date(now.getFullYear() + 1, month - 1, day, 12)
}

export function deriveCustomerSegments(customer: Customer, celebrations: Celebration[], now: Date, pointsExpiring = 0): CrmSegment[] {
  const result: CrmSegment[] = []
  const inactiveDays = daysSince(customer.stats.lastOrderAt, now)
  if (customer.stats.lifetimeOrders === 1) result.push('SECOND_ORDER_PENDING')
  if (inactiveDays >= 14 && inactiveDays <= 30) result.push('INACTIVE_14_30_DAYS')
  if (pointsExpiring > 0) result.push('POINTS_EXPIRING')
  if (celebrations.some((item) => (nextAnnualDate(item.day, item.month, now).getTime() - now.getTime()) / DAY <= 30)) result.push('BIRTHDAY_UPCOMING')
  if (customer.tier === 'SILVER' && (customer.stats.rolling120Orders >= 3 || customer.stats.rolling120EligibleSpend >= 1400)) result.push('NEAR_GOLD')
  if (customer.tier === 'GOLD' && (customer.stats.rolling120Orders >= 6 || customer.stats.rolling120EligibleSpend >= 3000)) result.push('NEAR_PLATINUM')
  if (customer.activityState === 'DORMANT' && customer.tier === 'GOLD') result.push('DORMANT_GOLD')
  if (customer.activityState === 'DORMANT' && customer.tier === 'PLATINUM') result.push('DORMANT_PLATINUM')
  return result
}

const definitions: Record<CrmSegment, Omit<CrmOpportunity, 'id' | 'segment' | 'label' | 'customerCount' | 'derivedCustomerIds' | 'estimatedCost' | 'estimatedConversions'> & { baseline: number; conversionRate: number }> = {
  SECOND_ORDER_PENDING: { baseline: 18, conversionRate: .18, title: 'Turn first visits into a habit', insight: 'The second order is the strongest early retention signal.', message: 'One more order unlocks your next Wave milestone. Your Pizza Wave favourite is waiting.', offer: '2X Wave Points', suggestedChannel: 'WHATSAPP_SIM', suggestedTiming: 'TONIGHT_7PM' },
  INACTIVE_14_30_DAYS: { baseline: 81, conversionRate: .14, title: 'Inactive Pizza Lovers', insight: 'Recent pizza regulars are entering the at-risk window.', message: 'Been a while 🍕\nYour favourite Pizza Wave order is waiting.', offer: '2X Wave Points', suggestedChannel: 'WHATSAPP_SIM', suggestedTiming: 'TONIGHT_7PM' },
  POINTS_EXPIRING: { baseline: 32, conversionRate: .21, title: 'Save expiring value', insight: 'A useful reminder can recover demand without a blanket discount.', message: 'Your Wave Points miss you. Use them on your next Puri pizza night.', offer: 'Use points before expiry', suggestedChannel: 'IN_APP', suggestedTiming: 'NOW' },
  BIRTHDAY_UPCOMING: { baseline: 12, conversionRate: .24, title: 'Make their day delicious', insight: 'Upcoming birthdays can trigger a timely, personal celebration journey.', message: 'Your birthday Wave is almost here 🎉 We saved something delicious for you.', offer: 'Birthday surprise', suggestedChannel: 'WHATSAPP_SIM', suggestedTiming: 'TOMORROW_11AM' },
  NEAR_GOLD: { baseline: 17, conversionRate: .19, title: 'Help members reach Gold', insight: 'These regulars are close enough for progress to feel tangible.', message: 'Gold Wave is close. Your next order moves you one step nearer.', offer: 'Bonus 40 points', suggestedChannel: 'IN_APP', suggestedTiming: 'NOW' },
  NEAR_PLATINUM: { baseline: 9, conversionRate: .26, title: 'Nudge high-intent Gold members', insight: 'A small, relevant reminder makes Platinum progress concrete.', message: 'You’re almost Platinum Wave: 2 orders + ₹880 to unlock 5% back.', offer: '2X Wave Points', suggestedChannel: 'PUSH_SIM', suggestedTiming: 'TONIGHT_7PM' },
  DORMANT_GOLD: { baseline: 14, conversionRate: .12, title: 'Welcome Gold members back', insight: 'High-value members have not ordered in more than 30 days.', message: 'Your Gold Wave favourites are still here. Come back to the table.', offer: 'Free side on ₹399', suggestedChannel: 'WHATSAPP_SIM', suggestedTiming: 'TONIGHT_7PM' },
  DORMANT_PLATINUM: { baseline: 4, conversionRate: .17, title: 'Recover Platinum regulars', insight: 'Personal recognition matters more than broad promotion here.', message: 'We saved your usual, Platinum Wave. Ready when you are.', offer: 'Priority comeback perk', suggestedChannel: 'WHATSAPP_SIM', suggestedTiming: 'TOMORROW_11AM' },
}

export function buildCrmOpportunities(customers: Customer[], celebrations: Celebration[], now: Date, pointsExpiringByCustomer: Record<string, number> = {}): CrmOpportunity[] {
  return (Object.keys(definitions) as CrmSegment[]).map((segment) => {
    const definition = definitions[segment]
    const ids = customers.filter((customer) => deriveCustomerSegments(customer, celebrations.filter((item) => item.customerId === customer.id), now, pointsExpiringByCustomer[customer.id] ?? 0).includes(segment)).map((customer) => customer.id)
    const customerCount = Math.max(ids.length, definition.baseline)
    const costPerRecipient = definition.suggestedChannel === 'WHATSAPP_SIM' ? .78 : definition.suggestedChannel === 'PUSH_SIM' ? .08 : 0
    return { id: `OPP-${segment}`, segment, label: segmentLabels[segment], customerCount, derivedCustomerIds: ids, title: definition.title, insight: definition.insight, message: definition.message, offer: definition.offer, suggestedChannel: definition.suggestedChannel, suggestedTiming: definition.suggestedTiming, estimatedCost: Number((customerCount * costPerRecipient).toFixed(2)), estimatedConversions: Number((customerCount * definition.conversionRate).toFixed(1)) }
  })
}

export function buildCampaignPreview(opportunity: CrmOpportunity, input: CampaignPreviewInput): CampaignPreview {
  const costRate: Record<CampaignChannel, number> = { IN_APP: 0, WHATSAPP_SIM: .78, PUSH_SIM: .08 }
  const conversionMultiplier: Record<CampaignChannel, number> = { IN_APP: .85, WHATSAPP_SIM: 1, PUSH_SIM: .72 }
  return { ...input, id: `CAMPAIGN-${opportunity.segment}`, audience: opportunity.title, estimatedAudience: opportunity.customerCount, estimatedCost: Number((opportunity.customerCount * costRate[input.channel]).toFixed(2)), estimatedConversions: Number((opportunity.estimatedConversions * conversionMultiplier[input.channel]).toFixed(1)), demoOnly: true }
}

const referralTransitions: Record<ReferralStatus, ReferralStatus | null> = { INVITED: 'SIGNED_UP', SIGNED_UP: 'FIRST_ORDER_PENDING', FIRST_ORDER_PENDING: 'QUALIFIED', QUALIFIED: 'REWARDED', REWARDED: null }
export const nextReferralStatus = (status: ReferralStatus): ReferralStatus | null => referralTransitions[status]
export const referralRewardEligible = (status: ReferralStatus): boolean => status === 'QUALIFIED'

export function celebrationStageFor(day: number, month: number, now: Date): CelebrationStage | null {
  const days = Math.ceil((nextAnnualDate(day, month, now).getTime() - now.getTime()) / DAY)
  if (days === 7) return 'T_MINUS_7'
  if (days === 3) return 'T_MINUS_3'
  if (days === 1) return 'T_MINUS_1'
  if (days === 0) return 'BIRTHDAY'
  return null
}

export function rankPersonalizedProducts(products: Product[], preferences: FoodPreferences, favourites: Favourite[], savedOrders: SavedOrder[], customer: Customer): string[] {
  const favouriteIds = new Set(favourites.flatMap((row) => row.productId ? [row.productId] : row.items?.map((item) => item.productId) ?? []))
  const savedIds = new Set(savedOrders.flatMap((row) => row.items.map((item) => item.productId)))
  return products.filter((product) => product.available && (preferences.diet !== 'VEG' || product.veg) && !preferences.avoid.some((avoid) => `${product.name} ${product.shortDescription}`.toLowerCase().includes(avoid.toLowerCase())))
    .map((product) => ({ id: product.id, score: (favouriteIds.has(product.id) ? 30 : 0) + (savedIds.has(product.id) ? 20 : 0) + (customer.stats.preferredProducts.includes(product.id) ? 25 : 0) + (preferences.favouriteCategories.some((category) => category.toLowerCase() === product.categoryId) ? 12 : 0) + (product.badges.includes('Bestseller') ? 4 : 0) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).map((row) => row.id)
}
