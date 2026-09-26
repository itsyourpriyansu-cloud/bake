import type { OrderEventType } from '../../domain/orders/order.types'

export type SystemEventType = OrderEventType
  | 'CART_UPDATED' | 'DEMO_RESET' | 'DEMO_SCENARIO_LOADED' | 'DEMO_CLOCK_ADVANCED'
  | 'KDS_ONLINE_CHANGED' | 'KITCHEN_LOAD_CHANGED' | 'CAPABILITIES_CHANGED'
  | 'PAYMENT_STATUS_CHANGED' | 'REFUND_STATUS_CHANGED' | 'ATTENTION_CHANGED'
  | 'CONVERSATION_UPDATED' | 'CUSTOMER_UPDATED'
  | 'RETENTION_UPDATED'

export interface AppEvent<T = unknown> { id: string; type: SystemEventType; at: string; orderId?: string; customerId?: string; payload?: T }
