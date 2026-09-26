import axios from 'axios'
import type { BakeryBespokeRequest, BakeryCartItem, BakeryEvent, BakeryFulfillment, BakeryOrder, BakeryProduct, BakeryProductionStatus, BakeryQuote, BakeryReferenceApprovalStatus, BakerySavedDesign, BakerySelection, BakerySettings } from '../../domain/bakery/bakery.types'

const bakeryApi = axios.create({ baseURL: '/api/bakery/v1', timeout: 8000 })

export interface BakeryCartResponse { items: BakeryCartItem[]; quote: BakeryQuote }

const emptyBakeryQuote: BakeryQuote = {
  itemCount: 0,
  subtotal: 0,
  discount: 0,
  pointsRequested: 0,
  pointsUsable: 0,
  pointsValue: 0,
  deliveryFee: 0,
  pointsToEarn: 0,
  total: 0,
  valid: false,
  warnings: ['Cart quote needs to be refreshed.'],
}

/** Keeps the bakery UI resilient to an older cached prototype response. */
export function normalizeBakeryCartResponse(value: unknown): BakeryCartResponse {
  const candidate = value && typeof value === 'object' ? value as Partial<BakeryCartResponse> & { item?: BakeryCartItem } : {}
  return {
    items: Array.isArray(candidate.items) ? candidate.items : candidate.item ? [candidate.item] : [],
    quote: candidate.quote ?? emptyBakeryQuote,
  }
}

export const getBakeryCatalog = () => bakeryApi.get<{ products: BakeryProduct[] }>('/catalog').then((response) => response.data)
export const getBakeryProduct = (productId: string) => bakeryApi.get<BakeryProduct>(`/products/${productId}`).then((response) => response.data)
export const getBakeryCart = () => bakeryApi.get<BakeryCartResponse>('/cart').then((response) => normalizeBakeryCartResponse(response.data))
export const addBakeryCartItem = (input: { productId: string; quantity?: number; selections?: BakerySelection[]; message?: string; eventType?: BakeryEvent; eventDate?: string }) => bakeryApi.post('/cart/items', input).then((response) => response.data)
export const updateBakeryCartItem = (itemId: string, quantity: number) => bakeryApi.patch<BakeryCartResponse>(`/cart/items/${itemId}`, { quantity }).then((response) => normalizeBakeryCartResponse(response.data))
export const removeBakeryCartItem = (itemId: string) => bakeryApi.delete<BakeryCartResponse>(`/cart/items/${itemId}`).then((response) => normalizeBakeryCartResponse(response.data))
export const quoteBakeryCart = (fulfillment: BakeryFulfillment, pointsRequested = 0) => bakeryApi.post<BakeryQuote>('/cart/quote', { fulfillment, pointsRequested }).then((response) => response.data)
export const requestBakeryOtp = (phone: string) => bakeryApi.post('/auth/request-otp', { phone }).then((response) => response.data)
export const verifyBakeryOtp = (phone: string, otp: string) => bakeryApi.post('/auth/verify-otp', { phone, otp }).then((response) => response.data)
export const createBakeryCheckout = (input: { fulfillment: BakeryFulfillment; eventDate: string; slot: string; note?: string; pointsRequested?: number }) => bakeryApi.post<{ paymentId: string }>('/checkout', input).then((response) => response.data)
export const simulateBakeryPayment = (paymentId: string, outcome: 'SUCCESS' | 'FAILURE' | 'PENDING') => bakeryApi.post<{ status: string; order?: BakeryOrder }>(`/payments/${paymentId}/simulate`, { outcome }).then((response) => response.data)
export const getBakeryOrders = () => bakeryApi.get<{ orders: BakeryOrder[] }>('/orders').then((response) => response.data)
export const getBakeryOrder = (orderId: string) => bakeryApi.get<BakeryOrder>(`/orders/${orderId}`).then((response) => response.data)
export const updateBakeryOrderStatus = (orderId: string, status: BakeryProductionStatus) => bakeryApi.patch<BakeryOrder>(`/orders/${orderId}/status`, { status }).then((response) => response.data)
export const updateBakeryOrderNote = (orderId: string, note: string) => bakeryApi.patch<BakeryOrder>(`/orders/${orderId}/note`, { note }).then((response) => response.data)
export const createBespokeRequest = (input: Omit<BakeryBespokeRequest, 'id' | 'status' | 'createdAt'>) => bakeryApi.post<BakeryBespokeRequest>('/bespoke', input).then((response) => response.data)
export const updateBespokeStatus = (requestId: string, input: { status?: BakeryBespokeRequest['status']; quoteAmount?: number; referenceApprovalStatus?: BakeryReferenceApprovalStatus; referenceReviewNote?: string; referenceReviewedAt?: string }) => bakeryApi.patch<BakeryBespokeRequest>(`/bespoke/${requestId}`, input).then((response) => response.data)
export const getBakeryAdminSummary = () => bakeryApi.get<{ orders: BakeryOrder[]; requests: BakeryBespokeRequest[]; savedDesigns: BakerySavedDesign[]; settings: BakerySettings; revenue: number; points: number }>('/admin/summary').then((response) => response.data)
export const getBakeryAvailability = () => bakeryApi.get<{ products: BakeryProduct[]; overrides: unknown[] }>('/availability').then((response) => response.data)
export const setBakeryAvailability = (productId: string, input: { available: boolean; source: 'OWNER' | 'BAKER'; reason?: string; until?: string }) => bakeryApi.patch(`/availability/${productId}`, input).then((response) => response.data)
export const getBakerySettings = () => bakeryApi.get<BakerySettings>('/settings').then((response) => response.data)
export const updateBakerySettings = (input: Partial<BakerySettings>) => bakeryApi.patch<BakerySettings>('/settings', input).then((response) => response.data)
export const getBakerySavedDesigns = () => bakeryApi.get<{ designs: BakerySavedDesign[] }>('/saved-designs').then((response) => response.data.designs)
export const createBakerySavedDesign = (input: Omit<BakerySavedDesign, 'id' | 'customerPhone' | 'savedAt'>) => bakeryApi.post<BakerySavedDesign>('/saved-designs', input).then((response) => response.data)
export const removeBakerySavedDesign = (designId: string) => bakeryApi.delete(`/saved-designs/${designId}`).then((response) => response.data)
export const resetBakeryPrototype = () => bakeryApi.post('/demo/reset').then((response) => response.data)
