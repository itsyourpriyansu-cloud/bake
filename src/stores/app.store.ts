import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { FulfillmentMode } from '../shared/types/domain'

interface AppState {
  fulfillmentMode: FulfillmentMode
  checkoutPointsRequested: number
  setFulfillmentMode: (mode: FulfillmentMode) => void
  setCheckoutPointsRequested: (points: number) => void
}

export const useAppStore = create<AppState>()(persist((set) => ({
  fulfillmentMode: 'DELIVERY',
  checkoutPointsRequested: 0,
  setFulfillmentMode: (fulfillmentMode) => set({ fulfillmentMode }),
  setCheckoutPointsRequested: (checkoutPointsRequested) => set({ checkoutPointsRequested }),
}), { name: 'pizza-wave:app' }))
