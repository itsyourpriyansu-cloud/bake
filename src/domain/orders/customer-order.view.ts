import type { Order } from './order.types'

export type CustomerOrderStage = 'PAYMENT' | 'ACCEPTANCE' | 'SCHEDULED' | 'PREPARING' | 'READY' | 'TRAVEL' | 'COMPLETE'

export interface CustomerOrderView {
  label: string
  detail: string
  stage: CustomerOrderStage
  progress: number
  terminal: boolean
}

export function getCustomerOrderView(order: Order): CustomerOrderView {
  if (order.acceptanceStatus === 'REJECTED') return { label: "We couldn't accept this order", detail: 'A refund has been started.', stage: 'COMPLETE', progress: 100, terminal: true }
  if (order.fulfillmentStatus === 'CANCELLED') return { label: 'Order cancelled', detail: 'Check support for the latest refund update.', stage: 'COMPLETE', progress: 100, terminal: true }
  if (order.fulfillmentStatus === 'DELIVERED') return { label: 'Delivered', detail: 'Delivered with care. Enjoy your Wave!', stage: 'COMPLETE', progress: 100, terminal: true }
  if (order.fulfillmentStatus === 'PICKED_UP') return { label: 'Picked up', detail: 'Fresh from Grand Road. Enjoy!', stage: 'COMPLETE', progress: 100, terminal: true }
  if (order.fulfillmentStatus === 'STORE_COMPLETED') return { label: 'Completed', detail: 'Thanks for eating with The Pizza Wave.', stage: 'COMPLETE', progress: 100, terminal: true }
  if (order.fulfillmentStatus === 'DISPATCHED') return { label: 'On the way', detail: 'Your order has left Grand Road.', stage: 'TRAVEL', progress: 86, terminal: false }
  if (order.fulfillmentStatus === 'READY') return { label: order.fulfillmentType === 'PICKUP' ? 'Ready for pickup' : 'Ready', detail: order.fulfillmentType === 'PICKUP' ? 'Collect it from our Grand Road counter.' : 'Packed and waiting for the rider.', stage: 'READY', progress: 72, terminal: false }
  if (order.fulfillmentStatus === 'PREPARING' || order.fulfillmentStatus === 'PREP_DUE') return { label: 'Preparing', detail: 'Your food is in the kitchen now.', stage: 'PREPARING', progress: 54, terminal: false }
  if (order.fulfillmentStatus === 'SCHEDULED') return { label: 'Kitchen scheduled', detail: 'We have reserved a fresh prep slot.', stage: 'SCHEDULED', progress: 38, terminal: false }
  if (order.acceptanceStatus === 'ACCEPTED') return { label: 'Order confirmed', detail: 'Pizza Wave has accepted your order.', stage: 'ACCEPTANCE', progress: 24, terminal: false }
  if (order.acceptanceStatus === 'AWAITING_ACCEPTANCE' || order.acceptanceStatus === 'REVIEW_REQUIRED') return { label: 'Confirming your order', detail: "We're checking it with Pizza Wave.", stage: 'ACCEPTANCE', progress: 14, terminal: false }
  return { label: 'Payment received', detail: 'Your payment is safely recorded.', stage: 'PAYMENT', progress: 8, terminal: false }
}

export const isActiveCustomerOrder = (order: Order) => !getCustomerOrderView(order).terminal

export const customerTimeline = (order: Order) => {
  const current = getCustomerOrderView(order)
  const labels = [
    ['PAYMENT', 'Payment received'], ['ACCEPTANCE', 'Order confirmed'], ['SCHEDULED', 'Kitchen scheduled'],
    ['PREPARING', 'Preparing'], ['READY', order.fulfillmentType === 'PICKUP' ? 'Ready for pickup' : 'Ready'],
    ['TRAVEL', order.fulfillmentType === 'PICKUP' ? 'Picked up' : 'On the way'], ['COMPLETE', order.fulfillmentType === 'DELIVERY' ? 'Delivered' : 'Completed'],
  ] as const
  const currentIndex = labels.findIndex(([stage]) => stage === current.stage)
  return labels.map(([stage, label], index) => ({ stage, label, complete: index < currentIndex || current.terminal, current: index === currentIndex && !current.terminal }))
}

