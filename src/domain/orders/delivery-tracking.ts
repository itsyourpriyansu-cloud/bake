import type { Order } from './order.types'

export type DeliveryTrackingPhase = 'KITCHEN' | 'HANDOFF' | 'ON_ROUTE' | 'ARRIVING' | 'COMPLETE'
export type DeliveryRiskLevel = 'ON_TRACK' | 'WATCH' | 'DELAY'

export interface DeliveryTrackingView {
  phase: DeliveryTrackingPhase
  progress: number
  headline: string
  detail: string
  locationLabel: string
  riderVisible: boolean
}

export interface FounderDeliveryWatch {
  level: DeliveryRiskLevel
  label: string
  detail: string
  impactMinutes: number
}

/**
 * Presentation projection for the Phase 1 route simulation. It deliberately derives
 * from backend-owned order state so the future GPS transport can replace the position
 * source without changing either the customer or founder screen contract.
 */
export function getDeliveryTrackingView(order: Order): DeliveryTrackingView {
  if (['DELIVERED', 'PICKED_UP', 'STORE_COMPLETED'].includes(order.fulfillmentStatus)) {
    return { phase: 'COMPLETE', progress: 1, headline: 'Delivered', detail: 'Your order reached you safely.', locationLabel: 'CT Road', riderVisible: false }
  }
  if (order.fulfillmentStatus === 'DISPATCHED') {
    return { phase: 'ON_ROUTE', progress: 0.68, headline: 'Your rider is on the way', detail: 'Fresh from Grand Road and moving towards you.', locationLabel: 'VIP Road Junction', riderVisible: true }
  }
  if (order.fulfillmentStatus === 'READY') {
    return { phase: 'HANDOFF', progress: 0.08, headline: 'Packed for the journey', detail: 'Your rider is collecting the order at Pizza Wave.', locationLabel: 'Pizza Wave · Grand Road', riderVisible: true }
  }
  return { phase: 'KITCHEN', progress: 0.04, headline: 'Route reserved', detail: 'Live movement begins as soon as your food leaves the store.', locationLabel: 'Pizza Wave · Grand Road', riderVisible: false }
}

export function getFounderDeliveryWatch(order: Order): FounderDeliveryWatch {
  const impactMinutes = Math.max(0, (order.chefOverrideMinutes ?? order.effectivePrepMinutes) - order.systemPrepMinutes)
  if (impactMinutes >= 10) return { level: 'DELAY', label: `${impactMinutes} MIN IMPACT`, detail: 'Chef override changed the customer ETA.', impactMinutes }
  if (impactMinutes > 0) return { level: 'WATCH', label: 'PROMISE WATCH', detail: `Prep estimate moved by ${impactMinutes} minutes.`, impactMinutes }
  if (order.fulfillmentStatus === 'PREP_DUE') return { level: 'WATCH', label: 'START WINDOW', detail: 'System recommends starting preparation now.', impactMinutes: 0 }
  if (order.fulfillmentStatus === 'DISPATCHED') return { level: 'ON_TRACK', label: 'ON ROUTE', detail: 'Customer is receiving live route updates.', impactMinutes: 0 }
  if (order.fulfillmentStatus === 'READY') return { level: 'ON_TRACK', label: 'HANDOFF', detail: 'Packed and waiting for rider collection.', impactMinutes: 0 }
  return { level: 'ON_TRACK', label: 'ON TRACK', detail: 'Order remains inside its current promise.', impactMinutes: 0 }
}

export const isTrackableDelivery = (order: Order) => order.fulfillmentType === 'DELIVERY'
  && ['SCHEDULED', 'PREP_DUE', 'PREPARING', 'READY', 'DISPATCHED'].includes(order.fulfillmentStatus)
