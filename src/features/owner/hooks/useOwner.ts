import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  acceptOwnerOrder, adjustOwnerCustomerPoints, createOwnerStoreOrder, getAttentionQueue, getOwnerAvailability,
  getOwnerCustomer360, getOwnerDashboard, getOwnerOpportunities, getOwnerOrders, getOwnerSupport, rejectOwnerOrder,
  runOwnerSupportAction, searchOwnerCustomers,
  previewOwnerCampaign, simulateOwnerCampaign,
  simulateOwnerWhatsApp,
} from '../../../services/api/owner.api'
import type { CampaignPreviewInput } from '../../../domain/retention/retention.types'
import type { WhatsAppMessageType } from '../../../domain/retention/retention.types'
import { patchStoreConfig } from '../../../services/api/config.api'
import { setOwnerAvailability } from '../../../services/api/availability.api'

export const ownerKeys = {
  all: ['owner'] as const, dashboard: ['owner', 'dashboard'] as const, attention: ['owner', 'attention'] as const,
  orders: ['owner', 'orders'] as const, availability: ['owner', 'availability'] as const,
  customer: (id: string) => ['owner', 'customer', id] as const, search: (q: string) => ['owner', 'search', q] as const,
  opportunities: ['owner', 'opportunities'] as const, support: ['owner', 'support'] as const,
  campaignPreview: ['owner', 'campaign-preview'] as const,
}

export function useOwnerDashboard() { return useQuery({ queryKey: ownerKeys.dashboard, queryFn: getOwnerDashboard }) }
export function useOwnerAttention() { return useQuery({ queryKey: ownerKeys.attention, queryFn: getAttentionQueue }) }
export function useOwnerOrders() { return useQuery({ queryKey: ownerKeys.orders, queryFn: () => getOwnerOrders() }) }
export function useOwnerAvailability() { return useQuery({ queryKey: ownerKeys.availability, queryFn: getOwnerAvailability }) }
export function useOwnerOpportunities() { return useQuery({ queryKey: ownerKeys.opportunities, queryFn: getOwnerOpportunities }) }
export function useOwnerSupport() { return useQuery({ queryKey: ownerKeys.support, queryFn: getOwnerSupport }) }
export function useOwnerCustomer(id?: string) { return useQuery({ queryKey: ownerKeys.customer(id ?? ''), queryFn: () => getOwnerCustomer360(id!), enabled: Boolean(id) }) }
export function useOwnerCustomerSearch(query: string) { return useQuery({ queryKey: ownerKeys.search(query), queryFn: () => searchOwnerCustomers(query), enabled: query.trim().length > 0 }) }

export function useOwnerActions() {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: ownerKeys.all })
  return {
    accept: useMutation({ mutationFn: acceptOwnerOrder, onSuccess: refresh }),
    reject: useMutation({ mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) => rejectOwnerOrder(orderId, reason), onSuccess: refresh }),
    config: useMutation({ mutationFn: patchStoreConfig, onSuccess: refresh }),
    availability: useMutation({ mutationFn: ({ entityId, entityType, available, reason }: { entityId: string; entityType: 'PRODUCT' | 'VARIANT' | 'MODIFIER'; available: boolean; reason?: string }) => setOwnerAvailability(entityId, entityType, available, reason), onSuccess: refresh }),
    points: useMutation({ mutationFn: ({ customerId, input }: { customerId: string; input: { direction: 'ADD' | 'REMOVE'; amount: number; reason: string; note?: string } }) => adjustOwnerCustomerPoints(customerId, input), onSuccess: refresh }),
    support: useMutation({ mutationFn: ({ caseId, input }: { caseId: string; input: { action: 'REFUND_ITEM' | 'REPLACEMENT' | 'ANSWER' | 'CLOSE'; amount?: number; message?: string } }) => runOwnerSupportAction(caseId, input), onSuccess: refresh }),
    storeOrder: useMutation({ mutationFn: createOwnerStoreOrder, onSuccess: refresh }),
    previewCampaign: useMutation({ mutationFn: (input: CampaignPreviewInput) => previewOwnerCampaign(input) }),
    simulateCampaign: useMutation({ mutationFn: (input: CampaignPreviewInput) => simulateOwnerCampaign(input), onSuccess: async () => { await Promise.all([refresh(), queryClient.invalidateQueries({ queryKey: ['conversation'] }), queryClient.invalidateQueries({ queryKey: ['conversations'] })]) } }),
    simulateWhatsApp: useMutation({ mutationFn: (messageType: WhatsAppMessageType) => simulateOwnerWhatsApp(messageType), onSuccess: async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['conversation'] }), queryClient.invalidateQueries({ queryKey: ['conversations'] })]) } }),
  }
}
