import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../services/api'
import type { AvailabilityEntityType } from '../../../domain/availability/availability.types'
import type { ChefUnavailableDuration } from '../../../domain/availability/availability.engine'
import type { KdsProblemType } from '../../../domain/kitchen/kds.types'

export const kdsKeys = {
  all: ['kds'] as const,
  queue: ['kds', 'queue'] as const,
  order: (id: string) => ['kds', 'order', id] as const,
  availability: ['kds', 'availability'] as const,
  heartbeat: ['kds', 'heartbeat'] as const,
}

export function useKdsQueue(enabled = true) {
  return useQuery({ queryKey: kdsKeys.queue, queryFn: api.kds.getKitchenQueue, enabled })
}

export function useKdsOrder(orderId: string, enabled = true) {
  return useQuery({ queryKey: kdsKeys.order(orderId), queryFn: () => api.kds.getKitchenOrder(orderId), enabled: enabled && Boolean(orderId) })
}

export function useKdsAvailability(enabled = true) {
  return useQuery({ queryKey: kdsKeys.availability, queryFn: api.kds.getKdsAvailability, enabled })
}

export function useKdsHeartbeat(enabled = true) {
  return useQuery({ queryKey: kdsKeys.heartbeat, queryFn: api.kds.getKdsHeartbeat, enabled })
}

export function useKdsActions() {
  const client = useQueryClient()
  const refreshOrders = async () => {
    await Promise.all([client.invalidateQueries({ queryKey: kdsKeys.queue }), client.invalidateQueries({ queryKey: ['kds', 'order'] })])
  }
  return {
    start: useMutation({ mutationFn: api.kds.startPrep, onSuccess: refreshOrders }),
    prepTime: useMutation({
      mutationFn: ({ orderId, minutes, reason }: { orderId: string; minutes: number; reason: string }) => api.kds.updatePrepTime(orderId, minutes, reason, 'Kitchen Tablet #1'),
      onSuccess: refreshOrders,
    }),
    ready: useMutation({ mutationFn: api.kds.markReady, onSuccess: refreshOrders }),
    problem: useMutation({ mutationFn: ({ orderId, type, detail }: { orderId: string; type: KdsProblemType; detail?: string }) => api.kds.reportKitchenProblem(orderId, type, detail) }),
    availability: useMutation({
      mutationFn: ({ entityId, entityType, duration, reason }: { entityId: string; entityType: AvailabilityEntityType; duration: ChefUnavailableDuration; reason?: string }) => api.kds.setKdsAvailability(entityId, entityType, duration, reason),
      onSuccess: () => client.invalidateQueries({ queryKey: kdsKeys.availability }),
    }),
    enable: useMutation({ mutationFn: api.kds.clearKdsAvailability, onSuccess: () => client.invalidateQueries({ queryKey: kdsKeys.availability }) }),
    heartbeat: useMutation({ mutationFn: api.kds.setKdsOnline, onSuccess: (value) => client.setQueryData(kdsKeys.heartbeat, value) }),
  }
}
