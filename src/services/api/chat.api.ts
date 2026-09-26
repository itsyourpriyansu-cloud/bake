import { apiClient } from './client'
import { endpoints } from './endpoints'
import { z } from 'zod'

const conversationSchema = z.object({ id: z.string(), customerId: z.string(), channel: z.string(), status: z.string(), node: z.string(), createdAt: z.string(), updatedAt: z.string() })
const messageSchema = z.object({ id: z.string(), conversationId: z.string(), from: z.string(), text: z.string(), intent: z.string().optional(), channel: z.string().optional(), messageType: z.string().optional(), at: z.string() })
const sendResponseSchema = z.object({ conversation: conversationSchema, intent: z.string(), reply: messageSchema })
const intentResponseSchema = z.object({ conversation: conversationSchema, reply: messageSchema })
const conversationDetailSchema = z.object({ conversation: conversationSchema, messages: z.array(messageSchema) })

export const sendChatMessage = async (customerId: string, text: string, conversationId?: string) =>
  sendResponseSchema.parse((await apiClient.post(endpoints.chatMessage, { customerId, text, conversationId })).data)
export const getConversationMessages = async (conversationId: string) => messageSchema.array().parse((await apiClient.get(`${endpoints.chatConversations}/${conversationId}/messages`)).data)
export const getConversation = async (conversationId: string) => conversationSchema.parse((await apiClient.get(`${endpoints.chatConversations}/${conversationId}`)).data)
export const getConversations = async (customerId = 'CUST001') => conversationSchema.array().parse((await apiClient.get(endpoints.conversations, { params: { customerId } })).data)
export const createConversation = async (customerId = 'CUST001') => conversationSchema.parse((await apiClient.post(endpoints.conversations, { customerId })).data)
export const getConversationDetail = async (conversationId: string) => conversationDetailSchema.parse((await apiClient.get(`${endpoints.conversations}/${conversationId}`)).data)
export const sendIntent = async (conversationId: string, intent: string, text: string) => intentResponseSchema.parse((await apiClient.post(`${endpoints.conversations}/${conversationId}/intents`, { intent, text })).data)
