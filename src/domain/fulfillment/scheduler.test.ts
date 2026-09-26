import { describe, expect, it } from 'vitest'
import { scheduleOrder } from './scheduler'

const baseInput = {
  items: [{ productId: 'PIZZA-VEG-001', prepMinutes: 14, complexity: 2, station: 'PIZZA', quantity: 1 }],
  fulfillmentType: 'PICKUP' as const, kitchenCapacityCount: 8, packingMinutes: 3, pickupBufferMinutes: 5, deliveryBufferMinutes: 15,
  now: new Date('2026-09-08T12:00:00.000Z'),
}

describe('scheduleOrder load bands', () => {
  it('adds no padding at or below 50% load', () => {
    const result = scheduleOrder({ ...baseInput, activeOrderCount: 4 })
    expect(result.loadPercent).toBe(50)
    expect(result.reviewRequired).toBe(false)
    expect(result.systemPrepMinutes).toBe(14 + 1 + 0 + 3) // base + complexity(2-1) + padding + packing
  })

  it('adds 5 minutes between 51% and 75% load', () => {
    const result = scheduleOrder({ ...baseInput, activeOrderCount: 6 })
    expect(result.loadPercent).toBe(75)
    expect(result.systemPrepMinutes).toBe(14 + 1 + 5 + 3)
  })

  it('adds 10 minutes between 76% and 90% load', () => {
    const result = scheduleOrder({ ...baseInput, activeOrderCount: 7 })
    expect(result.loadPercent).toBe(88)
    expect(result.systemPrepMinutes).toBe(14 + 1 + 10 + 3)
  })

  it('requires review above 90% load and gives no automatic padding', () => {
    const result = scheduleOrder({ ...baseInput, activeOrderCount: 8 })
    expect(result.loadPercent).toBe(100)
    expect(result.reviewRequired).toBe(true)
    expect(result.reviewReason).toBeDefined()
  })

  it('is deterministic for the same inputs (no wall-clock reads)', () => {
    const a = scheduleOrder({ ...baseInput, activeOrderCount: 2 })
    const b = scheduleOrder({ ...baseInput, activeOrderCount: 2 })
    expect(a).toEqual(b)
  })

  it('computes a dispatch target for delivery but not pickup', () => {
    const delivery = scheduleOrder({ ...baseInput, fulfillmentType: 'DELIVERY', activeOrderCount: 0 })
    const pickup = scheduleOrder({ ...baseInput, fulfillmentType: 'PICKUP', activeOrderCount: 0 })
    expect(delivery.dispatchTargetAt).toBeDefined()
    expect(pickup.dispatchTargetAt).toBeUndefined()
  })
})
