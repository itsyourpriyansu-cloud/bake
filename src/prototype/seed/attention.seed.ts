import type { AttentionItem } from '../../domain/attention/attention.types'

export const attentionSeed: AttentionItem[] = [
  {
    id: 'ATTN-ORDER-1382', type: 'ORDER_REVIEW', severity: 'HIGH', title: 'Paid order needs a capacity decision',
    summary: 'PW1382 · ₹649 · Delivery · Priyanshu · Gold Wave. Kitchen load is 94% and the current promise is 58 minutes.',
    orderId: 'ORDER-REVIEW-1382', customerId: 'CUST001', suggestedAction: 'Accept only if the 58-minute promise is realistic; otherwise reject and refund.',
    createdAt: '2026-09-10T12:08:00.000Z',
  },
  {
    id: 'ATTN-COMPLAINT-001', type: 'COMPLAINT', severity: 'MEDIUM', title: 'Missing item complaint',
    summary: 'Priyanshu reports that Cheesy Garlic Bread was missing from pickup order PW-00002.',
    orderId: 'ORDER-HIST-002', customerId: 'CUST001', suggestedAction: 'Review the thread and issue an item refund or replacement.',
    createdAt: '2026-09-10T12:24:00.000Z',
  },
  {
    id: 'ATTN-DELAY-1384', type: 'SEVERE_DELAY', severity: 'HIGH', title: 'Delivery promise at risk',
    summary: 'PW1384 is preparing and tracking 12 minutes behind its system schedule.',
    orderId: 'ORDER-ACTIVE-1384', customerId: 'CUST001', suggestedAction: 'Confirm the revised ETA with the kitchen and update the customer once.',
    createdAt: '2026-09-10T12:42:00.000Z',
  },
]
