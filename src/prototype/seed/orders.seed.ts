import type { Order, OrderEvent } from '../../domain/orders/order.types'
import type { CartQuote } from '../../domain/pricing/pricing.types'

const quote = (subtotal: number, pointsToEarn: number): CartQuote => ({
  itemCount: 2, subtotal, discount: 0, pointsRequested: 0, pointsUsable: 0, pointsValue: 0,
  deliveryFee: 0, eligibleSpend: subtotal, pointsToEarn, total: subtotal, warnings: [], valid: true,
})

/** Historical completed orders — seed the CRM/loyalty history a fresh cart can't provide on its own. */
export const orderHistorySeed: Order[] = [
  {
    id: 'ORDER-REVIEW-1382', publicOrderNumber: 'PW1382', customerId: 'CUST001', source: 'PWA', fulfillmentType: 'DELIVERY',
    paymentStatus: 'CONFIRMED', acceptanceStatus: 'REVIEW_REQUIRED', fulfillmentStatus: 'NOT_STARTED', refundStatus: 'NONE',
    items: [
      { productId: 'PIZZA-PANEER-001', name: 'Paneer Cheese Pizza', quantity: 2, unitPrice: 229 },
      { productId: 'KULHAD-001', name: 'Signature Kulhad Pizza', quantity: 1, unitPrice: 191 },
    ],
    financialSnapshot: { ...quote(649, 25), itemCount: 3, total: 649, eligibleSpend: 649 },
    systemPrepMinutes: 28, effectivePrepMinutes: 28, promisedAt: '2026-09-10T13:06:00.000Z',
    createdAt: '2026-09-10T12:07:00.000Z', orderIntentId: 'INTENT-REVIEW-1382', paymentId: 'PAY-REVIEW-1382',
  },
  {
    id: 'ORDER-ACTIVE-1384', publicOrderNumber: 'PW1384', customerId: 'CUST001', source: 'PWA', fulfillmentType: 'DELIVERY',
    paymentStatus: 'CONFIRMED', acceptanceStatus: 'ACCEPTED', fulfillmentStatus: 'PREP_DUE', refundStatus: 'NONE',
    items: [
      { productId: 'PIZZA-CHK-001', name: 'Chicken Tikka Pizza', quantity: 2, unitPrice: 249, modifiers: [{ groupId: 'size', optionIds: ['medium'] }, { groupId: 'base', optionIds: ['normal'] }, { groupId: 'sauce', optionIds: ['smoky-makhani'] }, { groupId: 'cheese', optionIds: ['extra-cheese'] }, { groupId: 'spice', optionIds: ['spice-medium'] }] },
      { productId: 'FRIES-001', name: 'Peri Peri Fries', quantity: 1, unitPrice: 99 },
    ],
    financialSnapshot: { ...quote(600, 24), itemCount: 3, deliveryFee: 36, total: 636 },
    systemPrepMinutes: 18, effectivePrepMinutes: 18,
    recommendedStartAt: '2026-09-10T02:56:00.000Z', targetReadyAt: '2026-09-10T03:14:00.000Z', promisedAt: '2026-09-10T03:32:00.000Z',
    kitchenNotes: ['NO ONION', 'NO MUSHROOM', 'EXTRA CHEESE'],
    acceptedAt: '2026-09-10T02:52:00.000Z', createdAt: '2026-09-10T02:48:00.000Z',
    orderIntentId: 'INTENT-ACTIVE-1384', paymentId: 'PAY-ACTIVE-1384',
  },
  {
    id: 'ORDER-READY-1383', publicOrderNumber: 'PW1383', customerId: 'CUST002', source: 'PWA', fulfillmentType: 'PICKUP',
    paymentStatus: 'CONFIRMED', acceptanceStatus: 'ACCEPTED', fulfillmentStatus: 'READY', refundStatus: 'NONE',
    items: [{ productId: 'BURGER-001', name: 'Paneer Crunch Burger', quantity: 2, unitPrice: 149 }],
    financialSnapshot: quote(298, 6), systemPrepMinutes: 12, effectivePrepMinutes: 12,
    prepStartAt: '2026-09-10T12:05:00.000Z', targetReadyAt: '2026-09-10T12:17:00.000Z', promisedAt: '2026-09-10T12:25:00.000Z',
    acceptedAt: '2026-09-10T12:01:00.000Z', createdAt: '2026-09-10T11:59:00.000Z', orderIntentId: 'INTENT-READY-1383', paymentId: 'PAY-READY-1383',
  },
  {
    id: 'ORDER-DISPATCHED-1381', publicOrderNumber: 'PW1381', customerId: 'CUST002', source: 'PWA', fulfillmentType: 'DELIVERY',
    paymentStatus: 'CONFIRMED', acceptanceStatus: 'ACCEPTED', fulfillmentStatus: 'DISPATCHED', refundStatus: 'NONE',
    items: [{ productId: 'WRAP-001', name: 'Chicken Tikka Wrap', quantity: 1, unitPrice: 179 }],
    financialSnapshot: quote(179, 3), systemPrepMinutes: 10, effectivePrepMinutes: 10,
    prepStartAt: '2026-09-10T11:30:00.000Z', targetReadyAt: '2026-09-10T11:40:00.000Z', promisedAt: '2026-09-10T12:05:00.000Z',
    acceptedAt: '2026-09-10T11:25:00.000Z', createdAt: '2026-09-10T11:22:00.000Z', orderIntentId: 'INTENT-DISPATCHED-1381', paymentId: 'PAY-DISPATCHED-1381',
  },
  {
    id: 'ORDER-HIST-001', publicOrderNumber: 'PW-00001', customerId: 'CUST001', source: 'PWA', fulfillmentType: 'DELIVERY',
    paymentStatus: 'CONFIRMED', acceptanceStatus: 'ACCEPTED', fulfillmentStatus: 'DELIVERED', refundStatus: 'NONE',
    items: [{ productId: 'PIZZA-VEG-001', name: 'Classic Veg Pizza', quantity: 1, unitPrice: 110 }, { productId: 'COFFEE-001', name: 'Cold Coffee', quantity: 1, unitPrice: 119 }],
    financialSnapshot: quote(229, 9),
    systemPrepMinutes: 17, effectivePrepMinutes: 17,
    prepStartAt: '2026-09-02T18:05:00.000Z', targetReadyAt: '2026-09-02T18:22:00.000Z', promisedAt: '2026-09-02T18:37:00.000Z',
    acceptedAt: '2026-09-02T18:00:00.000Z', createdAt: '2026-09-02T17:58:00.000Z',
    orderIntentId: 'INTENT-HIST-001', paymentId: 'PAY-HIST-001',
  },
  {
    id: 'ORDER-HIST-002', publicOrderNumber: 'PW-00002', customerId: 'CUST001', source: 'PWA', fulfillmentType: 'PICKUP',
    paymentStatus: 'CONFIRMED', acceptanceStatus: 'ACCEPTED', fulfillmentStatus: 'STORE_COMPLETED', refundStatus: 'NONE',
    items: [{ productId: 'KULHAD-001', name: 'Signature Kulhad Pizza', quantity: 1, unitPrice: 199 }, { productId: 'GARLIC-001', name: 'Cheesy Garlic Bread', quantity: 1, unitPrice: 129 }],
    financialSnapshot: quote(328, 13),
    systemPrepMinutes: 23, effectivePrepMinutes: 23,
    prepStartAt: '2026-08-24T13:10:00.000Z', targetReadyAt: '2026-08-24T13:33:00.000Z', promisedAt: '2026-08-24T13:38:00.000Z',
    acceptedAt: '2026-08-24T13:05:00.000Z', createdAt: '2026-08-24T13:02:00.000Z',
    orderIntentId: 'INTENT-HIST-002', paymentId: 'PAY-HIST-002',
  },
]

export const orderEventSeed: OrderEvent[] = [
  { id: 'EVT-1384-1', orderId: 'ORDER-ACTIVE-1384', type: 'PAYMENT_CONFIRMED', actor: 'SYSTEM', at: '2026-09-10T02:48:00.000Z' },
  { id: 'EVT-1384-2', orderId: 'ORDER-ACTIVE-1384', type: 'ORDER_ACCEPTED', actor: 'SYSTEM', at: '2026-09-10T02:52:00.000Z' },
  { id: 'EVT-1384-3', orderId: 'ORDER-ACTIVE-1384', type: 'FULFILLMENT_SCHEDULED', actor: 'SYSTEM', at: '2026-09-10T02:53:00.000Z' },
  { id: 'EVT-1384-4', orderId: 'ORDER-ACTIVE-1384', type: 'PREP_DUE', actor: 'SYSTEM', at: '2026-09-10T02:56:00.000Z' },
]
