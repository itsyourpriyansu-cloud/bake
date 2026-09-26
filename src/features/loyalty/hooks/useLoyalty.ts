import { useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'
export const useLoyalty = (enabled = true) => useQuery({ queryKey: ['loyalty'], queryFn: () => api.loyalty.getLoyalty(), enabled })
export const useLoyaltyHistory = (enabled = true) => useQuery({ queryKey: ['loyalty-history'], queryFn: () => api.loyalty.getLoyaltyHistory(), enabled })
