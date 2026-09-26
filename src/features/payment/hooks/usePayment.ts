import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../services/api'

export const usePaymentStatus = (paymentId: string) => useQuery({
  queryKey: ['payment', paymentId], queryFn: () => api.payment.getPaymentStatus(paymentId), enabled: Boolean(paymentId),
  refetchInterval: (query) => ['PENDING', 'RECONCILING'].includes(query.state.data?.payment.status ?? '') ? 1500 : false,
})

export function usePaymentActions() {
  const client = useQueryClient()
  const refresh = (paymentId: string) => client.invalidateQueries({ queryKey: ['payment', paymentId] })
  const initiate = useMutation({ mutationFn: (orderIntentId: string) => api.payment.initiatePayment(orderIntentId) })
  const succeed = useMutation({ mutationFn: (paymentId: string) => api.payment.confirmPaymentDemo(paymentId), onSuccess: (_, id) => refresh(id) })
  const fail = useMutation({ mutationFn: (paymentId: string) => api.payment.failPaymentDemo(paymentId), onSuccess: (_, id) => refresh(id) })
  const keepPending = useMutation({ mutationFn: (paymentId: string) => api.payment.keepPaymentPendingDemo(paymentId), onSuccess: (_, id) => refresh(id) })
  return { initiate, succeed, fail, keepPending }
}
