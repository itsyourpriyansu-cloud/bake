import { useQuery } from '@tanstack/react-query'
import { api } from '../../../services/api'
export const useMenu = () => useQuery({ queryKey: ['menu'], queryFn: api.catalog.getMenu })
export const useProduct = (productId: string) => useQuery({ queryKey: ['product', productId], queryFn: () => api.catalog.getProduct(productId), enabled: Boolean(productId) })
export const useRecommendations = (context: 'popular' | 'personalized' = 'personalized', enabled = true) => useQuery({ queryKey: ['recommendations', context], queryFn: () => api.catalog.getRecommendations(context), enabled })
export const useProductSearch = (query: string) => useQuery({ queryKey: ['search', query], queryFn: () => api.catalog.searchProducts(query), enabled: query.trim().length > 0 })
