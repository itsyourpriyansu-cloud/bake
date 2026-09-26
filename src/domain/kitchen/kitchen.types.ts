import type { Order } from '../orders/order.types'

export interface KitchenQueueEntry { order: Order; position: number }
export interface KitchenProblemReport { orderId: string; reason: string; reportedAt: string }
