import { apiClient } from './client'
import { endpoints } from './endpoints'
import { categorySchema, legacyProductViewSchema, productDetailResponseSchema, smartCollectionSchema } from '../../domain/catalog/catalog.schema'
import { z } from 'zod'

const legacyMenuResponseSchema = z.object({ categories: z.array(categorySchema), products: z.array(legacyProductViewSchema), collections: z.array(smartCollectionSchema) })
export type LegacyMenuResponse = z.infer<typeof legacyMenuResponseSchema>

export const getCategories = async () => categorySchema.array().parse((await apiClient.get(endpoints.categories)).data)
export const getProducts = async (category?: string) => legacyProductViewSchema.array().parse((await apiClient.get(endpoints.products, { params: category ? { category } : undefined })).data)
export const getProduct = async (id: string) => productDetailResponseSchema.parse((await apiClient.get(`${endpoints.products}/${id}`)).data)
export const getMenu = async () => legacyMenuResponseSchema.parse((await apiClient.get(endpoints.menu)).data)
export const getRecommendations = async (context?: 'popular' | 'personalized') => legacyProductViewSchema.array().parse((await apiClient.get(endpoints.recommendations, { params: context ? { context } : undefined })).data)
export const searchProducts = async (q: string) => legacyProductViewSchema.array().parse((await apiClient.get(endpoints.search, { params: { q } })).data)
