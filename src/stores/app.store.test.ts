import { beforeEach, describe, expect, it } from 'vitest'
import { useAppStore } from './app.store'
describe('fulfillment store', () => {
  beforeEach(() => { localStorage.clear(); useAppStore.setState({ fulfillmentMode: 'DELIVERY', checkoutPointsRequested: 0 }) })
  it('supports customer modes and the future STORE type', () => {
    useAppStore.getState().setFulfillmentMode('PICKUP'); expect(useAppStore.getState().fulfillmentMode).toBe('PICKUP')
    useAppStore.getState().setFulfillmentMode('STORE'); expect(useAppStore.getState().fulfillmentMode).toBe('STORE')
  })
  it('keeps the points choice in the cart draft until checkout resolves', () => {
    useAppStore.getState().setCheckoutPointsRequested(50)
    expect(useAppStore.getState().checkoutPointsRequested).toBe(50)
  })
})
