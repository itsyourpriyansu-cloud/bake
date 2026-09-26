import { describe, expect, it } from 'vitest'
import { orderHistorySeed } from '../../prototype/seed/orders.seed'
import { customerTimeline, getCustomerOrderView, isActiveCustomerOrder } from './customer-order.view'

describe('customer order view', () => {
  it('maps internal preparation state to customer language without exposing enums', () => {
    const active = orderHistorySeed.find((order) => order.id === 'ORDER-ACTIVE-1384')!
    const view = getCustomerOrderView(active)
    expect(view.label).toBe('Preparing')
    expect(`${view.label} ${view.detail}`).not.toContain('PREPARING')
    expect(isActiveCustomerOrder(active)).toBe(true)
  })

  it('uses fulfillment-aware final timeline labels', () => {
    const pickup = orderHistorySeed.find((order) => order.fulfillmentType === 'PICKUP' && ['PICKED_UP', 'STORE_COMPLETED'].includes(order.fulfillmentStatus))!
    expect(getCustomerOrderView(pickup).label).toBe('Completed')
    expect(customerTimeline(pickup).at(-1)?.label).toBe('Completed')
  })
})
