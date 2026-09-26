import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { BakeryBespokeRequest, BakeryReferenceApprovalStatus, BakerySettings } from '../../domain/bakery/bakery.types'
import {
  addBakeryCartItem, createBakeryCheckout, createBakerySavedDesign, createBespokeRequest, getBakeryAdminSummary, getBakeryAvailability,
  getBakeryCart, getBakeryCatalog, getBakeryOrder, getBakeryOrders, getBakerySavedDesigns, getBakerySettings, getBakeryProduct, removeBakeryCartItem,
  removeBakerySavedDesign, setBakeryAvailability, updateBakeryCartItem, updateBakeryOrderNote, updateBakeryOrderStatus, updateBakerySettings, updateBespokeStatus,
} from '../../services/api/bakery.api'

export const bakeryKeys = {
  all: ['bakery'] as const,
  catalog: ['bakery', 'catalog'] as const,
  cart: ['bakery', 'cart'] as const,
  orders: ['bakery', 'orders'] as const,
  order: (id: string) => ['bakery', 'orders', id] as const,
  admin: ['bakery', 'admin'] as const,
  availability: ['bakery', 'availability'] as const,
  settings: ['bakery', 'settings'] as const,
  savedDesigns: ['bakery', 'saved-designs'] as const,
}

export const useBakeryCatalog = () => useQuery({ queryKey: bakeryKeys.catalog, queryFn: getBakeryCatalog })
export const useBakeryProduct = (id?: string) => useQuery({ queryKey: ['bakery', 'product', id], queryFn: () => getBakeryProduct(id!), enabled: Boolean(id) })
export const useBakeryCart = () => useQuery({ queryKey: bakeryKeys.cart, queryFn: getBakeryCart })
export const useBakeryOrders = () => useQuery({ queryKey: bakeryKeys.orders, queryFn: getBakeryOrders, refetchInterval: 5000 })
export const useBakeryOrder = (id?: string) => useQuery({ queryKey: bakeryKeys.order(id ?? ''), queryFn: () => getBakeryOrder(id!), enabled: Boolean(id), refetchInterval: 4000 })
export const useBakeryAdmin = () => useQuery({ queryKey: bakeryKeys.admin, queryFn: getBakeryAdminSummary, refetchInterval: 5000 })
export const useBakeryAvailability = () => useQuery({ queryKey: bakeryKeys.availability, queryFn: getBakeryAvailability, refetchInterval: 5000 })
export const useBakerySettings = () => useQuery({ queryKey: bakeryKeys.settings, queryFn: getBakerySettings, refetchInterval: 5000 })
export const useBakerySavedDesigns = () => useQuery({ queryKey: bakeryKeys.savedDesigns, queryFn: getBakerySavedDesigns })

export function useBakeryCartActions() {
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: bakeryKeys.all })
  return {
    add: useMutation({ mutationFn: addBakeryCartItem, onSuccess: refresh }),
    update: useMutation({ mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) => updateBakeryCartItem(itemId, quantity), onSuccess: refresh }),
    remove: useMutation({ mutationFn: removeBakeryCartItem, onSuccess: refresh }),
  }
}

export function useBakeryOperations() {
  const queryClient = useQueryClient(); const refresh = () => queryClient.invalidateQueries({ queryKey: bakeryKeys.all })
  return {
    checkout: useMutation({ mutationFn: createBakeryCheckout, onSuccess: refresh }),
    status: useMutation({ mutationFn: ({ orderId, status }: { orderId: string; status: Parameters<typeof updateBakeryOrderStatus>[1] }) => updateBakeryOrderStatus(orderId, status), onSuccess: refresh }),
    note: useMutation({ mutationFn: ({ orderId, note }: { orderId: string; note: string }) => updateBakeryOrderNote(orderId, note), onSuccess: refresh }),
    bespoke: useMutation({ mutationFn: createBespokeRequest, onSuccess: refresh }),
    bespokeStatus: useMutation({ mutationFn: ({ requestId, ...input }: { requestId: string; status?: BakeryBespokeRequest['status']; quoteAmount?: number; referenceApprovalStatus?: BakeryReferenceApprovalStatus; referenceReviewNote?: string; referenceReviewedAt?: string }) => updateBespokeStatus(requestId, input), onSuccess: refresh }),
    availability: useMutation({ mutationFn: ({ productId, ...input }: { productId: string; available: boolean; source: 'OWNER' | 'BAKER'; reason?: string; until?: string }) => setBakeryAvailability(productId, input), onSuccess: refresh }),
    settings: useMutation({ mutationFn: (input: Partial<BakerySettings>) => updateBakerySettings(input), onSuccess: refresh }),
  }
}

export function useBakerySavedDesignActions() {
  const queryClient = useQueryClient(); const refresh = () => queryClient.invalidateQueries({ queryKey: bakeryKeys.all })
  return {
    save: useMutation({ mutationFn: createBakerySavedDesign, onSuccess: refresh }),
    remove: useMutation({ mutationFn: removeBakerySavedDesign, onSuccess: refresh }),
  }
}
