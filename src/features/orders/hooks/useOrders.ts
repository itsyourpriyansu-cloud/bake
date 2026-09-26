import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../services/api'
import { useRealtimeStatus } from '../../realtime/hooks/useRealtimeStatus'

export const orderTrackingRefetchInterval = (realtimeConnected: boolean): false | number => realtimeConnected ? false : 3_000

export const useOrders = (customerId?: string) => useQuery({
  queryKey: ['orders', customerId],
  queryFn: () => api.orders.getOrders(customerId),
  enabled: Boolean(customerId),
})

export const useOrder = (orderId: string) => {
  const realtimeConnected = useRealtimeStatus()
  return useQuery({
    queryKey: ['order', orderId], queryFn: () => api.orders.getOrder(orderId), enabled: Boolean(orderId),
    refetchInterval: orderTrackingRefetchInterval(realtimeConnected),
  })
}

export const useOrderEvents = (orderId: string) => {
  const realtimeConnected = useRealtimeStatus()
  return useQuery({ queryKey: ['order-events', orderId], queryFn: () => api.orders.getOrderEvents(orderId), enabled: Boolean(orderId), refetchInterval: orderTrackingRefetchInterval(realtimeConnected) })
}

export function useOrderActions() {
  const client = useQueryClient()
  const refresh = async () => { await Promise.all([client.invalidateQueries({ queryKey: ['orders'] }), client.invalidateQueries({ queryKey: ['cart'] }), client.invalidateQueries({ queryKey: ['cart-quote'] }), client.invalidateQueries({ queryKey: ['loyalty'] })]) }
  const reorder = useMutation({ mutationFn: ({ orderId, acceptChanges = false }: { orderId: string; acceptChanges?: boolean }) => api.orders.reorder(orderId, acceptChanges), onSuccess: refresh })
  const advance = useMutation({ mutationFn: api.orders.advanceDemoOrder, onSuccess: async (order) => { await Promise.all([refresh(), client.invalidateQueries({ queryKey: ['order', order.id] }), client.invalidateQueries({ queryKey: ['order-events', order.id] })]) } })
  return { reorder, advance }
}
