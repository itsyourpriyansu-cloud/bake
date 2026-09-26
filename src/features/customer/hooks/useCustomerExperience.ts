import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '../../../services/api'
import type { Celebration, FamilyMember, FoodPreferences, NotificationPreferences } from '../../../domain/customer/customer-experience.types'

export const useCustomerProfile = () => useQuery({ queryKey: ['customer-profile'], queryFn: api.customer.getProfile })
export const useFoodPreferences = () => useQuery({ queryKey: ['customer-preferences'], queryFn: api.customer.getPreferences })
export const useSavedOrders = () => useQuery({ queryKey: ['saved-orders'], queryFn: api.customer.getSavedOrders })
export const useFavourites = () => useQuery({ queryKey: ['favourites'], queryFn: api.customer.getFavourites })
export const useFamily = () => useQuery({ queryKey: ['family'], queryFn: api.customer.getFamily })
export const useCelebrations = () => useQuery({ queryKey: ['celebrations'], queryFn: api.customer.getCelebrations })
export const useNotifications = () => useQuery({ queryKey: ['notifications'], queryFn: api.customer.getNotifications })
export const useWaveId = () => useQuery({ queryKey: ['wave-id-token'], queryFn: api.customer.createWaveId, refetchInterval: 60_000 })

export function useCustomerExperienceActions() {
  const client = useQueryClient()
  const invalidate = (key: string) => client.invalidateQueries({ queryKey: [key] })
  const savePreferences = useMutation({ mutationFn: (input: Partial<FoodPreferences>) => api.customer.updatePreferences(input), onSuccess: async () => { await Promise.all([invalidate('customer-preferences'), invalidate('customer-profile')]) } })
  const saveNotificationPreferences = useMutation({ mutationFn: (input: Partial<NotificationPreferences>) => api.customer.updateNotificationPreferences(input), onSuccess: async () => { await invalidate('customer-profile') } })
  const renameSavedOrder = useMutation({ mutationFn: ({ id, name }: { id: string; name: string }) => api.customer.renameSavedOrder(id, name), onSuccess: async () => { await invalidate('saved-orders') } })
  const saveCompletedOrder = useMutation({ mutationFn: ({ orderId, name }: { orderId: string; name?: string }) => api.customer.saveCompletedOrder(orderId, name), onSuccess: async () => { await invalidate('saved-orders') } })
  const deleteSavedOrder = useMutation({ mutationFn: api.customer.deleteSavedOrder, onSuccess: async () => { await invalidate('saved-orders') } })
  const deleteFavourite = useMutation({ mutationFn: api.customer.deleteFavourite, onSuccess: async () => { await invalidate('favourites') } })
  const saveFamilyMember = useMutation({ mutationFn: (member: FamilyMember) => api.customer.saveFamilyMember(member), onSuccess: async () => { await invalidate('family') } })
  const createCelebration = useMutation({ mutationFn: (input: Omit<Celebration, 'id' | 'customerId'>) => api.customer.createCelebration(input), onSuccess: async () => { await invalidate('celebrations') } })
  const deleteCelebration = useMutation({ mutationFn: api.customer.deleteCelebration, onSuccess: async () => { await invalidate('celebrations') } })
  const markNotificationRead = useMutation({ mutationFn: api.customer.markNotificationRead, onSuccess: (rows) => client.setQueryData(['notifications'], rows) })
  return { savePreferences, saveNotificationPreferences, renameSavedOrder, saveCompletedOrder, deleteSavedOrder, deleteFavourite, saveFamilyMember, createCelebration, deleteCelebration, markNotificationRead }
}
