import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CelebrationStage } from '../../../domain/retention/retention.types'
import { api } from '../../../services/api'

export const retentionKeys = {
  summary: ['retention', 'summary'] as const, referrals: ['retention', 'referrals'] as const,
  celebration: ['retention', 'celebration'] as const,
}
export const useRetentionSummary = (enabled = true) => useQuery({ queryKey: retentionKeys.summary, queryFn: api.retention.getRetentionSummary, enabled })
export const useReferrals = () => useQuery({ queryKey: retentionKeys.referrals, queryFn: api.retention.getReferrals })
export const useCelebrationAutomation = () => useQuery({ queryKey: retentionKeys.celebration, queryFn: api.retention.getCelebrationAutomation })

export function useRetentionActions() {
  const client = useQueryClient(); const refreshConversation = () => Promise.all([client.invalidateQueries({ queryKey: ['conversations'] }), client.invalidateQueries({ queryKey: ['conversation'] })])
  return {
    createReferral: useMutation({ mutationFn: api.retention.createReferral, onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: retentionKeys.referrals }), refreshConversation()]) } }),
    advanceReferral: useMutation({ mutationFn: api.retention.advanceReferral, onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: retentionKeys.referrals }), client.invalidateQueries({ queryKey: ['customer-profile'] }), client.invalidateQueries({ queryKey: ['loyalty'] }), refreshConversation()]) } }),
    celebration: useMutation({ mutationFn: (stage: CelebrationStage) => api.retention.simulateCelebrationStage(stage), onSuccess: async () => { await Promise.all([client.invalidateQueries({ queryKey: retentionKeys.celebration }), refreshConversation()]) } }),
  }
}
