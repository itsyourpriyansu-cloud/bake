export type CustomerLifecycle = 'NEW' | 'FIRST_ORDER' | 'SECOND_ORDER' | 'REPEAT' | 'LOYAL' | 'VIP'
export type CustomerActivity = 'ACTIVE' | 'AT_RISK' | 'DORMANT'

export interface CrmOrderHistoryEntry { fulfillmentType: 'DELIVERY' | 'PICKUP' | 'STORE'; total: number; category: string; completedAt: string }
