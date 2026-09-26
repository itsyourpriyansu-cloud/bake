export type ConversationChannel = 'PWA_CHAT' | 'WHATSAPP_SIM' | 'SYSTEM' | 'OWNER'

export type ChatIntent =
  | 'START_ORDER' | 'CHOOSE_DELIVERY' | 'CHOOSE_PICKUP' | 'VIEW_MENU' | 'PRODUCT_QUESTION' | 'CUSTOMIZE_PRODUCT'
  | 'VIEW_CART' | 'CHECKOUT' | 'TRACK_ORDER' | 'CANCEL_ORDER' | 'CANCELLATION_STATUS' | 'REPORT_PROBLEM'
  | 'REFUND_REQUEST' | 'REFUND_STATUS' | 'LOYALTY_HELP' | 'OFFER_HELP' | 'TALK_TO_HUMAN' | 'UNKNOWN'

export type ChatNodeId =
  | 'START' | 'MAIN_MENU' | 'TRACK_ORDER' | 'ORDER_STATUS' | 'REPORT_PROBLEM' | 'PROBLEM_CATEGORY'
  | 'SELECT_ORDER_ITEM' | 'CREATE_SUPPORT_CASE' | 'REFUND_STATUS' | 'LOYALTY_HELP' | 'HUMAN_HANDOFF'

export type SimulatedMessageType = 'ORDER_CONFIRMATION' | 'DELAY' | 'READY_FOR_PICKUP' | 'ON_THE_WAY' | 'POINTS_EARNED' | 'BIRTHDAY' | 'REORDER' | 'REFUND' | 'SUPPORT' | 'CAMPAIGN'

export interface ChatMessage {
  id: string; conversationId: string; from: 'CUSTOMER' | 'SYSTEM' | 'OWNER'; text: string;
  intent?: ChatIntent; channel?: ConversationChannel; messageType?: SimulatedMessageType; at: string
}

export interface Conversation { id: string; customerId: string; channel: ConversationChannel; status: 'OPEN' | 'CLOSED'; node: ChatNodeId; createdAt: string; updatedAt: string }
