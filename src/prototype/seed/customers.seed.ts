import type { Customer } from '../../domain/customer/customer.types'

export const primaryCustomerSeed: Customer = {
  id: 'CUST001', firstName: 'Priyanshu', phone: '+919876543210', createdAt: '2025-11-02T10:00:00.000Z',
  preferences: { veg: true, spiceLevel: 'medium' },
  addresses: [{ id: 'ADDR001', label: 'Home', line1: 'CT Road', city: 'Puri', pincode: '752001', isDefault: true }],
  tier: 'GOLD', pointsAvailable: 182, pointsPending: 19,
  stats: {
    rolling30Orders: 3, rolling120Orders: 8, rolling120EligibleSpend: 3620,
    lifetimeOrders: 14, lifetimeValue: 6891, averageOrderValue: 492,
    preferredCategory: 'Pizza', preferredProducts: ['PIZZA-VEG-001'], preferredFulfillment: 'DELIVERY',
    lastOrderAt: '2026-09-02T18:30:00.000Z',
  },
  customerStage: 'LOYAL', activityState: 'ACTIVE',
  tags: ['Gold Wave', 'Pizza Lover', 'Weekend Buyer', 'Repeat Customer'],
  waveId: 'WAVE-CUST001',
}

export const secondaryCustomerSeed: Customer = {
  id: 'CUST002', firstName: 'Ananya', phone: '+919812345678', createdAt: '2026-08-20T09:00:00.000Z',
  preferences: {}, addresses: [],
  tier: 'MEMBER', pointsAvailable: 0, pointsPending: 0,
  stats: { rolling30Orders: 0, rolling120Orders: 0, rolling120EligibleSpend: 0, lifetimeOrders: 0, lifetimeValue: 0, averageOrderValue: 0, preferredProducts: [] },
  customerStage: 'NEW', activityState: 'DORMANT', tags: [], waveId: 'WAVE-CUST002',
}
