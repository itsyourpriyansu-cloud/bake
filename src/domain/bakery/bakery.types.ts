export type BakeryCategory = 'CAKES' | 'BENTO' | 'PASTRIES' | 'BROWNIES' | 'BREADS' | 'SAVOURIES' | 'GIFTING' | 'DRINKS'
export type BakeryStyle = 'VINTAGE' | 'FLORAL' | 'MINIMAL' | 'CHOCOLATE' | 'PHOTO' | 'KIDS' | 'FUSION' | 'BENTO' | 'KOREAN' | 'COQUETTE' | 'RETRO' | 'LUXE'
export type BakeryEvent = 'BIRTHDAY' | 'ANNIVERSARY' | 'WEDDING' | 'BABY_SHOWER' | 'KIDS' | 'CORPORATE' | 'FESTIVAL' | 'JUST_BECAUSE' | 'COUPLES' | 'GEN_Z' | 'CUSTOM'
export type BakeryFulfillment = 'DELIVERY' | 'PICKUP'
export type BakeryProductionStatus = 'AWAITING_ACCEPTANCE' | 'SCHEDULED' | 'MIXING' | 'BAKING' | 'COOLING' | 'DECORATING' | 'PACKING' | 'READY' | 'COMPLETED' | 'REJECTED'

export interface BakeryModifierOption {
  id: string
  label: string
  priceDelta: number
  available?: boolean
  recommended?: boolean
}

export interface BakeryModifierGroup {
  id: string
  title: string
  description: string
  required: boolean
  min: number
  max: number
  options: BakeryModifierOption[]
}

export interface BakeryProduct {
  id: string
  name: string
  description: string
  category: BakeryCategory
  style?: BakeryStyle
  events: BakeryEvent[]
  basePrice: number
  imageKey: string
  leadHours: number
  servingLabel: string
  egglessAvailable: boolean
  readyToday: boolean
  customisable: boolean
  bestseller?: boolean
  new?: boolean
  available: boolean
  modifierGroups: BakeryModifierGroup[]
}

export interface BakerySelection {
  groupId: string
  optionIds: string[]
}

export interface BakeryCartItem {
  id: string
  productId: string
  quantity: number
  unitPrice: number
  selections: BakerySelection[]
  message?: string
  eventType?: BakeryEvent
  eventDate?: string
  product?: BakeryProduct
}

export interface BakeryQuote {
  itemCount: number
  subtotal: number
  discount: number
  pointsRequested: number
  pointsUsable: number
  pointsValue: number
  deliveryFee: number
  pointsToEarn: number
  total: number
  valid: boolean
  warnings: string[]
}

export interface BakeryOrder {
  id: string
  publicNumber: string
  customerName: string
  customerPhone: string
  fulfillment: BakeryFulfillment
  eventDate: string
  slot: string
  items: BakeryCartItem[]
  quote: BakeryQuote
  paymentStatus: 'CONFIRMED' | 'REFUNDING' | 'REFUNDED'
  productionStatus: BakeryProductionStatus
  promisedAt: string
  createdAt: string
  note?: string
}

export interface BakeryAvailability {
  id: string
  productId: string
  available: boolean
  source: 'OWNER' | 'BAKER'
  reason?: string
  until?: string
}

export interface BakeryBespokeRequest {
  id: string
  event: BakeryEvent
  eventDate: string
  servings: string
  budget: string
  notes: string
  status: 'NEW' | 'REVIEWING' | 'QUOTED'
  createdAt: string
}
