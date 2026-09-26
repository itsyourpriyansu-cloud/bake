import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'
import type { FulfillmentMode } from '../../../domain/customer/customer.types'

export const useCheckoutOptions = (mode: FulfillmentMode, enabled = true) => useQuery({
  queryKey: ['checkout-options', mode], queryFn: () => api.checkout.getCheckoutOptions(mode), enabled,
})

export function useCheckoutActions() {
  const createSession = useMutation({ mutationFn: api.checkout.createCheckoutSession })
  const createIntent = useMutation({ mutationFn: (checkoutSessionId: string) => api.checkout.createOrderIntent(checkoutSessionId) })
  return { createSession, createIntent }
}
